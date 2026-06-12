import { useEffect, useRef } from "react";
import { useSiteImagesState } from "@/hooks/useSiteImages";
import { useRegisterSiteImageSlug } from "@/hooks/useSiteImageRegistry";

interface Props {
  slug: string;
  /** Kept for backwards compatibility — IGNORED. */
  fallback?: string;
  /** Kept for backwards compatibility — IGNORED. */
  fallbackVideo?: string;
  alt: string;
  className?: string;
  videoClassName?: string;
  /** Set true on the above-the-fold hero image to avoid lazy-loading LCP. */
  priority?: boolean;
}

/**
 * Renders an admin-uploaded image OR video for a given slug.
 * No hardcoded fallback is ever shown — only what admins upload.
 */
export function SiteMedia({ slug, alt, className = "", videoClassName, priority = false }: Props) {
  useRegisterSiteImageSlug(slug);
  const { map, loaded } = useSiteImagesState();
  const entry = map[slug];

  const brightnessStyle = entry?.brightness !== undefined
    ? { filter: `brightness(${entry.brightness}) contrast(1.04)` }
    : undefined;

  if (!loaded || !entry?.url) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={videoClassName || className}
        style={{
          background: "linear-gradient(135deg, hsl(0 0% 8%), hsl(0 0% 14%))",
        }}
      />
    );
  }

  if (entry.media_type === "video") {
    return (
      <VideoEl
        src={entry.url}
        poster={entry.poster_url || undefined}
        ariaLabel={entry.alt || alt}
        className={videoClassName || className}
        style={brightnessStyle}
      />
    );
  }

  return (
    <img
      src={entry.url}
      alt={entry.alt || alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      className={className}
      style={brightnessStyle}
    />
  );
}

/**
 * Video element with iOS-safe autoplay:
 * React's `muted` JSX prop is not always serialized as the HTML attribute,
 * which iOS Safari requires for autoplay. We set it imperatively via ref
 * and explicitly call play() after metadata loads.
 */
function VideoEl({
  src, poster, ariaLabel, className, style,
}: {
  src: string;
  poster?: string;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    const tryPlay = () => { v.play().catch(() => {}); };
    tryPlay();
    v.addEventListener("loadedmetadata", tryPlay);
    v.addEventListener("canplay", tryPlay);
    return () => {
      v.removeEventListener("loadedmetadata", tryPlay);
      v.removeEventListener("canplay", tryPlay);
    };
  }, [src]);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-label={ariaLabel}
      className={className}
      style={style}
    />
  );
}

export default SiteMedia;
