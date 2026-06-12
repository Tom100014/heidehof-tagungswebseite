// Edge function: edit any site_images entry via AI prompt.
// Uses Gemini image editing — takes source image + prompt, writes new PNG into the
// `site-images` bucket and updates the site_images row for the given slug.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EditPayload {
  slug: string;
  edit_prompt: string;
  source_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authFail = await requireAdmin(req);
  if (authFail) return authFail;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = (await req.json()) as EditPayload;
    const slug = String(body.slug || "").trim();
    const editPrompt = String(body.edit_prompt || "").trim();
    if (!slug || !editPrompt) throw new Error("slug und edit_prompt sind erforderlich");

    // Resolve source URL — from payload or from existing site_images row.
    let sourceUrl = body.source_url?.trim();
    if (!sourceUrl) {
      const { data: row } = await supabase
        .from("site_images")
        .select("url")
        .eq("slug", slug)
        .maybeSingle();
      sourceUrl = row?.url;
    }
    if (!sourceUrl) throw new Error(`Kein Quellbild für Slug "${slug}" gefunden`);

    const fullPrompt =
      `Bearbeite das beigefügte Foto entsprechend dieser Anweisung des Hotelbetreibers: ${editPrompt}. ` +
      `Erhalte den ursprünglichen Bildaufbau, die Perspektive und die Hotel-Atmosphäre (Heidehof Hotel, ` +
      `gehoben, warm, einladend). Liefere ein hochauflösendes, fotorealistisches Ergebnis ohne Text, Wasserzeichen oder Logos.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: fullPrompt },
              { type: "image_url", image_url: { url: sourceUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI edit error", aiRes.status, txt);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen, bitte später erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("KI-Bearbeitung fehlgeschlagen");
    }

    const data = await aiRes.json();
    const dataUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl?.startsWith("data:")) throw new Error("Keine Bilddaten von KI erhalten");
    const base64 = dataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const path = `edited/${slug}-${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("site-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("site-images").getPublicUrl(path);
    const newUrl = pub.publicUrl;

    // Update site_images row (upsert by slug).
    const { error: dbErr } = await supabase
      .from("site_images")
      .upsert(
        { slug, url: newUrl, storage_path: path, media_type: "image", updated_at: new Date().toISOString() },
        { onConflict: "slug" },
      );
    if (dbErr) throw dbErr;

    return new Response(JSON.stringify({ success: true, slug, image_url: newUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("edit-site-image error", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
