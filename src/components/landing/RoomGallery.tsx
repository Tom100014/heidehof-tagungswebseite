import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SiteImage } from "@/components/site/SiteImage";
import { writeClaraInquiryContext } from "@/lib/clara/inquiry-context";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";

export interface RoomGalleryItem {
  slug: string;
  name: string;
  eyebrow: string;
  area: string;
  capacity: number;
  img: string;
}

interface RoomGalleryProps {
  rooms: RoomGalleryItem[];
}

/**
 * Horizontaler Snap-Scroll der 5 Tagungsräume — Full-Bleed-Bilder mit
 * Text-Overlay. Ersetzt die alten 5 großen Cinematic-Karten. Detail auf
 * /tagungsraeume.
 */
export const RoomGallery = ({ rooms }: RoomGalleryProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-room-card]");
    const w = card?.offsetWidth ?? el.clientWidth * 0.8;
    el.scrollBy({ left: dir * (w + 16), behavior: "smooth" });
  };

  return (
    <section
      id="raeume"
      aria-label="Tagungsräume im Überblick"
      className="relative bg-background py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-12 md:mb-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-gold/80 mb-4 font-medium">
              Räumlichkeiten
            </p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.05] tracking-tight">
              Acht Räume.
              <br />
              <span className="italic text-foreground/70">Eine Bühne.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Zurück"
              onClick={() => scrollBy(-1)}
              className="w-11 h-11 rounded-full border border-gold/25 text-gold/80 hover:border-gold/60 hover:text-gold transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Weiter"
              onClick={() => scrollBy(1)}
              className="w-11 h-11 rounded-full border border-gold/25 text-gold/80 hover:border-gold/60 hover:text-gold transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-6 px-5 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {rooms.map((r, idx) => {
          const ctx = {
            category: "tagung" as const,
            topic: `Raum ${r.name}`,
            room: r.name,
            source: "landing-room-gallery",
            details: [r.eyebrow, r.area].filter(Boolean),
          };
          const onClick = () => {
            writeClaraInquiryContext(ctx);
            openClaraBubble(ctx);
          };
          return (
            <article
              key={r.slug}
              data-room-card
              role="button"
              tabIndex={0}
              onClick={onClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }}
              className="group relative shrink-0 snap-start w-[82vw] sm:w-[60vw] md:w-[44vw] lg:w-[32vw] aspect-[3/4] overflow-hidden rounded-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
            >
              <SiteImage
                slug={r.slug}
                fallback={r.img}
                alt={`Tagungsraum ${r.name} – ${r.area}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform [transition-duration:1600ms] group-hover:scale-[1.04]"
              />
              {/* Bottom-up gradient for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              {/* Hairline accent */}
              <div className="absolute bottom-32 left-6 right-6 h-px bg-gold/40 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-7 text-white">
                <p className="text-[10px] uppercase tracking-[0.42em] text-gold/90 mb-3 font-medium">
                  {r.eyebrow}
                </p>
                <h3 className="font-serif text-3xl md:text-4xl leading-[1.05] tracking-tight">
                  {r.name}
                </h3>
                <div className="mt-4 flex items-center gap-5 text-[11px] uppercase tracking-[0.28em] text-white/75">
                  <span>{r.area}</span>
                  <span className="h-px w-6 bg-white/30" />
                  <span>bis {r.capacity} Pers.</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 mt-12 md:mt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-gold/15 pt-8">
        <p className="text-sm text-foreground/60 font-light max-w-xl">
          Plus drei Kreativräume im Art Center: Feuer, Wasser, Holz — für
          Workshops & Klausuren.
        </p>
        <Link
          to="/tagungsraeume"
          className="group inline-flex items-center gap-3 text-gold/90 hover:text-gold uppercase tracking-[0.3em] text-[11px] font-medium border-b border-gold/30 hover:border-gold pb-1.5 transition-all"
        >
          Komplette Raumübersicht
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
};
