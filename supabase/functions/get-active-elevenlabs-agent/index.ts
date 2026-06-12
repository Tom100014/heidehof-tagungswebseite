// Public endpoint: returns the active ElevenLabs agent_id for a given page context.
// Replaces direct client SELECT on elevenlabs_agents (which is admin-only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_CONTEXTS = new Set(["homepage", "tagung", "wellness", "zimmer", "restaurant"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const rawCtx = (url.searchParams.get("context") ?? "homepage").toLowerCase();
    const context = ALLOWED_CONTEXTS.has(rawCtx) ? rawCtx : "homepage";

    const supaUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });

    const { data: setting } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "elevenlabs_enabled")
      .maybeSingle();
    const enabled = setting?.value === true;

    if (!enabled) {
      return new Response(JSON.stringify({ enabled: false, agentId: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rows } = await admin
      .from("elevenlabs_agents")
      .select("context,agent_id,is_active")
      .in("context", [context, "homepage"]);

    const byCtx = new Map<string, { agent_id: string; is_active: boolean }>();
    for (const r of rows ?? []) byCtx.set(r.context, { agent_id: r.agent_id, is_active: r.is_active });

    const pick = byCtx.get(context);
    const fallback = byCtx.get("homepage");
    const chosen = pick?.is_active ? pick : fallback?.is_active ? fallback : null;

    return new Response(
      JSON.stringify({ enabled: true, agentId: chosen?.agent_id ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ enabled: false, agentId: null, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
