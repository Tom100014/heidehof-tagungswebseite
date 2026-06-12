// Public webhook for inbound email replies (Resend Inbound, Mailgun, SendGrid, custom forwarder).
// Identifies the lead via from-email (or in_reply_to header), logs the reply,
// marks the lead as replied, pauses any active sequence enrollment and creates a pipeline note.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SHARED_SECRET = Deno.env.get("LEAD_REPLY_WEBHOOK_SECRET") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function pick<T = string>(obj: any, ...keys: string[]): T | undefined {
  for (const k of keys) {
    const v = k.split(".").reduce((a: any, p) => (a ? a[p] : undefined), obj);
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return undefined;
}

function parseAddress(raw: string): { email: string; name?: string } {
  if (!raw) return { email: "" };
  const m = raw.match(/^\s*(?:"?([^"<]*)"?\s*)?<?([^>\s]+@[^>\s]+)>?/);
  if (!m) return { email: raw.trim().toLowerCase() };
  return { email: m[2].trim().toLowerCase(), name: m[1]?.trim() || undefined };
}

function detectAutoReply(subject: string, headers: any): boolean {
  const s = (subject || "").toLowerCase();
  if (/^(auto[- ]?reply|abwesenheits|out of office|automatic reply|automatische antwort)/.test(s)) return true;
  const auto = headers?.["auto-submitted"] || headers?.["Auto-Submitted"];
  if (auto && String(auto).toLowerCase() !== "no") return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "method" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (SHARED_SECRET) {
      const provided = req.headers.get("x-webhook-secret") || new URL(req.url).searchParams.get("secret");
      if (provided !== SHARED_SECRET) {
        return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const payload = await req.json().catch(() => ({}));

    // Normalise across providers (Resend Inbound, Mailgun, SendGrid, plain JSON)
    const fromRaw = pick<string>(payload, "from", "From", "sender", "envelope.from", "data.from") ?? "";
    const { email: fromEmail, name: fromName } = parseAddress(fromRaw);
    if (!fromEmail) {
      return new Response(JSON.stringify({ ok: false, error: "missing from" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const subject = pick<string>(payload, "subject", "Subject", "data.subject") ?? "";
    const text = pick<string>(payload, "text", "body-plain", "plain", "data.text") ?? "";
    const html = pick<string>(payload, "html", "body-html", "data.html") ?? "";
    const messageId = pick<string>(payload, "message_id", "Message-Id", "messageId", "data.message_id");
    const inReplyTo = pick<string>(payload, "in_reply_to", "In-Reply-To", "data.in_reply_to");
    const headers = pick<any>(payload, "headers", "message-headers") ?? {};
    const isAuto = detectAutoReply(subject, headers);

    // Find lead by sender email
    const { data: lead } = await admin
      .from("leads")
      .select("id, campaign_id, enrolled_sequence_id, status")
      .ilike("email", fromEmail)
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();

    const { data: reply, error: replyErr } = await admin.from("lead_replies").insert({
      lead_id: lead?.id ?? null,
      campaign_id: lead?.campaign_id ?? null,
      from_email: fromEmail,
      from_name: fromName ?? null,
      subject,
      body_text: text,
      body_html: html,
      message_id: messageId ?? null,
      in_reply_to: inReplyTo ?? null,
      is_auto_reply: isAuto,
      raw: payload,
    }).select("id").single();

    if (replyErr) {
      console.error("reply insert", replyErr);
      return new Response(JSON.stringify({ ok: false, error: replyErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (lead && !isAuto) {
      // Mark replied, pause enrollment, status -> replied
      await admin.from("leads").update({
        replied_at: now,
        enrolled_sequence_id: null,
        status: "replied",
        last_activity_at: now,
      }).eq("id", lead.id);

      await admin.from("lead_activities").insert({
        lead_id: lead.id,
        type: "reply_received",
        payload: { reply_id: reply?.id, subject, from: fromEmail },
        occurred_at: now,
      });

      // Promote deal to "Antwort erhalten" if exists
      await admin.from("pipeline_deals")
        .update({ stage: "qualified", updated_at: now })
        .eq("lead_id", lead.id)
        .in("stage", ["new", "contacted"]);

      await admin.from("email_events").insert({
        lead_id: lead.id,
        event_type: "replied",
        payload: { reply_id: reply?.id, subject },
      });
    }

    return new Response(JSON.stringify({ ok: true, reply_id: reply?.id, lead_id: lead?.id ?? null, auto_reply: isAuto }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lead-reply-inbound error", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
