import { supabase } from "@/integrations/supabase/client";

export interface AvailabilitySlot {
  time: string;
  staff_id: string;
  staff_name: string;
}

export interface AvailabilityResponse {
  treatment: { id: string; title: string; duration_min: number; price_eur: number | null; price_label: string | null };
  date: string;
  slots: AvailabilitySlot[];
  reason?: string;
}

export async function fetchAvailability(treatment_id: string, date: string): Promise<AvailabilityResponse> {
  const { data, error } = await supabase.functions.invoke("beauty-availability", {
    body: { treatment_id, date },
  });
  if (error) throw error;
  return data as AvailabilityResponse;
}

export interface BookingInput {
  treatment_id: string;
  date: string;
  time: string;
  staff_id?: string;
  guest_name: string;
  guest_phone?: string;
  guest_email?: string;
  guest_room?: string;
  notes?: string;
}

export async function createBooking(input: BookingInput) {
  const { data, error } = await supabase.functions.invoke("beauty-book", { body: input });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data;
}

export function todayIsoBerlin(): string {
  const now = new Date();
  const berlin = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const y = berlin.getFullYear();
  const m = String(berlin.getMonth() + 1).padStart(2, "0");
  const d = String(berlin.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nextNDays(n: number): { iso: string; label: string; weekday: string }[] {
  const out: { iso: string; label: string; weekday: string }[] = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime() + i * 86400000);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({
      iso,
      label: `${d.getDate()}.${d.getMonth() + 1}.`,
      weekday: d.toLocaleDateString("de-DE", { weekday: "short" }),
    });
  }
  return out;
}
