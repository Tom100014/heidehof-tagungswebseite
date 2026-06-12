import { lazy, type ComponentType } from "react";

/**
 * Wrap React.lazy() with a one-time auto-reload on stale-chunk failures.
 *
 * When Vite re-bundles deps (HMR / dep optimizer rewrite), older hashed
 * chunk URLs disappear → dynamic imports fail with "Importing a module
 * script failed" / ChunkLoadError. We force-reload the page once so the
 * browser picks up the fresh chunk hashes. A sessionStorage flag prevents
 * reload loops if the failure is real.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
): ReturnType<typeof lazy<T>> {
  return lazy(async () => {
    const RELOAD_KEY = "lazy-chunk-reloaded";
    try {
      return await factory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isChunkError =
        /Importing a module script failed/i.test(msg) ||
        /Failed to fetch dynamically imported module/i.test(msg) ||
        /ChunkLoadError/i.test(msg) ||
        (err as { name?: string })?.name === "ChunkLoadError";

      if (isChunkError && typeof window !== "undefined") {
        const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
        if (!alreadyReloaded) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
          // Return a never-resolving promise so Suspense keeps the fallback
          // visible until the reload swaps the page out.
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    }
  });
}
