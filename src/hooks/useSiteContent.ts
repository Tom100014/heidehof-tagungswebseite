import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteContentRow {
  section_key: string;
  value_de: string;
}
export interface SiteMediaRow {
  section_key: string;
  url: string;
  alt: string | null;
}

interface PageContent {
  texts: Record<string, string>;
  media: Record<string, { url: string; alt: string | null }>;
  loading: boolean;
}

const cache = new Map<string, PageContent>();

export function useSiteContent(page: string): PageContent & {
  t: (key: string, fallback?: string) => string;
  img: (key: string, fallback?: string) => string;
  imgAlt: (key: string, fallback?: string) => string;
} {
  const [state, setState] = useState<PageContent>(
    cache.get(page) ?? { texts: {}, media: {}, loading: true },
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [texts, media] = await Promise.all([
          supabase.from("site_content").select("section_key,value_de").eq("page", page),
          supabase.from("site_media").select("section_key,url,alt").eq("page", page),
        ]);
        const t: Record<string, string> = {};
        (texts.data ?? []).forEach((r) => {
          if (r.value_de && r.value_de.length > 0) t[r.section_key] = r.value_de;
        });
        const m: Record<string, { url: string; alt: string | null }> = {};
        (media.data ?? []).forEach((r) => {
          if (r.url) m[r.section_key] = { url: r.url, alt: r.alt };
        });
        const next = { texts: t, media: m, loading: false };
        // Always update the cache so re-mounts after cancelled fetches get fresh data.
        cache.set(page, next);
        if (!cancelled) setState(next);
      } catch {
        if (!cancelled) setState((prev) => ({ ...prev, loading: false }));
      }
    };
    load();

    const channel = supabase
      .channel(`site-content-${page}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content", filter: `page=eq.${page}` },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_media", filter: `page=eq.${page}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [page]);

  return {
    ...state,
    t: (key, fallback = "") => state.texts[key] ?? fallback,
    img: (key, fallback = "") => state.media[key]?.url ?? fallback,
    imgAlt: (key, fallback = "") => state.media[key]?.alt ?? fallback,
  };
}
