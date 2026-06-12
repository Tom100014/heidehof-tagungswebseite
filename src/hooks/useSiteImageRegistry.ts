import { useEffect } from "react";

/**
 * Global registry of all `<SiteImage slug="…" />` (and Hero3D) instances currently
 * mounted on the page. Powers the admin-only overlay that lets admins jump from
 * any rendered image straight to its slot in the Bildverwaltung.
 */
const counts = new Map<string, number>();
const subs = new Set<() => void>();

export function registerSiteImageSlug(slug: string): () => void {
  counts.set(slug, (counts.get(slug) ?? 0) + 1);
  subs.forEach((cb) => cb());
  return () => {
    const next = (counts.get(slug) ?? 1) - 1;
    if (next <= 0) counts.delete(slug);
    else counts.set(slug, next);
    subs.forEach((cb) => cb());
  };
}

export function useRegisterSiteImageSlug(slug: string | undefined | null) {
  useEffect(() => {
    if (!slug) return;
    return registerSiteImageSlug(slug);
  }, [slug]);
}

export function getActiveSiteImageSlugs(): string[] {
  return Array.from(counts.keys()).sort();
}

export function subscribeActiveSiteImageSlugs(cb: () => void): () => void {
  subs.add(cb);
  return () => { subs.delete(cb); };
}
