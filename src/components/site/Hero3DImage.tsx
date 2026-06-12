import { useEffect, useRef } from "react";
import { SiteImage } from "./SiteImage";

interface Props {
  slug: string;
  fallback: string;
  alt: string;
  /** Tilt strength in degrees (default 6) */
  tilt?: number;
  /** Parallax translate strength in px (default 24) */
  parallax?: number;
  /** Base zoom to allow movement without showing edges (default 1.12) */
  zoom?: number;
  className?: string;
}

/**
 * Cinematic 3D hero image:
 * - Mouse-driven tilt + parallax (perspective)
 * - Scroll-driven depth (subtle Y translate + scale)
 * - Soft inner depth layers (vignette + shine) to enhance 3D feel
 * - Falls back gracefully on touch / reduced motion
 */
export function Hero3DImage({
  slug,
  fallback,
  alt,
  tilt = 6,
  parallax = 24,
  zoom = 1.12,
  className = "",
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapperRef.current;
    const img = imgRef.current;
    const shine = shineRef.current;
    if (!wrap || !img) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let scrollY = 0;

    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = px;
      targetY = py;
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };

    const tick = () => {
      // Smooth lerp
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      const rotY = currentX * tilt;
      const rotX = -currentY * tilt;
      const tx = -currentX * parallax;
      const ty = -currentY * parallax;

      // Scroll depth: translate up + slight extra scale
      const sd = Math.min(scrollY / 800, 1);
      const sy = sd * -60;
      const sc = zoom + sd * 0.04;

      img.style.transform =
        `translate3d(${tx}px, ${ty + sy}px, 0) scale(${sc}) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

      if (shine) {
        const sx = (currentX + 0.5) * 100;
        const sYp = (currentY + 0.5) * 100;
        shine.style.background =
          `radial-gradient(circle at ${sx}% ${sYp}%, hsla(36,40%,90%,0.18), transparent 55%)`;
      }

      rafId = requestAnimationFrame(tick);
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [tilt, parallax, zoom]);

  return (
    <div
      ref={wrapperRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ perspective: "1400px", perspectiveOrigin: "50% 50%" }}
    >
      <div
        ref={imgRef}
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `scale(${zoom})`,
          transformStyle: "preserve-3d",
          transition: "transform 0.05s linear",
        }}
      >
        <SiteImage
          slug={slug}
          priority
          fallback={fallback}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Depth layer: inner vignette to fake foreground curvature */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, hsla(0,0%,0%,0.55) 100%)",
        }}
      />

      {/* Dynamic shine following pointer */}
      <div
        ref={shineRef}
        className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70"
      />
    </div>
  );
}

export default Hero3DImage;
