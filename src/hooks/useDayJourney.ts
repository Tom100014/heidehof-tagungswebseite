import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DayJourneyStep {
  id: string;
  slug: string;
  sort_order: number;
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  story_md: string;
  media_type: "image" | "video";
  media_url: string | null;
  poster_url: string | null;
  video_url: string | null;
  video_webm_url: string | null;
  loop: boolean;
  muted: boolean;
  object_position: string;
  autoplay_seconds: number;
  mobile_media_url: string | null;
  mobile_media_type: "image" | "video" | null;
  is_active: boolean;
}

export const useDayJourney = (includeInactive = false) => {
  const [steps, setSteps] = useState<DayJourneyStep[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("day_journey_steps" as never)
      .select("*")
      .order("sort_order", { ascending: true });
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (!error && data) setSteps(data as unknown as DayJourneyStep[]);
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("day_journey_steps_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "day_journey_steps" },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { steps, loading, reload: load };
};
