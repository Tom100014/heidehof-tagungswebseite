import { useEffect, useState } from "react";
import { X, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveHeidehofUrl, HEIDEHOF_SECTIONS } from "@/lib/clara/heidehof-routes";

const ALLOWED_HOSTS = new Set([
  "www.der-heidehof.de",
  "der-heidehof.de",
  "hotel-dream-guide.lovable.app",
  "onepagebooking.com",
  "www.onepagebooking.com",
]);

const INTERNAL_HOSTS = new Set([
  "hotel-dream-guide.lovable.app",
  window.location.host,
]);

const HEIDEHOF_INTERNAL_ROUTES: Array<[RegExp, string]> = [
  [/bankett-tagung\/raeumlichkeiten/i, "/tagungsraeume"],
  [/bankett-tagung\/tagungsangebote/i, "/tagungspauschalen"],
  [/bankett-tagung\/ausstattung-technik/i, "/ausstattung-technik"],
  [/bankett-tagung\/outdoor/i, "/outdoor-aktiv"],
  [/kulinarik-locations\/restaurants/i, "/restaurant"],
  [/kulinarik-locations\/kulinarik\/speisekarten/i, "/speisekarte"],
  [/spa-area/i, "/spa"],
  [/living-beauty/i, "/wellness"],
  [/kulinarik-locations\/kulinarik\/events/i, "/veranstaltungen"],
];

interface OpenPageDetail {
  url?: string;
  section?: string;
  title?: string;
  target?: "overlay" | "hero";
  fullscreen?: boolean;
}

const isAllowed = (url: string): boolean => {
  try {
    const u = new URL(url, window.location.href);
    return ALLOWED_HOSTS.has(u.host) || INTERNAL_HOSTS.has(u.host);
  } catch {
    return false;
  }
};

const resolveInternalRouteFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url, window.location.href);
    const path = parsed.pathname;
    return HEIDEHOF_INTERNAL_ROUTES.find(([pattern]) => pattern.test(path))?.[1] ?? null;
  } catch {
    return null;
  }
};

export function HeidehofPageOverlay() {
  const navigate = useNavigate();
  const [src, setSrc] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("Heidehof");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenPageDetail>).detail ?? {};
      if (detail.target === "hero") return;
      let url = detail.url;
      if (!url && detail.section) {
        if (HEIDEHOF_SECTIONS[detail.section]) {
          url = resolveHeidehofUrl(detail.section);
        } else if (detail.section.startsWith("/")) {
          url = detail.section;
        }
      }
      if (!url) return;

      const internalRoute = resolveInternalRouteFromUrl(url);
      if (internalRoute) {
        navigate(internalRoute);
        return;
      }

      // Internal route → use React Router instead of iframe
      try {
        const parsed = new URL(url, window.location.href);
        if (INTERNAL_HOSTS.has(parsed.host)) {
          navigate(parsed.pathname + parsed.search + parsed.hash);
          return;
        }
      } catch { /* ignore */ }

      if (!isAllowed(url)) {
        console.warn("Clara overlay: URL not allowed", url);
        return;
      }
      setTitle(detail.title || "Heidehof");
      if (detail.fullscreen) setFullscreen(true);
      // Versuche Cookie-Banner per URL-Hint zu unterdrücken (Cookiebot/best effort).
      try {
        const u = new URL(url, window.location.href);
        if (!u.searchParams.has("cookieconsent")) u.searchParams.set("cookieconsent", "dismiss");
        url = u.toString();
      } catch { /* ignore */ }
      setSrc(url);
    };
    const onClose = () => setSrc(null);
    window.addEventListener("clara:open-page", onOpen as EventListener);
    window.addEventListener("clara:close-page", onClose);
    return () => {
      window.removeEventListener("clara:open-page", onOpen as EventListener);
      window.removeEventListener("clara:close-page", onClose);
    };
  }, [navigate]);

  useEffect(() => {
    if (src) document.body.classList.add("clara-overlay-active");
    else {
      document.body.classList.remove("clara-overlay-active");
      document.body.classList.remove("clara-overlay-fullscreen");
      setFullscreen(false);
    }
    return () => {
      document.body.classList.remove("clara-overlay-active");
      document.body.classList.remove("clara-overlay-fullscreen");
    };
  }, [src]);

  useEffect(() => {
    if (fullscreen) document.body.classList.add("clara-overlay-fullscreen");
    else document.body.classList.remove("clara-overlay-fullscreen");
  }, [fullscreen]);

  if (!src) return null;

  const close = () => setSrc(null);

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[1020] flex print:hidden"
          : "fixed inset-x-0 bottom-0 top-24 md:top-28 z-[1000] flex items-end md:items-center justify-end print:hidden"
      }
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <aside
        className={
          fullscreen
            ? "relative bg-background border border-apple/30 shadow-2xl w-full h-full overflow-hidden flex flex-col"
            : "relative bg-background border border-apple/30 shadow-[0_30px_120px_-20px_rgba(0,0,0,0.8)] w-full md:w-[min(820px,92vw)] h-full md:h-[calc(100vh-9rem)] md:mr-6 rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col"
        }
        role="dialog"
        aria-label={title}
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-apple/20 bg-background">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-block w-2 h-2 rounded-full bg-apple-bright animate-pulse" />
            <p className="text-xs uppercase tracking-[0.25em] text-apple-bright truncate">
              Clara zeigt · {title}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Verkleinern" : "Vollbild"}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-apple-bright hover:bg-apple/10 transition"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-apple-bright hover:bg-apple/10 transition"
              aria-label="Im neuen Tab öffnen"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={close}
              aria-label="Schließen"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>
        <iframe
          key={src}
          src={src}
          title={title}
          className="flex-1 w-full bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </aside>
    </div>
  );
}

export default HeidehofPageOverlay;

