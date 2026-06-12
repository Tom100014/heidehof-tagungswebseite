import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { loadHotelStyle, buildHotelStylePrompt } from "../_shared/hotel-image-style.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EditPayload {
  menu_id: string;
  image_type: string;
  edit_prompt: string;
  source_url: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authFail = await requireAdmin(req);
  if (authFail) return authFail;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { menu_id, image_type, edit_prompt, source_url } = (await req.json()) as EditPayload;
    if (!menu_id || !image_type || !edit_prompt || !source_url) {
      throw new Error("menu_id, image_type, edit_prompt und source_url sind erforderlich");
    }

    const { style, references } = await loadHotelStyle(supabase);
    const fullPrompt = buildHotelStylePrompt(
      `Bearbeite das beigefügte Food-Foto entsprechend dieser Anweisung: ${edit_prompt}`,
      style
    );

    const refUrls = [
      references.background_url,
      references.plates_url,
      references.glasses_url,
      references.cutlery_url,
      references.mood_url,
    ].filter(Boolean) as string[];

    const content: Array<Record<string, unknown>> = [
      { type: "text", text: fullPrompt },
      { type: "image_url", image_url: { url: source_url } },
    ];
    for (const url of refUrls) content.push({ type: "image_url", image_url: { url } });

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content }],
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
    const url: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url?.startsWith("data:")) throw new Error("Keine Bilddaten von KI erhalten");
    const base64 = url.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    const path = `menus/${menu_id}/${image_type}-${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("menu-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from("menu-images").getPublicUrl(path);
    const newUrl = pub.publicUrl;

    // Deactivate previous, insert new
    await supabase
      .from("conference_menu_images")
      .update({ is_active: false })
      .eq("menu_id", menu_id)
      .eq("image_type", image_type);

    await supabase.from("conference_menu_images").insert({
      menu_id, image_type, image_url: newUrl, storage_path: path, is_active: true,
    });

    // Update daily_menu_assets.images
    const { data: asset } = await supabase
      .from("daily_menu_assets")
      .select("id, images")
      .eq("menu_id", menu_id)
      .maybeSingle();
    if (asset) {
      const images = { ...((asset.images as Record<string, string>) ?? {}), [image_type]: newUrl };
      await supabase.from("daily_menu_assets").update({ images, updated_at: new Date().toISOString() }).eq("id", asset.id);
    }

    return new Response(JSON.stringify({ success: true, image_url: newUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("edit-generated-image error", e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
