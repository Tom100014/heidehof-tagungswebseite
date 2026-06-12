import { ImgHTMLAttributes, CSSProperties, useEffect, useRef } from "react";
import { useSiteImagesState } from "@/hooks/useSiteImages";
import { useRegisterSiteImageSlug } from "@/hooks/useSiteImageRegistry";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  slug: string;
  /** Kept for backwards compatibility — IGNORED. We never show a hardcoded fallback. */
  fallback?: string;
  alt: string;
  /** When true: marks image as LCP candidate (eager + high fetchpriority + sync decode). */
  priority?: boolean;
  /** Optional per-image brightness multiplier (1 = unchanged, 1.2 = 20% brighter). */
  brightness?: number;
}

/**
 * Renders an <img> whose src is fully managed by the Admin Image Manager.
 * If no upload exists for the slug, a neutral placeholder is rendered (no hardcoded image).
 */
export function SiteImage({ slug, alt, priority, loading, decoding, brightness, style, className, ...rest }: Props) {
  useRegisterSiteImageSlug(slug);
  const { map, loaded } = useSiteImagesState();
  const entry = map[slug];
  const resolvedLoading = loading ?? (priority ? "eager" : "lazy");
  const resolvedDecoding = decoding ?? (priority ? "sync" : "async");
  const fetchPriority = priority ? "high" : "auto";
  const resolvedBrightness = brightness ?? entry?.brightness;

  const composedStyle: CSSProperties | undefined = resolvedBrightness !== undefined
    ? {
        ...style,
        filter: `${style?.filter ? style.filter + " " : ""}brightness(${resolvedBrightness}) contrast(1.04)`,
        ["--img-brightness" as never]: resolvedBrightness,
      } as CSSProperties
    : style;

  // While loading or when no admin upload exists: render a neutral placeholder (no hardcoded image).
  if (!loaded || !entry?.url) {
    return (
      <div
        aria-label={alt}
        role="img"
        className={className}
        style={{
          ...composedStyle,
          background: "linear-gradient(135deg, hsl(0 0% 8%), hsl(0 0% 14%))",
        }}
      />
    );
  }

  if (entry.media_type === "video") {
    return (
      <AutoplayVideo
        src={entry.url}
        poster={entry.poster_url || undefined}
        ariaLabel={entry.alt || alt}
        className={className}
        style={composedStyle}
      />
    );
  }

  return (
    <img
      src={entry.url}
      alt={entry.alt || alt}
      loading={resolvedLoading}
      decoding={resolvedDecoding}
      className={className}
      style={composedStyle}
      {...(resolvedBrightness !== undefined ? { "data-brightness": "true" } : {})}
      {...({ fetchpriority: fetchPriority } as Record<string, string>)}
      {...rest}
    />
  );
}

/** iOS-safe autoplay video (sets muted attribute imperatively + retries play()). */
function AutoplayVideo({
  src, poster, ariaLabel, className, style,
}: {
  src: string;
  poster?: string;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
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

export default SiteImage;
