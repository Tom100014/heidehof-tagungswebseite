// Clara - Tagungs-Berater (RAG + DB + Resend)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

async function loadRagContext() {
  const { data } = await admin
    .from("clara_knowledge")
    .select("title,category,content")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (!data?.length) return "";
  return data.map((k: any) => `### ${k.category.toUpperCase()} — ${k.title}\n${k.content}`).join("\n\n");
}

async function getSetting(key: string, fallback: string) {
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  if (!data) return fallback;
  const v = (data as any).value;
  return typeof v === "string" ? v : (v?.toString() ?? fallback);
}

function buildSystemPrompt(rag: string) {
  return `Du bist Clara, persönliche Tagungs- und Concierge-Beraterin von Hotel Der Heidehof in Gaimersheim/Ingolstadt – warm, kompetent, auf Augenhöhe (Sie-Form, deutsch).

HARTE STIL-REGELN (immer einhalten, spart Tokens):
- Antworte in **maximal 2 kurzen Sätzen**.
- Stelle pro Nachricht **genau EINE** konkrete Folgefrage.
- **Wiederhole niemals** den Text aus der Wissensbasis als Vorlese-Block – verweise nur darauf, wenn der Gast danach fragt.
- **Keine Begrüßung** nach der ersten Nachricht. Kein „Gerne", „Sehr gerne", „Mit Freude" als Einleitung.
- Keine Aufzählungen, außer der Gast bittet ausdrücklich darum.
- Direkt zum Ziel: passender Raum, passende Pauschale, fehlende Info abfragen.

GESPRÄCHSFLUSS (genau eine Frage pro Runde, in dieser Reihenfolge sammeln):
1. Anlass → 2. Personenzahl → 3. Datum/Dauer → 4. Übernachtung → 5. Verpflegung → 6. Technik → 7. Kontaktdaten (Firma, Name, E-Mail, Telefon)
8. Sobald Anlass + Personen + Datum + Kontakt vorliegen: kurze Empfehlung (1 Satz) + „Möchten Sie die Anfrage jetzt absenden?"

FAKTEN AUS UNSERER WISSENSDATENBANK (verbindlich – nichts anderes erfinden):
${rag || "(Wissensbasis leer – nur generelle Tagungs-Beratung möglich.)"}

Erfinde keine Preise außerhalb der genannten Pauschalen. Bei Sonderwünschen: „Das stimmen wir individuell ab."`;
}

const SUMMARY_TOOL = {
  type: "function",
  function: {
    name: "tagungsanfrage",
    description: "Strukturierte Tagungsanfrage extrahieren",
    parameters: {
      type: "object",
      properties: {
        firma: { type: "string" }, name: { type: "string" }, email: { type: "string" }, telefon: { type: "string" },
        anlass: { type: "string" }, personen: { type: "string" }, datum: { type: "string" }, dauer: { type: "string" },
        uebernachtung: { type: "string" }, verpflegung: { type: "string" }, technik: { type: "string" },
        raumvorschlag: { type: "string" }, pauschalvorschlag: { type: "string" },
        besonderheiten: { type: "string" }, zusammenfassung: { type: "string" },
      },
      required: ["zusammenfassung"],
      additionalProperties: false,
    },
  },
};

function inquiryHtml(d: any, conversation: any[]) {
  const row = (l: string, v: string) => `<tr><td style="padding:6px 12px;color:#888;width:180px;">${l}</td><td style="padding:6px 12px;color:#111;">${v || "–"}</td></tr>`;
  const conv = conversation.map(m => `<p style="margin:8px 0;"><strong style="color:${m.role==='user'?'#b8924a':'#333'}">${m.role==='user'?'Kunde':'Clara'}:</strong> ${(m.content||"").replace(/</g,"&lt;").replace(/\n/g,"<br>")}</p>`).join("");
  return `<!doctype html><html><body style="background:#fff;font-family:-apple-system,system-ui,sans-serif;color:#111;margin:0;padding:24px;">
  <div style="max-width:680px;margin:0 auto;border:1px solid #eee;">
    <div style="background:#0a0a0a;color:#d4af6a;padding:24px 32px;">
      <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Hotel Der Heidehof</div>
      <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-weight:400;font-size:26px;">Neue Tagungsanfrage von Clara</h1>
    </div>
    <div style="padding:24px 32px;">
      <h2 style="font-family:Georgia,serif;font-weight:400;font-size:18px;border-bottom:1px solid #eee;padding-bottom:8px;">Kontakt</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row("Firma", d.firma)}${row("Ansprechpartner", d.name)}${row("E-Mail", d.email)}${row("Telefon", d.telefon)}
      </table>
      <h2 style="font-family:Georgia,serif;font-weight:400;font-size:18px;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:24px;">Veranstaltung</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row("Anlass", d.anlass)}${row("Personen", d.personen)}${row("Datum", d.datum)}${row("Dauer", d.dauer)}
        ${row("Übernachtung", d.uebernachtung)}${row("Verpflegung", d.verpflegung)}${row("Technik", d.technik)}
        ${row("Besonderheiten", d.besonderheiten)}
      </table>
      <h2 style="font-family:Georgia,serif;font-weight:400;font-size:18px;border-bottom:1px solid #eee;padding-bottom:8px;margin-top:24px;">Empfehlung von Clara</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row("Raum", d.raumvorschlag)}${row("Pauschale", d.pauschalvorschlag)}
      </table>
      <p style="background:#faf6ee;padding:16px;border-left:3px solid #d4af6a;margin-top:16px;font-size:14px;">${(d.zusammenfassung||"").replace(/</g,"&lt;").replace(/\n/g,"<br>")}</p>
      <details style="margin-top:24px;font-size:13px;color:#555;"><summary style="cursor:pointer;color:#b8924a;">Vollständiger Gesprächsverlauf</summary><div style="margin-top:12px;">${conv}</div></details>
    </div>
    <div style="padding:16px 32px;background:#fafafa;border-top:1px solid #eee;font-size:11px;color:#888;text-align:center;letter-spacing:0.15em;text-transform:uppercase;">Hotel Der Heidehof · Conference & SPA Resort · Ingolstadt</div>
  </div></body></html>`;
}

async function sendEmail(to: string, from: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY missing" };
  const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!r.ok) return { ok: false, error: `${r.status} ${await r.text()}` };
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { messages, mode } = body;

    // SUBMIT mode → summarize, persist, email
    if (mode === "submit") {
      const sumResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Extrahiere strukturierte Tagungsanfrage-Daten. Antworte nur über das Tool." },
            ...messages,
          ],
          tools: [SUMMARY_TOOL],
          tool_choice: { type: "function", function: { name: "tagungsanfrage" } },
        }),
      });
      const sumData = await sumResp.json();
      const args = sumData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      let d: Record<string, unknown> = {};
      try {
        d = args ? JSON.parse(args) : {};
      } catch (parseError) {
        console.warn("tagungs-agent summary parse failed:", parseError);
        d = { zusammenfassung: "Tagungsanfrage konnte nicht vollständig strukturiert werden. Bitte Gesprächsverlauf prüfen." };
      }

      const recipient = await getSetting("inquiry_recipient_email", "reservierung@der-heidehof.de");
      const fromAddr = await getSetting("inquiry_from_email", "Hotel Der Heidehof <onboarding@resend.dev>");
      const subject = `Tagungsanfrage – ${d.firma || d.name || "Neuer Kunde"}`;
      const html = inquiryHtml(d, messages);

      const mail = await sendEmail(recipient, fromAddr, subject, html);

      const { error: insErr } = await admin.from("tagungs_inquiries").insert({
        firma: d.firma, name: d.name, email: d.email, telefon: d.telefon,
        anlass: d.anlass, personen: d.personen, datum: d.datum, dauer: d.dauer,
        uebernachtung: d.uebernachtung, verpflegung: d.verpflegung, technik: d.technik,
        raumvorschlag: d.raumvorschlag, pauschalvorschlag: d.pauschalvorschlag,
        besonderheiten: d.besonderheiten, zusammenfassung: d.zusammenfassung,
        conversation: messages, email_sent: mail.ok, email_error: mail.ok ? null : mail.error,
      });
      if (insErr) {
        console.error("insert error:", insErr);
        return new Response(JSON.stringify({ ok: false, error: insErr.message, data: d, email: mail }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, data: d, email: mail }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CHAT (streaming) with RAG
    const rag = await loadRagContext();
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: buildSystemPrompt(rag) }, ...messages],
        stream: true,
      }),
    });

    if (response.status === 429)
      return new Response(JSON.stringify({ error: "Zu viele Anfragen." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (response.status === 402)
      return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!response.ok) {
      console.error("AI gateway:", response.status, await response.text());
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
