import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

/**
 * Clara DOM-Awareness — "short-term memory" der Webseite.
 *
 * Trackt:
 *  - aktuelle Route + Scroll-Tiefe (0..1)
 *  - die letzten 5 semantisch markierten Klicks
 *  - das letzte semantisch markierte Hover (>500ms)
 *  - die aktuell sichtbaren tracked-Elemente (IntersectionObserver)
 *
 * Elemente werden mit `data-clara-context="..."` markiert. Optional
 * `data-clara-category="tagung|wellness|essen|event|..."`.
 */

export interface ClaraInteraction {
  label: string;
  category?: string;
  at: number;
}

interface ClaraContextValue {
  route: string;
  scrollDepth: number; // 0..1
  viewport: { w: number; h: number };
  currentlyViewing: string[];
  recentClicks: ClaraInteraction[];
  lastHover: ClaraInteraction | null;
  /** Kompakter Snapshot, der z. B. an einen LLM/Voice-Agent gegeben werden kann. */
  snapshot: () => Record<string, unknown>;
}

const ClaraCtx = createContext<ClaraContextValue | null>(null);

const MAX_CLICKS = 5;

export const ClaraContextProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [scrollDepth, setScrollDepth] = useState(0);
  const [viewport, setViewport] = useState(() => ({
    w: typeof window === "undefined" ? 0 : window.innerWidth,
    h: typeof window === "undefined" ? 0 : window.innerHeight,
  }));
  const [currentlyViewing, setCurrentlyViewing] = useState<string[]>([]);
  const [recentClicks, setRecentClicks] = useState<ClaraInteraction[]>([]);
  const [lastHover, setLastHover] = useState<ClaraInteraction | null>(null);

  const hoverTimerRef = useRef<number | null>(null);
  const visibleSetRef = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Scroll-Tiefe ──
  useEffect(() => {
    const onScroll = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      setScrollDepth(Math.min(1, Math.max(0, window.scrollY / max)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  // ── Viewport ──
  useEffect(() => {
    const onResize = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── IntersectionObserver für [data-clara-context] ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    observerRef.current?.disconnect();
    const set = visibleSetRef.current;
    set.clear();

    const obs = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const e of entries) {
          const label = (e.target as HTMLElement).dataset.claraContext;
          if (!label) continue;
          if (e.isIntersecting && e.intersectionRatio > 0.4) {
            if (!set.has(label)) {
              set.add(label);
              changed = true;
            }
          } else {
            if (set.has(label)) {
              set.delete(label);
              changed = true;
            }
          }
        }
        if (changed) setCurrentlyViewing(Array.from(set));
      },
      { threshold: [0, 0.4, 0.75] },
    );
    observerRef.current = obs;

    const rescan = () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        "[data-clara-context]",
      );
      nodes.forEach((n) => obs.observe(n));
    };
    rescan();
    // Re-Scan nach Route-Wechsel + bei DOM-Mutationen
    const mo = new MutationObserver(() => rescan());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      obs.disconnect();
    };
  }, [location.pathname]);

  // ── Klick- & Hover-Interceptor (global) ──
  useEffect(() => {
    if (typeof window === "undefined") return;

    const categoryFromText = (text: string): string | undefined => {
      const t = text.toLowerCase();
      if (/tagung|konferenz|raum|pauschale|technik|angebot|bankett|meeting/.test(t)) return "tagung";
      if (/speise|essen|men[uü]|restaurant|schnitzel|dinner|lunch|kulinarik/.test(t)) return "food";
      if (/getr[aä]nk|bar|wein|bier|cola|cocktail|kaffee|aperol/.test(t)) return "drink";
      if (/spa|wellness|beauty|massage|sauna|pool|kosmetik/.test(t)) return "wellness";
      if (/event|feier|hochzeit|outdoor|aktiv|incentive|veranstaltung/.test(t)) return "event";
      return undefined;
    };

    const textFromNode = (node: HTMLElement): string => {
      const aria = node.getAttribute("aria-label");
      if (aria?.trim()) return aria.trim();
      const title = node.getAttribute("title");
      if (title?.trim()) return title.trim();
      const heading = node.querySelector("h1,h2,h3,h4,[data-clara-context]");
      if (heading?.textContent?.trim()) return heading.textContent.trim();
      return node.textContent?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "";
    };

    const extract = (el: Element | null): ClaraInteraction | null => {
      let node: Element | null = el;
      while (node && node !== document.body) {
        if (node instanceof HTMLElement && node.dataset.claraContext) {
          return {
            label: node.dataset.claraContext,
            category: node.dataset.claraCategory,
            at: Date.now(),
          };
        }
        if (
          node instanceof HTMLElement &&
          (node.matches("button,a,[role='button'],section,article") || node.id)
        ) {
          const label = textFromNode(node);
          if (label) {
            return {
              label,
              category: node.dataset.claraCategory ?? categoryFromText(label),
              at: Date.now(),
            };
          }
        }
        node = node.parentElement;
      }
      return null;
    };

    const onClick = (ev: MouseEvent) => {
      const info = extract(ev.target as Element);
      if (!info) return;
      setRecentClicks((prev) => {
        const next = [info, ...prev].slice(0, MAX_CLICKS);
        return next;
      });
    };

    const onOver = (ev: MouseEvent) => {
      const info = extract(ev.target as Element);
      if (!info) return;
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = window.setTimeout(() => {
        setLastHover(info);
      }, 350);
    };
    const onOut = () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("mouseover", onOver, true);
    document.addEventListener("mouseout", onOut, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mouseover", onOver, true);
      document.removeEventListener("mouseout", onOut, true);
    };
  }, []);

  // ── Reset bei Route-Wechsel ──
  useEffect(() => {
    setCurrentlyViewing([]);
    visibleSetRef.current.clear();
  }, [location.pathname]);

  const snapshot = useCallback(
    () => ({
      route: location.pathname,
      scrollDepth: Number(scrollDepth.toFixed(2)),
      viewport,
      currentlyViewing,
      recentClicks: recentClicks.map((c) => ({
        label: c.label,
        category: c.category,
        secondsAgo: Math.round((Date.now() - c.at) / 1000),
      })),
      lastHover: lastHover
        ? {
            label: lastHover.label,
            category: lastHover.category,
            secondsAgo: Math.round((Date.now() - lastHover.at) / 1000),
          }
        : null,
    }),
    [location.pathname, scrollDepth, viewport, currentlyViewing, recentClicks, lastHover],
  );

  const value = useMemo<ClaraContextValue>(
    () => ({
      route: location.pathname,
      scrollDepth,
      viewport,
      currentlyViewing,
      recentClicks,
      lastHover,
      snapshot,
    }),
    [location.pathname, scrollDepth, viewport, currentlyViewing, recentClicks, lastHover, snapshot],
  );

  return <ClaraCtx.Provider value={value}>{children}</ClaraCtx.Provider>;
};

export const useClaraContext = (): ClaraContextValue => {
  const ctx = useContext(ClaraCtx);
  if (!ctx) {
    // Safe fallback — falls jemand außerhalb des Providers liest.
    return {
      route: typeof window !== "undefined" ? window.location.pathname : "/",
      scrollDepth: 0,
      viewport: { w: 0, h: 0 },
      currentlyViewing: [],
      recentClicks: [],
      lastHover: null,
      snapshot: () => ({}),
    };
  }
  return ctx;
};
