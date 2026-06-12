// Receives a Clara voice conversation transcript, extracts structured fields
// via Lovable AI, persists the inquiry, and emails a summary to the hotel.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const DEFAULT_RECIPIENT = "kontakt@heidehof.de";
const DEFAULT_FROM = "Hotel Der Heidehof <onboarding@resend.dev>";

async function loadEmailSettings() {
  const { data } = await admin
    .from("app_settings")
    .select("key,value")
    .in("key", ["inquiry_recipient_email", "inquiry_from_email"]);
  const map: Record<string, unknown> = {};
  (data || []).forEach((r: { key: string; value: unknown }) => { map[r.key] = r.value; });
  const recipient = typeof map.inquiry_recipient_email === "string" && map.inquiry_recipient_email
    ? map.inquiry_recipient_email as string
    : DEFAULT_RECIPIENT;
  const from = typeof map.inquiry_from_email === "string" && map.inquiry_from_email
    ? map.inquiry_from_email as string
    : DEFAULT_FROM;
  return { recipient, from };
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

interface Turn {
  role: "user" | "agent";
  text: string;
}

const extractionTool = {
  type: "function" as const,
  function: {
    name: "extract_inquiry",
    description: "Extrahiert die Tagungsanfrage-Felder aus dem Gespräch.",
    parameters: {
      type: "object",
      properties: {
        anlass: { type: "string" },
        personen: { type: "string" },
        datum: { type: "string" },
        dauer: { type: "string" },
        uebernachtung: { type: "string" },
        verpflegung: { type: "string" },
        technik: { type: "string" },
        besonderheiten: { type: "string" },
        raumvorschlag: { type: "string" },
        pauschalvorschlag: { type: "string" },
        name: { type: "string" },
        firma: { type: "string" },
        email: { type: "string" },
        telefon: { type: "string" },
        zusammenfassung: { type: "string", description: "2-4 Sätze, professionell." },
      },
      required: ["zusammenfassung"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript } = (await req.json()) as { transcript: Turn[] };
    if (!Array.isArray(transcript) || transcript.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Leerer Gesprächsverlauf" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transcriptText = transcript
      .map((t) => `${t.role === "user" ? "GAST" : "CLARA"}: ${t.text}`)
      .join("\n");

    // 1. Extract structured fields via Lovable AI (with retry + fallback on 429)
    const callAi = async (model: string) =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Du extrahierst aus einem Beratungsgespräch zwischen Clara (Hotel Der Heidehof) und einem Gast die Tagungsanfrage-Felder. Lass leere Felder weg. Schreibe eine professionelle 2-4-sätzige Zusammenfassung auf Deutsch.",
            },
            { role: "user", content: transcriptText },
          ],
          tools: [extractionTool],
          tool_choice: { type: "function", function: { name: "extract_inquiry" } },
        }),
      });

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    let aiRes: Response | null = null;
    let lastDetail = "";
    outer: for (const model of models) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const r = await callAi(model);
        if (r.ok) { aiRes = r; break outer; }
        lastDetail = await r.text();
        if (r.status === 429 || r.status >= 500) {
          await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
          continue;
        }
        break;
      }
    }

    let fields: Record<string, string> = {};
    if (aiRes) {
      const aiJson = await aiRes.json();
      const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
      fields = toolCall ? JSON.parse(toolCall.function.arguments) : {};
    } else {
      // Fallback: persist + email transcript without AI extraction so the lead is never lost
      console.warn("AI-Extraktion übersprungen (Rate-Limit):", lastDetail);
      fields = {
        zusammenfassung:
          "Automatische Zusammenfassung aktuell nicht verfügbar (KI-Limit). Bitte Gesprächsverlauf unten prüfen.",
      };
    }

    // 2. Persist to tagungs_inquiries
    const { data: inquiry, error: insertErr } = await admin
      .from("tagungs_inquiries")
      .insert({
        ...fields,
        conversation: transcript,
        email_sent: false,
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // 3. Send email via Resend
    const fieldRow = (label: string, value?: string) =>
      value ? `<tr><td style="padding:6px 12px;color:#6b6b6b;font-weight:600;width:160px">${label}</td><td style="padding:6px 12px;color:#1a1a1a">${escapeHtml(value)}</td></tr>` : "";

    const html = `
      <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;padding:24px;background:#fafaf7;color:#1a1a1a">
        <h1 style="font-size:22px;color:#8b6914;border-bottom:2px solid #d4af37;padding-bottom:8px">Neue Tagungsanfrage über Clara</h1>
        <p style="font-size:15px;line-height:1.6;color:#333">${escapeHtml(fields.zusammenfassung || "")}</p>
        <h2 style="font-size:16px;margin-top:24px;color:#8b6914">Details</h2>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:6px;overflow:hidden">
          ${fieldRow("Anlass", fields.anlass)}
          ${fieldRow("Personen", fields.personen)}
          ${fieldRow("Datum", fields.datum)}
          ${fieldRow("Dauer", fields.dauer)}
          ${fieldRow("Übernachtung", fields.uebernachtung)}
          ${fieldRow("Verpflegung", fields.verpflegung)}
          ${fieldRow("Technik", fields.technik)}
          ${fieldRow("Raumvorschlag", fields.raumvorschlag)}
          ${fieldRow("Pauschalvorschlag", fields.pauschalvorschlag)}
          ${fieldRow("Besonderheiten", fields.besonderheiten)}
        </table>
        <h2 style="font-size:16px;margin-top:24px;color:#8b6914">Kontakt</h2>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:6px;overflow:hidden">
          ${fieldRow("Name", fields.name)}
          ${fieldRow("Firma", fields.firma)}
          ${fieldRow("E-Mail", fields.email)}
          ${fieldRow("Telefon", fields.telefon)}
        </table>
        <details style="margin-top:24px">
          <summary style="cursor:pointer;color:#6b6b6b;font-size:13px">Vollständiger Gesprächsverlauf</summary>
          <pre style="white-space:pre-wrap;font-family:inherit;font-size:13px;color:#444;background:white;padding:12px;border-radius:6px;margin-top:8px">${escapeHtml(transcriptText)}</pre>
        </details>
        <p style="margin-top:24px;font-size:12px;color:#999">Anfrage-ID: ${inquiry.id}</p>
      </div>
    `;

    const subject = `Tagungsanfrage${fields.name ? ` – ${fields.name}` : ""}${fields.anlass ? ` (${fields.anlass})` : ""}`;

    const { recipient, from } = await loadEmailSettings();
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: fields.email || undefined,
        subject,
        html,
      }),
    });

    let emailError: string | null = null;
    if (!emailRes.ok) {
      emailError = await emailRes.text();
      console.error("Resend error:", emailError);
    }

    await admin
      .from("tagungs_inquiries")
      .update({ email_sent: emailRes.ok, email_error: emailError })
      .eq("id", inquiry.id);

    return new Response(JSON.stringify({ ok: true, id: inquiry.id, email_sent: emailRes.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clara-voice-summary error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
