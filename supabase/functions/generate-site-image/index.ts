import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const _authFail = await requireAdmin(req);
  if (_authFail) return _authFail;
  try {
    const { slug, prompt, alt, reference_image_urls, references } = await req.json();
    const refUrls: string[] = Array.isArray(reference_image_urls) ? reference_image_urls.filter((u: unknown) => typeof u === "string" && u.length > 0).slice(0, 6) : [];
    if (!slug || !prompt) {
      return new Response(JSON.stringify({ error: "slug und prompt erforderlich" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY fehlt");

    const fullPrompt = `${prompt}\n\nStil: hochwertiges Hotel-Marketing-Foto für „Hotel Der Heidehof", warmes natürliches Licht, hohe Detailtiefe, fotorealistisch, edel und einladend. Kein Text, kein Logo, kein Wasserzeichen.`;

    let refInstructions = "";
    if (references && Array.isArray(references) && references.length > 0) {
      refInstructions = "Verwende die beigefügten Fotos als Referenzen mit folgenden zugewiesenen Rollen:\n";
      references.forEach((ref: any, idx: number) => {
        refInstructions += `- Bild #${idx + 1}: Rolle: "${ref.role}"${ref.user_notes ? `, Anmerkung: "${ref.user_notes}"` : ""}\n`;
      });
      refInstructions += `\nErzeuge ein neues Bild gemäß folgendem Prompt:\n\n${fullPrompt}`;
    } else {
      refInstructions = refUrls.length === 1
        ? `Verwende das beigefügte Foto als Stil-/Komposition-/Hintergrund-Referenz und erzeuge ein neues Bild gemäß folgendem Prompt:\n\n${fullPrompt}`
        : `Verwende die ${refUrls.length} beigefügten Fotos als Stil-/Komposition-/Hintergrund-Referenzen und erzeuge ein neues Bild gemäß folgendem Prompt:\n\n${fullPrompt}`;
    }

    const userContent: unknown = refUrls.length > 0
      ? [
          { type: "text", text: refInstructions },
          ...refUrls.map((url) => ({ type: "image_url", image_url: { url } })),
        ]
      : fullPrompt;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI-Fehler: ${txt}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiData = await aiRes.json();
    const dataUrl: string | undefined = aiData?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) {
      return new Response(JSON.stringify({ error: "Kein Bild erhalten" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const base64 = dataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const path = `${slug}/${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("site-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("site-images").getPublicUrl(path);

    const { error: dbErr } = await supabase.from("site_images").upsert({
      slug, url: pub.publicUrl, alt: alt ?? null, storage_path: path,
    });
    if (dbErr) throw dbErr;

    return new Response(JSON.stringify({ success: true, url: pub.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
