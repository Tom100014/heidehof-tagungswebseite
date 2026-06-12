import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { event_slug, guest_name, email, phone, party_size, notes, source } = body;
    if (!event_slug || !guest_name) {
      return new Response(JSON.stringify({ error: "event_slug and guest_name required" }), { status: 400, headers: corsHeaders });
    }
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: ev, error: evErr } = await sb.from("events").select("id, agent_bookable, booking_enabled, is_active, is_published").eq("slug", event_slug).maybeSingle();
    if (evErr || !ev) return new Response(JSON.stringify({ error: "event not found" }), { status: 404, headers: corsHeaders });
    if (!ev.is_active || !ev.is_published || !ev.booking_enabled) return new Response(JSON.stringify({ error: "booking not enabled" }), { status: 403, headers: corsHeaders });
    if (source === "clara" && !ev.agent_bookable) return new Response(JSON.stringify({ error: "agent bookings disabled for this event" }), { status: 403, headers: corsHeaders });

    const { data, error } = await sb.from("event_bookings").insert({
      event_id: ev.id,
      guest_name,
      email: email ?? null,
      phone: phone ?? null,
      party_size: party_size ?? 1,
      notes: notes ?? null,
      source: source ?? "web",
    }).select("id").single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

    return new Response(JSON.stringify({ ok: true, booking_id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
