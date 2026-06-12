// Resend Webhook: empfängt delivered / bounced / complained / opened / clicked
// und schreibt sie in email_events + leads.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const type: string = body?.type || "";
    const data = body?.data || {};
    const to: string = Array.isArray(data?.to) ? data.to[0] : (data?.to || "");
    if (!to) return new Response("ok", { headers: corsHeaders });

    const email = to.toString().toLowerCase();
    const { data: lead } = await admin.from("leads").select("id").eq("email", email).maybeSingle();
    if (!lead) return new Response("ok", { headers: corsHeaders });

    const ts = new Date().toISOString();
    const eventType = type.replace("email.", ""); // delivered, bounced, complained, opened, clicked

    await admin.from("email_events").insert({ lead_id: lead.id, type: eventType, metadata: data });

    const patch: Record<string, unknown> = { last_activity_at: ts };
    if (eventType === "bounced") patch.bounced_at = ts;
    if (eventType === "complained") { patch.do_not_contact = true; patch.unsubscribed = true; }
    if (eventType === "opened") patch.status = "opened";
    if (eventType === "clicked") patch.status = "clicked";
    await admin.from("leads").update(patch).eq("id", lead.id);

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("resend-webhook error", e);
    return new Response("ok", { headers: corsHeaders });
  }
});
