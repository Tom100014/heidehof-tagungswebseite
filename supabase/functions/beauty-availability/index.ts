// Beauty-Verfügbarkeits-Engine.
// Berechnet freie Slots für eine Behandlung an einem Datum
// auf Basis von Schichtplan + Overrides + bestehenden Buchungen.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TZ_OFFSET_MINUTES = 60; // Europa/Berlin Winter; einfache Näherung. DST-Korrektur erfolgt via toISO.
const SLOT_STEP_MIN = 15;
const OPENING = { start: "09:00", end: "20:00" };

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(min: number): string {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

interface FreeWindow { start: number; end: number; } // minutes since midnight

function subtractIntervals(base: FreeWindow[], blocked: FreeWindow[]): FreeWindow[] {
  let out = [...base];
  for (const b of blocked) {
    const next: FreeWindow[] = [];
    for (const w of out) {
      if (b.end <= w.start || b.start >= w.end) { next.push(w); continue; }
      if (b.start > w.start) next.push({ start: w.start, end: b.start });
      if (b.end < w.end) next.push({ start: b.end, end: w.end });
    }
    out = next;
  }
  return out.filter((w) => w.end > w.start);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { treatment_id, date } = await req.json();
    if (!treatment_id || !date) {
      return new Response(JSON.stringify({ error: "treatment_id and date required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Behandlung
    const { data: t, error: tErr } = await sb
      .from("wellness_treatments")
      .select("id, title, duration_minutes, buffer_minutes, required_skill, bookable, price_eur, price_label")
      .eq("id", treatment_id)
      .maybeSingle();

    if (tErr || !t) {
      return new Response(JSON.stringify({ error: "treatment not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (t.bookable === false) {
      return new Response(JSON.stringify({ slots: [], reason: "treatment_not_bookable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const duration = (t.duration_minutes ?? 60) + (t.buffer_minutes ?? 0);
    const requiredSkill: string | null = t.required_skill ?? null;

    // 2) Mitarbeiter mit Skill (oder alle wenn kein Skill gefordert)
    let staffQuery = sb.from("beauty_staff").select("id, name, color").eq("is_active", true);
    const { data: allStaff } = await staffQuery;
    let candidateStaff = allStaff ?? [];

    if (requiredSkill) {
      const { data: skill } = await sb.from("beauty_skills").select("id").eq("slug", requiredSkill).maybeSingle();
      if (skill) {
        const { data: links } = await sb.from("beauty_staff_skills").select("staff_id").eq("skill_id", skill.id);
        const allowedIds = new Set((links ?? []).map((l: any) => l.staff_id));
        candidateStaff = candidateStaff.filter((s: any) => allowedIds.has(s.id));
      } else {
        candidateStaff = [];
      }
    }

    if (candidateStaff.length === 0) {
      return new Response(JSON.stringify({ slots: [], reason: "no_qualified_staff" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Tag → weekday
    const day = new Date(`${date}T00:00:00+02:00`);
    const weekday = day.getDay(); // 0=So..6=Sa

    // 4) pro Mitarbeiter: Schicht-Windows berechnen
    const staffIds = candidateStaff.map((s: any) => s.id);
    const [shiftsRes, ovRes, bookingsRes] = await Promise.all([
      sb.from("beauty_shifts").select("*").in("staff_id", staffIds).eq("weekday", weekday),
      sb.from("beauty_shift_overrides").select("*").in("staff_id", staffIds).eq("date", date),
      sb.from("beauty_bookings").select("staff_id, starts_at, ends_at, status")
        .in("staff_id", staffIds)
        .gte("starts_at", `${date}T00:00:00+00:00`)
        .lt("starts_at", `${date}T23:59:59+00:00`)
        .not("status", "in", "(cancelled,no_show)"),
    ]);

    const opening: FreeWindow = { start: toMinutes(OPENING.start), end: toMinutes(OPENING.end) };

    const slots: { time: string; staff_id: string; staff_name: string }[] = [];

    for (const staff of candidateStaff) {
      const shifts = (shiftsRes.data ?? []).filter((s: any) => s.staff_id === staff.id);
      const overrides = (ovRes.data ?? []).filter((o: any) => o.staff_id === staff.id);
      const bookings = (bookingsRes.data ?? []).filter((b: any) => b.staff_id === staff.id);

      // valid_from/valid_to check
      const validShifts = shifts.filter((s: any) => {
        if (s.valid_from && date < s.valid_from) return false;
        if (s.valid_to && date > s.valid_to) return false;
        return true;
      });

      let windows: FreeWindow[] = validShifts.map((s: any) => ({
        start: Math.max(toMinutes(s.start_time.substring(0,5)), opening.start),
        end: Math.min(toMinutes(s.end_time.substring(0,5)), opening.end),
      })).filter((w) => w.end > w.start);

      // Overrides anwenden
      const offBlocks = overrides.filter((o: any) => o.type === "off").map((o: any) => ({
        start: o.start_time ? toMinutes(o.start_time.substring(0,5)) : 0,
        end: o.end_time ? toMinutes(o.end_time.substring(0,5)) : 24 * 60,
      }));
      const extras = overrides.filter((o: any) => o.type === "extra" && o.start_time && o.end_time).map((o: any) => ({
        start: toMinutes(o.start_time.substring(0,5)),
        end: toMinutes(o.end_time.substring(0,5)),
      }));
      windows = subtractIntervals(windows, offBlocks);
      windows.push(...extras);

      // Bestehende Buchungen abziehen
      const booked: FreeWindow[] = bookings.map((b: any) => {
        const s = new Date(b.starts_at);
        const e = new Date(b.ends_at);
        // in Berlin-Minuten umrechnen (Annahme: Datum stimmt überein)
        const sMin = s.getUTCHours() * 60 + s.getUTCMinutes() + TZ_OFFSET_MINUTES;
        const eMin = e.getUTCHours() * 60 + e.getUTCMinutes() + TZ_OFFSET_MINUTES;
        return { start: sMin, end: eMin };
      });
      windows = subtractIntervals(windows, booked);

      // In Slots zerlegen
      for (const w of windows) {
        for (let m = w.start; m + duration <= w.end; m += SLOT_STEP_MIN) {
          slots.push({ time: fromMinutes(m), staff_id: staff.id, staff_name: staff.name });
        }
      }
    }

    // nach Zeit sortieren, dedupliziert pro Zeit ersten freien Mitarbeiter zurückgeben
    slots.sort((a, b) => a.time.localeCompare(b.time));
    const seen = new Set<string>();
    const unique = slots.filter((s) => {
      if (seen.has(s.time)) return false;
      seen.add(s.time); return true;
    });

    return new Response(JSON.stringify({
      treatment: { id: t.id, title: t.title, duration_min: duration, price_eur: t.price_eur, price_label: t.price_label },
      date,
      slots: unique,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
