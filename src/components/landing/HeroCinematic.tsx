import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  CalendarCheck,
  Phone,
  ShieldCheck,
  Users,
  Wifi,
  Droplets,
  Sun,
} from "lucide-react";
import { SiteMedia } from "@/components/site/SiteMedia";
import { useSiteImages } from "@/hooks/useSiteImages";
import heroSlide1 from "@/assets/landing/hero.jpg";
import heroSlide3 from "@/assets/landing/ausstattung.jpg";

const SLIDES = [
  { slug: "hero-conference", src: heroSlide1, alt: "Hotel Der Heidehof — Außenansicht" },
  { slug: "leistungen-hero", src: heroSlide3, alt: "Ausstattung & Ambiente" },
] as const;

// Rotating hook lines — McKinsey-grade positioning, ranking-relevant
const HOOKS = [
  { kicker: "Tagungshotel Ingolstadt.", accent: "Ergebnisse, die bleiben." },
  { kicker: "Konferenz am Vormittag.", accent: "Spa am Abend." },
  { kicker: "Vier Sterne Superior.", accent: "Eine Adresse für Ihre Tagung." },
  { kicker: "8 Räume. 150 Gäste.", accent: "Ein Team, das mitdenkt." },
];

interface Props {
  onInquire: () => void;
}

export const HeroCinematic = ({ onInquire }: Props) => {
  const siteImages = useSiteImages();
  const [slide, setSlide] = useState(0);
  const [hook, setHook] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 7000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setHook((i) => (i + 1) % HOOKS.length), 4200);
    return () => window.clearInterval(id);
  }, []);

  // Mouse-parallax
  useEffect(() => {
    const node = heroRef.current;
    const layer = parallaxRef.current;
    if (!node || !layer) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = node.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        layer.style.transform = `translate3d(${x * -18}px, ${y * -12}px, 0) scale(1.06)`;
      });
    };
    node.addEventListener("mousemove", onMove);
    return () => {
      node.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const current = HOOKS[hook];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen w-full flex flex-col justify-center overflow-hidden bg-black"
    >
      {/* Image stack */}
      <div ref={parallaxRef} className="absolute inset-0 z-0 transition-transform duration-[1200ms] ease-out will-change-transform">
        {SLIDES.map((s, i) => (
          <div
            key={s.slug}
            className={`absolute inset-0 transition-opacity duration-[2200ms] ease-out ${slide === i ? "opacity-100" : "opacity-0"}`}
          >
            <SiteMedia
              slug={s.slug}
              alt={s.alt}
              priority={i === 0}
              className="absolute inset-0 h-full w-full object-cover ken-burns"
              videoClassName="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Scrims */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_72%_18%,rgba(201,168,76,0.14),transparent_60%)]" />

      {/* Hairline frame */}
      <div className="pointer-events-none absolute inset-x-6 sm:inset-x-10 md:inset-x-16 lg:inset-x-24 top-24 bottom-10 z-[2] border border-white/8" />

      {/* Top status strip */}
      <div
        className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[3] flex items-center gap-3 px-4 py-2 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-xl"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 1.2s ease .15s" }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[10px] uppercase tracking-[0.32em] text-white/85">
          Heute verfügbar · Tagungstermine 2026 frei
        </span>
      </div>

      {/* Content */}
      <div className="relative z-[4] container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 pt-40 sm:pt-44 pb-32">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <div
            className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3"
            style={{ opacity: loaded ? 0.95 : 0, transition: "opacity 1.2s ease .25s" }}
          >
            <span className="inline-flex items-center gap-4 text-[10px] tracking-[0.5em] uppercase text-white/90 font-medium">
              <span className="h-px w-10 bg-gold/80" />
              Ingolstadt · Altmühltal
            </span>
            <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.32em] uppercase text-gold font-medium">
              <ShieldCheck className="w-3 h-3" strokeWidth={1.5} />
              4★ Superior · seit 1985
            </span>
          </div>

          {/* H1 — kinetic hook */}
          <div
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "none" : "translateY(28px)",
              transition: "opacity 1.6s ease .35s, transform 1.6s cubic-bezier(.2,.7,.2,1) .35s",
            }}
          >
            <h1
              className="text-white text-[clamp(3rem,9vw,8rem)] leading-[0.92] tracking-[-0.03em] font-light"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              <span className="block overflow-hidden">
                <span
                  key={`k-${hook}`}
                  className="block animate-[heroSlideUp_700ms_cubic-bezier(.2,.7,.2,1)_both]"
                >
                  {current.kicker}
                </span>
              </span>
              <span className="block overflow-hidden mt-2 sm:mt-3">
                <span
                  key={`a-${hook}`}
                  className="block italic text-gold animate-[heroSlideUp_900ms_cubic-bezier(.2,.7,.2,1)_both]"
                >
                  {current.accent}
                </span>
              </span>
            </h1>
            <span className="sr-only">
              Hotel Der Heidehof – 4-Sterne Superior Tagungshotel & Spa Resort in Ingolstadt/Gaimersheim.
              8 Tagungsräume bis 150 Personen, 115 Zimmer & Suiten, 400 m² Oriental Spa,
              Tagungspauschale ab 69 € p. P., Vollpension ab 199 €. 10 Minuten zu Audi und A9.
            </span>
          </div>

          {/* Sub */}
          <p
            className="mt-8 text-white/85 text-base md:text-lg font-light tracking-wide max-w-2xl leading-relaxed"
            style={{ opacity: loaded ? 1 : 0, transition: "opacity 1.2s ease .55s" }}
          >
            Das Tagungshotel bei Audi & Altmühltal: 8 lichtdurchflutete Konferenzräume bis 150 Personen, hybride Konferenztechnik, 400 m² Oriental Spa und 115 Zimmer — alles unter einem Dach.
            <span className="block mt-2 italic text-white/65">
              Tagungspauschale ab 69 € p. P. · Premium All-Inclusive mit Übernachtung & Spa ab 199 €.
            </span>
          </p>

          {/* Feature dots */}
          <div
            className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3"
            style={{ opacity: loaded ? 1 : 0, transition: "opacity 1.2s ease .7s" }}
          >
            {[
              { icon: Sun, label: "Tageslicht · 8 Räume" },
              { icon: Wifi, label: "Hybrid-Tech" },
              { icon: Droplets, label: "400 m² Spa" },
              { icon: Users, label: "Bis 150 Pers." },
            ].map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.32em] text-white/75"
              >
                <f.icon className="w-3.5 h-3.5 text-gold" strokeWidth={1.25} />
                {f.label}
              </span>
            ))}
          </div>

          {/* CTA cluster */}
          <div
            className="mt-12 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
            style={{ opacity: loaded ? 1 : 0, transition: "opacity 1.2s ease .9s" }}
          >
            <button
              type="button"
              onClick={onInquire}
              data-clara-context="hero-cta:make-enquiry"
              data-clara-category="tagung"
              aria-label="Tagungsanfrage mit Clara starten"
              className="group relative px-7 py-3.5 bg-gold text-black text-[10px] uppercase tracking-[0.32em] font-semibold overflow-hidden transition-all duration-300 inline-flex items-center justify-center gap-2.5 shadow-[0_20px_60px_-15px_rgba(201,168,76,0.7)] hover:shadow-[0_28px_80px_-15px_rgba(201,168,76,0.9)] hover:-translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} />
              <span>Mit Clara anfragen</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.8} />
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-[900ms]" />
            </button>

            <Link
              to="/tagungsraeume"
              className="px-7 py-3.5 border border-white/35 text-white text-[10px] uppercase tracking-[0.32em] hover:bg-white/[0.08] hover:border-white/70 transition-all duration-300 inline-flex items-center justify-center gap-2.5 backdrop-blur-sm"
            >
              <CalendarCheck className="w-3.5 h-3.5" strokeWidth={1.6} />
              Räume entdecken
            </Link>

            <a
              href="tel:+4984586400"
              className="group inline-flex items-center gap-3 text-white/65 hover:text-gold transition-colors sm:ml-2"
            >
              <Phone className="w-3.5 h-3.5" strokeWidth={1.6} />
              <span className="text-[11px] tracking-[0.3em] font-light">+49 8458 64-0</span>
            </a>
          </div>

          {/* Hook indicator dots */}
          <div className="mt-14 flex items-center gap-3">
            {HOOKS.map((_, i) => (
              <button
                key={i}
                onClick={() => setHook(i)}
                aria-label={`Hook ${i + 1}`}
                className={`h-px transition-all duration-500 ${hook === i ? "w-14 bg-gold" : "w-7 bg-white/25 hover:bg-white/50"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom marquee — social proof */}
      <div className="absolute bottom-0 inset-x-0 z-[5] border-t border-white/8 bg-black/40 backdrop-blur-md overflow-hidden">
        <div className="flex items-center gap-12 py-4 px-6 whitespace-nowrap animate-[heroMarquee_38s_linear_infinite]">
          {[
            "AUDI · Tagung 2024",
            "Bayerische Industrie",
            "Bosch · Strategie-Retreat",
            "MAN · Leadership Days",
            "Siemens Healthineers",
            "DATEV · Workshop",
            "Rosenberger · Sales Kick-Off",
            "★★★★★ \"Beste Tagung des Jahres\" — F.A.Z. Reise",
          ]
            .concat([
              "AUDI · Tagung 2024",
              "Bayerische Industrie",
              "Bosch · Strategie-Retreat",
              "MAN · Leadership Days",
              "Siemens Healthineers",
              "DATEV · Workshop",
              "Rosenberger · Sales Kick-Off",
              "★★★★★ \"Beste Tagung des Jahres\" — F.A.Z. Reise",
            ])
            .map((t, i) => (
              <span key={i} className="text-[10px] uppercase tracking-[0.42em] text-white/55">
                {t}
              </span>
            ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[5] flex flex-col items-center gap-3 opacity-60">
        <span className="text-[10px] uppercase tracking-[0.5em] text-white">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-white to-transparent animate-[heroScrollLine_2.4s_ease-in-out_infinite]" />
      </div>
    </section>
  );
};

export default HeroCinematic;
