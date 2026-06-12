// Versendet Tagungsanfrage per Resend (Connector Gateway) + speichert in DB.
// - DIN 5008 Geschäftsbrief-PDF mit Logo, Anschriftenfeld, Bezugszeile, Falzmarken
// - Proaktive Upselling-Vorschläge (Wellness/SPA, Abendessen, Aktivprogramm) aus RAG
// - Markenkonforme HTML-Mail mit Logo + Hotel-Footer
// - PDF an Hotel und Gast als Anhang
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

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
const DEFAULT_FROM = "Hotel Der Heidehof <anfrage@notify.ichloescheselbst.de>";
const DEFAULT_RECIPIENT = "reservierung@der-heidehof.de";

// Hotel-Stammdaten (DIN 5008)
const HOTEL = {
  name: "Hotel Der Heidehof",
  subtitle: "Conference & SPA Resort",
  street: "Ingolstädter Straße 121",
  zip: "85080",
  city: "Gaimersheim / Ingolstadt",
  country: "Deutschland",
  phone: "+49 8458 64-0",
  fax: "+49 8458 64-230",
  email: "info@der-heidehof.de",
  web: "www.der-heidehof.de",
};

interface InquiryBody {
  sessionId?: string;
  name: string;
  email: string;
  telefon?: string;
  firma?: string;
  anlass: string;
  personen?: string;
  datum?: string;
  nachricht?: string;
  uebernachtung?: string;
  verpflegung?: string;
  technik?: string;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c] as string));
}

async function loadLogoBase64(): Promise<{ data: string; format: "PNG" | "JPEG" } | null> {
  try {
    const { data } = await admin.from("site_images").select("url").eq("slug", "footer-logo").maybeSingle();
    const url = (data as { url?: string } | null)?.url;
    if (!url) return null;
    const r = await fetch(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = ""; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    const b64 = btoa(bin);
    const format: "PNG" | "JPEG" = url.toLowerCase().endsWith(".jpg") || url.toLowerCase().endsWith(".jpeg") ? "JPEG" : "PNG";
    return { data: b64, format };
  } catch { return null; }
}

interface OfferDraft {
  bezug: string;            // Bezugszeile
  anrede: string;           // "Sehr geehrter Herr ..."
  einleitung: string;
  raum: string;             // empfohlener Raum + kurze Begründung
  pauschale: string;        // Pauschalvorschlag (Pro-Pers ca. €)
  upselling: string[];      // Liste konkreter Zusatzangebote (Wellness, Dinner, Aktiv ...)
  hinweis: string;          // Freibleibend / Bestätigung Bankett
  schluss: string;          // Schlussformel
}

async function generateOfferDraft(b: InquiryBody): Promise<OfferDraft> {
  const { data: kb } = await admin.from("clara_knowledge").select("title,category,content").eq("is_active", true).limit(60);
  const kbText = (kb ?? []).map((k) => `### ${k.category} – ${k.title}\n${k.content}`).join("\n\n");

  const tool = {
    type: "function",
    function: {
      name: "create_offer",
      description: "Strukturiertes DIN-Angebot mit Upselling",
      parameters: {
        type: "object",
        properties: {
          bezug: { type: "string", description: "Bezugszeile, z.B. 'Ihre Anfrage vom ... – Seminar am ...'" },
          anrede: { type: "string", description: "Persönliche Anrede in Sie-Form" },
          einleitung: { type: "string", description: "1-2 Sätze Dank + Bezug" },
          raum: { type: "string", description: "Empfohlener Raum + Begründung (Kapazität, Ausstattung) – aus Wissensbasis" },
          pauschale: { type: "string", description: "Pauschal-Empfehlung mit ca. Pro-Person-Preis × Personen = Gesamt (freibleibend)" },
          upselling: {
            type: "array", items: { type: "string" },
            description: "3-5 konkrete Zusatzangebote als Volltext-Sätze: SPA/Wellness nach dem Seminar, Abendessen im Restaurant, Aktivprogramm/Outdoor, Übernachtung im Hotel, Kaffeepausen-Upgrade. Nur was zur Wissensbasis passt, mit Pro-Pers-Preis falls bekannt.",
          },
          hinweis: { type: "string", description: "Hinweis dass Preise freibleibend, finale Bestätigung Bankett-Team" },
          schluss: { type: "string", description: "Schlussformel + Ansprechpartner" },
        },
        required: ["bezug", "anrede", "einleitung", "raum", "pauschale", "upselling", "hinweis", "schluss"],
        additionalProperties: false,
      },
    },
  };

  const userCtx = `ANFRAGE:\n${JSON.stringify(b, null, 2)}\n\nWISSENSBASIS:\n${kbText}`;
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Du bist Bankett-Verkaufsleitung im Hotel Der Heidehof. Erstelle ein DIN 5008 konformes Angebot in Sie-Form. Nutze AUSSCHLIESSLICH Räume, Pauschalen, Preise und Zusatzangebote (SPA/Wellness, Restaurant, Outdoor) aus der Wissensbasis. Sei aktiv im Upselling: schlage zu jedem Anlass passende Zusatzleistungen vor (Wellness nach dem Seminar, Abendessen, Aktivprogramm, Übernachtung). Erfinde keine Preise – wenn unbekannt, schreibe 'auf Anfrage'." },
        { role: "user", content: userCtx },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: "create_offer" } },
    }),
  });
  if (!r.ok) throw new Error(`AI ${r.status}`);
  const j = await r.json();
  const args = j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  return JSON.parse(args) as OfferDraft;
}

function buildDinPdfBase64(b: InquiryBody, draft: OfferDraft, logo: { data: string; format: "PNG" | "JPEG" } | null): string {
  // DIN 5008 Form B: Anschriftenfeld 45-95mm vom Blattrand oben, links 25mm
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, H = 297, L = 25, R = 20; // linker/rechter Rand DIN

  // Falzmarken (DIN 5008): 105mm und 210mm vom oberen Rand, 87mm Lochmarke
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.line(5, 105, 8, 105);
  doc.line(5, 210, 8, 210);
  doc.line(5, 148.5, 9, 148.5); // Lochmarke

  // Logo oben rechts
  if (logo) {
    try { doc.addImage(logo.data, logo.format, W - R - 38, 12, 38, 18, undefined, "FAST"); } catch { /* ignore */ }
  }

  // Absender-Kompaktzeile über Anschriftenfeld (klein, unterstrichen)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(90);
  doc.text(`${HOTEL.name} · ${HOTEL.street} · ${HOTEL.zip} ${HOTEL.city}`, L, 42);
  doc.setDrawColor(150);
  doc.line(L, 43, L + 90, 43);

  // Anschriftenfeld (Empfänger)
  doc.setTextColor(20);
  doc.setFontSize(11);
  let ay = 50;
  if (b.firma) { doc.text(b.firma, L, ay); ay += 5; }
  doc.text(b.name, L, ay); ay += 5;
  if (b.email) { doc.setFontSize(9); doc.setTextColor(100); doc.text(b.email, L, ay); ay += 4; }

  // Infoblock rechts (Datum, Ort, Ihre Zeichen)
  doc.setTextColor(20);
  doc.setFontSize(9);
  const ix = W - R - 55;
  doc.text("Ihr Zeichen:", ix, 50); doc.text("—", ix + 28, 50);
  doc.text("Unser Zeichen:", ix, 55); doc.text("Clara KI", ix + 28, 55);
  doc.text("Telefon:", ix, 60); doc.text(HOTEL.phone, ix + 28, 60);
  doc.text("E-Mail:", ix, 65); doc.text(HOTEL.email, ix + 28, 65);
  doc.text(`${HOTEL.city.split(" ")[0]}, ${new Date().toLocaleDateString("de-DE")}`, ix, 75);

  // Bezugszeile (Betreff) – fett
  let y = 98;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);
  const betreffLines = doc.splitTextToSize(draft.bezug || `Ihr Tagungsangebot – ${b.anlass}`, W - L - R);
  for (const line of betreffLines) { doc.text(line, L, y); y += 6; }
  y += 2;

  // Anrede
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(draft.anrede || `Sehr geehrte/r ${b.name},`, L, y);
  y += 8;

  const writeBlock = (title: string | null, text: string) => {
    if (title) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      if (y > H - 40) { doc.addPage(); y = 25; }
      doc.text(title, L, y); y += 5;
    }
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
    const lines = doc.splitTextToSize(text.replace(/[#*_`]/g, ""), W - L - R);
    for (const line of lines) {
      if (y > H - 35) { doc.addPage(); y = 25; }
      doc.text(line, L, y); y += 5;
    }
    y += 3;
  };

  writeBlock(null, draft.einleitung);
  writeBlock("Empfohlener Tagungsraum", draft.raum);

  // Eckdaten Tabelle
  doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  if (y > H - 60) { doc.addPage(); y = 25; }
  doc.text("Eckdaten Ihrer Veranstaltung", L, y); y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const rows: Array<[string, string | undefined]> = [
    ["Anlass", b.anlass], ["Datum", b.datum], ["Personen", b.personen],
    ["Übernachtung", b.uebernachtung], ["Verpflegung", b.verpflegung], ["Technik", b.technik],
  ];
  for (const [k, v] of rows) {
    if (!v) continue;
    if (y > H - 30) { doc.addPage(); y = 25; }
    doc.setTextColor(110); doc.text(`${k}:`, L, y);
    doc.setTextColor(20); doc.text(String(v).slice(0, 100), L + 38, y);
    y += 5;
  }
  y += 4;

  writeBlock("Pauschale & Investition", draft.pauschale);

  // Upselling-Block (Highlight)
  if (draft.upselling?.length) {
    if (y > H - 50) { doc.addPage(); y = 25; }
    doc.setFillColor(248, 245, 238);
    doc.setDrawColor(220, 215, 200);
    const boxStart = y - 4;
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(154, 123, 63);
    doc.text("Unsere Empfehlung – machen Sie mehr aus Ihrem Tag", L + 4, y + 2); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(40);
    for (const u of draft.upselling) {
      const lines = doc.splitTextToSize(`• ${u}`, W - L - R - 8);
      for (const line of lines) {
        if (y > H - 30) { doc.addPage(); y = 25; }
        doc.text(line, L + 4, y); y += 5;
      }
      y += 1;
    }
    doc.setDrawColor(220, 215, 200);
    doc.roundedRect(L, boxStart, W - L - R, y - boxStart + 2, 2, 2, "S");
    y += 6;
  }

  writeBlock(null, draft.hinweis);
  writeBlock(null, draft.schluss);
  y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text("Mit herzlichen Grüßen", L, y); y += 8;
  doc.setFont("helvetica", "bold"); doc.text("Ihr Bankett-Team", L, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(110);
  doc.text(HOTEL.name, L, y + 5);

  // Fußzeile (DIN 5008 unten)
  const fy = H - 18;
  doc.setDrawColor(220);
  doc.line(L, fy - 3, W - R, fy - 3);
  doc.setFontSize(7.5); doc.setTextColor(110);
  doc.text(`${HOTEL.name} · ${HOTEL.subtitle}`, L, fy);
  doc.text(`${HOTEL.street} · ${HOTEL.zip} ${HOTEL.city}`, L, fy + 3);
  doc.text(`Tel ${HOTEL.phone} · Fax ${HOTEL.fax}`, W / 2 - 20, fy);
  doc.text(`${HOTEL.email}`, W / 2 - 20, fy + 3);
  doc.text(`${HOTEL.web}`, W - R - 35, fy);
  doc.text(`Seite 1`, W - R - 15, fy + 3);

  return doc.output("datauristring").split(",")[1];
}

function buildBrandedHtml(opts: {
  title: string; intro: string; body: string; logoUrl: string | null;
}): string {
  const logo = opts.logoUrl
    ? `<img src="${opts.logoUrl}" alt="${HOTEL.name}" style="height:54px;display:block;margin:0 auto 18px"/>`
    : `<div style="font-family:Georgia,serif;color:#9a7b3f;font-size:22px;text-align:center;margin-bottom:18px">${HOTEL.name}</div>`;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#f6f5f1;padding:32px 12px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #ece8df;border-radius:6px;overflow:hidden">
        <div style="padding:32px 36px 8px;text-align:center;border-bottom:1px solid #f0ece2">
          ${logo}
          <div style="font-family:Georgia,serif;color:#9a7b3f;font-size:11px;letter-spacing:0.32em;text-transform:uppercase">Conference &amp; SPA Resort</div>
        </div>
        <div style="padding:28px 36px">
          <h1 style="font-family:Georgia,serif;color:#1a1a1a;font-size:22px;margin:0 0 12px">${escapeHtml(opts.title)}</h1>
          <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 18px">${opts.intro}</p>
          <div style="color:#333;font-size:14px;line-height:1.65">${opts.body}</div>
        </div>
        <div style="padding:18px 36px;background:#faf8f2;border-top:1px solid #f0ece2;color:#8a7d63;font-size:11.5px;line-height:1.6;text-align:center">
          <strong style="color:#9a7b3f">${HOTEL.name}</strong> · ${HOTEL.subtitle}<br/>
          ${HOTEL.street} · ${HOTEL.zip} ${HOTEL.city} · ${HOTEL.country}<br/>
          Tel ${HOTEL.phone} · Fax ${HOTEL.fax} · <a href="mailto:${HOTEL.email}" style="color:#9a7b3f;text-decoration:none">${HOTEL.email}</a> · <a href="https://${HOTEL.web}" style="color:#9a7b3f;text-decoration:none">${HOTEL.web}</a>
        </div>
      </div>
    </div>`;
}

async function sendMail(opts: { from: string; to: string; subject: string; html: string; attachments?: Array<{ filename: string; content: string }> }) {
  const r = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: opts.from, to: [opts.to], subject: opts.subject, html: opts.html, attachments: opts.attachments,
    }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Resend ${r.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as InquiryBody;
    if (!body.name || !body.email || !body.anlass) {
      return new Response(JSON.stringify({ ok: false, error: "name, email, anlass sind Pflicht" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await admin
      .from("app_settings").select("key,value")
      .in("key", ["inquiry_recipient_email", "inquiry_from_email"]);
    const map: Record<string, string> = {};
    (settings ?? []).forEach((r) => { if (typeof r.value === "string") map[r.key] = r.value; });
    const recipient = map.inquiry_recipient_email || DEFAULT_RECIPIENT;
    const from = map.inquiry_from_email || DEFAULT_FROM;

    // Logo laden (für PDF + HTML)
    const logo = await loadLogoBase64();
    const { data: logoRow } = await admin.from("site_images").select("url").eq("slug", "footer-logo").maybeSingle();
    const logoUrl = (logoRow as { url?: string } | null)?.url ?? null;

    // 1) Strukturierten Angebotsentwurf via AI mit Upselling
    let draft: OfferDraft;
    try { draft = await generateOfferDraft(body); }
    catch (e) {
      console.warn("offer draft failed:", e);
      draft = {
        bezug: `Ihre Tagungsanfrage – ${body.anlass}${body.datum ? ` am ${body.datum}` : ""}`,
        anrede: `Sehr geehrte/r ${body.name},`,
        einleitung: "vielen Dank für Ihre Anfrage und Ihr Interesse am Hotel Der Heidehof.",
        raum: "Unser Bankett-Team prüft die optimale Raumempfehlung und meldet sich kurzfristig persönlich.",
        pauschale: "Die passende Pauschale wird individuell für Sie kalkuliert.",
        upselling: [
          "Entspannen Sie nach dem Seminar in unserem Wellness- & SPA-Bereich.",
          "Lassen Sie den Tag bei einem Abendessen in unserem Restaurant ausklingen.",
          "Nutzen Sie unsere Tagungs-Übernachtungspakete für Ihre Gäste.",
        ],
        hinweis: "Alle Preise sind freibleibend. Die finale Bestätigung erfolgt durch unser Bankett-Team.",
        schluss: "Wir freuen uns darauf, Sie bei uns begrüßen zu dürfen.",
      };
    }

    // 2) DIN-PDF
    let pdfBase64 = "";
    try { pdfBase64 = buildDinPdfBase64(body, draft, logo); }
    catch (e) { console.warn("pdf build failed:", e); }

    const offerFilename = `Heidehof-Angebot-${(body.firma || body.name).replace(/[^a-z0-9äöüß]+/gi, "_").slice(0, 40)}.pdf`;
    const attachments = pdfBase64 ? [{ filename: offerFilename, content: pdfBase64 }] : undefined;

    // 3) E-Mails (Hotel + Gast) – beide branded mit Logo & Footer
    const subject = `Neue Tagungsanfrage – ${body.anlass}${body.personen ? ` (${body.personen} Pers.)` : ""}${body.firma ? ` · ${body.firma}` : ""}`;

    const eckdatenRows: Array<[string, string | undefined]> = [
      ["Anlass", body.anlass], ["Personen", body.personen], ["Datum", body.datum],
      ["Firma", body.firma], ["Name", body.name], ["E-Mail", body.email], ["Telefon", body.telefon],
      ["Übernachtung", body.uebernachtung], ["Verpflegung", body.verpflegung], ["Technik", body.technik],
    ];
    const hotelBody = `
      <table style="width:100%;border-collapse:collapse;margin:0 0 18px">
        ${eckdatenRows.filter(([, v]) => v).map(([k, v]) => `
          <tr>
            <td style="padding:6px 0;color:#888;width:130px;vertical-align:top;font-size:13px">${escapeHtml(k)}</td>
            <td style="padding:6px 0;color:#1a1a1a;font-weight:500;font-size:14px">${escapeHtml(String(v))}</td>
          </tr>`).join("")}
      </table>
      <h2 style="font-family:Georgia,serif;color:#9a7b3f;font-size:15px;margin:18px 0 6px">Empfohlener Raum</h2>
      <p style="margin:0 0 14px;color:#333">${escapeHtml(draft.raum)}</p>
      <h2 style="font-family:Georgia,serif;color:#9a7b3f;font-size:15px;margin:18px 0 6px">Pauschale</h2>
      <p style="margin:0 0 14px;color:#333">${escapeHtml(draft.pauschale)}</p>
      <h2 style="font-family:Georgia,serif;color:#9a7b3f;font-size:15px;margin:18px 0 6px">Upselling-Vorschläge (im Angebot enthalten)</h2>
      <ul style="margin:0 0 14px;padding-left:20px;color:#333">
        ${draft.upselling.map((u) => `<li style="margin:4px 0">${escapeHtml(u)}</li>`).join("")}
      </ul>
      <p style="margin-top:20px;color:#888;font-size:12px">Das vollständige DIN-Angebot ist als PDF angehängt.</p>`;

    const hotelHtml = buildBrandedHtml({
      title: "Neue Tagungsanfrage über Clara",
      intro: `Aufgenommen am ${new Date().toLocaleString("de-DE")} – Antwort direkt an <a href="mailto:${escapeHtml(body.email)}" style="color:#9a7b3f">${escapeHtml(body.email)}</a> möglich.`,
      body: hotelBody, logoUrl,
    });

    const guestBody = `
      <p style="margin:0 0 14px">vielen Dank für Ihre Anfrage zum Thema <strong>${escapeHtml(body.anlass)}</strong>${body.datum ? ` am <strong>${escapeHtml(body.datum)}</strong>` : ""}. Im Anhang finden Sie Ihr persönliches, unverbindliches Angebot als PDF (DIN 5008).</p>
      <h2 style="font-family:Georgia,serif;color:#9a7b3f;font-size:15px;margin:18px 0 6px">Unsere Empfehlung für Sie</h2>
      <p style="margin:0 0 12px">${escapeHtml(draft.raum)}</p>
      <h2 style="font-family:Georgia,serif;color:#9a7b3f;font-size:15px;margin:18px 0 6px">Machen Sie mehr aus Ihrem Tag</h2>
      <ul style="margin:0 0 14px;padding-left:20px">
        ${draft.upselling.map((u) => `<li style="margin:6px 0">${escapeHtml(u)}</li>`).join("")}
      </ul>
      <p style="margin:18px 0 0">Unser Bankett-Team meldet sich innerhalb eines Werktages persönlich, um Details und Verfügbarkeit final zu bestätigen.</p>`;

    const guestHtml = buildBrandedHtml({
      title: `Ihr persönliches Angebot, ${escapeHtml(body.name.split(" ").slice(-1)[0])}`,
      intro: body.firma ? `für ${escapeHtml(body.firma)}` : "vielen Dank für Ihr Vertrauen.",
      body: guestBody, logoUrl,
    });

    const errors: string[] = [];
    try { await sendMail({ from, to: recipient, subject, html: hotelHtml, attachments }); }
    catch (e) { errors.push(`Hotel: ${e instanceof Error ? e.message : "fail"}`); }
    try { await sendMail({ from, to: body.email, subject: `Ihr Angebot – ${HOTEL.name}`, html: guestHtml, attachments }); }
    catch (e) { errors.push(`Gast: ${e instanceof Error ? e.message : "fail"}`); }

    await admin.from("tagungs_inquiries").insert({
      anlass: body.anlass, personen: body.personen, datum: body.datum,
      name: body.name, firma: body.firma, email: body.email, telefon: body.telefon,
      besonderheiten: body.nachricht,
      uebernachtung: body.uebernachtung, verpflegung: body.verpflegung, technik: body.technik,
      zusammenfassung: `${draft.einleitung}\n\n${draft.raum}\n\n${draft.pauschale}\n\nUpselling:\n- ${draft.upselling.join("\n- ")}`,
      email_sent: errors.length === 0,
      email_error: errors.length ? errors.join(" | ") : null,
    });

    return new Response(JSON.stringify({ ok: errors.length === 0, errors, offer_generated: Boolean(pdfBase64) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clara-send-inquiry error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
