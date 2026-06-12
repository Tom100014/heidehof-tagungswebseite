// Läuft im iframe-Inhalt (eigene Route): empfängt postMessage vom Parent (Anfrage-Seite),
// scrollt zum Anchor und setzt einen pulsierenden Spotlight-Marker.
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface ClaraGotoMessage {
  type: "clara:goto";
  route?: string;
  anchor?: string;
}

const SPOTLIGHT_CLASS = "clara-spotlight";
const SPOTLIGHT_MS = 4500;

function applySpotlight(el: Element) {
  el.classList.remove(SPOTLIGHT_CLASS);
  // force reflow um Animation neu zu starten
  void (el as HTMLElement).offsetWidth;
  el.classList.add(SPOTLIGHT_CLASS);
  window.setTimeout(() => el.classList.remove(SPOTLIGHT_CLASS), SPOTLIGHT_MS);
}

function scrollToAnchor(anchor?: string) {
  if (!anchor) return;
  const cleanAnchor = anchor.replace(/^#/, "");
  const sel = anchor.startsWith("#") ? anchor : `#${anchor}`;

  const tryFind = (attempt = 0) => {
    let el = document.getElementById(cleanAnchor);
    if (!el) {
      el = document.querySelector(`[data-clara-target="${cleanAnchor}"]`);
    }
    if (!el) {
      el = document.querySelector(`[data-clara-target="${anchor}"]`);
    }
    if (!el) {
      try {
        el = document.querySelector(sel);
      } catch {
        // In case sel is not a valid CSS selector
      }
    }
    if (!el && cleanAnchor) {
      try {
        el = document.querySelector(cleanAnchor);
      } catch {
        // In case cleanAnchor is not a valid CSS selector
      }
    }

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      applySpotlight(el);
    } else if (attempt < 10) {
      window.setTimeout(() => tryFind(attempt + 1), 250);
    }
  };
  tryFind();
}

import { resolveInternalRoute } from "@/lib/clara/internal-routes";

interface NavigateInternalDetail {
  route?: string;
  section?: string;
  anchor?: string;
}

interface FocusFieldDetail {
  target?: string;
  route?: string;
}

const FOCUS_CLASS = "clara-spotlight";

function focusFormField(target?: string) {
  if (!target) return;
  const clean = target.replace(/^#/, "");
  const selectors = [
    `#${CSS.escape(clean)}`,
    `[name="${CSS.escape(clean)}"]`,
    `[aria-label*="${clean.replace(/"/g, "")}" i]`,
    `[placeholder*="${clean.replace(/"/g, "")}" i]`,
  ];
  let el: HTMLElement | null = null;
  for (const selector of selectors) {
    try {
      el = document.querySelector<HTMLElement>(selector);
      if (el) break;
    } catch { /* ignore invalid selectors */ }
  }
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    el?.focus({ preventScroll: true });
    el?.classList.add(FOCUS_CLASS);
    window.setTimeout(() => el?.classList.remove(FOCUS_CLASS), 4500);
  }, 450);
}

export function useClaraTourBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.self !== window.top) {
      window.parent.postMessage({
        type: "clara:iframe-navigated",
        pathname: location.pathname
      }, window.location.origin);
    }
  }, [location.pathname]);

  useEffect(() => {
    const onMessage = (e: MessageEvent<unknown>) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as ClaraGotoMessage | null;
      if (!data || data.type !== "clara:goto") return;

      if (data.route && data.route !== location.pathname) {
        navigate(data.route);
        window.setTimeout(() => scrollToAnchor(data.anchor), 600);
      } else {
        scrollToAnchor(data.anchor);
      }
    };

    const onNavigateInternal = (e: Event) => {
      const detail = (e as CustomEvent<NavigateInternalDetail>).detail ?? {};
      const target = detail.route ?? resolveInternalRoute(detail.section);
      if (!target) return;

      if (document.body.classList.contains("clara-mobile-active")) {
        // Mobile assistant view: do not navigate parent window!
        // Instead, forward it to the mobile iframe.
        const iframe = document.querySelector(".clara-mobile-iframe") as HTMLIFrameElement | null;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: "clara:goto",
            route: target,
            anchor: detail.anchor
          }, window.location.origin);
        }
        return;
      }

      if (target !== location.pathname) {
        navigate(target);
        window.setTimeout(() => scrollToAnchor(detail.anchor), 600);
      } else {
        scrollToAnchor(detail.anchor);
      }
    };

    const onFocusField = (e: Event) => {
      const detail = (e as CustomEvent<FocusFieldDetail>).detail ?? {};
      const targetRoute = detail.route;
      if (targetRoute && targetRoute !== location.pathname) {
        navigate(targetRoute);
        window.setTimeout(() => focusFormField(detail.target), 700);
      } else {
        focusFormField(detail.target);
      }
    };

    // ── Item-level scroll: "scroll to Cola", "zeig mir Aperol Spritz" ──
    const CATEGORY_ROUTES: Record<string, string> = {
      drink: "/getraenkekarte",
      food: "/speisekarte",
      wellness: "/wellness",
      spa: "/spa",
      treatment: "/spa",
      package: "/tagungspauschalen",
      pauschale: "/tagungspauschalen",
      raum: "/tagungsraeume",
      room: "/tagungsraeume",
    };

    const slugify = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    const findItemElement = (name: string): HTMLElement | null => {
      const slug = slugify(name);
      // 1) exact id match (cards use id={slug})
      let el = document.getElementById(slug);
      if (el) return el;
      // 2) data-clara-slug match (incl. partial)
      el = document.querySelector<HTMLElement>(`[data-clara-slug="${CSS.escape(slug)}"]`);
      if (el) return el;
      // 3) fuzzy match by data-clara-name
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-clara-name]"),
      );
      const lower = name.toLowerCase().trim();
      const exact = nodes.find((n) => n.dataset.claraName?.toLowerCase() === lower);
      if (exact) return exact;
      const partial = nodes.find((n) => {
        const v = n.dataset.claraName?.toLowerCase() ?? "";
        return v.includes(lower) || lower.includes(v);
      });
      return partial ?? null;
    };

    const scrollToItem = (name: string, category?: string, route?: string) => {
      if (!name) return;
      const targetRoute =
        route ?? (category ? CATEGORY_ROUTES[category.toLowerCase()] : undefined);
      const reveal = () => {
        const el = findItemElement(name);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          applySpotlight(el);
        }
      };
      if (targetRoute && targetRoute !== location.pathname) {
        navigate(targetRoute);
        window.setTimeout(reveal, 700);
      } else {
        reveal();
      }
    };

    const onScrollToItem = (e: Event) => {
      const detail = (e as CustomEvent<{ name?: string; category?: string; route?: string }>).detail ?? {};
      if (detail.name) scrollToItem(detail.name, detail.category, detail.route);
    };

    // Global helper so voice/chat agents can call it directly
    (window as unknown as { claraScrollToItem?: typeof scrollToItem }).claraScrollToItem = scrollToItem;

    window.addEventListener("message", onMessage);
    window.addEventListener("clara:navigate-internal", onNavigateInternal as EventListener);
    window.addEventListener("clara:focus-field", onFocusField as EventListener);
    window.addEventListener("clara:scroll-to-item", onScrollToItem as EventListener);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("clara:navigate-internal", onNavigateInternal as EventListener);
      window.removeEventListener("clara:focus-field", onFocusField as EventListener);
      window.removeEventListener("clara:scroll-to-item", onScrollToItem as EventListener);
    };
  }, [navigate, location.pathname]);
}

