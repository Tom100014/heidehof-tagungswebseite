// Erzeugt/aktualisiert das Embedding eines Clara-Medien-Eintrags.
// Wird vom Admin-UI nach jedem Speichern aufgerufen.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface MediaRow {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  triggers: string[];
  caption: string | null;
}

const buildSearchText = (m: MediaRow): string =>
  [
    m.title,
    m.category,
    m.description,
    m.caption ?? "",
    (m.tags ?? []).join(", "),
    (m.triggers ?? []).join(", "),
  ]
    .filter(Boolean)
    .join("\n");

async function embed(text: string): Promise<number[]> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: text,
      dimensions: 1536,
    }),
  });
  if (!res.ok) throw new Error(`Embedding ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding as number[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const body = await req.json().catch(() => ({}));
    const ids: string[] | undefined = Array.isArray(body.ids)
      ? body.ids
      : body.id ? [body.id] : undefined;

    let rows: MediaRow[] = [];
    if (ids && ids.length) {
      const { data, error } = await admin
        .from("clara_media")
        .select("id,title,description,category,tags,triggers,caption")
        .in("id", ids);
      if (error) throw error;
      rows = (data ?? []) as MediaRow[];
    } else if (body.all === true) {
      const { data, error } = await admin
        .from("clara_media")
        .select("id,title,description,category,tags,triggers,caption");
      if (error) throw error;
      rows = (data ?? []) as MediaRow[];
    } else {
      throw new Error("Bitte 'id', 'ids' oder 'all: true' übergeben.");
    }

    let updated = 0;
    for (const row of rows) {
      const text = buildSearchText(row);
      if (!text.trim()) continue;
      const vector = await embed(text);
      const { error } = await admin
        .from("clara_media")
        .update({ embedding: vector as unknown as string })
        .eq("id", row.id);
      if (error) throw error;
      updated += 1;
    }

    return new Response(JSON.stringify({ ok: true, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clara-media-embed error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
