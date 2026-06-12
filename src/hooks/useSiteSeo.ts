import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSeoRow {
  route: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_image_url: string | null;
  canonical: string | null;
  noindex: boolean;
}

const cache = new Map<string, SiteSeoRow | null>();

export function useSiteSeo(route: string): SiteSeoRow | null {
  const [seo, setSeo] = useState<SiteSeoRow | null>(cache.get(route) ?? null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("site_seo")
        .select("*")
        .eq("route", route)
        .maybeSingle();
      if (cancelled) return;
      cache.set(route, data ?? null);
      setSeo(data ?? null);
    };
    load();

    const channel = supabase
      .channel(`site-seo-${route}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_seo", filter: `route=eq.${route}` },
        () => load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [route]);

  return seo;
}
