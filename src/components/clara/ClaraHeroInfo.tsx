import { useEffect, useState } from "react";
import { ExternalLink, Sparkles, X } from "lucide-react";
import { useSiteImages } from "@/hooks/useSiteImages";
import { HEIDEHOF_SECTIONS, resolveHeidehofUrl } from "@/lib/clara/heidehof-routes";

interface HeroDetail {
  title?: string;
  image?: string;
  pageUrl?: string;
  info?: string;
  mediaType?: "image" | "video";
  kind?: "room" | "media" | "info" | "page";
}

interface OpenPageDetail {
  url?: string;
  section?: string;
  title?: string;
}

/**
 * Permanenter „Showroom"-Bereich oberhalb des Clara-Chats.
 * - Standard: zeigt das Clara-Profilbild aus dem Admin (slug "clara-avatar").
 * - Bei Events (clara:hero-update, clara:show-media) wechselt der Inhalt
 *   weich zum gewünschten Bild/Video (Räume, Medien, Webseiten-Vorschau).
 * - Wenn Clara den vollen Browser öffnet (clara:open-page), zeigt der
 *   Bereich wieder das Standardbild – die Webseite läuft im Overlay.
 */
export function ClaraHeroInfo() {
  const images = useSiteImages();
  const defaultAvatar =
    images["clara-avatar"]?.url ||
    "/heidehof/clara-avatar.jpg";

  const [detail, setDetail] = useState<HeroDetail | null>(null);

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const d = (e as CustomEvent<HeroDetail>).detail;
      if (!d || (!d.image && !d.info && !d.title)) return;
      setDetail(d);
    };
    const onMedia = (e: Event) => {
      const m = (e as CustomEvent<{ url?: string; thumbnail_url?: string; title?: string; description?: string | null; caption?: string | null; media_type?: string }>).detail;
      if (!m) return;
      const image = m.media_type === "video" ? (m.thumbnail_url || m.url) : m.url;
      if (!image) return;
      setDetail({
        title: m.title,
        image,
        info: m.caption || m.description || undefined,
        mediaType: m.media_type === "video" ? "video" : "image",
        kind: "media",
      });
    };
    const onOpenPage = (e: Event) => {
      const openDetail = (e as CustomEvent<OpenPageDetail>).detail ?? {};
      let pageUrl = openDetail.url;
      if (!pageUrl && openDetail.section) {
        pageUrl = HEIDEHOF_SECTIONS[openDetail.section] ?? (openDetail.section.startsWith("/") ? openDetail.section : resolveHeidehofUrl(openDetail.section));
      }
      if (!pageUrl) return;
      setDetail({
        title: openDetail.title || openDetail.section || "Heidehof Webseite",
        pageUrl,
        info: "Clara zeigt die passende Webseite direkt hier im Anfrage-Bereich.",
        kind: "page",
      });
    };
    const reset = () => setDetail(null);

    window.addEventListener("clara:hero-update", onUpdate as EventListener);
    window.addEventListener("clara:show-media", onMedia as EventListener);
    window.addEventListener("clara:hero-clear", reset);
    window.addEventListener("clara:hide-media", reset);
    window.addEventListener("clara:open-page", onOpenPage as EventListener);
    window.addEventListener("clara:close-page", reset);
    return () => {
      window.removeEventListener("clara:hero-update", onUpdate as EventListener);
      window.removeEventListener("clara:show-media", onMedia as EventListener);
      window.removeEventListener("clara:hero-clear", reset);
      window.removeEventListener("clara:hide-media", reset);
      window.removeEventListener("clara:open-page", onOpenPage as EventListener);
      window.removeEventListener("clara:close-page", reset);
    };
  }, []);

  const showImage = detail?.image || defaultAvatar;
  const isDefault = !detail?.image && !detail?.pageUrl;
  const isPage = detail?.kind === "page" && Boolean(detail.pageUrl);

  if (isDefault) return null;

  return (
    <div className="relative max-w-4xl mx-auto mt-2 md:-mt-44 mb-2 md:mb-4 px-2 md:px-4 z-30">
      <div className={`relative w-full ${isPage ? "aspect-[4/3] md:aspect-[16/8]" : "aspect-[16/10] md:aspect-[16/6]"} rounded-[2rem] overflow-hidden border border-apple/20 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] bg-black`}>
        {isPage && detail?.pageUrl ? (
          <iframe
            key={detail.pageUrl}
            src={detail.pageUrl}
            title={detail.title ?? "Heidehof Webseite"}
            className="absolute inset-0 w-full h-full bg-white animate-fade-in"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : detail?.image && detail.mediaType === "video" ? (
          <video
            key={detail.image}
            src={detail.image}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover animate-fade-in"
          />
        ) : detail?.image ? (
          <img
            key={`media-${detail.image}`}
            src={detail.image}
            alt={detail.title ?? "Heidehof"}
            className="absolute inset-0 w-full h-full object-cover animate-fade-in"
          />
        ) : (
          <>
            <img
              key={`bg-${showImage}`}
              src={showImage}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-60 transition-opacity duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[42%] aspect-square max-w-[280px] rounded-full overflow-hidden ring-4 ring-apple/40 shadow-[0_0_60px_-10px] shadow-apple/60">
                <img
                  key={`fg-${showImage}`}
                  src={showImage}
                  alt="Clara"
                  className="w-full h-full object-cover animate-fade-in"
                />
              </div>
            </div>
          </>
        )}

        {!isDefault && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />}

        {!isDefault && (
          <button
            type="button"
            onClick={() => setDetail(null)}
            aria-label="Clara Anzeige schließen"
            className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/55 text-white/90 hover:bg-black/75 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isPage && detail?.pageUrl && (
          <a
            href={detail.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Webseite in neuem Tab öffnen"
            className="absolute top-3 right-14 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/55 text-white/90 hover:bg-black/75 transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Untere Caption nur wenn ein Inhalt aktiv ist */}
        {!isDefault && (detail?.title || detail?.info) && (
          <div className="absolute left-0 right-0 bottom-0 p-4 md:p-5 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
            <p className="text-xs uppercase tracking-[0.3em] text-apple-bright inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Clara zeigt
            </p>
            {detail?.title && (
              <h3 className="font-serif text-white text-lg md:text-xl leading-tight mt-1 drop-shadow">
                {detail.title}
              </h3>
            )}
            {detail?.info && (
              <p className="text-xs md:text-sm text-white/80 line-clamp-2 mt-1">
                {detail.info}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClaraHeroInfo;
