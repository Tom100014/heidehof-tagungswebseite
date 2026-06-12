import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { kind, record_id } = await req.json();
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);

    if (kind === "drinks_menu") {
      const { data: d } = await sb.from("drinks_menu").select("*").eq("id", record_id).maybeSingle();
      if (!d) return new Response("not found", { status: 404, headers: corsHeaders });
      const content = `Getränk: ${d.title}\nKategorie: ${d.category}\nWinzer/Hersteller: ${d.producer ?? ""} ${d.region ?? ""}\nVolumen: ${d.volume_label ?? ""}\nPreis: ${d.price_label ?? ""}\n${d.description ?? ""}`;
      await sb.from("clara_knowledge").upsert(
        { title: `Getränk · ${d.title}`, category: "getraenke", content, is_active: d.is_active, sort_order: d.sort_order },
        { onConflict: "title" },
      );
      if (d.image_url) {
        await sb.from("clara_media").upsert(
          {
            title: d.title,
            description: d.description ?? "",
            category: "getraenke",
            tags: [d.category, ...(d.tags ?? [])],
            triggers: ["getränk", "drink", "bestellung", d.category, d.title.toLowerCase()],
            media_type: "image",
            url: d.image_url,
            caption: `${d.title} – ${d.price_label ?? ""}`,
            is_active: d.is_active,
          },
          { onConflict: "title" },
        );
      }
    } else if (kind === "food_menu") {
      const { data: f } = await sb.from("food_menu").select("*").eq("id", record_id).maybeSingle();
      if (!f) return new Response("not found", { status: 404, headers: corsHeaders });
      const content = `Speise: ${f.title}\nGang: ${f.course}\nAllergene: ${(f.allergens ?? []).join(", ")}\nVegan: ${f.is_vegan} · Vegetarisch: ${f.is_vegetarian} · Glutenfrei: ${f.is_glutenfree}\nPreis: ${f.price_label ?? ""}\n${f.description ?? ""}`;
      await sb.from("clara_knowledge").upsert(
        { title: `Speise · ${f.title}`, category: "speise", content, is_active: f.is_active, sort_order: f.sort_order },
        { onConflict: "title" },
      );
      if (f.image_url) {
        await sb.from("clara_media").upsert(
          {
            title: f.title,
            description: f.description ?? "",
            category: "speise",
            tags: [f.course, ...(f.tags ?? [])],
            triggers: ["speise", "essen", "gericht", "menu", f.course, f.title.toLowerCase()],
            media_type: "image",
            url: f.image_url,
            caption: `${f.title} – ${f.price_label ?? ""}`,
            is_active: f.is_active,
          },
          { onConflict: "title" },
        );
      }
    } else if (kind === "events") {
      const { data: e } = await sb.from("events").select("*").eq("id", record_id).maybeSingle();
      if (!e) return new Response("not found", { status: 404, headers: corsHeaders });
      const content = `Veranstaltung: ${e.title}\nTyp: ${e.event_type}\nZeitraum: ${e.starts_at ?? ""} - ${e.ends_at ?? ""}\nOrt: ${e.location ?? ""}\nPreis: ${e.price_label ?? ""}\nKapazität: ${e.capacity ?? ""}\n${e.subtitle ?? ""}\n${e.description_md ?? ""}`;
      await sb.from("clara_knowledge").upsert(
        { title: `Veranstaltung · ${e.title}`, category: "veranstaltung", content, is_active: e.is_active && e.is_published, sort_order: e.sort_order },
        { onConflict: "title" },
      );
      if (e.hero_image_url) {
        await sb.from("clara_media").upsert(
          {
            title: e.title,
            description: e.subtitle ?? "",
            category: "veranstaltung",
            tags: [e.event_type, ...(e.tags ?? [])],
            triggers: ["veranstaltung", "event", e.event_type, e.title.toLowerCase()],
            media_type: "image",
            url: e.hero_image_url,
            caption: `${e.title} – ${e.price_label ?? ""}`,
            is_active: e.is_active && e.is_published,
          },
          { onConflict: "title" },
        );
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
