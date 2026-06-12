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
    const { kind, record_id, prompt_override, reference_image_urls, references } = await req.json();
    const refUrls: string[] = Array.isArray(reference_image_urls) ? reference_image_urls.filter((u: unknown) => typeof u === "string" && u.length > 0).slice(0, 6) : [];
    if (!kind || !record_id) return new Response(JSON.stringify({ error: "kind and record_id required" }), { status: 400, headers: corsHeaders });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    const table = kind === "drinks" ? "drinks_menu" : kind === "food" ? "food_menu" : "events";
    const catCol = kind === "drinks" ? "category" : kind === "food" ? "course" : "event_type";
    const { data: row } = await sb.from(table).select("*").eq("id", record_id).maybeSingle();
    if (!row) return new Response(JSON.stringify({ error: "row not found" }), { status: 404, headers: corsHeaders });

    const { data: catPrompt } = await sb
      .from("menu_category_prompts")
      .select("prompt, style_hint, negative_prompt")
      .eq("kind", kind === "events" ? "event" : kind)
      .eq("category", row[catCol])
      .maybeSingle();

    const master = catPrompt?.prompt ?? "Editorial photo, luxury hotel ambience, soft warm light.";
    const styleHint = catPrompt?.style_hint ? `, ${catPrompt.style_hint}` : "";
    const itemDesc = `${row.title}${row.description ? ". " + row.description : (row.description_md ? ". " + row.description_md : "")}`;
    const fullPrompt = prompt_override ?? row.image_prompt ?? `${master}${styleHint}. Subject: ${itemDesc}. Ultra-detailed, professional food/beverage photography, 8K.`;

    // Build multimodal content with optional reference images
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

    // Retry with exponential backoff for transient 429/5xx
    let aiRes: Response | null = null;
    let lastErrText = "";
    for (let attempt = 0; attempt < 6; attempt++) {
      aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: userContent }],
          modalities: ["image", "text"],
        }),
      });
      if (aiRes.ok) break;
      lastErrText = await aiRes.text();
      console.error(`Image gen attempt ${attempt + 1} failed:`, aiRes.status, lastErrText);
      // Don't retry on auth/credit/client errors
      if (aiRes.status === 401 || aiRes.status === 402 || aiRes.status === 400) break;
      // Honor Retry-After; otherwise exponential backoff with jitter: ~2s, 4s, 8s, 16s, 30s
      const retryAfter = Number(aiRes.headers.get("retry-after"));
      const base = retryAfter > 0 ? retryAfter * 1000 : Math.min(30000, 2000 * 2 ** attempt);
      const waitMs = base + Math.floor(Math.random() * 750);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    if (!aiRes || !aiRes.ok) {
      const status = aiRes?.status ?? 500;
      const userMsg =
        status === 429 ? "Bild-KI ist gerade ausgelastet (Rate-Limit). Bitte in 30–60 Sekunden erneut versuchen."
        : status === 402 ? "Lovable-AI Guthaben aufgebraucht. Bitte im Workspace aufladen."
        : "Bildgenerierung fehlgeschlagen.";
      return new Response(JSON.stringify({ error: userMsg, status, detail: lastErrText }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiRes.json();
    const dataUrl: string | undefined = aiJson.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl) return new Response(JSON.stringify({ error: "no image returned" }), { status: 500, headers: corsHeaders });

    const base64 = dataUrl.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${kind}/${row.slug}-${Date.now()}.png`;
    const { error: upErr } = await sb.storage.from("menu-media").upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) {
      console.error("upload error", upErr);
      return new Response(JSON.stringify({ error: upErr.message }), { status: 500, headers: corsHeaders });
    }
    const { data: pub } = sb.storage.from("menu-media").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const updateCol = kind === "events" ? { hero_image_url: publicUrl, image_storage_path: path, image_prompt: fullPrompt } : { image_url: publicUrl, image_storage_path: path, image_prompt: fullPrompt };
    await sb.from(table).update(updateCol).eq("id", record_id);

    return new Response(JSON.stringify({ ok: true, url: publicUrl, prompt: fullPrompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
