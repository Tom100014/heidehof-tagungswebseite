import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const PUBLIC_SITE_URL = "https://hotel-dream-guide.lovable.app";
const FROM_EMAIL = "Heidehof Lead-Agent <noreply@notify.ichloescheselbst.de>";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface SearchRequest {
  action: "search";
  campaignId: string;
  industry: string;
  city: string;
  radius: number;
  count: number;
}

interface StartRequest {
  action: "start_campaign";
  campaignId: string;
}

interface GenerateDraftsRequest {
  action: "generate_drafts";
  campaignId: string;
  leadIds?: string[];
}

type LeadAgentRequest = SearchRequest | StartRequest | GenerateDraftsRequest;

interface GeneratedLead {
  company: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  industry?: string | null;
  personalized_intro?: string | null;
}

interface LeadRow {
  id: string;
  campaign_id: string | null;
  company: string;
  contact_name: string | null;
  email: string | null;
  city: string | null;
  industry: string | null;
  enrichment: Record<string, unknown>;
  sequence_step: number;
  status: string;
}

interface CampaignRow {
  id: string;
  name: string;
  template_key: string;
  daily_cap: number;
  stats: Record<string, unknown>;
}

interface TemplateRow {
  subject: string;
  preheader: string | null;
  blocks: Record<string, unknown>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseRequest(value: unknown): { request: LeadAgentRequest } | { error: string } {
  const body = asRecord(value);
  const action = asString(body.action);
  const campaignId = asString(body.campaignId);
  if (!action) return { error: "Aktion fehlt." };
  if (!campaignId) return { error: "Kampagne fehlt." };

  if (action === "search") {
    const industry = asString(body.industry);
    const city = asString(body.city);
    if (!industry) return { error: "Branche fehlt." };
    if (!city) return { error: "Stadt fehlt." };
    const radius = Math.max(1, Math.min(250, Number(body.radius) || 25));
    const count = Math.max(1, Math.min(100, Number(body.count) || 15));
    return { request: { action, campaignId, industry, city, radius, count } };
  }

  if (action === "start_campaign") return { request: { action, campaignId } };
  if (action === "generate_drafts") {
    const leadIds = Array.isArray(body.leadIds) ? (body.leadIds as unknown[]).filter((v): v is string => typeof v === "string") : undefined;
    return { request: { action, campaignId, leadIds } };
  }
  return { error: `Unbekannte Aktion: ${action}` };
}

async function requireAdmin(req: Request): Promise<string | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, error: "Nicht angemeldet." }, 401);

  const token = authHeader.replace("Bearer ", "").trim();
  const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await authClient.auth.getClaims(token);
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return json({ ok: false, error: "Sitzung ungültig." }, 401);

  const { data: isAdmin, error: roleError } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (roleError || isAdmin !== true) return json({ ok: false, error: "Keine Admin-Berechtigung." }, 403);
  return userId;
}

function cleanLead(lead: GeneratedLead, fallback: SearchRequest): GeneratedLead | null {
  const company = asString(lead.company);
  if (!company) return null;
  const email = asString(lead.email).toLowerCase();
  return {
    company,
    contact_name: asString(lead.contact_name) || null,
    email: email.includes("@") ? email : null,
    phone: asString(lead.phone) || null,
    website: asString(lead.website) || null,
    address: asString(lead.address) || null,
    city: asString(lead.city) || fallback.city,
    postal_code: asString(lead.postal_code) || null,
    industry: asString(lead.industry) || fallback.industry,
    personalized_intro: asString(lead.personalized_intro) || null,
  };
}

async function generateLeads(request: SearchRequest): Promise<GeneratedLead[]> {
  const prompt = `Erstelle ${request.count} realistisch wirkende B2B-Lead-Datensätze für Tagungen/Seminare im Umkreis ${request.radius} km um ${request.city}, Branche/Zielgruppe: ${request.industry}.\n\nAntworte ausschließlich als JSON: {"leads":[{"company":"...","contact_name":"...","email":"...","phone":"...","website":"https://...","address":"...","city":"...","postal_code":"...","industry":"...","personalized_intro":"ein kurzer individueller Einstiegssatz für eine seriöse B2B-Mail"}]}.\nKeine Platzhalter wie example.com, keine erfundenen Privatdaten; wenn keine sinnvolle E-Mail ableitbar ist, email leer lassen.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 5000,
      temperature: 0.35,
    }),
  });

  if (!response.ok) throw new Error(`Lead-KI ${response.status}: ${(await response.text()).slice(0, 200)}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { leads?: GeneratedLead[] };
  return Array.isArray(parsed.leads) ? parsed.leads : [];
}

async function runSearch(request: SearchRequest): Promise<Response> {
  if (!LOVABLE_API_KEY) return json({ ok: false, error: "Lead-KI ist nicht verbunden." }, 500);
  const generated = await generateLeads(request);
  const cleaned = generated.map((lead) => cleanLead(lead, request)).filter((lead): lead is GeneratedLead => Boolean(lead));
  if (!cleaned.length) return json({ ok: false, error: "Keine passenden Leads gefunden." }, 422);

  const rows = cleaned.map((lead) => ({
    campaign_id: request.campaignId,
    company: lead.company,
    contact_name: lead.contact_name,
    email: lead.email,
    phone: lead.phone,
    website: lead.website,
    address: lead.address,
    city: lead.city,
    postal_code: lead.postal_code,
    industry: lead.industry,
    source: "ki-suche",
    status: lead.email ? "ready" : "needs_email",
    enrichment: { personalized_intro: lead.personalized_intro, search: { industry: request.industry, city: request.city, radius: request.radius } },
  }));

  const { data, error } = await admin.from("leads").insert(rows).select("id,company,email,status");
  if (error) throw error;

  await admin.from("lead_campaigns").update({
    filters: { industry: request.industry, city: request.city, radius: request.radius, count: request.count },
    mode: "search",
    status: "ready",
  }).eq("id", request.campaignId);

  return json({ ok: true, inserted: data?.length ?? rows.length, leads: data ?? [] });
}

function replaceVars(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, value), template);
}

function renderLeadHtml(template: TemplateRow, lead: LeadRow, unsubscribeUrl: string): { subject: string; html: string; text: string } {
  const intro = typeof template.blocks.intro === "string" ? template.blocks.intro : "Guten Tag {{contact_name}},\n\nfür {{company}} könnte der Heidehof ein passender Ort für Tagungen, Workshops und Firmenveranstaltungen sein. {{personalized_intro}}";
  const footer = typeof template.blocks.footer === "string" ? template.blocks.footer : "Hotel Der Heidehof";
  const ctaLabel = typeof template.blocks.cta_label === "string" ? template.blocks.cta_label : "Tagungsangebot ansehen";
  const ctaUrl = typeof template.blocks.cta_url === "string" && template.blocks.cta_url ? template.blocks.cta_url : `${PUBLIC_SITE_URL}/tagungspauschalen`;
  const values = {
    company: lead.company,
    contact_name: lead.contact_name || "Guten Tag",
    personalized_intro: asString(lead.enrichment?.personalized_intro),
    unsubscribe_url: unsubscribeUrl,
  };
  const body = replaceVars(intro, values).replaceAll("\n", "<br>");
  const subject = replaceVars(template.subject || "Tagungsmöglichkeiten im Heidehof", values);
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1A1A1A;line-height:1.6">
      <div style="background:#1A1A1A;color:#F5EFE3;padding:22px;text-align:center;letter-spacing:.18em;font-family:Georgia,serif">HEIDEHOF</div>
      <div style="border:1px solid #E5DCC7;border-top:0;padding:28px;background:#fff">
        <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 18px">${subject}</h1>
        <p>${body}</p>
        <p style="text-align:center;margin:28px 0"><a href="${ctaUrl}" style="background:#1A1A1A;color:#F5EFE3;padding:12px 22px;border-radius:6px;text-decoration:none">${ctaLabel}</a></p>
        <p style="font-size:13px;color:#555">${replaceVars(footer, values).replaceAll("\n", "<br>")}</p>
        <hr style="border:0;border-top:1px solid #E5DCC7;margin:22px 0" />
        <p style="font-size:11px;color:#777">Wenn Sie keine weiteren Nachrichten wünschen: <a href="${unsubscribeUrl}">abmelden</a>.</p>
      </div>
    </div>`;
  const text = `${subject}\n\n${replaceVars(intro, values)}\n\n${ctaLabel}: ${ctaUrl}\nAbmelden: ${unsubscribeUrl}`;
  return { subject, html, text };
}

async function sendLeadEmail(lead: LeadRow, template: TemplateRow): Promise<void> {
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) throw new Error("E-Mail-Anbindung ist nicht verbunden.");
  if (!lead.email) throw new Error("Lead hat keine E-Mail-Adresse.");

  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  await admin.from("email_unsubscribe_tokens").insert({ email: lead.email, token });
  const unsubscribeUrl = `${PUBLIC_SITE_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
  const rendered = renderLeadHtml(template, lead, unsubscribeUrl);

  const response = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [lead.email], subject: rendered.subject, html: rendered.html, text: rendered.text }),
  });

  const responseText = await response.text();
  if (!response.ok) throw new Error(`E-Mail ${response.status}: ${responseText.slice(0, 200)}`);
}

async function startCampaign(request: StartRequest): Promise<Response> {
  const { data: campaign, error: campaignError } = await admin
    .from("lead_campaigns")
    .select("id,name,template_key,daily_cap,stats")
    .eq("id", request.campaignId)
    .single();
  if (campaignError || !campaign) throw campaignError ?? new Error("Kampagne nicht gefunden.");

  const currentCampaign = campaign as CampaignRow;
  const { data: template, error: templateError } = await admin
    .from("email_templates")
    .select("subject,preheader,blocks")
    .eq("key", currentCampaign.template_key || "lead-outreach")
    .eq("is_active", true)
    .single();
  if (templateError || !template) throw templateError ?? new Error("E-Mail-Vorlage nicht gefunden.");

  const cap = Math.max(1, Math.min(100, currentCampaign.daily_cap ?? 25));
  const { data: leads, error: leadsError } = await admin
    .from("leads")
    .select("id,campaign_id,company,contact_name,email,city,industry,enrichment,sequence_step,status")
    .eq("campaign_id", request.campaignId)
    .eq("unsubscribed", false)
    .not("email", "is", null)
    .in("status", ["new", "ready", "imported", "generated"])
    .limit(cap);
  if (leadsError) throw leadsError;

  const recipients = (leads ?? []) as LeadRow[];
  let sent = 0;
  const errors: string[] = [];
  for (const lead of recipients) {
    try {
      await sendLeadEmail(lead, template as TemplateRow);
      sent += 1;
      await admin.from("leads").update({ status: "contacted", last_sent_at: new Date().toISOString(), sequence_step: (lead.sequence_step ?? 0) + 1 }).eq("id", lead.id);
      await admin.from("lead_events").insert({ lead_id: lead.id, campaign_id: request.campaignId, type: "email_sent", payload: { template_key: currentCampaign.template_key } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Versand fehlgeschlagen";
      errors.push(`${lead.company}: ${message}`);
      await admin.from("leads").update({ status: "send_error" }).eq("id", lead.id);
      await admin.from("lead_events").insert({ lead_id: lead.id, campaign_id: request.campaignId, type: "email_error", payload: { error: message } });
    }
  }

  const previousSent = Number(currentCampaign.stats?.sent ?? 0);
  await admin.from("lead_campaigns").update({
    status: sent > 0 ? "running" : "ready",
    stats: { ...currentCampaign.stats, sent: previousSent + sent },
  }).eq("id", request.campaignId);

  return json({ ok: true, sent, attempted: recipients.length, errors });
}

async function generateDraftsForCampaign(campaignId: string, leadIds?: string[]): Promise<Response> {
  if (!LOVABLE_API_KEY) return json({ ok: false, error: "KI nicht verbunden." }, 500);
  let query = admin
    .from("leads")
    .select("*")
    .not("email", "is", null)
    .eq("unsubscribed", false);
  if (leadIds && leadIds.length) query = query.in("id", leadIds);
  else query = query.eq("campaign_id", campaignId).limit(100);
  const { data: leads, error } = await query;
  if (error) throw error;
  if (!leads?.length) return json({ ok: false, error: "Keine geeigneten Leads gefunden." }, 422);

  let created = 0; const errors: string[] = [];
  for (const lead of leads) {
    // skip if draft already exists
    const { data: existing } = await admin.from("lead_email_drafts").select("id").eq("lead_id", lead.id).in("status", ["draft","approved"]).maybeSingle();
    if (existing) continue;

    try {
      const prompt = `Du bist Marketing-Texter*in für Hotel Der Heidehof in Bayern (Tagungen, Seminare, Firmenevents). Schreibe eine kurze, persönliche, professionelle B2B-Akquise-E-Mail. Antworte ausschließlich als JSON: {"subject":"…","body_html":"<p>…</p>","body_text":"…"}.\n\nLead:\n- Firma: ${lead.company || ""}\n- Ansprechperson: ${lead.contact_name || ""}\n- Branche: ${lead.industry || ""}\n- Stadt: ${lead.city || ""}\n- Aufhänger: ${lead.enrichment?.personalized_intro || ""}\n\nAnforderungen: Anrede mit Namen wenn vorhanden, sonst "Guten Tag". Zwei kurze Absätze, max. 120 Wörter. Klares Angebot Tagungspauschalen/Seminarräume. CTA Termin oder Angebot anfragen. Höfliches Deutsch.`;
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" }, temperature: 0.5 }),
      });
      if (!res.ok) { errors.push(`${lead.company}: ${res.status}`); continue; }
      const payload = await res.json() as any;
      const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? "{}");
      await admin.from("lead_email_drafts").insert({
        lead_id: lead.id,
        campaign_id: campaignId,
        subject: String(parsed.subject || "Tagungsmöglichkeiten im Heidehof"),
        body_html: String(parsed.body_html || ""),
        body_text: String(parsed.body_text || ""),
        status: "draft",
      });
      created++;
    } catch (e) {
      errors.push(`${lead.company}: ${e instanceof Error ? e.message : "Fehler"}`);
    }
  }

  return json({ ok: true, created, errors });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Methode nicht erlaubt." }, 405);

  try {
    const adminResult = await requireAdmin(req);
    if (adminResult instanceof Response) return adminResult;

    const parsed = parseRequest(await req.json());
    if ("error" in parsed) return json({ ok: false, error: parsed.error }, 400);
    const request = parsed.request;

    if (request.action === "search") return await runSearch(request);
    if (request.action === "generate_drafts") return await generateDraftsForCampaign(request.campaignId, request.leadIds);
    return await startCampaign(request);
  } catch (error) {
    console.error("lead-agent failed", error);
    return json({ ok: false, error: error instanceof Error ? error.message : "Unbekannter Fehler" }, 500);
  }
});
