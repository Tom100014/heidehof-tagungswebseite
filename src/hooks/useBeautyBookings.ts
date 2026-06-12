import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BeautyBooking {
  id: string;
  treatment_id: string | null;
  treatment_title: string;
  treatment_duration_min: number;
  staff_id: string | null;
  staff_name: string | null;
  guest_name: string;
  guest_phone: string | null;
  guest_email: string | null;
  guest_room: string | null;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "in_service" | "done" | "cancelled" | "no_show";
  source: string;
  notes: string | null;
  price_eur: number | null;
  created_at: string;
}

export function useBeautyBookings(date: string) {
  const [bookings, setBookings] = useState<BeautyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      const { data } = await supabase
        .from("beauty_bookings" as any)
        .select("*")
        .gte("starts_at", `${date}T00:00:00+00:00`)
        .lt("starts_at", `${date}T23:59:59+00:00`)
        .order("starts_at", { ascending: true });
      if (mounted) {
        setBookings((data as any) ?? []);
        setLoading(false);
      }
    };
    void load();

    const channel = supabase
      .channel(`beauty_bookings_${date}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "beauty_bookings" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [date]);

  return { bookings, loading };
}
