import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActiveEventNavItem {
  id: string;
  slug: string;
  title: string;
  starts_at: string | null;
}

export const useActiveEvents = () => {
  return useQuery<ActiveEventNavItem[]>({
    queryKey: ["nav-active-events"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("events")
        .select("id, slug, title, starts_at")
        .eq("is_active", true)
        .eq("is_published", true)
        .or(`starts_at.gte.${nowIso},starts_at.is.null`)
        .order("starts_at", { ascending: true, nullsFirst: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []) as ActiveEventNavItem[];
    },
  });
};
