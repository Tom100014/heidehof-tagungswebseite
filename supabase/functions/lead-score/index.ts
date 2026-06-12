// Auto-Scoring für Leads. Faktoren: Distanz zu Ingolstadt, Branche, Größe, Email-Validität, Aktivität.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOT_INDUSTRIES = ["it", "consulting", "beratung", "automotive", "pharma", "finanz", "bank", "kanzlei", "agentur"];
const NEAR_CITIES = ["ingolstadt", "münchen", "munchen", "augsburg", "nürnberg", "regensburg", "eichstätt", "neuburg", "pfaffenhofen"];

function scoreLead(lead: any, events: any[]): number {
  let s = 0;
  if (lead.email && /@.+\../.test(lead.email)) s += 15;
  if (lead.phone) s += 5;
  if (lead.website) s += 5;
  if (lead.contact_name) s += 5;

  const city = (lead.city || "").toLowerCase();
  if (NEAR_CITIES.some(c => city.includes(c))) s += 20;

  const ind = (lead.industry || "").toLowerCase();
  if (HOT_INDUSTRIES.some(i => ind.includes(i))) s += 15;

  const emp = lead.employee_count || 0;
  if (emp >= 200) s += 20; else if (emp >= 50) s += 12; else if (emp >= 10) s += 6;

  const opens = events.filter(e => e.type === "opened").length;
  const clicks = events.filter(e => e.type === "clicked").length;
  s += Math.min(opens * 3, 15);
  s += Math.min(clicks * 6, 24);
  if (lead.replied_at) s += 30;

  if (lead.do_not_contact || lead.unsubscribed) s = Math.min(s, 5);
  if (lead.bounced_at) s = Math.max(0, s - 20);

  return Math.max(0, Math.min(100, s));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { lead_id, all } = body as { lead_id?: string; all?: boolean };

    let leads: any[] = [];
    if (lead_id) {
      const { data } = await admin.from("leads").select("*").eq("id", lead_id);
      leads = data || [];
    } else if (all) {
      const { data } = await admin.from("leads").select("*").limit(1000);
      leads = data || [];
    } else {
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
      const { data } = await admin.from("leads").select("*").or(`last_activity_at.gte.${since},lead_score.is.null`).limit(500);
      leads = data || [];
    }

    let updated = 0;
    for (const l of leads) {
      const { data: ev } = await admin.from("email_events").select("type").eq("lead_id", l.id);
      const score = scoreLead(l, ev || []);
      if (score !== l.lead_score) {
        await admin.from("leads").update({ lead_score: score }).eq("id", l.id);
        updated++;
      }
    }
    return new Response(JSON.stringify({ ok: true, scored: leads.length, updated }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("lead-score error", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Fehler" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
