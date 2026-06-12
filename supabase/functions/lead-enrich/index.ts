// Lead-Anreicherung: nutzt FIRECRAWL (falls verfügbar) für Website-Daten, sonst Heuristik aus Email-Domain.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FIRECRAWL = Deno.env.get("FIRECRAWL_API_KEY") ?? "";
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FREE_PROVIDERS = ["gmail.com","gmx.de","gmx.net","web.de","yahoo.com","yahoo.de","hotmail.com","hotmail.de","outlook.com","outlook.de","t-online.de","aol.com","icloud.com","mail.de","posteo.de"];

async function firecrawlSummary(website: string): Promise<Record<string, unknown> | null> {
  if (!FIRECRAWL || !LOVABLE_KEY) return null;
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_KEY}`, "X-Connection-Api-Key": FIRECRAWL },
      body: JSON.stringify({ url: website, formats: ["summary","markdown"], onlyMainContent: true }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return { summary: j?.summary ?? j?.data?.summary, title: j?.metadata?.title ?? j?.data?.metadata?.title };
  } catch { return null; }
}

async function processLead(leadId: string) {
  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!lead) return { ok: false, error: "lead not found" };

  const patch: Record<string, unknown> = {};
  const enrich: Record<string, unknown> = { ...(lead.enrichment || {}) };

  // Domain aus Email ableiten, falls keine Website
  let website = lead.website as string | null;
  if (!website && lead.email) {
    const dom = lead.email.split("@")[1]?.toLowerCase();
    if (dom && !FREE_PROVIDERS.includes(dom)) {
      website = `https://${dom}`;
      patch.website = website;
    }
  }

  if (website) {
    const fc = await firecrawlSummary(website);
    if (fc) { enrich.firecrawl = fc; enrich.enriched_at = new Date().toISOString(); }
  }

  // einfache B2B-Heuristik
  if (lead.email) {
    const dom = lead.email.split("@")[1]?.toLowerCase() || "";
    enrich.is_business_email = !FREE_PROVIDERS.includes(dom);
  }

  patch.enrichment = enrich;
  await admin.from("leads").update(patch).eq("id", leadId);

  // Re-Scoring antriggern
  await admin.from("lead_activities").insert({ lead_id: leadId, type: "enriched", payload: { website, has_firecrawl: !!enrich.firecrawl } });

  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const { lead_id, drain = false, limit = 25 } = body as { lead_id?: string; drain?: boolean; limit?: number };

    if (lead_id) {
      const r = await processLead(lead_id);
      return new Response(JSON.stringify(r), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (drain) {
      const { data: jobs } = await admin.from("lead_enrichment_queue").select("*").eq("status", "pending").limit(limit);
      const results: any[] = [];
      for (const j of jobs || []) {
        await admin.from("lead_enrichment_queue").update({ status: "running", attempts: (j.attempts ?? 0) + 1 }).eq("id", j.id);
        try {
          const r = await processLead(j.lead_id);
          await admin.from("lead_enrichment_queue").update({ status: r.ok ? "done" : "error", result: r, last_error: r.ok ? null : (r as any).error }).eq("id", j.id);
          results.push({ id: j.id, ...r });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Fehler";
          await admin.from("lead_enrichment_queue").update({ status: "error", last_error: msg }).eq("id", j.id);
          results.push({ id: j.id, ok: false, error: msg });
        }
      }
      return new Response(JSON.stringify({ ok: true, processed: results.length, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: false, error: "lead_id oder drain erforderlich" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("lead-enrich error", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Fehler" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
