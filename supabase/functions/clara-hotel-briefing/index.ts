// Clara Hotel-Briefing: nimmt eine Roh-Anfrage (Bestellung/Wellness/Beschwerde/Roomservice/Tagungsbestellung)
// und erzeugt mit Lovable AI eine perfekt aufbereitete deutsche Briefing-Mail ans Hotel.
// Versand via Resend Connector. Best-effort, fire-and-forget tauglich.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const DEFAULT_FROM = "Clara · Heidehof <anfrage@notify.ichloescheselbst.de>";
const DEFAULT_RECIPIENT = "reservierung@der-heidehof.de";

type Kind =
  | "restaurant_order"
  | "room_order"
  | "conference_order"
  | "wellness"
  | "complaint"
  | "general";

const KIND_LABEL: Record<Kind, string> = {
  restaurant_order: "Restaurant-/Bar-Bestellung",
  room_order: "Zimmerservice-Bestellung",
  conference_order: "Tagungs-Bestellung (Küche)",
  wellness: "Wellness-/Spa-/Beauty-Terminwunsch",
  complaint: "Gast-Beschwerde",
  general: "Gast-Anfrage",
};

const KIND_DEPT: Record<Kind, string> = {
  restaurant_order: "Restaurant & Bar",
  room_order: "Roomservice / Küche",
  conference_order: "Tagungsküche",
  wellness: "Spa & Wellness",
  complaint: "Gästebetreuung / Direktion",
  general: "Rezeption",
};

interface BriefingDraft {
  betreff: string;
  zusammenfassung: string;
  details: string[];
  naechste_schritte: string[];
  prioritaet: "sofort" | "heute" | "normal";
}

async function generate(kind: Kind, data: Record<string, unknown>): Promise<BriefingDraft> {
  const tool = {
    type: "function",
    function: {
      name: "create_briefing",
      description: "Strukturiertes Hotel-Briefing.",
      parameters: {
        type: "object",
        properties: {
          betreff: { type: "string", description: "Kurzer, präziser Mailbetreff (max. 90 Zeichen)." },
          zusammenfassung: { type: "string", description: "1–2 Sätze Klartext für die Hotelmitarbeiter." },
          details: { type: "array", items: { type: "string" }, description: "Bullet-Punkte mit allen relevanten Informationen (Tisch/Zimmer/Raum, Personen, Items mit Mengen, Zeit, Kontakt, Sonderwünsche, Allergien)." },
          naechste_schritte: { type: "array", items: { type: "string" }, description: "Konkrete To-dos für die zuständige Abteilung." },
          prioritaet: { type: "string", enum: ["sofort","heute","normal"] },
        },
        required: ["betreff","zusammenfassung","details","naechste_schritte","prioritaet"],
        additionalProperties: false,
      },
    },
  };

  const sys = `Du bist die Sekretariatsfunktion von Clara, der Concierge-KI von Hotel Der Heidehof in Gaimersheim/Ingolstadt.
Verarbeite eine Roh-Anfrage zu einem perfekt vorbereiteten internen Briefing für die zuständige Abteilung.
Sprache: Deutsch, Sie-Form, sachlich präzise, hotelreif. Keine Erfindungen — nur was in den Daten steht.
Allergien/Sonderwünsche besonders hervorheben. Wenn Kontaktdaten fehlen, das vermerken.`;
  const usr = `ART: ${KIND_LABEL[kind]}\nABTEILUNG: ${KIND_DEPT[kind]}\n\nROH-DATEN:\n${JSON.stringify(data, null, 2)}`;

  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "system", content: sys }, { role: "user", content: usr }],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "create_briefing" } },
    }),
  });
  if (!r.ok) throw new Error(`AI ${r.status}: ${await r.text()}`);
  const j = await r.json();
  const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("Keine Briefing-Antwort.");
  return JSON.parse(args) as BriefingDraft;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c] as string));
}

function renderHtml(kind: Kind, draft: BriefingDraft) {
  const prioColor = draft.prioritaet === "sofort" ? "#c0392b" : draft.prioritaet === "heute" ? "#d68910" : "#117a65";
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a;background:#f5f1ea;padding:24px">
<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e6dfd1;border-radius:12px;overflow:hidden">
<div style="background:#1a3c2a;color:#f5f1ea;padding:18px 24px"><div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;opacity:.8">Clara · Concierge-Briefing</div><div style="font-size:18px;font-weight:600;margin-top:4px">${escapeHtml(KIND_LABEL[kind])} · ${escapeHtml(KIND_DEPT[kind])}</div></div>
<div style="padding:20px 24px">
<div style="display:inline-block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:${prioColor};padding:4px 10px;border-radius:999px;margin-bottom:12px">Priorität: ${escapeHtml(draft.prioritaet)}</div>
<p style="font-size:15px;line-height:1.55;margin:0 0 16px">${escapeHtml(draft.zusammenfassung)}</p>
<h3 style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#5b5b5b;margin:18px 0 6px">Details</h3>
<ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.55">${draft.details.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>
<h3 style="font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#5b5b5b;margin:18px 0 6px">Nächste Schritte</h3>
<ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.55">${draft.naechste_schritte.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>
</div>
<div style="background:#faf6ee;border-top:1px solid #e6dfd1;padding:12px 24px;font-size:11px;color:#7a7a7a">Automatisch erzeugt von Clara · Hotel Der Heidehof</div>
</div></body></html>`;
}

async function sendMail(to: string, subject: string, html: string) {
  const r = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: DEFAULT_FROM, to: [to], subject, html }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
  return r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json() as { kind?: Kind; data?: Record<string, unknown>; sessionId?: string; recipient?: string };
    const kind = (body.kind ?? "general") as Kind;
    const data = body.data ?? {};
    const draft = await generate(kind, data);
    const html = renderHtml(kind, draft);
    const subject = draft.betreff || `${KIND_LABEL[kind]} · Heidehof`;
    const recipient = body.recipient || DEFAULT_RECIPIENT;
    await sendMail(recipient, subject, html);

    // Notification mit aufbereitetem Briefing für In-App-Inbox
    await admin.from("notifications").insert({
      channel: kind === "complaint" ? "manager" : kind === "wellness" ? "spa" : kind === "room_order" ? "kitchen" : kind === "conference_order" ? "kitchen" : "restaurant",
      recipient,
      content: subject,
      payload: { kind, draft, raw: data, session_id: body.sessionId ?? null },
    });

    return new Response(JSON.stringify({ ok: true, draft, subject }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clara-hotel-briefing error:", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
