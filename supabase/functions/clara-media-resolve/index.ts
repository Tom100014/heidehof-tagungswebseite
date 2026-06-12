// Findet das beste Medium für einen Topic-String.
// 1. Exakter Tag-/Trigger-Match  →  sofort zurück
// 2. Volltext (ILIKE in title/description)
// 3. Embedding-Ähnlichkeit (pgvector)
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

interface MediaResult {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[] | null;
  triggers: string[] | null;
  media_type: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  similarity?: number;
  match_kind: "tag" | "trigger" | "ilike" | "embedding";
}

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

async function embedQuery(text: string): Promise<number[]> {
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
    const body = await req.json().catch(() => ({}));
    const topic: string = (body.topic ?? body.query ?? "").toString().trim();
    const category: string | undefined = typeof body.category === "string" && body.category ? body.category : undefined;
    const limit: number = Math.min(Math.max(Number(body.limit ?? 1), 1), 24);

    // GALLERY-MODUS: nur Kategorie übergeben → liefere alle aktiven Medien dieser Kategorie
    if (!topic && category) {
      const { data: list } = await admin
        .from("clara_media")
        .select("id,title,description,category,tags,triggers,media_type,url,thumbnail_url,caption,sort_order")
        .eq("is_active", true)
        .eq("category", category)
        .order("sort_order", { ascending: true })
        .limit(limit);
      const matches = (list ?? []).map((m) => ({ ...m, match_kind: "category" as const }));
      return new Response(JSON.stringify({ ok: matches.length > 0, matches, match: matches[0] ?? null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!topic) {
      return new Response(JSON.stringify({ ok: false, error: "topic oder category erforderlich" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const norm = normalize(topic);
    const tokens = norm.split(/[\s,/-]+/).filter((t) => t.length > 1);

    // 1. Exact tag/trigger match
    const { data: candidates } = await admin
      .from("clara_media")
      .select("id,title,description,category,tags,triggers,media_type,url,thumbnail_url,caption,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (candidates && candidates.length) {
      // Tag exakt
      for (const tok of tokens) {
        const hit = candidates.find((c) =>
          (c.tags ?? []).some((t: string) => normalize(t) === tok)
        );
        if (hit && (!category || hit.category === category)) {
          return new Response(JSON.stringify({ ok: true, match: { ...hit, match_kind: "tag" } satisfies MediaResult }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      // Trigger enthält
      for (const c of candidates) {
        const triggers = (c.triggers ?? []).map((t: string) => normalize(t));
        if (triggers.some((t) => norm.includes(t) || t.includes(norm))) {
          if (!category || c.category === category) {
            return new Response(JSON.stringify({ ok: true, match: { ...c, match_kind: "trigger" } satisfies MediaResult }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
      // Title/description ILIKE
      for (const tok of tokens) {
        const hit = candidates.find((c) =>
          normalize(c.title).includes(tok) ||
          normalize(c.description ?? "").includes(tok)
        );
        if (hit && (!category || hit.category === category)) {
          return new Response(JSON.stringify({ ok: true, match: { ...hit, match_kind: "ilike" } satisfies MediaResult }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // 2. Embedding-Suche
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "Kein Treffer und kein Embedding-Key konfiguriert." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const queryEmbedding = await embedQuery(topic);
    const { data: matches, error } = await admin.rpc("match_clara_media", {
      query_embedding: queryEmbedding as unknown as string,
      match_count: 1,
      filter_category: category ?? null,
    });
    if (error) throw error;
    const top = (matches ?? [])[0];
    if (!top) {
      return new Response(JSON.stringify({ ok: false, error: "Kein passendes Medium gefunden." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, match: { ...top, match_kind: "embedding" } satisfies MediaResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clara-media-resolve error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
