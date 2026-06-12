import { SubPageLayout } from "@/components/site/SubPageLayout";
import { SiteImage } from "@/components/site/SiteImage";
import { Button } from "@/components/ui/button";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { Clock, Phone, Sparkles, UtensilsCrossed, Wine, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { restaurantSchema, faqSchema } from "@/lib/seo/schemas";

/**
 * Restaurant — drei Gastro-Welten des Heidehof Hotels Ingolstadt:
 * Restaurant Maxwell · Fine-Dining-Lounge · Hotelbar Mäx.
 * Cinematic full-bleed Kapitel mit Glas-Overlay (analog Tagungsräume).
 */


interface OutletData {
  slug: string;
  eyebrow: string;
  title: string;
  tagline: string;
  hours: { label: string; value: string }[];
  cuisine: string[];
  features: string[];
  externalGuests?: string;
  price?: string;
  reverse?: boolean;
  icon: LucideIcon;
  ctaTopic: string;
}

const OUTLETS: OutletData[] = [
  {
    slug: "restaurant-maxwell",
    eyebrow: "Hauptrestaurant",
    title: "Restaurant Maxwell",
    tagline: "International · Mediterran · Regional",
    hours: [
      { label: "Frühstück Mo–Sa", value: "06:00 – 10:00" },
      { label: "Frühstück So & Feiertage", value: "06:00 – 11:00" },
      { label: "Dinner Mo–Sa", value: "18:00 – 22:00 (Küche bis 21:00)" },
      { label: "Sonntag", value: "Abends geschlossen" },
    ],
    cuisine: ["Internationale Küche", "Mediterran", "Regional"],
    features: ["Frontcooking", "Saisonale Menüs", "Vegane & vegetarische Optionen"],
    externalGuests: "Externe Gäste willkommen · 22 € pro Person · Reservierung empfohlen",
    icon: UtensilsCrossed,
    ctaTopic: "Reservierung Restaurant Maxwell",
  },
  {
    slug: "restaurant-fine-dining",
    eyebrow: "Fine Dining",
    title: "Fine-Dining-Lounge",
    tagline: "Hochwertige Küche aus regionalen Zutaten",
    hours: [
      { label: "Dinner Mo–Sa", value: "18:00 – 22:00 (Küche bis 21:00)" },
    ],
    cuisine: ["Fine Dining", "Regionale Produkte"],
    features: ["Intime Atmosphäre", "Reservierung empfohlen", "Auch für externe Gäste"],
    externalGuests: "Externe Gäste willkommen · Reservierung erforderlich",
    reverse: true,
    icon: Sparkles,
    ctaTopic: "Reservierung Fine-Dining-Lounge",
  },
  {
    slug: "restaurant-bar-maex",
    eyebrow: "Hotelbar",
    title: "Hotelbar Mäx",
    tagline: "Signature Cocktails, regionale Destillate & Herrnbräu",
    hours: [
      { label: "Täglich geöffnet", value: "17:00 – 00:00 Uhr" },
      { label: "Sonntag warme Speisen", value: "18:00 – 21:30 Uhr" },
    ],
    cuisine: ["Cocktails", "Spirituosen", "Weine", "Biere", "Softdrinks", "Kaffeespezialitäten"],
    features: ["Signature Cocktails", "Regionale Destillate", "Herrnbräu Ingolstadt"],
    reverse: true,
    icon: Wine,
    ctaTopic: "Tisch in der Bar Mäx",
  },
];

function CinematicOutletChapter({ outlet, index }: { outlet: OutletData; index: number }) {
  const Icon = outlet.icon;
  const isReversed = outlet.reverse ?? index % 2 === 1;
  return (
    <article
      id={outlet.slug}
      className="relative isolate min-h-[100svh] overflow-hidden flex items-center w-screen left-1/2 -translate-x-1/2"
    >
      {/* Full-bleed Hintergrundbild */}
      <div className="absolute inset-0 -z-10">
        <SiteImage
          slug={outlet.slug}
          alt={outlet.title}
          className="absolute inset-0 w-full h-full object-cover scale-[1.02] transition-transform [transition-duration:2400ms] ease-out hover:scale-[1.06]"
          loading="lazy"
        />
        {/* Cinematischer Richtungs-Gradient */}
        <div
          className={`absolute inset-0 ${
            isReversed
              ? "bg-gradient-to-l from-black/85 via-black/40 to-black/5"
              : "bg-gradient-to-r from-black/85 via-black/40 to-black/5"
          }`}
        />
        {/* Warme Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_120%,hsl(45_55%_55%/0.18),transparent_55%)]" />
      </div>

      {/* Eyebrow oben in der Ecke */}
      <div className="absolute top-10 md:top-14 left-6 md:left-12 z-10 flex items-center gap-3">
        <Icon className="h-4 w-4 text-gold/90" strokeWidth={1.5} />
        <span className="text-[10px] uppercase tracking-[0.5em] text-gold/90 font-medium">
          {outlet.eyebrow}
        </span>
      </div>

      {/* Glass-Panel */}
      <div className="w-full px-6 md:px-12 lg:px-20 py-24 md:py-28">
        <div className={`max-w-2xl relative ${isReversed ? "ml-auto" : ""}`}>
          <div
            className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] p-8 md:p-12"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%)",
            }}
          >
            <div className="pointer-events-none absolute inset-px rounded-[15px] ring-1 ring-inset ring-white/5" />

            <h2 className="font-serif text-5xl md:text-6xl xl:text-7xl text-white mb-4 leading-[0.95] tracking-tight">
              {outlet.title}
            </h2>
            <p className="text-white/80 text-base md:text-lg font-light mb-8 max-w-[46ch]">
              {outlet.tagline}
            </p>

            {/* Öffnungszeiten */}
            <div className="border-t border-white/10 pt-6 space-y-3 mb-8">
              {outlet.hours.map((h) => (
                <div key={h.label} className="flex items-start gap-3 text-sm md:text-base">
                  <Clock className="h-4 w-4 text-gold/90 mt-1 shrink-0" strokeWidth={1.5} />
                  <div className="flex-1">
                    <span className="text-white/60">{h.label}</span>
                    <span className="block text-white font-medium">{h.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Küche & Besonderes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-sm border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-gold/90 mb-3">Küche</p>
                <ul className="space-y-1.5 text-white/90 font-light">
                  {outlet.cuisine.map((c) => <li key={c}>· {c}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-gold/90 mb-3">Besonderes</p>
                <ul className="space-y-1.5 text-white/90 font-light">
                  {outlet.features.map((f) => <li key={f}>· {f}</li>)}
                </ul>
              </div>
            </div>

            {outlet.price && (
              <p className="text-gold font-serif text-2xl mb-4">{outlet.price}</p>
            )}
            {outlet.externalGuests && (
              <p className="flex items-start gap-2 text-xs text-white/70 mb-8">
                <Users className="h-3.5 w-3.5 text-gold/90 mt-0.5 shrink-0" />
                <span>{outlet.externalGuests}</span>
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" variant="outline" className="flex-1 border-white/20 bg-white/[0.04] hover:bg-white/10 text-white">
                <a href="tel:+4984586400"><Phone className="h-4 w-4 mr-2" /> +49 8458 64-0</a>
              </Button>
              <AskClaraButton
                context={{ topic: outlet.ctaTopic, category: "food", source: "/restaurant" }}
                variant="block"
                label="Mit Clara reservieren"
                className="flex-1 h-12 px-8 whitespace-nowrap"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Restaurant() {
  return (
    <SubPageLayout
      title="Restaurant Ingolstadt."
      titleAccent="Drei Welten. Ein Haus."
      eyebrow="Kulinarik · Maxwell · Fine Dining · Bar Mäx"
      seoTitle="Restaurant Ingolstadt – Maxwell, Fine-Dining-Lounge & Bar Mäx | Hotel Der Heidehof"
      metaDescription="Restaurant in Ingolstadt: Restaurant Maxwell für saisonale Küche, Fine-Dining-Lounge für Genießer und Hotelbar Mäx für den Abend. Drei kulinarische Welten im 4★ Superior Hotel Der Heidehof — Tisch online reservieren."
      heroImage="/heidehof/orig/restaurant-1.jpg"
      heroSlug="restaurant-hero"
      intro="Restaurant Maxwell, Fine-Dining-Lounge und Bar Mäx — saisonale Küche aus dem Altmühltal, ergänzt um internationale Klassiker. Tagesgäste willkommen."
      breadcrumbs={[{ name: "Restaurant", path: "/restaurant" }]}
      keywords={["Restaurant Ingolstadt", "Fine Dining Ingolstadt", "Hotelrestaurant Ingolstadt", "Bar Ingolstadt"]}
      jsonLd={[
        restaurantSchema(),
        faqSchema([
          { q: "Kann man im Hotel Der Heidehof Tisch reservieren?", a: "Ja, eine Tischreservierung ist telefonisch unter +49-8458-640 oder über Clara möglich." },
          { q: "Was ist Le Petit Chef?", a: "Le Petit Chef ist ein preisgekröntes 3D-Projektions-Dinner-Erlebnis im Hotel Der Heidehof." },
          { q: "Gibt es eine Hotelbar im Heidehof?", a: "Ja, die Bar Mäx ist täglich geöffnet und bietet Cocktails, Weine und Snacks." },
        ]),
      ]}
    >
      {/* Cinematic Full-Bleed Kapitel — analog Tagungsräume */}
      <div className="not-prose -mx-6 mt-10">
        {OUTLETS.map((o, i) => (
          <CinematicOutletChapter key={o.slug} outlet={o} index={i} />
        ))}
      </div>


      {/* Roomservice / Outro */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-3xl mx-auto rounded-2xl border border-gold/20 bg-card/60 backdrop-blur p-8 md:p-12 text-center">
          <p className="text-[10px] uppercase tracking-[0.42em] text-gold font-semibold mb-4">Roomservice</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light mb-6">Auch aufs Zimmer</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-foreground/80 mb-8">
            <div className="rounded-lg border border-gold/10 p-4">
              <p className="text-foreground font-medium mb-1">Warme Speisen</p>
              <p>Mo–Sa 18:00 – 21:00 Uhr<br />So 18:00 – 21:30 Uhr</p>
            </div>
            <div className="rounded-lg border border-gold/10 p-4">
              <p className="text-foreground font-medium mb-1">Kalte Karte</p>
              <p>Bis ca. 00:00 Uhr<br />Bestellung per Zimmertelefon</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <a href="tel:+4984586400"><Phone className="h-4 w-4 mr-2" /> Direkt anrufen</a>
            </Button>
            <AskClaraButton
              context={{ topic: "Restaurant-Reservierung Heidehof", category: "food", source: "/restaurant" }}
              variant="block"
              label="Frage an Clara"
            />
          </div>
        </div>
      </section>
    </SubPageLayout>
  );
}
