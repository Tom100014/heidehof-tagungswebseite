// cartesia-register-context – Registriert den aktuellen Seitenkontext (ClaraInquiryContext)
// vor einem tel:-Dial, sodass der Cartesia-Telefonagent ihn beim Connect über
// das Tool `get_call_context` abrufen kann.
// URL: POST /functions/v1/cartesia-register-context

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function makeToken(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 8);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const claraContext = body?.clara_context ?? body?.context ?? {};
    const phoneHint = typeof body?.phone_hint === "string" ? body.phone_hint : null;

    const token = makeToken();
    const { error } = await admin.from("phone_call_contexts").insert({
      token,
      clara_context: claraContext,
      phone_hint: phoneHint,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cartesia-register-context error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
