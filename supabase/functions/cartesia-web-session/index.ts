// cartesia-web-session – Click-to-Call Proxy für den Cartesia Voice Agent
//
// Cartesia bietet keinen Browser-WebRTC-Endpoint, der Agent läuft ausschließlich
// über Telefonie. Wir implementieren daher "Click-to-Call":
// Der Gast gibt seine Telefonnummer ein, wir lösen via Cartesia API einen
// Outbound-Call aus und der Agent ruft den Gast in Sekunden zurück.
//
// Endpoint: POST /functions/v1/cartesia-web-session
// Body: { to_number: "+49...", agent_id?: string, metadata?: object }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CARTESIA_AGENT_API_KEY =
  Deno.env.get("CARTESIA_ADMIN_API_KEY")?.trim() ||
  Deno.env.get("CARTESIA_API_KEY")?.trim() ||
  "";
const CARTESIA_BASE = "https://api.cartesia.ai";
const CARTESIA_VERSION = "2026-03-01";
const DEFAULT_AGENT_ID = "agent_gjYusgM21heczyikufbJ4P";
// Optional: feste From-Number setzen, sonst wird die erste am Agenten hängende verwendet.
const FROM_NUMBER_ID = Deno.env.get("CARTESIA_FROM_NUMBER_ID") ?? "";

function cartesiaHeaders() {
  return {
    "Cartesia-Version": CARTESIA_VERSION,
    "Authorization": `Bearer ${CARTESIA_AGENT_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function isE164(n: string) {
  return /^\+[1-9]\d{6,14}$/.test(n);
}

async function resolvePhoneAndAgent(
  preferredAgentId: string,
): Promise<{ fromNumberId: string; agentId: string }> {
  const res = await fetch(`${CARTESIA_BASE}/agents/phone-numbers`, {
    headers: cartesiaHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Konnte Telefonnummern nicht laden (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  const list: any[] = data?.data ?? data?.phone_numbers ?? data?.items ?? [];
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(
      "Keine Telefonnummer im Cartesia-Workspace gefunden. Bitte im Cartesia-Dashboard eine Nummer einem Agenten zuweisen.",
    );
  }
  // 1) explizite From-Number bevorzugen
  if (FROM_NUMBER_ID) {
    const match = list.find((p) => p.id === FROM_NUMBER_ID);
    return {
      fromNumberId: FROM_NUMBER_ID,
      agentId: match?.agent?.id ?? preferredAgentId,
    };
  }
  // 2) Nummer am gewünschten Agenten
  const forAgent = list.find((p) => p?.agent?.id === preferredAgentId);
  if (forAgent?.id) return { fromNumberId: forAgent.id, agentId: preferredAgentId };
  // 3) Fallback: erste Nummer + der zugehörige Agent
  const first = list[0];
  if (!first?.id) {
    throw new Error("Keine gültige Telefonnummer in der Cartesia-Antwort gefunden.");
  }
  return { fromNumberId: first.id, agentId: first?.agent?.id ?? preferredAgentId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!CARTESIA_AGENT_API_KEY) throw new Error("CARTESIA_ADMIN_API_KEY oder CARTESIA_API_KEY ist nicht gesetzt.");

    const body = await req.json().catch(() => ({}));
    const toNumber = String(body.to_number ?? "").replace(/\s+/g, "");
    const agentId = String(body.agent_id ?? DEFAULT_AGENT_ID);

    if (!isE164(toNumber)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Bitte gültige Telefonnummer im Format +49... angeben.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { fromNumberId, agentId: resolvedAgentId } = await resolvePhoneAndAgent(agentId);

    const res = await fetch(`${CARTESIA_BASE}/agents/calls`, {
      method: "POST",
      headers: cartesiaHeaders(),
      body: JSON.stringify({
        from_number_id: fromNumberId,
        agent_id: resolvedAgentId,
        outbound_calls: [
          {
            to_number: toNumber,
            metadata: {
              source: "website_click_to_call",
              timestamp: new Date().toISOString(),
              ...(body.metadata ?? {}),
            },
          },
        ],
        ringing_timeout_seconds: 45,
      }),
    });

    const rawText = await res.text();
    let payload: any = {};
    try { payload = JSON.parse(rawText); } catch { payload = { raw: rawText }; }
    if (!res.ok) {
      const detail = typeof payload === "string" ? payload : (payload?.error ?? payload?.message ?? payload?.raw ?? JSON.stringify(payload));
      throw new Error(`Cartesia Outbound-Call fehlgeschlagen (${res.status}): ${detail}`);
    }

    const call = payload?.calls?.[0];
    if (call?.error) throw new Error(`Provider-Fehler: ${JSON.stringify(call.error)}`);

    return new Response(
      JSON.stringify({
        success: true,
        agent_call_id: call?.agent_call_id,
        to_number: call?.number ?? toNumber,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[cartesia-web-session]", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
