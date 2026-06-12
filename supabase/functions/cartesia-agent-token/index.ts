// cartesia-agent-token — Issues short-lived access tokens for browser-side
// Cartesia Agent WebSocket connections.
//
// POST /functions/v1/cartesia-agent-token
// Body: { agent_id?: string, expires_in?: number }
// Returns: { token: string, expires_in: number, agent_id: string }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CARTESIA_API_KEY =
  Deno.env.get("CARTESIA_ADMIN_API_KEY")?.trim() ||
  Deno.env.get("CARTESIA_API_KEY")?.trim() ||
  "";

const CARTESIA_BASE = "https://api.cartesia.ai";
const CARTESIA_VERSION = "2026-03-01";
const DEFAULT_AGENT_ID = "agent_gjYusgM21heczyikufbJ4P";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!CARTESIA_API_KEY) throw new Error("CARTESIA_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const agentId = String(body.agent_id ?? DEFAULT_AGENT_ID);
    const expiresIn = Math.min(Math.max(Number(body.expires_in ?? 120), 30), 600);

    const res = await fetch(`${CARTESIA_BASE}/access-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cartesia-Version": CARTESIA_VERSION,
        "X-API-Key": CARTESIA_API_KEY,
        Authorization: `Bearer ${CARTESIA_API_KEY}`,
      },
      body: JSON.stringify({
        grants: { agent: true },
        expires_in: expiresIn,
      }),
    });

    const text = await res.text();
    let payload: any = {};
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    if (!res.ok) {
      throw new Error(`Cartesia token request failed (${res.status}): ${payload?.error ?? payload?.message ?? text}`);
    }

    const token = payload?.token ?? payload?.access_token;
    if (!token) throw new Error("Cartesia did not return an access token");

    return new Response(
      JSON.stringify({ success: true, token, expires_in: expiresIn, agent_id: agentId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[cartesia-agent-token]", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
