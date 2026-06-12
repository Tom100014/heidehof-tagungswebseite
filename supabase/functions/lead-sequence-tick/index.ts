// Multi-Step-Sequenz-Engine. Erzeugt für eingeschriebene Leads den nächsten Draft mit Tracking-Token.
// Die Drafts werden auf 'approved' gesetzt und vom bestehenden lead-automation-tick versendet.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATES: Record<string, { subject: string; body: string }> = {
  follow_up_1: {
    subject: "Kurz nachgehakt – Tagungsräume im Heidehof",
    body: `<p>Guten Tag {{name}},</p><p>ich wollte kurz nachfragen, ob meine letzte E-Mail bei Ihnen angekommen ist. Falls Sie aktuell Räume für Tagungen, Seminare oder Firmenevents in der Region Ingolstadt prüfen, sende ich Ihnen gerne ein passendes Angebot zu.</p><p>Beste Grüße<br/>Hotel Der Heidehof</p>`,
  },
  follow_up_2: {
    subject: "Letzter Impuls – Tagen mit Wohlfühl-Faktor",
    body: `<p>Guten Tag {{name}},</p><p>nur kurz: Unsere Tagungspauschalen ab 49 € p.P. inkl. Technik, Verpflegung und Pausen-Konzept sind aktuell sehr nachgefragt. Wenn Sie 2026 ein Format planen, melden Sie sich gerne – wir blocken Termine sehr flexibel.</p><p>Beste Grüße<br/>Hotel Der Heidehof</p>`,
  },
  follow_up_3: {
    subject: "Zum Abschluss: bleibt der Heidehof spannend für Sie?",
    body: `<p>Guten Tag {{name}},</p><p>damit ich Sie nicht weiter unnötig anschreibe: passt der Heidehof grundsätzlich zu Ihrem Bedarf? Eine kurze Rückmeldung – auch ein "aktuell nicht" – hilft mir sehr.</p><p>Beste Grüße<br/>Hotel Der Heidehof</p>`,
  },
};

async function aiGenerate(lead: any, templateKey: string): Promise<{ subject: string; body_html: string; body_text: string } | null> {
  if (!LOVABLE_API_KEY) return null;
  try {
    const prompt = `Schreibe eine kurze, höfliche deutsche Follow-up-E-Mail (max 100 Wörter) für ein Tagungshotel (Hotel Der Heidehof, Bayern). Template-Kontext: ${templateKey}. Lead: Firma=${lead.company||""}, Ansprechperson=${lead.contact_name||""}, Branche=${lead.industry||""}. JSON: {"subject":"…","body_html":"<p>…</p>","body_text":"…"}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "user", content: prompt }], response_format: { type: "json_object" }, temperature: 0.5 }),
    });
    if (!res.ok) return null;
    const j = await res.json() as any;
    const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? "{}");
    if (!parsed.subject || !parsed.body_html) return null;
    return parsed;
  } catch { return null; }
}

function fallback(lead: any, templateKey: string) {
  const t = TEMPLATES[templateKey] || TEMPLATES.follow_up_1;
  const name = lead.contact_name || "zusammen";
  const body_html = t.body.replaceAll("{{name}}", name);
  return { subject: t.subject, body_html, body_text: body_html.replace(/<[^>]+>/g, " ") };
}

function trackingToken() {
  return crypto.randomUUID().replaceAll("-", "") + Date.now().toString(36);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { data: seqs } = await admin.from("lead_sequences").select("*, steps:sequence_steps(*)").eq("is_active", true);
    const now = new Date();
    let enqueued = 0; let stopped = 0;

    for (const seq of seqs || []) {
      const steps = ((seq as any).steps || []).sort((a: any, b: any) => a.step_order - b.step_order);
      if (steps.length === 0) continue;

      const { data: leads } = await admin.from("leads")
        .select("*").eq("enrolled_sequence_id", seq.id).eq("unsubscribed", false).is("replied_at", null).eq("do_not_contact", false);

      for (const lead of leads || []) {
        const idx = lead.enrolled_step ?? 0;
        if (idx >= steps.length) {
          await admin.from("leads").update({ enrolled_sequence_id: null, status: "nurturing" }).eq("id", lead.id);
          stopped++; continue;
        }
        const step = steps[idx];
        const baseAt = lead.last_sent_at ? new Date(lead.last_sent_at) : (lead.enrolled_at ? new Date(lead.enrolled_at) : now);
        const dueAt = new Date(baseAt.getTime() + (step.wait_days ?? 0) * 86400000);
        if (dueAt > now) continue;

        const { count } = await admin.from("lead_email_drafts").select("id", { head: true, count: "exact" })
          .eq("lead_id", lead.id).eq("campaign_id", seq.campaign_id).in("status", ["draft","approved","scheduled","sent"]).gte("created_at", baseAt.toISOString());
        if ((count ?? 0) > 0) {
          await admin.from("leads").update({ enrolled_step: idx + 1 }).eq("id", lead.id);
          continue;
        }

        const content = (await aiGenerate(lead, step.template_key)) || fallback(lead, step.template_key);
        const { error } = await admin.from("lead_email_drafts").insert({
          lead_id: lead.id,
          campaign_id: seq.campaign_id,
          subject: content.subject,
          body_html: content.body_html,
          body_text: content.body_text,
          status: "approved",
          approved_at: now.toISOString(),
          ai_generated_at: now.toISOString(),
          tracking_token: trackingToken(),
        });
        if (error) { console.error("draft insert", error); continue; }

        enqueued++;
        await admin.from("leads").update({ enrolled_step: idx + 1, last_activity_at: now.toISOString() }).eq("id", lead.id);
        await admin.from("lead_activities").insert({ lead_id: lead.id, type: "sequence_step_queued", payload: { sequence_id: seq.id, step_order: step.step_order, template_key: step.template_key } });
      }
    }
    return new Response(JSON.stringify({ ok: true, enqueued, stopped }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("lead-sequence-tick error", e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Fehler" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
