// Generate an image with role-based reference images
// (e.g. "use reference 1 as background, reference 2 for the plates, reference 3 for cutlery").
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type ReferenceRole =
  | "background" | "plates" | "cutlery" | "glassware"
  | "lighting" | "style" | "decoration" | "subject";

const ROLE_INSTRUCTIONS: Record<ReferenceRole, string> = {
  background: "übernimm Hintergrund, Umgebung, Wand- und Bodenmaterial, Atmosphäre und Tisch-Setting aus diesem Bild",
  plates: "übernimm exakt Form, Farbe, Material und Größe der Teller / des Geschirrs aus diesem Bild",
  cutlery: "übernimm Stil, Material und Anordnung des Bestecks aus diesem Bild",
  glassware: "übernimm Stil, Form und Material der Gläser / Karaffen / Tassen aus diesem Bild",
  lighting: "übernimm Lichtfarbe, Lichtrichtung, Schatten und Stimmung aus diesem Bild",
  style: "übernimm Kameraperspektive, Komposition und Bild-Stil aus diesem Bild",
  decoration: "übernimm Deko-Elemente, Garnitur, Blumen oder Servietten aus diesem Bild",
  subject: "nimm dies als visuelle Referenz für das Hauptmotiv",
};

interface IncomingReference {
  image_url?: string;
  url?: string;
  role?: ReferenceRole;
  notes?: string;
}

interface Body {
  prompt: string;
  // New role-aware references
  references?: IncomingReference[];
  // Legacy
  referenceImageIds?: string[];
  referenceImageUrls?: string[];
  layoutPrompt?: string;
  model?: string;
}

function buildStructuredPrompt(
  basePrompt: string,
  layoutPrompt: string | undefined,
  refs: { url: string; role: ReferenceRole; notes?: string }[],
): string {
  const lines: string[] = [];

  if (refs.length > 0) {
    lines.push("REFERENZ-ZUORDNUNG (in der Reihenfolge der beigefügten Bilder):");
    refs.forEach((r, i) => {
      const role = r.role;
      const instr = ROLE_INSTRUCTIONS[role];
      const note = r.notes?.trim() ? ` Zusatz: ${r.notes.trim()}.` : "";
      lines.push(`• REFERENZ ${i + 1} — Rolle "${role}": ${instr}.${note}`);
    });
    lines.push("");
    lines.push("Halte dich strikt an die zugewiesenen Rollen. Mische die Rollen nicht.");
    lines.push("");
  }

  if (layoutPrompt?.trim()) {
    lines.push("LAYOUT / KONTEXT:");
    lines.push(layoutPrompt.trim());
    lines.push("");
  }

  lines.push("HAUPTMOTIV:");
  lines.push(basePrompt.trim());
  lines.push("");
  lines.push("Kein Text, keine Logos, keine Wasserzeichen im Bild.");

  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Normalize references: prefer structured `references`, fall back to legacy fields.
    let refs: { url: string; role: ReferenceRole; notes?: string }[] = [];

    if (body.references?.length) {
      refs = body.references
        .map((r) => ({
          url: (r.image_url ?? r.url ?? "").trim(),
          role: (r.role ?? "background") as ReferenceRole,
          notes: r.notes,
        }))
        .filter((r) => r.url);
    } else {
      let urls = body.referenceImageUrls ?? [];
      if (body.referenceImageIds?.length) {
        const { data } = await supabase
          .from("hotel_reference_images")
          .select("id,image_url")
          .in("id", body.referenceImageIds);
        const map = new Map((data ?? []).map((r) => [r.id as string, r.image_url as string]));
        urls = [
          ...urls,
          ...body.referenceImageIds.map((id) => map.get(id)).filter(Boolean) as string[],
        ];
      }
      refs = urls.map((u) => ({ url: u, role: "background" as ReferenceRole }));
    }

    refs = refs.slice(0, 6);

    const fullPrompt = buildStructuredPrompt(body.prompt ?? "", body.layoutPrompt, refs);

    const content: Array<Record<string, unknown>> = [{ type: "text", text: fullPrompt }];
    for (const r of refs) {
      content.push({ type: "image_url", image_url: { url: r.url } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model ?? "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      const status = res.status === 402 || res.status === 429 ? res.status : 500;
      return new Response(JSON.stringify({ error: `AI gateway: ${res.status} ${t}` }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    const dataUrl: string | undefined =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) {
      return new Response(JSON.stringify({ error: "no image in response", raw: data }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!m) {
      return new Response(JSON.stringify({ imageUrl: dataUrl, prompt: fullPrompt }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ext = m[1];
    const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const path = `generated/${Date.now()}.${ext}`;
    await supabase.storage
      .from("image-references")
      .upload(path, bin, { contentType: `image/${ext}`, upsert: false });
    const { data: pub } = supabase.storage.from("image-references").getPublicUrl(path);
    return new Response(JSON.stringify({ imageUrl: pub.publicUrl, prompt: fullPrompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
