import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Monitor,
  Coffee,
  Waves,
  Utensils,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";
import type { DayJourneyStep } from "@/hooks/useDayJourney";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";

const ICONS: Record<string, LucideIcon> = {
  MapPin,
  Monitor,
  Coffee,
  Waves,
  Utensils,
  Dumbbell,
};

interface Props {
  steps: DayJourneyStep[];
}

type ResolvedMedia = {
  type: "image" | "video";
  url: string | null;
  webm: string | null;
  poster: string | null;
  objectPosition: string;
  loop: boolean;
  muted: boolean;
};

function resolveMedia(step: DayJourneyStep, isMobile: boolean): ResolvedMedia {
  // mobile override
  if (isMobile && step.mobile_media_url) {
    return {
      type: (step.mobile_media_type ?? "image") as "image" | "video",
      url: step.mobile_media_url,
      webm: null,
      poster: step.poster_url,
      objectPosition: step.object_position || "center",
      loop: step.loop,
      muted: step.muted,
    };
  }
  // explicit video_url wins
  if (step.video_url) {
    return {
      type: "video",
      url: step.video_url,
      webm: step.video_webm_url,
      poster: step.poster_url ?? step.media_url,
      objectPosition: step.object_position || "center",
      loop: step.loop,
      muted: step.muted,
    };
  }
  return {
    type: step.media_type,
    url: step.media_url,
    webm: null,
    poster: step.poster_url ?? step.media_url,
    objectPosition: step.object_position || "center",
    loop: step.loop,
    muted: step.muted,
  };
}

export const DayJourneyHero = ({ steps }: Props) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Hash routing (#tagen → jump to step)
  useEffect(() => {
    const slug = window.location.hash.replace("#", "");
    if (!slug) return;
    const idx = steps.findIndex((s) => s.slug === slug);
    if (idx >= 0) setActiveIdx(idx);
  }, [steps]);

  const active = steps[activeIdx];
  const advanceMs = Math.max(2000, (active?.autoplay_seconds ?? 9) * 1000);

  // Auto-advance
  useEffect(() => {
    if (paused || steps.length === 0) return;
    const t = window.setTimeout(() => {
      setActiveIdx((i) => (i + 1) % steps.length);
    }, advanceMs);
    return () => window.clearTimeout(t);
  }, [activeIdx, paused, steps.length, advanceMs]);

  // Preload next video
  const nextIdx = steps.length ? (activeIdx + 1) % steps.length : 0;
  const nextStep = steps[nextIdx];
  const nextMedia = useMemo(
    () => (nextStep ? resolveMedia(nextStep, isMobile) : null),
    [nextStep, isMobile],
  );

  // Swipe gestures
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let startX = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 50) return;
      setPaused(true);
      setActiveIdx((i) => {
        const next = dx < 0 ? (i + 1) % steps.length : (i - 1 + steps.length) % steps.length;
        return next;
      });
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [steps.length]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setPaused(true);
        setActiveIdx((i) => (i + 1) % steps.length);
      } else if (e.key === "ArrowLeft") {
        setPaused(true);
        setActiveIdx((i) => (i - 1 + steps.length) % steps.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  if (steps.length === 0 || !active) {
    return (
      <section className="relative min-h-[80vh] flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Inhalte werden geladen …</p>
      </section>
    );
  }

  const handleSelect = (i: number) => {
    setActiveIdx(i);
    setPaused(true);
    if (steps[i]) window.history.replaceState(null, "", `#${steps[i].slug}`);
  };

  const activeMedia = resolveMedia(active, isMobile);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[88svh] md:min-h-[100svh] w-full overflow-hidden bg-background text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Ein Tag bei uns – Cinema-Reise"
    >
      {/* Background media (crossfade with subtle Ken-Burns) */}
      <AnimatePresence mode="sync">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.06 }}
          animate={{
            opacity: 1,
            scale: reduceMotion ? 1 : 1.0,
            transition: {
              opacity: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: advanceMs / 1000 + 2, ease: "linear" },
            },
          }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
          className="absolute inset-0"
        >
          {activeMedia.type === "video" && activeMedia.url && !reduceMotion ? (
            <video
              key={activeMedia.url}
              poster={activeMedia.poster ?? undefined}
              autoPlay
              muted={activeMedia.muted}
              loop={activeMedia.loop}
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: activeMedia.objectPosition }}
              onError={(e) => {
                // fall back to poster
                const v = e.currentTarget;
                if (activeMedia.poster) {
                  v.style.display = "none";
                  const img = document.createElement("img");
                  img.src = activeMedia.poster;
                  img.className = "absolute inset-0 w-full h-full object-cover";
                  img.style.objectPosition = activeMedia.objectPosition;
                  v.parentElement?.appendChild(img);
                }
              }}
            >
              {activeMedia.webm && <source src={activeMedia.webm} type="video/webm" />}
              <source src={activeMedia.url} type="video/mp4" />
            </video>
          ) : (
            <img
              src={activeMedia.url ?? activeMedia.poster ?? "/placeholder.svg"}
              alt={active.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: activeMedia.objectPosition }}
              loading={activeIdx === 0 ? "eager" : "lazy"}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Hidden preload for next video */}
      {nextMedia?.type === "video" && nextMedia.url && (
        <video
          key={`preload-${nextMedia.url}`}
          src={nextMedia.url}
          preload="metadata"
          muted
          playsInline
          className="hidden"
          aria-hidden="true"
        />
      )}

      {/* Overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 pt-32 pb-16 md:pt-40 md:pb-24 min-h-[88svh] md:min-h-[100svh] flex flex-col justify-end">
        <div className="grid md:grid-cols-12 gap-10 items-end">
          {/* Left: storytelling */}
          <div className="md:col-span-7 lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 }}
              >
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.5 }}
                  className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-gold/90 mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
                >
                  {active.eyebrow}
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.65 }}
                  className="font-serif text-white text-[2.4rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight max-w-3xl drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]"
                >
                  {active.title}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.55 }}
                  className="text-white/85 max-w-xl mt-6 sm:mt-8 text-base md:text-lg leading-relaxed font-light drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)]"
                >
                  {active.body}
                </motion.p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-3 pt-8">
              <button
                type="button"
                onClick={() =>
                  openClaraBubble({
                    category: "tagung",
                    topic: `Ein Tag bei uns – ${active.title}`,
                    section: active.eyebrow,
                    source: typeof window !== "undefined" ? window.location.pathname : undefined,
                    trigger: "day-journey-hero",
                  })
                }
                className="group inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-4 uppercase tracking-[0.2em] text-xs rounded-md bg-apple hover:bg-apple-bright text-white transition-all hover:gap-4 shadow-2xl shadow-apple/25 min-h-[52px]"
              >
                <Sparkles className="w-4 h-4" />
                Mit Clara anfragen
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: chapters */}
          <div className="md:col-span-5 lg:col-span-5">
            <ul className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-visible snap-x md:snap-none pb-2 md:pb-0 -mx-5 px-5 md:mx-0 md:px-0">
              {steps.map((step, i) => {
                const Icon = ICONS[step.icon] ?? MapPin;
                const isActive = i === activeIdx;
                return (
                  <li key={step.id} className="snap-start shrink-0 md:shrink">
                    <button
                      type="button"
                      onClick={() => handleSelect(i)}
                      className={`group relative w-[220px] md:w-full flex items-center gap-4 px-5 py-4 rounded-md border transition-all duration-300 backdrop-blur-md text-left overflow-hidden ${
                        isActive
                          ? "border-apple bg-apple/10 shadow-[0_0_30px_-8px_hsl(var(--apple)/0.6)]"
                          : "border-white/20 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/40"
                      }`}
                      aria-current={isActive ? "step" : undefined}
                    >
                      <span
                        className={`text-[11px] tracking-[0.2em] font-mono w-7 ${
                          isActive ? "text-apple" : "text-white/50"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-apple" : "text-white/70"}`}
                      />
                      <span
                        className={`text-xs sm:text-sm uppercase tracking-[0.18em] truncate ${
                          isActive ? "text-white" : "text-white/80"
                        }`}
                      >
                        {step.slug}
                      </span>
                      {isActive && !paused && !reduceMotion && (
                        <motion.span
                          key={`progress-${active.id}-${advanceMs}`}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: advanceMs / 1000, ease: "linear" }}
                          className="absolute left-0 bottom-0 h-[2px] w-full origin-left bg-apple"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
