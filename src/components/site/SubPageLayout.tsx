import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ArrowLeft, Sparkles, ChevronDown, Utensils, CalendarDays, Wine } from "lucide-react";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteMedia } from "@/components/site/SiteMedia";
import { SiteImage } from "@/components/site/SiteImage";
import { Breadcrumb, type Crumb } from "@/components/site/Breadcrumb";
import { PageNavigator } from "@/components/site/PageNavigator";
import { PageSeo } from "@/components/seo/PageSeo";
import { breadcrumbSchema } from "@/lib/seo/schemas";

interface SubPageLayoutProps {
  title: string;
  titleAccent?: string;
  seoTitle?: string;
  metaDescription: string;
  eyebrow: string;
  heroImage: string;
  heroSlug?: string;
  intro?: string;
  breadcrumbs?: Crumb[];
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  keywords?: string[];
  ctaImageSlug?: string;
  ghostCta?: { label: string; target: string };
  heroSpecs?: Array<{ label: string; value: string }>;
  children: React.ReactNode;
}

/* ─────────────────────────────────────────────────────────────────────────
   SubPageLayout – mirrors Landing's editorial minimal vocabulary:
   serif headline with lime italic accent, glasige bordered CTAs,
   lime-700 slide-over on the primary button, no gold accents.
   One source of truth for every subpage hero + closing CTA band.
   ───────────────────────────────────────────────────────────────────── */

export const SubPageLayout = ({
  title,
  titleAccent,
  seoTitle,
  metaDescription,
  eyebrow,
  heroImage,
  heroSlug,
  intro,
  breadcrumbs,
  jsonLd,
  keywords,
  ctaImageSlug = "cta-clara-subpage-bg",
  ghostCta,
  heroSpecs,
  children,
}: SubPageLayoutProps) => {

  useScrollReveal();

  const location = useLocation();
  const path = location.pathname;
  const claraCategory = path.startsWith("/speisekarte")
    ? "food"
    : path.startsWith("/getraenkekarte")
    ? "drink"
    : path.startsWith("/wellness") || path.startsWith("/spa")
    ? "wellness"
    : path.startsWith("/veranstaltungen") || path.startsWith("/outdoor")
    ? "event"
    : "tagung";
  // Context-aware secondary CTA — only where it makes sense.
  const secondaryCta: { to: string; label: string; icon: typeof Utensils } | null = path.startsWith("/tagung")
    ? { to: "/menue-bestellung", label: "Tagungsgast Menü", icon: Utensils }
    : path.startsWith("/speisekarte")
    ? { to: "/getraenkekarte", label: "Getränkekarte", icon: Wine }
    : path.startsWith("/getraenkekarte")
    ? { to: "/speisekarte", label: "Speisekarte", icon: Utensils }
    : path.startsWith("/wellness") || path.startsWith("/spa")
    ? { to: "/ein-tag-bei-uns", label: "Ein Tag bei uns", icon: CalendarDays }
    : null;

  const crumbLd =
    breadcrumbs && breadcrumbs.length > 0
      ? breadcrumbSchema([{ name: "Start", path: "/" }, ...breadcrumbs])
      : null;
  const ldList = [crumbLd, ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])].filter(
    Boolean,
  ) as Record<string, unknown>[];

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground relative">
      <PageSeo
        title={seoTitle || title}
        description={metaDescription}
        keywords={keywords}
        image={heroImage.startsWith("http") ? heroImage : `https://hotel-der-heidehof.de${heroImage}`}
        jsonLd={ldList}
      />

      <SiteHeader />

      {/* ── Editorial Minimal Hero – mirrors Landing.tsx ── */}
      <section className="relative min-h-[88svh] sm:min-h-[92svh] md:h-[100svh] md:min-h-[680px] flex items-end overflow-hidden w-full">
        <SiteMedia
          slug={heroSlug || `hero-${eyebrow.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          fallback={heroImage}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover ken-burns"
          videoClassName="absolute inset-0 w-full h-full object-cover"
        />
        {/* Editorial scrims – same recipe as Landing hero */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 cine-grain opacity-30" />

        <div className="relative z-10 container mx-auto px-6 sm:px-8 md:px-16 lg:px-24 pt-28 sm:pt-32 pb-28 sm:pb-20 md:pb-28">
          <div className="max-w-4xl">

            {/* Eyebrow – letterspaced left-rule, identical to Landing */}
            <div className="reveal-up mb-7">
              <span className="text-[10px] tracking-[0.4em] uppercase text-white/80 border-l border-white/40 pl-4">
                {eyebrow}
              </span>
            </div>

            {/* Headline – Cormorant, italic lime accent */}
            <div className="reveal-up" style={{ animationDelay: "120ms" }}>
              <h1
                className="text-white text-fluid-display leading-[0.96] mb-8 font-light tracking-tight text-balance"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {titleAccent ? (
                  <>
                    <span className="block">{title}</span>
                    <span className="block italic text-lime-400/90">{titleAccent}</span>
                  </>
                ) : (
                  (() => {
                    const words = title.split(" ");
                    return words.map((w, i) => (
                      <span
                        key={i}
                        className={i === words.length - 1 && words.length > 1 ? "italic text-lime-400/90" : ""}
                      >
                        {w}
                        {i < words.length - 1 ? " " : ""}
                      </span>
                    ));
                  })()
                )}
              </h1>
            </div>

            {heroSpecs && heroSpecs.length > 0 && (
              <div
                className="reveal-up flex items-center gap-6 mb-8 text-zinc-300 flex-wrap"
                style={{ animationDelay: "180ms" }}
              >
                {heroSpecs.map((spec, i) => (
                  <span key={i} className="inline-flex items-baseline gap-3">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                      {spec.label}
                    </span>
                    <span className="text-xs tracking-[0.15em] font-light italic text-zinc-300">
                      {spec.value}
                    </span>
                    {i < heroSpecs.length - 1 && <span className="h-px w-8 bg-white/15 ml-3" />}
                  </span>
                ))}
              </div>
            )}

            {intro && (
              <div className="reveal-up" style={{ animationDelay: "240ms" }}>
                <p className="text-zinc-300/90 max-w-2xl mb-12 text-fluid-body leading-relaxed font-light text-pretty">
                  {intro}
                </p>
              </div>
            )}

            {/* CTAs – editorial: bg-white primary with lime-700 slide-over + bordered glass secondary */}
            <div
              className="reveal-up flex flex-wrap items-center gap-5 sm:gap-8"
              style={{ animationDelay: "360ms" }}
            >
              <button
                type="button"
                onClick={() =>
                  openClaraBubble({
                    category: claraCategory,
                    topic: title,
                    section: eyebrow,
                    source: typeof window !== "undefined" ? window.location.pathname : undefined,
                    trigger: "hero-cta",
                  })
                }
                data-clara-context="hero-cta:make-enquiry"
                data-clara-category={claraCategory}
                className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-lime-500/55 hover:bg-lime-900/55 text-white text-[11px] uppercase tracking-[0.3em] font-medium overflow-hidden transition-all duration-300 inline-flex items-center gap-3 border border-lime-300/70 hover:border-lime-500/50 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_-10px_rgba(132,204,22,0.55)]"
              >
                <span className="relative z-10 inline-flex items-center gap-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  Mit Clara anfragen
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-b from-lime-900/70 to-black/70" />

              </button>

              {secondaryCta && (
                <Link
                  to={secondaryCta.to}
                  className="px-8 sm:px-10 py-4 sm:py-5 border border-white/30 text-white text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-300 inline-flex items-center gap-3 backdrop-blur-sm"
                >
                  <secondaryCta.icon className="w-3.5 h-3.5" />
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          </div>

          {/* Ghost CTA or default scroll indicator */}
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
            {ghostCta ? (
              <a
                href={`#${ghostCta.target}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(ghostCta.target)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group flex flex-col items-center gap-1 text-white/60 hover:text-lime-400/90 transition-colors"
              >
                <span className="text-[10px] uppercase tracking-[0.35em]">{ghostCta.label}</span>
                <ChevronDown className="w-4 h-4 animate-bounce" />
              </a>
            ) : (
              <>
                <span className="text-[10px] uppercase tracking-[0.35em] text-white/50 hidden sm:inline">Scrollen</span>
                <ChevronDown className="w-4 h-4 animate-bounce text-white/50" />
              </>
            )}
          </div>
        </div>
      </section>

      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}

      <main className="relative max-w-6xl mx-auto px-6 pb-24 md:pb-32">
        {children}
      </main>

      {/* ── Closing CTA band – Editorial Minimal, lime accent ── */}
      <section className="relative overflow-hidden bg-zinc-950 border-t border-white/5">
        <SiteImage
          slug={ctaImageSlug}
          fallback=""
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/85 to-zinc-950" />

        <div className="relative max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-lime-500/80 mb-6">Nächster Schritt</p>
          <h2
            className="text-white text-3xl md:text-5xl leading-[1.05] font-light tracking-tight mb-6"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Sprechen Sie mit{" "}
            <span className="italic text-lime-400/90">Clara</span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-10 text-base md:text-lg leading-relaxed font-light">
            Stellen Sie Ihre Anfrage direkt – Clara antwortet sofort, unser Team meldet sich innerhalb eines Werktags.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
            <button
              type="button"
              onClick={() =>
                openClaraBubble({
                  category: claraCategory,
                  topic: title,
                  section: eyebrow,
                  source: typeof window !== "undefined" ? window.location.pathname : undefined,
                  trigger: "cta-band",
                })
              }
              className="group relative px-8 sm:px-10 py-4 sm:py-5 bg-lime-500/55 hover:bg-lime-900/55 text-white text-[11px] uppercase tracking-[0.3em] font-medium overflow-hidden transition-all duration-300 inline-flex items-center gap-3 border border-lime-300/70 hover:border-lime-500/50 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_-10px_rgba(132,204,22,0.55)]"
            >
              <span className="relative z-10 inline-flex items-center gap-3">
                <Sparkles className="w-3.5 h-3.5" />
                Mit Clara anfragen
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
              <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-b from-lime-900/70 to-black/70" />

            </button>
            <Link
              to="/"
              className="px-8 sm:px-10 py-4 sm:py-5 border border-white/30 text-white text-[11px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-300 inline-flex items-center gap-3 backdrop-blur-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Zur Startseite
            </Link>
          </div>
        </div>
      </section>

      <PageNavigator />

      <SiteFooter />
    </div>
  );
};
