import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function embed(text: string): Promise<number[] | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/text-embedding-3-small", input: text, dimensions: 1536 }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.data?.[0]?.embedding ?? null;
  } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { kind, record_id } = await req.json();
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    if (kind === "wellness_treatments") {
      const { data: t } = await sb.from("wellness_treatments").select("*").eq("id", record_id).maybeSingle();
      if (!t) return new Response("not found", { status: 404, headers: corsHeaders });

      const content = `${t.title}\nKategorie: ${t.category}\nDauer: ${t.duration_label ?? ""}\nPreis: ${t.price_label ?? ""}\n${t.description ?? ""}`;
      const emb = await embed(content);

      await sb.from("wellness_treatments").update({ embedding: emb }).eq("id", t.id);

      await sb.from("clara_knowledge").upsert({
        title: `Spa · ${t.title}`,
        category: "spa",
        content,
        is_active: t.is_active,
        sort_order: t.sort_order,
      }, { onConflict: "title" });

      if (t.image_url) {
        await sb.from("clara_media").upsert({
          title: t.title,
          description: t.description ?? "",
          category: "spa",
          tags: t.tags ?? [],
          triggers: ["spa","wellness", t.category],
          media_type: "image",
          url: t.image_url,
          caption: `${t.title} – ${t.price_label ?? ""}`,
          is_active: t.is_active,
        }, { onConflict: "title" });
      }
    } else if (kind === "wellness_sections") {
      const { data: s } = await sb.from("wellness_sections").select("*").eq("id", record_id).maybeSingle();
      if (!s) return new Response("not found", { status: 404, headers: corsHeaders });
      const content = `${s.title}\n${s.subtitle ?? ""}\n${s.body_md ?? ""}\nÖffnungszeiten: ${s.opening_hours ?? ""}`;
      const emb = await embed(content);
      await sb.from("wellness_sections").update({ embedding: emb }).eq("id", s.id);

      await sb.from("clara_knowledge").upsert({
        title: `${s.page === "spa" ? "Spa" : "Wellness"} · ${s.title}`,
        category: s.page,
        content,
        is_active: s.is_active,
        sort_order: s.sort_order,
      }, { onConflict: "title" });

      if (s.hero_image_url) {
        await sb.from("clara_media").upsert({
          title: s.title,
          description: s.subtitle ?? "",
          category: s.page,
          tags: [s.slug],
          triggers: [s.page, s.slug],
          media_type: "image",
          url: s.hero_image_url,
          is_active: s.is_active,
        }, { onConflict: "title" });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
