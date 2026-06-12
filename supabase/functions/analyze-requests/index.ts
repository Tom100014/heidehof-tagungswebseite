// RAG analysis: embed question, find relevant archived requests, ask AI for answer.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { question, filter_source, filter_category, top_k = 5 } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "missing question" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

    // 1. embed query
    const embRes = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-embedding-001", input: question, dimensions: 1536 }),
    });
    if (!embRes.ok) {
      const t = await embRes.text();
      console.error("embed failed", embRes.status, t);
      return new Response(JSON.stringify({ error: "embedding failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const embJson = await embRes.json();
    const queryEmbedding = embJson.data[0].embedding;

    // 2. retrieve top-k
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: matches, error: matchErr } = await supabase.rpc("match_archive", {
      query_embedding: queryEmbedding,
      match_count: Math.min(Math.max(top_k, 1), 10),
      filter_source: filter_source ?? null,
      filter_category: filter_category ?? null,
    });
    if (matchErr) throw matchErr;

    // 3. Compose context (token-frugal: source + date + summary, capped 500 chars each)
    const context = (matches ?? []).map((m: { source_table: string; category: string | null; original_created_at: string | null; summary: string; id: string }, i: number) =>
      `[${i + 1}] ${m.source_table}${m.category ? `/${m.category}` : ""} · ${m.original_created_at ?? ""}\n${(m.summary ?? "").slice(0, 500)}`
    ).join("\n\n");

    // 4. Ask AI
    const chatRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Du bist die KI-Analystin für das Hotel Heidehof Admin-Dashboard. Beantworte Fragen zu archivierten Gäste-Anfragen, Bestellungen und Beschwerden präzise auf Deutsch. Nutze nur die im KONTEXT genannten Daten. Wenn die Antwort daraus nicht hervorgeht, sage es klar. Verweise auf die Quellen mit [1], [2] usw. Sei knapp, professionell, datenbasiert.",
          },
          {
            role: "user",
            content: `KONTEXT (${matches?.length ?? 0} Treffer aus dem Anfragen-Archiv):\n\n${context || "(keine Treffer)"}\n\nFRAGE: ${question}`,
          },
        ],
      }),
    });

    if (!chatRes.ok) {
      if (chatRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit erreicht, bitte gleich erneut versuchen." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (chatRes.status === 402) return new Response(JSON.stringify({ error: "Lovable AI Guthaben aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await chatRes.text();
      console.error("chat failed", chatRes.status, t);
      return new Response(JSON.stringify({ error: "AI-Anfrage fehlgeschlagen" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const chatJson = await chatRes.json();
    const answer = chatJson.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({
        answer,
        sources: (matches ?? []).map((m: { id: string; source_table: string; category: string | null; original_created_at: string | null; summary: string; similarity: number }) => ({
          id: m.id,
          source_table: m.source_table,
          category: m.category,
          original_created_at: m.original_created_at,
          summary: m.summary?.slice(0, 200),
          similarity: m.similarity,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-requests error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
