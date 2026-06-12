// Lead-Draft Verwaltung: KI-Regenerierung, Freigeben, Verwerfen, sofort senden.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const PUBLIC_SITE_URL = "https://hotel-dream-guide.lovable.app";
const FROM_EMAIL = "Heidehof Lead-Agent <noreply@notify.ichloescheselbst.de>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function requireAdmin(req: Request): Promise<string | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ ok: false, error: "Nicht angemeldet." }, 401);
  const token = authHeader.replace("Bearer ", "").trim();
  const authClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await authClient.auth.getClaims(token);
  const uid = data?.claims?.sub;
  if (error || typeof uid !== "string") return json({ ok: false, error: "Sitzung ungültig." }, 401);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uid, _role: "admin" });
  if (isAdmin !== true) return json({ ok: false, error: "Keine Admin-Berechtigung." }, 403);
  return uid;
}

interface DraftRow {
  id: string;
  lead_id: string;
  campaign_id: string | null;
  subject: string;
  body_html: string;
  body_text: string;
  status: string;
  images: any[];
  attachments: any[];
}

async function loadDraft(draftId: string): Promise<DraftRow & { lead: any }> {
  const { data, error } = await admin
    .from("lead_email_drafts")
    .select("*, lead:leads(*)")
    .eq("id", draftId)
    .single();
  if (error || !data) throw new Error("Entwurf nicht gefunden.");
  return data as any;
}

async function generateDraftContent(lead: any): Promise<{ subject: string; body_html: string; body_text: string }> {
  const prompt = `Du bist Marketing-Texter*in für Hotel Der Heidehof in Bayern (Tagungen, Seminare, Firmenevents). Schreibe eine kurze, persönliche, professionelle B2B-Akquise-E-Mail an folgenden Lead. Antworte ausschließlich als JSON: {"subject":"…","body_html":"…","body_text":"…"}.

Lead:
- Firma: ${lead.company || ""}
- Ansprechperson: ${lead.contact_name || ""}
- Branche: ${lead.industry || ""}
- Stadt: ${lead.city || ""}
- Persönlicher Aufhänger: ${lead.enrichment?.personalized_intro || ""}

Anforderungen:
- Anrede mit Namen wenn vorhanden, sonst "Guten Tag"
- 2 kurze Absätze, max. 120 Wörter
- Klares Angebot: Tagungspauschalen / Seminarräume / Firmenevents im Heidehof
- Call-to-Action: Termin / Angebot anfragen
- Sprache: höfliches Deutsch, kein Marketing-Geschwurbel
- HTML als sauberes <p>…</p>, kein <html>/<body>-Wrapper, keine Inline-Bilder
- Plaintext ohne HTML`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    }),
  });
  if (!res.ok) throw new Error(`KI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const payload = await res.json() as any;
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return {
    subject: String(parsed.subject || "Tagungsmöglichkeiten im Heidehof"),
    body_html: String(parsed.body_html || ""),
    body_text: String(parsed.body_text || ""),
  };
}

function renderEmailHtml(draft: DraftRow, lead: any, unsubscribeUrl: string): string {
  const images = Array.isArray(draft.images) ? draft.images : [];
  const imageBlock = images
    .map((img: any) => img?.url ? `<img src="${img.url}" alt="${img.alt || ""}" style="max-width:100%;border-radius:8px;margin:12px 0" />` : "")
    .join("");
  const attachments = Array.isArray(draft.attachments) ? draft.attachments : [];
  const attachmentBlock = attachments.length
    ? `<p style="margin:18px 0 0;font-size:13px"><strong>Anhang:</strong> ${attachments.map((a: any) => `<a href="${a.url}">${a.name || "Datei"}</a>`).join(", ")}</p>`
    : "";
  return `
  <div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;color:#1A1A1A;line-height:1.6;background:#fff">
    <div style="background:#1A1A1A;color:#F5EFE3;padding:22px;text-align:center;letter-spacing:.18em">HEIDEHOF</div>
    <div style="border:1px solid #E5DCC7;border-top:0;padding:28px">
      ${draft.body_html}
      ${imageBlock}
      ${attachmentBlock}
      <hr style="border:0;border-top:1px solid #E5DCC7;margin:22px 0" />
      <p style="font-size:11px;color:#777">Hotel Der Heidehof · ${lead.city || ""} · <a href="${unsubscribeUrl}">abmelden</a></p>
    </div>
  </div>`;
}

async function sendDraftNow(draft: DraftRow & { lead: any }) {
  if (!draft.lead?.email) throw new Error("Lead hat keine E-Mail-Adresse.");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) throw new Error("E-Mail-Anbindung ist nicht verbunden.");
  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  await admin.from("email_unsubscribe_tokens").insert({ email: draft.lead.email, token });
  const unsubscribeUrl = `${PUBLIC_SITE_URL}/unsubscribe?token=${encodeURIComponent(token)}`;
  const html = renderEmailHtml(draft, draft.lead, unsubscribeUrl);
  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [draft.lead.email],
      subject: draft.subject || "Tagungsmöglichkeiten im Heidehof",
      html,
      text: draft.body_text || draft.subject,
    }),
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`E-Mail ${res.status}: ${txt.slice(0, 200)}`);
  await admin.from("lead_email_drafts").update({ status: "sent", sent_at: new Date().toISOString(), error_message: null }).eq("id", draft.id);
  await admin.from("leads").update({ status: "contacted", last_sent_at: new Date().toISOString() }).eq("id", draft.lead_id);
  await admin.from("lead_events").insert({ lead_id: draft.lead_id, campaign_id: draft.campaign_id, type: "email_sent", payload: { draft_id: draft.id, mode: "manual" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (auth instanceof Response) return auth;

    const body = await req.json() as { action: string; draftId?: string; draftIds?: string[]; subject?: string; body_html?: string; body_text?: string; images?: any[]; attachments?: any[] };
    const action = body.action;
    if (!action) return json({ ok: false, error: "Aktion fehlt." }, 400);

    if (action === "regenerate") {
      if (!body.draftId) return json({ ok: false, error: "draftId fehlt." }, 400);
      if (!LOVABLE_API_KEY) return json({ ok: false, error: "KI nicht verbunden." }, 500);
      const draft = await loadDraft(body.draftId);
      const gen = await generateDraftContent(draft.lead);
      const { data, error } = await admin
        .from("lead_email_drafts")
        .update({ ...gen, status: "draft", ai_generated_at: new Date().toISOString(), error_message: null })
        .eq("id", body.draftId)
        .select("*")
        .single();
      if (error) throw error;
      return json({ ok: true, draft: data });
    }

    if (action === "update") {
      if (!body.draftId) return json({ ok: false, error: "draftId fehlt." }, 400);
      const patch: Record<string, unknown> = {};
      if (typeof body.subject === "string") patch.subject = body.subject;
      if (typeof body.body_html === "string") patch.body_html = body.body_html;
      if (typeof body.body_text === "string") patch.body_text = body.body_text;
      if (Array.isArray(body.images)) patch.images = body.images;
      if (Array.isArray(body.attachments)) patch.attachments = body.attachments;
      const { data, error } = await admin.from("lead_email_drafts").update(patch).eq("id", body.draftId).select("*").single();
      if (error) throw error;
      return json({ ok: true, draft: data });
    }

    if (action === "approve") {
      const { error } = await admin.from("lead_email_drafts").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", body.draftId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "discard") {
      const { error } = await admin.from("lead_email_drafts").update({ status: "discarded" }).eq("id", body.draftId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete") {
      const ids = body.draftIds?.length ? body.draftIds : (body.draftId ? [body.draftId] : []);
      if (!ids.length) return json({ ok: false, error: "Keine IDs." }, 400);
      const { error } = await admin.from("lead_email_drafts").delete().in("id", ids);
      if (error) throw error;
      return json({ ok: true, deleted: ids.length });
    }

    if (action === "send_now") {
      const draft = await loadDraft(body.draftId!);
      try {
        await sendDraftNow(draft);
        return json({ ok: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Versand fehlgeschlagen";
        await admin.from("lead_email_drafts").update({ status: "error", error_message: msg }).eq("id", draft.id);
        return json({ ok: false, error: msg }, 500);
      }
    }

    if (action === "send_bulk") {
      const ids = body.draftIds ?? [];
      if (!ids.length) return json({ ok: false, error: "Keine IDs." }, 400);
      let sent = 0; const errors: string[] = [];
      for (const id of ids) {
        try {
          const draft = await loadDraft(id);
          if (draft.status === "sent") continue;
          await sendDraftNow(draft);
          sent++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Fehler";
          errors.push(`${id}: ${msg}`);
          await admin.from("lead_email_drafts").update({ status: "error", error_message: msg }).eq("id", id);
        }
      }
      return json({ ok: true, sent, attempted: ids.length, errors });
    }

    if (action === "approve_bulk" || action === "discard_bulk") {
      const ids = body.draftIds ?? [];
      if (!ids.length) return json({ ok: false, error: "Keine IDs." }, 400);
      const patch = action === "approve_bulk"
        ? { status: "approved", approved_at: new Date().toISOString() }
        : { status: "discarded" };
      const { error } = await admin.from("lead_email_drafts").update(patch).in("id", ids);
      if (error) throw error;
      return json({ ok: true, updated: ids.length });
    }

    return json({ ok: false, error: "Unbekannte Aktion." }, 400);
  } catch (e) {
    console.error("lead-draft failed", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "Fehler" }, 500);
  }
});
