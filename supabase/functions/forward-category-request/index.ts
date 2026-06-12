import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Payload {
  category_key: string;
  source_table: string;
  record_id: string;
}

const formatRecord = (rec: Record<string, unknown>): string => {
  return Object.entries(rec)
    .filter(([k, v]) => v !== null && v !== "" && k !== "id" && !k.startsWith("_"))
    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join("\n");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { category_key, source_table, record_id }: Payload = await req.json();
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: route } = await supabase
      .from("category_email_routes")
      .select("emails, enabled, label")
      .eq("category_key", category_key)
      .maybeSingle();

    if (!route?.enabled || !route.emails?.length) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_recipients" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: record } = await supabase
      .from(source_table)
      .select("*")
      .eq("id", record_id)
      .maybeSingle();

    if (!record) {
      return new Response(JSON.stringify({ ok: false, error: "record_not_found" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const summary = formatRecord(record as Record<string, unknown>);
    const subject = `Neue Anfrage: ${route.label}`;

    const results = await Promise.allSettled(
      (route.emails as string[]).map((email) =>
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "category-forwarded",
            recipientEmail: email,
            idempotencyKey: `forward-${source_table}-${record_id}-${email}`,
            templateData: {
              categoryLabel: route.label,
              subject,
              summary,
            },
          },
        })
      )
    );

    return new Response(
      JSON.stringify({ ok: true, sent: results.length, results: results.map(r => r.status) }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("forward-category-request error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
