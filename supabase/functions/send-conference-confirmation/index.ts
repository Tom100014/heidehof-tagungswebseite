// Sends a polished email confirmation for a conference menu order.
// Uses the Lovable transactional email pipeline (send-transactional-email).
// If the transactional infrastructure is not yet available, the function
// returns success=false but never blocks the user flow.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      recipientEmail, firstName, lastName, company,
      conferenceRoom, guestType, lunchSelection, dinnerSelection,
      menuDate, orderId,
    } = body;

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "recipientEmail required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Try transactional pipeline first
    const idemKey = `conf-confirm-${orderId || crypto.randomUUID()}`;
    const { data, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "conference-order-confirmation",
        recipientEmail,
        idempotencyKey: idemKey,
        templateData: {
          firstName, lastName, company, conferenceRoom,
          guestType, lunchSelection, dinnerSelection, menuDate,
        },
      },
    });

    if (error) {
      console.warn("Transactional email failed:", error.message);
      return new Response(JSON.stringify({ success: false, queued: false, reason: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
