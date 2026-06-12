// Tracking-Pixel + Click-Redirect für Lead-Mails.
// GET /email-track/open?t=<token>           -> 1x1 PNG, logt 'opened'
// GET /email-track/click?t=<token>&u=<url>  -> 302 Redirect, logt 'clicked'
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const PIXEL = Uint8Array.from(atob(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
), c => c.charCodeAt(0));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

async function logEvent(token: string, type: "opened" | "clicked", meta: Record<string, unknown>) {
  const { data: draft } = await admin
    .from("lead_email_drafts")
    .select("id, lead_id, campaign_id")
    .eq("tracking_token", token)
    .maybeSingle();
  if (!draft) return;

  await admin.from("email_events").insert({
    draft_id: draft.id,
    lead_id: draft.lead_id,
    campaign_id: draft.campaign_id,
    type,
    metadata: meta,
  });
  await admin.from("lead_events").insert({
    lead_id: draft.lead_id,
    campaign_id: draft.campaign_id,
    type: `email_${type}`,
    payload: { draft_id: draft.id, ...meta },
  });
  const patch: Record<string, unknown> = { last_activity_at: new Date().toISOString() };
  if (type === "opened") patch.status = "opened";
  if (type === "clicked") patch.status = "clicked";
  await admin.from("leads").update(patch).eq("id", draft.lead_id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() || "";
    const token = url.searchParams.get("t") || "";
    const ua = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for") || "";

    if (path === "open") {
      if (token) { try { await logEvent(token, "opened", { ua, ip }); } catch (e) { console.error(e); } }
      return new Response(PIXEL, { headers: { "Content-Type": "image/png", "Cache-Control": "no-store, no-cache" } });
    }
    if (path === "click") {
      const target = url.searchParams.get("u") || "https://hotel-dream-guide.lovable.app/";
      if (token) { try { await logEvent(token, "clicked", { ua, ip, url: target }); } catch (e) { console.error(e); } }
      return new Response(null, { status: 302, headers: { Location: target } });
    }
    return new Response("not found", { status: 404 });
  } catch (e) {
    console.error("email-track error", e);
    return new Response("ok"); // niemals scheitern – Pixel muss immer 200 sein
  }
});
