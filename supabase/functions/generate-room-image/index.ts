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
    const { room_id, prompt, style } = await req.json();
    if (!room_id || !prompt) throw new Error("room_id und prompt erforderlich");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY fehlt");

    const fullPrompt = `Professional photograph of a luxury conference room. Style: ${style ?? "modern"}. ${prompt}. Architectural interior photography, soft natural lighting, elegant business setup, ultra-high quality, magazine-worthy. No text, no logos.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit erreicht" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "Credits aufgebraucht" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI-Bildgenerierung fehlgeschlagen");
    }
    const data = await aiRes.json();
    const dataUrl: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) throw new Error("Kein Bild erhalten");

    // dataUrl: data:image/png;base64,xxx
    const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!m) throw new Error("Ungültiges Bildformat");
    const mime = m[1];
    const ext = mime.split("/")[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const path = `${room_id}/ai-${Date.now()}.${ext}`;
    const { error: upErr } = await supa.storage.from("room-images").upload(path, bytes, { contentType: mime });
    if (upErr) throw upErr;
    const { data: pub } = supa.storage.from("room-images").getPublicUrl(path);

    const { data: imgRow, error: insErr } = await supa.from("room_images")
      .insert({ room_id, url: pub.publicUrl, storage_path: path, source: "ai" })
      .select().single();
    if (insErr) throw insErr;

    // Set as primary if none yet
    const { count } = await supa.from("room_images").select("*", { count: "exact", head: true }).eq("room_id", room_id).eq("is_primary", true);
    if (!count) {
      await supa.from("room_images").update({ is_primary: true }).eq("id", imgRow.id);
      await supa.from("conference_rooms").update({ image_url: pub.publicUrl }).eq("id", room_id);
    }

    return new Response(JSON.stringify({ success: true, image: imgRow }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
