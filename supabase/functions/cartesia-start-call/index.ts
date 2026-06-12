// cartesia-start-call – Startet einen Cartesia Outbound-Call (Rückruf) und
// hängt den ClaraInquiryContext als metadata.clara_context an, damit der
// Telefonagent sofort kontextbezogen einsteigen kann.
// URL: POST /functions/v1/cartesia-start-call

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CARTESIA_AGENT_API_KEY =
  Deno.env.get("CARTESIA_ADMIN_API_KEY")?.trim() ||
  Deno.env.get("CARTESIA_API_KEY")?.trim() ||
  "";
const CARTESIA_AGENT_ID = Deno.env.get("CARTESIA_AGENT_ID") ?? "agent_gjYusgM21heczyikufbJ4P";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const phone = String(body?.phone ?? "").trim();
    const claraContext = body?.clara_context ?? {};
    if (!phone || phone.length < 5) {
      return new Response(JSON.stringify({ success: false, error: "Telefonnummer fehlt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Token zusätzlich speichern (Fallback, falls metadata nicht ankommt)
    const tokenBytes = new Uint8Array(6);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 8);

    await admin.from("phone_call_contexts").insert({
      token,
      clara_context: claraContext,
      phone_hint: phone,
    });

    const fromNumberId =
      Deno.env.get("CARTESIA_FROM_NUMBER_ID")?.trim() ||
      Deno.env.get("CARTESIA_PHONE_NUMBER_ID")?.trim() ||
      "";

    if (!fromNumberId) {
      return new Response(JSON.stringify({
        success: false,
        error: "CARTESIA_FROM_NUMBER_ID ist nicht konfiguriert. Bitte in den Cloud-Secrets hinterlegen (Nummer-ID aus dem Cartesia-Dashboard, Format ap_…).",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const keyMeta = {
      present: !!CARTESIA_AGENT_API_KEY,
      length: CARTESIA_AGENT_API_KEY.length,
      prefix: CARTESIA_AGENT_API_KEY.slice(0, 7),
      suffix: CARTESIA_AGENT_API_KEY.slice(-4),
      from_number_id_present: !!fromNumberId,
      agent_id: CARTESIA_AGENT_ID,
    };
    console.log("[cartesia-start-call] key meta:", JSON.stringify(keyMeta));

    const cartesiaRes = await fetch("https://api.cartesia.ai/agents/calls", {
      method: "POST",
      headers: {
        "Cartesia-Version": "2026-03-01",
        "Authorization": `Bearer ${CARTESIA_AGENT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_number_id: fromNumberId,
        agent_id: CARTESIA_AGENT_ID,
        ringing_timeout_seconds: 30,
        outbound_calls: [
          {
            to_number: phone,
            metadata: {
              clara_context: claraContext,
              context_token: token,
            },
          },
        ],
      }),
    });

    const rawText = await cartesiaRes.text();
    let cartesiaBody: any = {};
    try { cartesiaBody = rawText ? JSON.parse(rawText) : {}; } catch { cartesiaBody = { raw: rawText }; }
    if (!cartesiaRes.ok) {
      console.error("Cartesia API error:", cartesiaRes.status, rawText);
      return new Response(JSON.stringify({
        success: false,
        error: `Cartesia ${cartesiaRes.status}`,
        details: cartesiaBody,
        raw: rawText,
        key_meta: keyMeta,
        request: { from_number_id: fromNumberId, agent_id: CARTESIA_AGENT_ID, to_number: phone },
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callId =
      cartesiaBody?.calls?.[0]?.agent_call_id ??
      cartesiaBody?.id ??
      cartesiaBody?.call_id ??
      null;

    if (callId) {
      await admin.from("phone_call_contexts").update({ call_id: callId }).eq("token", token);
    }

    return new Response(JSON.stringify({
      success: true,
      call_id: callId,
      token,
      message: "Anruf wird gestartet – Sie werden gleich vom Hotel angerufen.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("cartesia-start-call error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
