// Stündlicher Cron-Tick: versendet freigegebene Drafts gemäß lead_automation-Einstellungen.
// Erweitert: injiziert Open-Pixel + Click-Tracking pro Mail (über tracking_token).
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const PUBLIC_SITE_URL = "https://hotel-dream-guide.lovable.app";
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const FROM_EMAIL = "Heidehof Lead-Agent <noreply@notify.ichloescheselbst.de>";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function newTrackingToken() {
  return crypto.randomUUID().replaceAll("-", "") + Date.now().toString(36);
}

function rewriteLinks(html: string, token: string): string {
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (_m, url) => {
    if (url.includes("/email-track/") || url.includes("/unsubscribe")) return `href="${url}"`;
    const wrapped = `${FUNCTIONS_URL}/email-track/click?t=${token}&u=${encodeURIComponent(url)}`;
    return `href="${wrapped}"`;
  });
}

function renderHtml(draft: any, lead: any, unsubscribeUrl: string, token: string) {
  const images = Array.isArray(draft.images) ? draft.images : [];
  const imageBlock = images.map((img: any) => img?.url ? `<img src="${img.url}" alt="${img.alt || ""}" style="max-width:100%;border-radius:8px;margin:12px 0" />` : "").join("");
  const attachments = Array.isArray(draft.attachments) ? draft.attachments : [];
  const att = attachments.length ? `<p style="margin:18px 0 0;font-size:13px"><strong>Anhang:</strong> ${attachments.map((a:any)=>`<a href="${a.url}">${a.name||"Datei"}</a>`).join(", ")}</p>` : "";
  const pixel = `<img src="${FUNCTIONS_URL}/email-track/open?t=${token}" width="1" height="1" style="display:none" alt="" />`;
  const inner = `${draft.body_html}${imageBlock}${att}`;
  const tracked = rewriteLinks(inner, token);
  return `<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;color:#1A1A1A;line-height:1.6;background:#fff"><div style="background:#1A1A1A;color:#F5EFE3;padding:22px;text-align:center;letter-spacing:.18em">HEIDEHOF</div><div style="border:1px solid #E5DCC7;border-top:0;padding:28px">${tracked}<hr style="border:0;border-top:1px solid #E5DCC7;margin:22px 0" /><p style="font-size:11px;color:#777">Hotel Der Heidehof · ${lead.city||""} · <a href="${unsubscribeUrl}">abmelden</a></p>${pixel}</div></div>`;
}

async function ensureTrackingToken(draftId: string, existing?: string | null): Promise<string> {
  if (existing) return existing;
  const t = newTrackingToken();
  await admin.from("lead_email_drafts").update({ tracking_token: t }).eq("id", draftId);
  return t;
}

async function sendOne(draft: any, lead: any) {
  const unsubToken = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  await admin.from("email_unsubscribe_tokens").insert({ email: lead.email, token: unsubToken });
  const unsubUrl = `${PUBLIC_SITE_URL}/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
  const token = await ensureTrackingToken(draft.id, draft.tracking_token);
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": RESEND_API_KEY },
    body: JSON.stringify({ from: FROM_EMAIL, to: [lead.email], subject: draft.subject, html: renderHtml(draft, lead, unsubUrl, token), text: draft.body_text || draft.subject }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const now = new Date();
    const hour = now.getUTCHours() + 1;
    const weekday = ((now.getUTCDay() + 6) % 7) + 1;

    const { data: autos } = await admin.from("lead_automation").select("*").eq("is_active", true);
    const results: any[] = [];

    for (const auto of autos || []) {
      if (hour < auto.send_hour_start || hour >= auto.send_hour_end) continue;
      if (!Array.isArray(auto.weekdays) || !auto.weekdays.includes(weekday)) continue;

      const startOfDay = new Date(now); startOfDay.setUTCHours(0, 0, 0, 0);
      const { count: sentToday } = await admin
        .from("lead_email_drafts").select("id", { count: "exact", head: true })
        .eq("campaign_id", auto.campaign_id).eq("status", "sent").gte("sent_at", startOfDay.toISOString());
      const remaining = Math.max(0, (auto.daily_cap ?? 25) - (sentToday ?? 0));
      if (remaining === 0) continue;

      const { data: drafts } = await admin
        .from("lead_email_drafts").select("*, lead:leads(*)")
        .eq("campaign_id", auto.campaign_id).eq("status", "approved").limit(remaining);

      let sent = 0; const errors: string[] = [];
      for (const d of drafts || []) {
        try {
          if (!d.lead?.email || d.lead.unsubscribed || d.lead.do_not_contact) {
            await admin.from("lead_email_drafts").update({ status: "discarded" }).eq("id", d.id); continue;
          }
          await sendOne(d, d.lead);
          await admin.from("lead_email_drafts").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", d.id);
          await admin.from("leads").update({ status: "contacted", last_sent_at: new Date().toISOString(), last_activity_at: new Date().toISOString() }).eq("id", d.lead_id);
          await admin.from("lead_events").insert({ lead_id: d.lead_id, campaign_id: d.campaign_id, type: "email_sent", payload: { draft_id: d.id, mode: "auto" } });
          await admin.from("lead_activities").insert({ lead_id: d.lead_id, type: "email_sent", payload: { draft_id: d.id, subject: d.subject } });
          sent++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Fehler";
          errors.push(`${d.id}: ${msg}`);
          await admin.from("lead_email_drafts").update({ status: "error", error_message: msg }).eq("id", d.id);
        }
      }

      await admin.from("lead_automation").update({ last_run_at: new Date().toISOString(), last_run_stats: { sent, errors } }).eq("campaign_id", auto.campaign_id);
      results.push({ campaign_id: auto.campaign_id, sent, errors });
    }

    return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("lead-automation-tick failed", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Fehler" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
