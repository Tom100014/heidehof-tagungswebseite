import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { treatment_id, section_id, custom_prompt, reference_image_urls, references } = await req.json();
    const refUrls: string[] = Array.isArray(reference_image_urls) ? reference_image_urls.filter((u: unknown) => typeof u === "string" && u.length > 0).slice(0, 6) : [];
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    let target: { table: string; id: string; title: string; description?: string; category: string; image_field: string; storage_field: string } | null = null;
    let entry: Record<string, unknown> | null = null;

    if (treatment_id) {
      const { data } = await sb.from("wellness_treatments").select("*").eq("id", treatment_id).maybeSingle();
      if (!data) return new Response("not found", { status: 404, headers: corsHeaders });
      entry = data;
      target = { table: "wellness_treatments", id: data.id, title: data.title, description: data.description, category: data.category, image_field: "image_url", storage_field: "image_storage_path" };
    } else if (section_id) {
      const { data } = await sb.from("wellness_sections").select("*").eq("id", section_id).maybeSingle();
      if (!data) return new Response("not found", { status: 404, headers: corsHeaders });
      entry = data;
      target = { table: "wellness_sections", id: data.id, title: data.title, description: data.subtitle ?? data.body_md, category: data.slug, image_field: "hero_image_url", storage_field: "hero_storage_path" };
    } else {
      return new Response("missing id", { status: 400, headers: corsHeaders });
    }

    // get category master prompt
    const cat = (entry as any).category ?? (entry as any).slug;
    const { data: cp } = await sb.from("wellness_category_prompts").select("*").eq("category", cat).maybeSingle();

    const masterPrompt = custom_prompt
      || (entry as any).image_prompt
      || (entry as any).master_image_prompt
      || cp?.prompt
      || "Luxuriöses Spa-Ambiente, Hotel Heidehof.";

    const fullPrompt = `${masterPrompt}\n\nThema: ${target.title}. ${target.description ?? ""}\n${cp?.style_hint ?? ""}\nNegative: ${cp?.negative_prompt ?? ""}`;

    let refInstructions = "";
    if (references && Array.isArray(references) && references.length > 0) {
      refInstructions = "Verwende die beigefügten Fotos als Referenzen mit folgenden zugewiesenen Rollen:\n";
      references.forEach((ref: any, idx: number) => {
        refInstructions += `- Bild #${idx + 1}: Rolle: "${ref.role}"${ref.user_notes ? `, Anmerkung: "${ref.user_notes}"` : ""}\n`;
      });
      refInstructions += `\nErzeuge ein neues Bild gemäß folgendem Prompt:\n\n${fullPrompt}`;
    } else {
      refInstructions = refUrls.length === 1
        ? `Verwende das beigefügte Foto als Stil-/Raum-/Atmosphäre-Referenz und erzeuge ein neues Bild gemäß folgendem Prompt:\n\n${fullPrompt}`
        : `Verwende die ${refUrls.length} beigefügten Fotos als Stil-/Raum-/Atmosphäre-Referenzen und erzeuge ein neues Bild gemäß folgendem Prompt:\n\n${fullPrompt}`;
    }

    const userContent: unknown = refUrls.length > 0
      ? [
          { type: "text", text: refInstructions },
          ...refUrls.map((url) => ({ type: "image_url", image_url: { url } })),
        ]
      : fullPrompt;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      console.error("img gen failed", r.status, text);
      return new Response(JSON.stringify({ error: "image generation failed", detail: text }), { status: 500, headers: corsHeaders });
    }
    const j = await r.json();
    const dataUrl: string | undefined = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) return new Response(JSON.stringify({ error: "no image returned" }), { status: 500, headers: corsHeaders });

    // decode base64
    const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!m) return new Response(JSON.stringify({ error: "bad data url" }), { status: 500, headers: corsHeaders });
    const mime = m[1];
    const ext = mime.split("/")[1] ?? "png";
    const bin = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
    const path = `${target.table}/${target.id}-${Date.now()}.${ext}`;

    const up = await sb.storage.from("wellness-media").upload(path, bin, { contentType: mime, upsert: true });
    if (up.error) {
      console.error(up.error);
      return new Response(JSON.stringify({ error: up.error.message }), { status: 500, headers: corsHeaders });
    }
    const { data: pub } = sb.storage.from("wellness-media").getPublicUrl(path);

    await sb.from(target.table).update({
      [target.image_field]: pub.publicUrl,
      [target.storage_field]: path,
    }).eq("id", target.id);

    return new Response(JSON.stringify({ ok: true, image_url: pub.publicUrl, storage_path: path }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
