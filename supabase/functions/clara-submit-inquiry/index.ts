// Empfängt strukturierte Tagungsanfrage vom ElevenLabs Voice-Agent (oder Chat)
// und persistiert sie in tagungs_inquiries + sendet Mail + Notification.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const DEFAULT_RECIPIENT = "kontakt@heidehof.de";
const DEFAULT_FROM = "Hotel Der Heidehof <onboarding@resend.dev>";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface InquiryPayload {
  salutation?: string;
  first_name?: string;
  last_name?: string;
  firma?: string;
  email?: string;
  telefon?: string;
  anlass?: string;
  personen?: string;
  datum?: string;
  dauer?: string;
  uebernachtung?: string;
  verpflegung?: string;
  technik?: string;
  besonderheiten?: string;
  raumvorschlag?: string;
  pauschalvorschlag?: string;
  zusammenfassung?: string;
  source?: string;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

async function loadEmailSettings() {
  const { data } = await admin
    .from("app_settings")
    .select("key,value")
    .in("key", ["inquiry_recipient_email", "inquiry_from_email"]);
  const map: Record<string, unknown> = {};
  (data ?? []).forEach((r: { key: string; value: unknown }) => { map[r.key] = r.value; });
  const recipient = typeof map.inquiry_recipient_email === "string" && map.inquiry_recipient_email
    ? map.inquiry_recipient_email as string : DEFAULT_RECIPIENT;
  const from = typeof map.inquiry_from_email === "string" && map.inquiry_from_email
    ? map.inquiry_from_email as string : DEFAULT_FROM;
  return { recipient, from };
}

function buildHtml(p: InquiryPayload, fullName: string) {
  const row = (label: string, value?: string) =>
    value && value.trim()
      ? `<tr><td style="padding:6px 12px;color:#666;font-size:13px;">${label}</td><td style="padding:6px 12px;font-size:14px;">${value}</td></tr>`
      : "";
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;color:#1a1a1a;">
    <h2 style="font-family:Georgia,serif;color:#1a1a1a;">Neue Sprach-Anfrage von Clara</h2>
    <p style="color:#555;">Erfasst über Clara, den Sprachagenten auf der-heidehof.de.</p>
    <table style="border-collapse:collapse;width:100%;margin-top:16px;">
      ${row("Gast", fullName)}
      ${row("Firma", p.firma)}
      ${row("E-Mail", p.email)}
      ${row("Telefon", p.telefon)}
      ${row("Anlass", p.anlass)}
      ${row("Personen", p.personen)}
      ${row("Datum", p.datum)}
      ${row("Dauer", p.dauer)}
      ${row("Übernachtung", p.uebernachtung)}
      ${row("Verpflegung", p.verpflegung)}
      ${row("Technik", p.technik)}
      ${row("Besonderheiten", p.besonderheiten)}
      ${row("Raumvorschlag", p.raumvorschlag)}
      ${row("Pauschale", p.pauschalvorschlag)}
    </table>
    ${p.zusammenfassung ? `<div style="margin-top:20px;padding:14px;background:#f6f4ee;border-left:3px solid #c9a76a;"><strong>Zusammenfassung:</strong><br/>${p.zusammenfassung}</div>` : ""}
  </div>`;
}

async function sendMail(to: string, from: string, subject: string, html: string) {
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) return { skipped: true };
  const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Resend ${r.status}: ${text.slice(0, 200)}`);
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const p = (await req.json()) as InquiryPayload;
    const salutation = str(p.salutation);
    const first = str(p.first_name);
    const last = str(p.last_name);
    const fullName = [salutation, first, last].filter(Boolean).join(" ") || "Unbekannt";

    if (!last && !p.email && !p.telefon) {
      return new Response(JSON.stringify({ ok: false, error: "Mindestens Nachname oder Kontaktdaten erforderlich." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inquiry, error: insErr } = await admin
      .from("tagungs_inquiries")
      .insert({
        name: fullName,
        firma: str(p.firma) || null,
        email: str(p.email) || null,
        telefon: str(p.telefon) || null,
        anlass: str(p.anlass) || null,
        personen: str(p.personen) || null,
        datum: str(p.datum) || null,
        dauer: str(p.dauer) || null,
        uebernachtung: str(p.uebernachtung) || null,
        verpflegung: str(p.verpflegung) || null,
        technik: str(p.technik) || null,
        besonderheiten: str(p.besonderheiten) || null,
        raumvorschlag: str(p.raumvorschlag) || null,
        pauschalvorschlag: str(p.pauschalvorschlag) || null,
        zusammenfassung: str(p.zusammenfassung) || null,
        status: "neu",
        dispatch_status: p.source === "auto_summary" ? "auto_summary" : "pending",
      })
      .select()
      .single();
    if (insErr) throw insErr;

    const { recipient, from } = await loadEmailSettings();
    let mailOk = false;
    let mailErr: string | null = null;
    try {
      const subject = `Neue Tagungsanfrage – ${fullName}${p.firma ? ` (${p.firma})` : ""}`;
      await sendMail(recipient, from, subject, buildHtml(p, fullName));
      mailOk = true;
    } catch (e) {
      mailErr = e instanceof Error ? e.message : String(e);
      console.error("mail send failed", mailErr);
    }

    await admin.from("tagungs_inquiries").update({
      email_sent: mailOk,
      email_error: mailErr,
      dispatched_at: mailOk ? new Date().toISOString() : null,
    }).eq("id", inquiry.id);

    await admin.from("notifications").insert({
      channel: "admin",
      recipient: "bankett",
      content: `Neue Sprach-Anfrage: ${fullName}${p.anlass ? ` – ${p.anlass}` : ""}`,
      payload: { inquiry_id: inquiry.id, source: p.source ?? "voice" },
      status: "unread",
    });

    return new Response(JSON.stringify({ ok: true, inquiry_id: inquiry.id, mail_sent: mailOk }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clara-submit-inquiry error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
