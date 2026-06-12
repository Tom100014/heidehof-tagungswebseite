import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CARTESIA_VERSION = "2026-03-01";
const CARTESIA_BASE = "https://api.cartesia.ai";
const DEFAULT_AGENT_ID = "agent_gjYusgM21heczyikufbJ4P";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

type Action = "status" | "sync_calls";

interface CartesiaCall {
  id: string;
  agent_id: string;
  agent_name?: string | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  transcript?: Array<{ role?: string; text?: string }> | null;
  telephony_params?: {
    to?: string | null;
    from?: string | null;
    direction?: string | null;
    call_sid?: string | null;
    parameters?: Record<string, unknown>;
    headers?: Record<string, unknown>;
  } | null;
  summary?: string | null;
  error_message?: string | null;
  metadata?: Record<string, unknown> | null;
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const readString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "id" in value && typeof (value as { id: unknown }).id === "string") {
    return (value as { id: string }).id.trim();
  }
  return fallback;
};

async function getSetting(key: string): Promise<unknown> {
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

async function getAgentId(input?: unknown): Promise<string> {
  const fromBody = readString(input);
  if (fromBody) return fromBody;
  return readString(await getSetting("clara_cartesia_agent_id"), DEFAULT_AGENT_ID);
}

async function cartesiaGet(path: string, search?: Record<string, string | number | undefined>) {
  const apiKey =
    Deno.env.get("CARTESIA_ADMIN_API_KEY")?.trim() ||
    Deno.env.get("CARTESIA_API_KEY")?.trim();
  if (!apiKey) throw new Error("CARTESIA_ADMIN_API_KEY oder CARTESIA_API_KEY fehlt.");

  const url = new URL(`${CARTESIA_BASE}${path}`);
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (value != null && String(value).trim()) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Cartesia-Version": CARTESIA_VERSION,
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Cartesia ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

function transcriptText(call: CartesiaCall): string {
  if (!Array.isArray(call.transcript)) return "";
  return call.transcript
    .map((turn) => `${turn.role ?? "unknown"}: ${turn.text ?? ""}`.trim())
    .filter((line) => line.length > 10)
    .join("\n")
    .slice(0, 6000);
}

function classifyCall(call: CartesiaCall): { category: string; priority: string } {
  const text = `${call.summary ?? ""}\n${transcriptText(call)}`.toLowerCase();
  const urgent = /(beschwerde|problem|kaputt|defekt|heizung|kalt|notfall|dringend|unzufrieden|fehl)/.test(text);
  if (/(tagung|seminar|meeting|konferenz|raum|angebot|firma|personen)/.test(text)) {
    return { category: "conference_lead", priority: urgent ? "urgent" : "normal" };
  }
  if (/(tisch|restaurant|bar|cola|wasser|bier|wein|essen|speise|getränk|bestell)/.test(text)) {
    return { category: "restaurant_order", priority: urgent ? "urgent" : "normal" };
  }
  if (/(wellness|spa|massage|beauty|kosmetik|termin|behandlung)/.test(text)) {
    return { category: "wellness", priority: "normal" };
  }
  if (urgent) return { category: "complaint", priority: "urgent" };
  if (/(zimmer|handtuch|zahnpasta|kissen|decke|room service|roomservice)/.test(text)) {
    return { category: "room_service", priority: "normal" };
  }
  return { category: "general", priority: "normal" };
}

async function loadStatus(agentId: string) {
  const [agent, phoneNumbersResponse, calls] = await Promise.all([
    cartesiaGet(`/agents/${encodeURIComponent(agentId)}`),
    cartesiaGet("/agents/phone-numbers", { agent_id: agentId }).catch(() => []),
    cartesiaGet("/agents/calls", { agent_id: agentId, expand: "transcript", limit: 5 }).catch(() => ({ data: [] })),
  ]);
  const phoneNumbers = Array.isArray(phoneNumbersResponse?.data)
    ? phoneNumbersResponse.data
    : Array.isArray(phoneNumbersResponse)
      ? phoneNumbersResponse
      : [];
  return { agent, phoneNumbers, calls: Array.isArray(calls?.data) ? calls.data : [] };
}

async function syncCalls(agentId: string, limit: number) {
  const callsResponse = await cartesiaGet("/agents/calls", {
    agent_id: agentId,
    expand: "transcript",
    limit: Math.min(Math.max(limit || 25, 1), 100),
  });
  const calls = (Array.isArray(callsResponse?.data) ? callsResponse.data : []) as CartesiaCall[];
  const rows = calls.map((call) => {
    const classification = classifyCall(call);
    return {
      cartesia_call_id: call.id,
      agent_id: call.agent_id,
      agent_name: call.agent_name ?? null,
      status: call.status ?? (call.error_message ? "failed" : call.end_time ? "completed" : "started"),
      direction: call.telephony_params?.direction ?? null,
      from_number: call.telephony_params?.from ?? null,
      to_number: call.telephony_params?.to ?? null,
      started_at: call.start_time ?? null,
      ended_at: call.end_time ?? null,
      summary: call.summary ?? call.error_message ?? null,
      transcript: call.transcript ?? [],
      category: classification.category,
      priority: classification.priority,
      raw_payload: call as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    };
  });

  if (rows.length) {
    const { error } = await admin
      .from("phone_agent_calls")
      .upsert(rows, { onConflict: "cartesia_call_id" });
    if (error) throw new Error(error.message);
  }

  return { synced: rows.length, calls: rows.slice(0, 10) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);

  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = (await req.json().catch(() => ({}))) as { action?: Action; agentId?: string; limit?: number };
    const action: Action = body.action === "sync_calls" ? "sync_calls" : "status";
    const agentId = await getAgentId(body.agentId);
    if (!agentId) return json({ ok: false, error: "Cartesia Agent-ID fehlt." }, 400);

    if (action === "sync_calls") {
      const result = await syncCalls(agentId, body.limit ?? 25);
      return json({ ok: true, agentId, ...result });
    }

    const status = await loadStatus(agentId);
    return json({ ok: true, agentId, ...status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telefonagent konnte nicht geladen werden.";
    console.error("cartesia-phone-agent error:", message);
    return json({ ok: false, error: message }, 500);
  }
});
