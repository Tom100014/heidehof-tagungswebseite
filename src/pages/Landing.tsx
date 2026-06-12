import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Phone, Sparkles, Sun, Wifi, Droplets, ShieldCheck, CalendarCheck, Utensils } from "lucide-react";

import { PageSeo } from "@/components/seo/PageSeo";
import {
  hotelSchema,
  organizationSchema,
  websiteSchema,
  faqSchema,
  offerSchema,
} from "@/lib/seo/schemas";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageNavigator } from "@/components/site/PageNavigator";
import { SiteImage } from "@/components/site/SiteImage";
import { SiteMedia } from "@/components/site/SiteMedia";

import { Hero3DImage } from "@/components/site/Hero3DImage";
import { HeroCinematic } from "@/components/landing/HeroCinematic";
import heroSlide1 from "@/assets/landing/hero.jpg";
import heroSlide3 from "@/assets/landing/ausstattung.jpg";
import { useSiteImages } from "@/hooks/useSiteImages";

const HERO_FALLBACK = [
  { src: heroSlide1, alt: "Hotel Der Heidehof — Außenansicht", slug: "hero-conference" },
  { src: heroSlide3, alt: "Ausstattung & Ambiente des Hauses", slug: "leistungen-hero" },
] as const;

import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { PartnerLogosMarquee } from "@/components/landing/PartnerLogosMarquee";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { writeClaraInquiryContext } from "@/lib/clara/inquiry-context";

/* ────────────────────────────────────────────────────────────────────────────
   Rolls-Royce-inspired homepage — obsidian, cinematic, single-column.
   Sparse type. Hairline gold. Generous negative space. Slow reveals.
   ──────────────────────────────────────────────────────────────────────── */

// ── Reveal on scroll ──────────────────────────────────────────────────────
function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          obs.unobserve(el);
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : "translateY(32px)",
        transition: `opacity 1.4s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 1.4s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ── Eyebrow ─────────────────────────────────────────────────────────────
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] uppercase tracking-[0.5em] text-gold/85 font-medium">
    {children}
  </span>
);

// ── Hero-Style CTA (glasig, Apfelgrün-Hover) ──────────────────────────────
const GhostCta = ({
  children,
  href,
  to,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  to?: string;
  onClick?: () => void;
}) => {
  const cls =
    "group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 border border-white/30 text-white text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-300 backdrop-blur-sm overflow-hidden";
  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-3">
        <span>{children}</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </span>
      <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-lime-700/80" />
    </>
  );
  if (to) return <Link to={to} onClick={onClick} className={cls}>{inner}</Link>;
  if (href) return <a href={href} onClick={onClick} className={cls}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
};


// ── Editorial Chapter — full-bleed image with overlay text ────────────────
interface ChapterClaraCtx {
  category: "tagung" | "food" | "wellness" | "package" | "event" | "room";
  topic: string;
  label: string; // visible CTA label, e.g. "Clara erklärt die Pauschalen"
  details?: string[];
}

interface ChapterProps {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  slug: string;
  img: string;
  cta: string;
  href?: string;
  onCta?: () => void;
  align?: "left" | "right" | "center";
  clara?: ChapterClaraCtx;
}

const Chapter = ({
  index,
  eyebrow,
  title,
  body,
  slug,
  img,
  cta,
  href,
  onCta,
  align = "left",
  clara,
}: ChapterProps) => {
  const alignCls =
    align === "right"
      ? "items-end text-right"
      : align === "center"
      ? "items-center text-center"
      : "items-start text-left";

  const askClara = clara
    ? () => {
        const ctx = {
          category: clara.category,
          topic: clara.topic,
          source: `landing-chapter-${slug}`,
          section: eyebrow,
          details: clara.details,
          trigger: "chapter-cta",
        };
        writeClaraInquiryContext(ctx);
        // Erst zur relevanten Seite navigieren, danach Clara mit Sprachassistent öffnen.
        if (href) {
          window.history.pushState({}, "", href);
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else if (onCta) {
          onCta();
        }
        // kurzes Delay, damit die Zielseite gemountet ist, bevor Clara öffnet
        setTimeout(() => openClaraBubble(ctx), 220);
      }
    : undefined;

  return (
    <section
      className="relative w-full min-h-[100svh] flex overflow-hidden bg-black"
      data-clara-context={`chapter:${slug}`}
    >
      <div className="absolute inset-0">
        <SiteImage
          slug={slug}
          fallback={img}
          alt={typeof title === "string" ? title : eyebrow}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/30" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-20 pt-32 sm:pb-28 sm:pt-40 flex flex-col justify-end">
        <Reveal>
          <div className={`flex flex-col gap-7 max-w-2xl ${alignCls}`}>
            <div>
              <span className="text-[10px] uppercase tracking-[0.5em] text-gold/85 font-medium">
                {eyebrow}
              </span>
            </div>
            <h2 className="font-serif font-light text-white leading-[1.02] tracking-[-0.015em] text-[clamp(2.5rem,5.5vw,5rem)]">
              {title}
            </h2>
            <p className="text-white/75 font-light leading-[1.7] max-w-xl text-[15px] sm:text-base">
              {body}
            </p>
            <div className={`pt-4 flex flex-wrap gap-3 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}>
              {askClara ? (
                <button
                  type="button"
                  onClick={askClara}
                  data-clara-context={`chapter-clara:${slug}`}
                  data-clara-category={clara!.category}
                  aria-label={`${clara!.label} – öffnet ${cta}`}
                  className="group relative px-5 sm:px-6 py-2 sm:py-2.5 bg-lime-500/55 hover:bg-lime-900/55 text-white text-[10px] uppercase tracking-[0.24em] font-medium overflow-hidden transition-all duration-300 inline-flex items-center gap-2 border border-lime-300/70 hover:border-lime-500/50 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_6px_20px_-8px_rgba(132,204,22,0.45)]"
                >
                  <span className="relative z-10 inline-flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    <span>{clara!.label}</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-b from-lime-900/70 to-black/70" />

                </button>
              ) : (
                <GhostCta href={href} onClick={onCta}>{cta}</GhostCta>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};


// ── Chapter data ──────────────────────────────────────────────────────────
const chapters: ChapterProps[] = [
  {
    index: "01",
    eyebrow: "Tagungspauschalen",
    title: (
      <>
        Alles enthalten.
        <br />
        <span className="italic text-gold/90">Nichts entbehrt.</span>
      </>
    ),
    body: "Transparente Tagungspauschalen für Ingolstadt &amp; Altmühltal — ab 69 € pro Person inkl. Tagungstechnik, Pausen-Catering und Mittagessen. Die Premium-All-Inclusive-Pauschale ab 199 € umfasst Übernachtung im 4★ Superior-Zimmer, Vollverpflegung und 400 m² Spa.",
    slug: "landing-akt-alles-drin",
    img: "/heidehof/orig/zimmer-1.jpg",
    cta: "Pauschalen entdecken",
    href: "/tagungspauschalen",
    clara: {
      category: "package",
      topic: "Tagungspauschalen",
      label: "Clara erklärt die Pauschalen",
      details: ["Tagungspauschale ab 69 €", "Premium All-Inclusive ab 199 €"],
    },
  },
  {
    index: "02",
    eyebrow: "Tagungsräume · Konferenz",
    title: (
      <>
        Acht Bühnen.
        <br />
        <span className="italic text-gold/90">Eine Vision.</span>
      </>
    ),
    body: "Acht modulare Tagungs- und Konferenzräume mit Tageslicht, kalibrierter Akustik und voller Hybrid-Technik — vom 6er-Boardroom bis zur Konferenz mit 150 Teilnehmern. Glasfaser-WLAN, 4K-Beamer, Streaming-Setup und persönliche Tagungsbetreuung sind selbstverständlich.",
    slug: "landing-akt-tagen",
    img: "/heidehof/orig/hero-conference.jpg",
    cta: "Räume betreten",
    href: "/tagungsraeume",
    clara: {
      category: "tagung",
      topic: "Tagungsräume & Kapazitäten",
      label: "Clara empfiehlt den passenden Raum",
      details: ["8 Tagungsräume", "bis 150 Personen", "Hybrid-Technik"],
    },
  },
  {
    index: "03",
    eyebrow: "Restaurant Maxwell · Bar Maex",
    title: (
      <>
        Stille Hand.
        <br />
        <span className="italic text-gold/90">Lautes Aroma.</span>
      </>
    ),
    body: "Restaurant Maxwell und Bar Maex servieren bayerische Klassik in moderner Handschrift: signaturstarke Business-Lunches, Coffeebreaks mit Patisserie aus eigener Konditorei, Galadinner mit Sommelier-Begleitung. Regionale Produzenten, präzise Küche, ehrliche Preise.",
    slug: "landing-akt-geniessen",
    img: "/heidehof/orig/restaurant-1.jpg",
    cta: "Kulinarisches Konzept",
    clara: {
      category: "food",
      topic: "Kulinarisches Konzept",
      label: "Clara erzählt vom Restaurant",
      details: ["Business-Lunch", "Galadinner", "Sommelier-Begleitung"],
    },
  },
  {
    index: "04",
    eyebrow: "Spa &amp; Wellness · 400 m²",
    title: (
      <>
        Atem holen.
        <br />
        <span className="italic text-gold/90">Tiefer als gewohnt.</span>
      </>
    ),
    body: "Direkt vom Workshop in den 400 m² großen Wellnessbereich: Innenpool, finnische Sauna, Bio-Sauna, Aromadampfbad und Ruheräume mit Blick ins Grüne. Im Premium-Tagungspaket und für alle Übernachtungsgäste ohne Aufpreis inklusive.",
    slug: "landing-akt-loslassen",
    img: "/heidehof/orig/spa-pool.jpg",
    cta: "Spa erleben",
    href: "/wellness",
    align: "right",
    clara: {
      category: "wellness",
      topic: "Spa & Wellness",
      label: "Clara führt durch den Spa",
      details: ["400 m²", "Pool · Sauna · Aromadampfbad"],
    },
  },
  {
    index: "05",
    eyebrow: "Outdoor · Teamevents · Beauty",
    title: (
      <>
        Draußen denken.
        <br />
        <span className="italic text-gold/90">Drinnen ankommen.</span>
      </>
    ),
    body: "Zwei Business-Terrassen, geführte Teamevents im Naturpark Altmühltal, E-Bike-Touren und Beauty-Treatments unserer hauseigenen Kosmetik runden jede Tagung ab. Workation, Incentive, Firmenausflug — wir orchestrieren den ganzen Tag.",
    slug: "landing-akt-durchatmen",
    img: "/heidehof/outdoor.jpg",
    cta: "Outdoor & Beauty",
    href: "/outdoor-aktiv",
    clara: {
      category: "event",
      topic: "Outdoor & Teamevents",
      label: "Clara plant Ihr Teamevent",
      details: ["Businessterrassen", "Teamevents Altmühltal"],
    },
  },
  {
    index: "06",
    eyebrow: "Zimmer &amp; Suiten",
    title: (
      <>
        Hundertfünfzehn Zimmer.
        <br />
        <span className="italic text-gold/90">Ein Versprechen.</span>
      </>
    ),
    body: "115 ruhige, klimatisierte Zimmer und Suiten im 4★ Superior-Standard — Boxspringbett, freies WLAN, Spa-Zugang inklusive. Frühstücksbuffet Mo–Sa ab 06:00 Uhr, persönlicher Check-in 24/7, kostenfreie Tiefgarage und Ladesäulen für E-Autos.",
    slug: "landing-akt-ankommen",
    img: "/heidehof/orig/hotel-impression.jpg",
    cta: "Zimmer anfragen",
    clara: {
      category: "room",
      topic: "Zimmer & Suiten",
      label: "Clara reserviert Ihr Zimmer",
      details: ["115 Zimmer & Suiten", "Spa-Zugang", "Frühstück ab 06:00"],
    },
  },
];


const Landing = () => {
  useScrollReveal();

  const siteImages = useSiteImages();
  const HERO_SLIDES = HERO_FALLBACK.map((s) => ({
    src: siteImages[s.slug]?.url || s.src,
    alt: siteImages[s.slug]?.alt || s.alt,
  }));
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeroSlide((i) => (i + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [HERO_SLIDES.length]);


  const inquireTagung = () => {
    const ctx = {
      category: "tagung" as const,
      topic: "Tagungsanfrage",
      source: "/",
      trigger: "hero-cta",
    };
    writeClaraInquiryContext(ctx);
    openClaraBubble(ctx);
  };

  return (
    <div className="landing-page min-h-screen bg-background text-foreground overflow-x-hidden">
      <PageSeo
        title="Hotel Der Heidehof · Conference & SPA Resort Ingolstadt · 4★ Superior"
        description="Tagungshotel Ingolstadt: 8 Tagungsräume bis 150 Personen, Hybrid-Technik, 400 m² Spa, Fine Dining. Pauschalen ab 69 €, Premium All-Inclusive ab 199 €."
        keywords={[
          "Tagungshotel Ingolstadt",
          "Tagungsräume Ingolstadt",
          "Konferenzhotel Bayern",
          "Hotel Der Heidehof",
          "Conference Resort Ingolstadt",
          "Spa Tagungshotel",
        ]}
        jsonLd={[
          hotelSchema(),
          organizationSchema(),
          websiteSchema(),
          offerSchema(),
          faqSchema([
            {
              q: "Wo finde ich Tagungsräume in Ingolstadt?",
              a: "Im 4★ Superior Hotel Der Heidehof, vor den Toren Ingolstadts in Gaimersheim. 8 Tagungsräume, flexibel kombinierbar bis 150 Personen.",
            },
            {
              q: "Was kostet eine Tagung im Hotel Der Heidehof?",
              a: "Die Tagungspauschale startet bei 69 € pro Person. Premium All-Inclusive mit Übernachtung, Vollverpflegung und Spa ab 199 €.",
            },
          ]),
        ]}
      />

      <ScrollProgress />
      <SiteHeader />

      {/* ══════════════════ HERO — Cinematic w/ rotating hook ══════════════════ */}
      <HeroCinematic onInquire={inquireTagung} />


      {/* ══════════════════ MANIFESTO STRIP — mit Admin-Hintergrundbild ══════════════════ */}
      <section className="relative bg-zinc-950 py-20 md:py-28 border-y border-white/5 overflow-hidden">
        {/* Optional Hintergrundbild (im Admin via Slug "landing-manifest-bg" hochladbar) */}
        <div className="absolute inset-0 z-0">
          <SiteImage
            slug="landing-manifest-bg"
            fallback=""
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-zinc-950" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 text-center">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.5em] text-gold/85 font-medium">
              Manifest
            </span>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-8 font-light text-white/90 leading-[1.25] tracking-[-0.012em] text-[clamp(1.6rem,3vw,2.8rem)]"
               style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              „Wir bauen keine Tagungen.
              <br />
              Wir komponieren <span className="italic text-gold">Tage</span>,
              an die sich Ihre Gäste <span className="italic text-gold">erinnern</span>."
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-10 flex items-center justify-center">
              <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-medium">
                Hotel Der Heidehof · seit 1985
              </span>
            </div>
          </Reveal>
        </div>
      </section>





      {/* ══════════════════ CHAPTERS ══════════════════ */}
      {chapters.map((c) => (
        <Chapter
          key={c.slug}
          {...c}
          onCta={
            c.href
              ? undefined
              : () => {
                  const ctx = {
                    category: c.clara?.category ?? ("tagung" as const),
                    topic: c.eyebrow,
                    source: `landing-chapter-${c.slug}`,
                    details: [c.eyebrow],
                  };
                  writeClaraInquiryContext(ctx);
                  openClaraBubble(ctx);
                }
          }
        />
      ))}

      {/* ══════════════════ PARTNER & MARKEN ══════════════════ */}
      <PartnerLogosMarquee />

      {/* ══════════════════ CLOSING — Anfrage Bridge (directly above footer) ══════════════════ */}
      <section className="relative overflow-hidden py-32 md:py-48 border-t border-foreground/8">

        <div className="absolute inset-0 -z-10">
          <SiteMedia
            slug="landing-cta-anfrage-bg"
            alt="Anfrage – Hintergrund"
            className="absolute inset-0 h-full w-full object-cover"
            videoClassName="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/75 to-background/95" />
        </div>
        <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16 text-center">

          <Reveal>
            <Eyebrow>
              <span>Anfrage</span>
            </Eyebrow>
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-10 font-serif font-light text-foreground leading-[1.05] tracking-[-0.015em] text-[clamp(2.4rem,5vw,4.5rem)]">
              Bereit, Ihre nächste Tagung
              <br />
              <span className="italic text-gold/90">neu zu komponieren?</span>
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-8 text-foreground/70 font-light leading-[1.8] max-w-xl mx-auto">
              Unsere KI-Beraterin Clara erstellt Ihr individuelles Tagungsangebot in unter drei Minuten —
              inklusive Raumvorschlag, Pauschale, Menüführung und Verfügbarkeit. Lieber persönlich?
              Unsere Veranstaltungsleitung ist Mo–Sa von 08:00 bis 20:00 Uhr erreichbar.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={inquireTagung}
                data-clara-context="closing-cta:make-enquiry"
                data-clara-category="tagung"
                className="group relative px-6 py-3 bg-lime-500/55 hover:bg-lime-500/75 text-white text-[10px] uppercase tracking-[0.28em] font-medium overflow-hidden transition-all duration-300 inline-flex items-center gap-2.5 border border-lime-300/60 hover:border-lime-200/80 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_30px_-10px_rgba(132,204,22,0.55)]"
              >
                <span className="relative z-10 inline-flex items-center gap-2.5">
                  <Sparkles className="w-3 h-3" strokeWidth={1.6} />
                  Mit Clara anfragen
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" strokeWidth={1.6} />
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-b from-lime-700/70 to-black/70" />
              </button>

              <Link
                to="/tagungsraeume"
                className="px-6 py-3 border border-foreground/30 text-foreground text-[10px] uppercase tracking-[0.28em] hover:bg-foreground/[0.07] hover:border-foreground/60 transition-all duration-300 inline-flex items-center gap-2.5 backdrop-blur-sm"
              >
                <CalendarCheck className="w-3 h-3" strokeWidth={1.6} />
                Verfügbarkeit prüfen
              </Link>

              <Link
                to="/menue-bestellung"
                className="px-6 py-3 border border-foreground/30 text-foreground text-[10px] uppercase tracking-[0.28em] hover:bg-foreground/[0.07] hover:border-foreground/60 transition-all duration-300 inline-flex items-center gap-2.5 backdrop-blur-sm"
              >
                <Utensils className="w-3 h-3" strokeWidth={1.6} />
                Tagungsgast Menü
              </Link>

            </div>
            <a
              href="tel:+4984586400"
              className="mt-8 inline-flex items-center gap-3 text-foreground/55 hover:text-gold uppercase tracking-[0.3em] text-[10px] font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              +49 8458 64-0
            </a>
          </Reveal>
        </div>
      </section>

      <PageNavigator />

      <SiteFooter />


    </div>
  );
};

export default Landing;
