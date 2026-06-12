// Mews webhook receiver - inbound events from Mews (reservation updates, etc.)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const expectedSecret = Deno.env.get("MEWS_WEBHOOK_SECRET");
    const provided = req.headers.get("X-Mews-Signature") ?? new URL(req.url).searchParams.get("secret");
    if (expectedSecret && provided !== expectedSecret) {
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json().catch(() => ({}));
    await admin.from("mews_sync_log").insert({
      direction: "inbound",
      action: body?.Type ?? body?.event ?? "webhook",
      status: "ok",
      request: body,
    });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from("mews_sync_log").insert({
      direction: "inbound", action: "webhook_error", status: "error", error: msg,
    });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
