// Wandelt eine eingehende Tagungs-Anfrage in einen Lead + Pipeline-Deal um.
// Aufruf entweder direkt vom Frontend nach Erstellung oder per DB-Trigger.
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
    const { source = "tagungs_inquiry", inquiry_id, payload } = body as {
      source?: string;
      inquiry_id?: string;
      payload?: Record<string, unknown>;
    };

    let data: any = payload;
    if (!data && inquiry_id) {
      const { data: inq } = await admin.from("tagungs_inquiries").select("*").eq("id", inquiry_id).maybeSingle();
      if (!inq) return new Response(JSON.stringify({ ok: false, error: "inquiry not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      data = inq;
    }
    if (!data) return new Response(JSON.stringify({ ok: false, error: "no payload" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const email = (data.email || "").toString().trim().toLowerCase();
    const company = (data.firma || data.company || "").toString().trim();
    const contact_name = (data.name || data.contact_name || "").toString().trim();
    const phone = (data.telefon || data.phone || "").toString().trim();
    const personen = parseInt((data.personen || data.expected_persons || "0").toString().replace(/\D/g, ""), 10) || null;
    const anlass = (data.anlass || data.event_type || "").toString();
    const datum = (data.datum || data.expected_date || "").toString();

    if (!email && !company) {
      return new Response(JSON.stringify({ ok: false, error: "email or company required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Lead upsert (per Email)
    let leadId: string | null = null;
    if (email) {
      const { data: existing } = await admin.from("leads").select("id").eq("email", email).maybeSingle();
      if (existing) leadId = existing.id;
    }
    if (!leadId) {
      const { data: newLead, error } = await admin.from("leads").insert({
        email: email || null,
        company: company || null,
        contact_name: contact_name || null,
        phone: phone || null,
        source: `inbound:${source}`,
        status: "new",
        last_activity_at: new Date().toISOString(),
      }).select("id").single();
      if (error) throw error;
      leadId = newLead.id;
    } else {
      await admin.from("leads").update({
        company: company || undefined,
        contact_name: contact_name || undefined,
        phone: phone || undefined,
        last_activity_at: new Date().toISOString(),
        status: "engaged",
      }).eq("id", leadId);
    }

    // Deal anlegen
    const expectedDate = /^\d{4}-\d{2}-\d{2}/.test(datum) ? datum.slice(0, 10) : null;
    const estimatedValue = personen ? personen * 89 : null; // grobe Tagungspauschale
    const { data: deal } = await admin.from("pipeline_deals").insert({
      lead_id: leadId,
      stage: "qualifying",
      event_type: anlass || null,
      expected_persons: personen,
      expected_date: expectedDate,
      estimated_value: estimatedValue,
      probability: 30,
      notes: `Automatisch aus ${source} erstellt.`,
    }).select("id").single();

    // Activity + Inbound-Log
    await admin.from("lead_activities").insert({
      lead_id: leadId, deal_id: deal?.id, type: "inbound_inquiry",
      payload: { source, inquiry_id, anlass, personen, datum },
    });
    await admin.from("lead_inbound_log").insert({
      source, source_record_id: inquiry_id ?? null, lead_id: leadId, deal_id: deal?.id ?? null, raw: data,
    });

    // Anreicherung anstoßen
    await admin.from("lead_enrichment_queue").insert({ lead_id: leadId });

    return new Response(JSON.stringify({ ok: true, lead_id: leadId, deal_id: deal?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lead-inbound error", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Fehler" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
