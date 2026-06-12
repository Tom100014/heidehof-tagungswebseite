// Sends a status-update email to the guest of a tagungs_inquiries row.
// Triggered from AdminInbox when an admin changes the inquiry status.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type Status = "neu" | "in_bearbeitung" | "angebot_gesendet" | "gewonnen" | "abgesagt";

const TEMPLATES: Record<Status, { subject: (n: string) => string; body: (n: string, extra?: string) => string }> = {
  neu: {
    subject: () => "Wir haben Ihre Anfrage erhalten – Hotel Der Heidehof",
    body: (n) => `Guten Tag ${n},\n\nvielen Dank für Ihre Tagungsanfrage. Wir melden uns kurzfristig mit einem persönlichen Vorschlag bei Ihnen.\n\nHerzliche Grüße\nIhr Heidehof-Team`,
  },
  in_bearbeitung: {
    subject: () => "Ihre Anfrage wird bearbeitet – Hotel Der Heidehof",
    body: (n) => `Guten Tag ${n},\n\nwir bearbeiten Ihre Anfrage gerade und stellen ein passendes Angebot zusammen. Sie hören in Kürze von uns.\n\nHerzliche Grüße\nIhr Heidehof-Team`,
  },
  angebot_gesendet: {
    subject: () => "Ihr Angebot vom Hotel Der Heidehof",
    body: (n, extra) => `Guten Tag ${n},\n\nanbei senden wir Ihnen unser Angebot. Bei Fragen sind wir jederzeit für Sie da.\n\n${extra || ""}\n\nHerzliche Grüße\nIhr Heidehof-Team`,
  },
  gewonnen: {
    subject: () => "Bestätigung Ihrer Tagung – Hotel Der Heidehof",
    body: (n) => `Guten Tag ${n},\n\nherzlichen Dank für Ihre Buchung! Wir freuen uns sehr, Sie bei uns begrüßen zu dürfen, und kümmern uns um alle Details.\n\nHerzliche Grüße\nIhr Heidehof-Team`,
  },
  abgesagt: {
    subject: () => "Ihre Anfrage – Hotel Der Heidehof",
    body: (n) => `Guten Tag ${n},\n\nleider können wir Ihre Anfrage zum gewünschten Zeitraum nicht passend abbilden. Wir würden uns freuen, Sie zu einem anderen Termin bei uns zu begrüßen.\n\nHerzliche Grüße\nIhr Heidehof-Team`,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { id, status, extra } = (await req.json()) as { id: string; status: Status; extra?: string };
    if (!id || !status || !(status in TEMPLATES)) {
      return new Response(JSON.stringify({ ok: false, error: "id und gültiger status erforderlich" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: inquiry, error } = await supabase
      .from("tagungs_inquiries")
      .select("id, name, email, firma, angebot_text")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!inquiry || !inquiry.email) {
      return new Response(JSON.stringify({ ok: false, error: "Anfrage ohne E-Mail" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tpl = TEMPLATES[status];
    const greetingName = (inquiry.name || inquiry.firma || "")?.toString().split(" ")[0] || "geschätzte/r Gast";
    const subject = tpl.subject(greetingName);
    const body = tpl.body(greetingName, extra ?? (status === "angebot_gesendet" ? inquiry.angebot_text ?? "" : undefined));
    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#fffaf1;padding:24px;color:#2a2418;">
      <div style="max-width:600px;margin:auto;background:#fff;border:1px solid #e6dcc1;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a1408,#2a2418);color:#d9b45a;padding:18px 22px;">
          <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;">Hotel Der Heidehof</div>
        </div>
        <div style="padding:22px;white-space:pre-line;line-height:1.55;">${body.replace(/</g, "&lt;")}</div>
        <div style="padding:14px 22px;background:#1a1408;color:#9a8a66;font-size:11px;text-align:center;">Hotel Der Heidehof · Lüneburger Heide</div>
      </div></body></html>`;

    const gateway = "https://connector-gateway.lovable.dev/resend";
    const sendRes = await fetch(`${gateway}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Hotel Der Heidehof <onboarding@resend.dev>",
        to: [inquiry.email],
        subject,
        html,
      }),
    });
    const sendJson = await sendRes.json().catch(() => ({}));

    await supabase
      .from("tagungs_inquiries")
      .update({ guest_notified_at: new Date().toISOString() })
      .eq("id", id);

    return new Response(JSON.stringify({ ok: true, send: sendJson }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-inquiry-status-email failed:", e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
