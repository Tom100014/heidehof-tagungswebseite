// Archive a request: copy to requests_archive (with embedding+summary), then delete original.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_TABLES = new Set([
  "tagungs_inquiries",
  "restaurant_orders",
  "room_orders",
  "complaints",
  "conference_orders",
  "clara_conversations",
]);

function buildSummary(table: string, row: Record<string, unknown>): string {
  const parts: string[] = [`[${table}]`];
  const get = (k: string) => (row[k] != null ? String(row[k]) : "");
  switch (table) {
    case "tagungs_inquiries":
      parts.push(get("name"), get("firma"), get("anlass"), get("personen") && `${get("personen")} Pers.`, get("datum"), get("email"), get("nachricht"));
      break;
    case "restaurant_orders":
      parts.push(get("category"), get("guest_name"), get("table_or_room"), JSON.stringify(row.items ?? ""), get("notes"));
      break;
    case "room_orders":
      parts.push(`Zimmer ${get("room_number")}`, get("guest_name"), JSON.stringify(row.items ?? ""), get("notes"));
      break;
    case "complaints":
      parts.push(get("category"), get("urgency"), get("guest_name"), get("room_or_table"), get("description"));
      break;
    case "conference_orders":
      parts.push(get("guest_name"), get("company"), get("meal_type"), `${get("participants")} Pers.`, get("service_date"), get("notes"));
      break;
    case "clara_conversations": {
      const t = row.transcript as Array<{ role?: string; content?: string }> | undefined;
      if (Array.isArray(t)) parts.push(t.map((m) => `${m.role}: ${m.content}`).join(" | ").slice(0, 1500));
      break;
    }
  }
  return parts.filter(Boolean).join(" · ").slice(0, 1500);
}

async function embed(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-embedding-001", input: text, dimensions: 1536 }),
    });
    if (!r.ok) {
      console.error("embed fail", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    return j.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.error("embed err", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );

    // verify caller is admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { source_table, source_id, ids } = await req.json();
    if (!ALLOWED_TABLES.has(source_table)) {
      return new Response(JSON.stringify({ error: "invalid table" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const targetIds: string[] = Array.isArray(ids) && ids.length ? ids : [source_id];
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const { data: rows, error: fetchErr } = await supabase.from(source_table).select("*").in("id", targetIds);
    if (fetchErr) throw fetchErr;
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ archived: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const archiveRecords = await Promise.all(
      rows.map(async (row: Record<string, unknown>) => {
        const summary = buildSummary(source_table, row);
        const embedding = await embed(summary, apiKey);
        return {
          source_table,
          source_id: row.id,
          category: (row.category as string) ?? null,
          payload: row,
          summary,
          embedding,
          original_created_at: row.created_at ?? null,
          read_by: user.id,
        };
      }),
    );

    const { error: insErr } = await supabase.from("requests_archive").insert(archiveRecords);
    if (insErr) throw insErr;

    const { error: delErr } = await supabase.from(source_table).delete().in("id", targetIds);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ archived: archiveRecords.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("archive-request error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
