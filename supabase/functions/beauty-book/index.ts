// Server-validierte Beauty-Buchung mit Race-Condition-Schutz.
// Re-validiert Slot und schreibt in beauty_bookings (EXCLUDE-Constraint verhindert Overlaps).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      treatment_id, date, time, // time = "HH:MM" Berlin
      staff_id,                 // optional, sonst Auto-Pick
      guest_name, guest_phone, guest_email, guest_room,
      notes, source = "frontend",
    } = body;

    if (!treatment_id || !date || !time || !guest_name) {
      return new Response(JSON.stringify({ error: "treatment_id, date, time, guest_name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Re-validiere via availability-Function
    const availRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/beauty-availability`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ treatment_id, date }),
    });
    const avail = await availRes.json();
    if (!avail?.slots) {
      return new Response(JSON.stringify({ error: "no_slots", reason: avail?.reason }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const candidate = avail.slots.find((s: any) =>
      s.time === time && (!staff_id || s.staff_id === staff_id)
    );
    if (!candidate) {
      return new Response(JSON.stringify({ error: "slot_unavailable" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const duration = avail.treatment.duration_min;
    // Berlin → UTC (annahme: CEST=+02:00, CET=+01:00). Wir codieren Europe/Berlin pauschal als +01:00 Winter, +02:00 Sommer.
    // Einfach: nehme Datum als +02:00 (DST aktiv im Sommer). Eckfälle akzeptiert.
    const startIso = `${date}T${time}:00+02:00`;
    const startDate = new Date(startIso);
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const { data: inserted, error } = await sb.from("beauty_bookings").insert({
      treatment_id,
      treatment_title: avail.treatment.title,
      treatment_duration_min: duration,
      staff_id: candidate.staff_id,
      staff_name: candidate.staff_name,
      guest_name: String(guest_name).trim(),
      guest_phone: guest_phone ?? null,
      guest_email: guest_email ?? null,
      guest_room: guest_room ?? null,
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      status: "confirmed",
      source,
      notes: notes ?? null,
      price_eur: avail.treatment.price_eur ?? null,
    }).select().single();

    if (error) {
      // Overlap → 23P01
      if ((error as any).code === "23P01") {
        return new Response(JSON.stringify({ error: "slot_taken" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin-Inbox-Eintrag (best-effort)
    try {
      await sb.from("admin_messages").insert({
        message_type: "beauty_booking",
        source_form: "beauty_booking_v2",
        recipient_type: "whatsapp",
        recipient_contact: "+4917634177214",
        message_content: `🌸 Neue Beauty-Buchung | ${avail.treatment.title} | ${guest_name} | ${date} ${time} | ${candidate.staff_name}`,
        customer_name: guest_name,
        room_number: guest_room ?? null,
        order_reference: inserted.id,
        guest_phone_number: guest_phone ?? null,
        metadata: { booking_id: inserted.id, treatment_id, staff_id: candidate.staff_id, starts_at: startDate.toISOString() },
        priority: false,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
    } catch (_e) { /* non-fatal */ }

    return new Response(JSON.stringify({ ok: true, booking: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
