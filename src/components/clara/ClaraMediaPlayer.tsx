// Visueller Player für Clara: zeigt automatisch das von "show_media" gewählte
// Bild oder Video — mit sanftem Crossfade, Ken-Burns für Bilder, Auto-Loop für Videos.
import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Video as VideoIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClaraMedia {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  media_type: "image" | "video" | "gallery";
  url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  match_kind?: "tag" | "trigger" | "ilike" | "embedding";
}

interface Props {
  media: ClaraMedia | null;
  fallbackUrl?: string;
  fallbackAlt?: string;
  className?: string;
}

export function ClaraMediaPlayer({ media, fallbackUrl, fallbackAlt, className }: Props) {
  const [current, setCurrent] = useState<ClaraMedia | null>(media);
  const [previous, setPrevious] = useState<ClaraMedia | null>(null);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!media) return;
    if (current?.id === media.id) return;
    setPrevious(current);
    setCurrent(media);
    setFading(true);
    if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    fadeTimer.current = window.setTimeout(() => {
      setFading(false);
      setPrevious(null);
    }, 800);
  }, [media, current]);

  const showFallback = !current && fallbackUrl;

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-background", className)}>
      {/* Vorheriges Medium für Crossfade */}
      {previous && (
        <MediaLayer media={previous} className={cn("absolute inset-0 transition-opacity duration-700", fading ? "opacity-0" : "opacity-100")} />
      )}

      {/* Aktuelles Medium */}
      {current && (
        <MediaLayer
          media={current}
          className={cn("absolute inset-0 transition-opacity duration-700", fading ? "opacity-100" : "opacity-100")}
        />
      )}

      {/* Fallback wenn noch nichts geladen */}
      {showFallback && (
        <img
          src={fallbackUrl}
          alt={fallbackAlt ?? ""}
          className="absolute inset-0 w-full h-full object-cover ken-burns-slow"
        />
      )}

      {!current && !showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
          <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
            <Sparkles className="w-10 h-10 animate-pulse text-apple-bright" />
            <p className="text-xs uppercase tracking-[0.3em]">Clara wählt gleich ein Bild</p>
          </div>
        </div>
      )}

      {/* Sanfter Vignette-Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/15" />

      {/* Caption-Banner unten */}
      {current && (
        <div
          key={current.id}
          className="absolute left-0 right-0 bottom-0 px-5 py-4 backdrop-blur-md bg-black/35 border-t border-white/10 animate-fade-in"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-apple-bright mb-1">
            {current.media_type === "video" ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
            <span>{current.category || "Heidehof"}</span>
          </div>
          <p className="font-serif text-white text-lg md:text-2xl leading-tight drop-shadow">
            {current.title}
          </p>
          {(current.caption || current.description) && (
            <p className="mt-1 text-xs md:text-sm text-white/80 line-clamp-2">
              {current.caption || current.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MediaLayer({ media, className }: { media: ClaraMedia; className?: string }) {
  if (media.media_type === "video") {
    return (
      <video
        key={media.id}
        src={media.url}
        poster={media.thumbnail_url ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        className={cn("w-full h-full object-cover", className)}
      />
    );
  }
  return (
    <img
      key={media.id}
      src={media.url}
      alt={media.title}
      className={cn("w-full h-full object-cover ken-burns-slow", className)}
      loading="eager"
    />
  );
}

export default ClaraMediaPlayer;
