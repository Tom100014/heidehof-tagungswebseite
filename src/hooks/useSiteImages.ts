import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteMediaEntry = {
  url: string;
  alt?: string | null;
  media_type?: "image" | "video";
  poster_url?: string | null;
  brightness?: number;
};

type ImgMap = Record<string, SiteMediaEntry>;

let cache: ImgMap | null = null;
let loaded = false;
const subs = new Set<(m: ImgMap, l: boolean) => void>();

async function load() {
  const { data } = await supabase
    .from("site_images")
    .select("slug,url,alt,media_type,poster_url,brightness");
  const m: ImgMap = {};
  (data || []).forEach((r) => {
    m[r.slug] = {
      url: r.url,
      alt: r.alt,
      media_type: (r.media_type as "image" | "video") || "image",
      poster_url: r.poster_url,
      brightness: r.brightness,
    };
  });
  cache = m;
  loaded = true;
  subs.forEach((cb) => cb(m, true));
}

export function useSiteImages() {
  const [map, setMap] = useState<ImgMap>(cache || {});
  useEffect(() => {
    if (!cache) load();
    const cb = (m: ImgMap) => setMap({ ...m });
    subs.add(cb);
    return () => { subs.delete(cb); };
  }, []);
  return map;
}

export function useSiteImagesState() {
  const [state, setState] = useState<{ map: ImgMap; loaded: boolean }>({
    map: cache || {},
    loaded,
  });
  useEffect(() => {
    if (!cache) load();
    const cb = (m: ImgMap, l: boolean) => setState({ map: { ...m }, loaded: l });
    subs.add(cb);
    return () => { subs.delete(cb); };
  }, []);
  return state;
}

export function refreshSiteImages() { return load(); }
