import { Link } from "react-router-dom";
import { MapPin, Lock, ChevronDown, Phone, Mail, Clock } from "lucide-react";
import { SiteMedia } from "@/components/site/SiteMedia";

// Editorial Footer 2.0 — Brand · Reservierung (Tel groß) · Erleben · Rechtliches
// Keine Trust-Badges, keine generischen Claims. Reservierungs-Telefon prominent.

const ERLEBEN_LINKS = [
  { to: "/tagungsraeume", label: "Tagungsräume" },
  { to: "/tagungspauschalen", label: "Pauschalen" },
  { to: "/wellness", label: "Wellness & Spa" },
  { to: "/restaurant", label: "Restaurant" },
  { to: "/speisekarte", label: "Kulinarik" },
];

const HOTEL_LINKS = [
  { to: "/veranstaltungen", label: "Veranstaltungen" },
  { to: "/outdoor-aktiv", label: "Outdoor & Aktiv" },
  { to: "/ausstattung-technik", label: "Ausstattung & Technik" },
  { to: "/getraenkekarte", label: "Getränkekarte" },
];

const LEGAL_LINKS = [
  { to: "/impressum", label: "Impressum" },
  { to: "/datenschutz", label: "Datenschutz" },
  { to: "/agb", label: "AGB" },
];

const serifDisplay = "font-serif font-light tracking-[-0.01em]";
const eyebrow =
  "uppercase tracking-[0.42em] text-[10px] font-semibold text-gold";
// Lesbarkeit: helleres Weiß, mehr Zeilenhöhe, Drop-Shadow gegen Bildhintergrund
const bodyText = "text-[14px] leading-[1.75] text-foreground/95 font-normal [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]";
const linkBase =
  "text-[13px] tracking-[0.01em] text-foreground/90 hover:text-gold transition-colors duration-300 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]";

export const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative bg-background overflow-hidden"
      aria-label="Seiten-Footer"
    >
      {/* Hintergrund – starker Dunkel-Overlay sichert Lesbarkeit auf jedem Bild */}
      <div className="absolute inset-0 -z-10">
        <SiteMedia
          slug="footer-bg"
          alt=""
          className="w-full h-full object-cover"
          videoClassName="w-full h-full object-cover"
        />
        {/* Mehrschichtiger Overlay: dunkel + Vignette + Noise-Feel */}
        <div className="absolute inset-0 bg-background/96" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/94 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background)/0.6)_100%)]" />
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* ── Mobile ── */}
      <div className="md:hidden px-6 pt-14 pb-8 space-y-10">
        <div className="text-center space-y-5">
          <img
            src="/heidehof/logo-white.svg"
            alt="Hotel Der Heidehof"
            className="h-14 w-auto mx-auto"
            loading="lazy"
          />
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gold/40" />
            <span className={eyebrow}>Ingolstadt · seit 1985</span>
            <span className="h-px w-8 bg-gold/40" />
          </div>
          <p className={`${serifDisplay} italic text-foreground/85 text-2xl`}>
            „Tagen wie im Urlaub."
          </p>
        </div>

        {/* Reservierung Card — Telefon-first */}
        <div className="rounded-sm border border-gold/20 bg-background/50 backdrop-blur-xl p-6 space-y-5">
          <h4 className={eyebrow}>Reservierung</h4>
          <a
            href="tel:+4984586400"
            className={`${serifDisplay} block text-3xl text-foreground hover:text-gold transition-colors tracking-tight`}
            aria-label="Hotel Der Heidehof anrufen"
          >
            +49 8458 64-0
          </a>
          <a
            href="mailto:reservierung@der-heidehof.de"
            className="flex items-center gap-3 text-sm text-foreground/75 hover:text-gold transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-gold/70 shrink-0" />
            reservierung@der-heidehof.de
          </a>
          <div className="flex items-start gap-3 pt-2 border-t border-gold/10">
            <MapPin className="w-3.5 h-3.5 mt-1 text-gold/70 shrink-0" />
            <span className={bodyText}>
              Ingolstädter Str. 121
              <br />
              85080 Gaimersheim
            </span>
          </div>
          <div className="flex items-start gap-3 pt-2 border-t border-gold/10">
            <Clock className="w-3.5 h-3.5 mt-1 text-gold/70 shrink-0" />
            <p className="text-[11px] leading-[1.7] text-foreground/55">
              Mo–Fr 08:00 – 20:00
              <br />
              Sa–So 09:00 – 18:00
            </p>
          </div>
        </div>

        <FooterAccordion title="Erleben" links={ERLEBEN_LINKS} />
        <FooterAccordion title="Hotel" links={HOTEL_LINKS} />
        <FooterAccordion title="Rechtliches" links={LEGAL_LINKS} />

        <div className="pt-2 text-center">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold/25 text-gold/80 hover:bg-gold hover:text-background transition-colors text-[10px] uppercase tracking-[0.32em] font-medium"
          >
            <Lock className="w-3 h-3" /> Admin
          </Link>
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="hidden md:block max-w-7xl mx-auto px-8 pt-24 pb-12">
        {/* Editorial headline row */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="h-px w-12 bg-gold/40" />
            <span className={eyebrow}>Hotel Der Heidehof · seit 1985</span>
            <span className="h-px w-12 bg-gold/40" />
          </div>
          <h2
            className={`${serifDisplay} text-5xl lg:text-[64px] text-foreground leading-[1.05] max-w-3xl mx-auto`}
          >
            Tagen, wo andere{" "}
            <span className="italic text-foreground/65">Urlaub</span> machen.
          </h2>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent mb-16" />

        {/* 4 Spalten: Brand · Reservierung · Erleben · Hotel + Recht */}
        <div className="grid grid-cols-12 gap-12">
          {/* Brand */}
          <div className="col-span-3 space-y-6">
            <img
              src="/heidehof/logo-white.svg"
              alt="Hotel Der Heidehof"
              className="h-14 w-auto object-contain"
              loading="lazy"
            />
            <p className={`${serifDisplay} italic text-foreground/80 text-xl leading-snug`}>
              „Tagen wie im Urlaub."
            </p>
            <p className={bodyText}>
              4★ Superior Conference &amp; SPA Resort vor den Toren Ingolstadts.
              Zwischen Auwald und Audi.
            </p>
          </div>

          {/* Reservierung — Telefon groß, prominent */}
          <address
            className="col-span-4 space-y-5 not-italic"
            itemScope
            itemType="https://schema.org/Hotel"
          >
            <h4 className={eyebrow}>Reservierung</h4>
            <meta itemProp="name" content="Hotel Der Heidehof" />
            <a
              href="tel:+4984586400"
              itemProp="telephone"
              className={`${serifDisplay} block text-4xl xl:text-5xl text-foreground hover:text-gold transition-colors tracking-tight leading-none`}
              aria-label="Hotel Der Heidehof anrufen"
            >
              +49 8458 64-0
            </a>
            <a
              href="mailto:reservierung@der-heidehof.de"
              itemProp="email"
              className="flex items-center gap-3 text-sm text-foreground/75 hover:text-gold transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-gold/70 shrink-0" />
              reservierung@der-heidehof.de
            </a>
            <div
              className={`flex items-start gap-3 ${bodyText} pt-2`}
              itemProp="address"
              itemScope
              itemType="https://schema.org/PostalAddress"
            >
              <MapPin className="w-3.5 h-3.5 mt-1 text-gold/70 shrink-0" aria-hidden />
              <span>
                <span itemProp="streetAddress">Ingolstädter Str. 121</span>
                <br />
                <span itemProp="postalCode">85080</span>{" "}
                <span itemProp="addressLocality">Gaimersheim / Ingolstadt</span>
              </span>
            </div>
            <div className="flex items-start gap-3 pt-1">
              <Clock className="w-3.5 h-3.5 mt-1 text-gold/80 shrink-0" />
              <p className="text-[12px] leading-[1.8] text-foreground/80 font-normal [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                <span className="text-foreground/95">Reservierung</span>
                <br />
                Mo–Fr 08:00 – 20:00 · Sa–So 09:00 – 18:00
              </p>
            </div>
          </address>

          {/* Erleben */}
          <nav className="col-span-2 space-y-4" aria-label="Erleben">
            <h4 className={`${eyebrow} mb-5`}>Erleben</h4>
            {ERLEBEN_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={`block ${linkBase}`}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Hotel + Rechtliches */}
          <div className="col-span-3 space-y-7">
            <nav aria-label="Hotel">
              <h4 className={`${eyebrow} mb-5`}>Hotel</h4>
              <div className="space-y-3">
                {HOTEL_LINKS.map((l) => (
                  <Link key={l.to} to={l.to} className={`block ${linkBase}`}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </nav>
            <nav aria-label="Rechtliches" className="pt-6 border-t border-gold/12">
              <h4 className={`${eyebrow} mb-4`}>Rechtliches</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {LEGAL_LINKS.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`${linkBase} text-[12px]`}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-[12px] text-foreground/40 hover:text-gold transition-colors"
                >
                  <Lock className="w-3 h-3" /> Admin
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold/20 py-6 md:py-7 px-5 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.4em] text-foreground/70 font-medium">
            © {year} Hotel Der Heidehof
          </p>
          <p className={`${serifDisplay} italic text-[13px] text-foreground/75`}>
            Gaimersheim · Bayern · Deutschland
          </p>
          <p className="text-[10px] uppercase tracking-[0.4em] text-foreground/70 font-medium">
            4★ Superior · DSGVO-konform
          </p>
        </div>
      </div>
    </footer>
  );
};

interface FooterAccordionProps {
  title: string;
  links: { to: string; label: string }[];
}

function FooterAccordion({ title, links }: FooterAccordionProps) {
  return (
    <details className="group rounded-sm border border-gold/15 bg-background/40 backdrop-blur-xl overflow-hidden">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className={eyebrow}>{title}</span>
        <ChevronDown className="w-4 h-4 text-gold/70 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 pt-1 space-y-3">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={`block ${linkBase}`}>
            {l.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
