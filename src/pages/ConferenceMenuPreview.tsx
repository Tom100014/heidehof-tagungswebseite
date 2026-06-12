// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { de } from "date-fns/locale";
import {
  Calendar, ChevronLeft, ChevronRight, Fish, Beef, Leaf, Sparkles,
  ArrowRight, UtensilsCrossed, Moon, Sun, Loader2,
} from "lucide-react";
import { fetchMenuByDate, type ConferenceMenu } from "@/services/conference/menu-service";
import { fetchActiveImagesByType } from "@/services/conference/menu-image-service";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteMedia } from "@/components/site/SiteMedia";
import { PageSeo } from "@/components/seo/PageSeo";

const fmtIso = (d: Date) => format(d, "yyyy-MM-dd");

export default function ConferenceMenuPreview() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [menu, setMenu] = useState<ConferenceMenu | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMenu(null);
    setImages({});
    fetchMenuByDate(fmtIso(date))
      .then(async (m) => {
        if (cancelled) return;
        setMenu(m);
        if (m?.id) {
          try {
            const imgs = await fetchActiveImagesByType(m.id);
            if (!cancelled) setImages(imgs || {});
          } catch {}
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [date]);

  const handleAnmelden = () => {
    localStorage.setItem("conferenceMenuPreviewDate", fmtIso(date));
    navigate("/conference-guests");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageSeo
        title="Tagungsmenüs Vorschau – Hotel Der Heidehof Ingolstadt"
        description="Tagesaktuelle Tagungs- und Bankettmenüs im Hotel Der Heidehof: Vorspeise, Hauptgang, Dessert – Fisch, Fleisch, vegetarisch."
        keywords={["Tagungsmenü Ingolstadt", "Bankett Menü", "Konferenz Catering", "Hotel Der Heidehof"]}
        noindex={true}
      />
      <SiteHeader />

      {/* ══ HERO – editable via Admin → Bilder → "menue-hero" ══ */}
      <section className="relative h-[100svh] min-h-[600px] md:min-h-[680px] flex items-end overflow-hidden w-full">
        {/* Editable background image / video – full bleed */}
        <SiteMedia
          slug="menue-hero"
          alt="Tagesmenü im Hotel Der Heidehof"
          className="absolute inset-0 w-full h-full object-cover ken-burns"
          videoClassName="absolute inset-0 w-full h-full object-cover"
        />
        {/* Cinematic overlay stack – matches SubPageLayout */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/30 to-transparent" />
        <div
          className="aurora-orb w-[600px] h-[600px] -bottom-60 -left-60"
          style={{ background: "hsla(42,70%,55%,0.18)" }}
        />
        <div className="absolute inset-0 cine-grain opacity-60 pointer-events-none" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 md:pb-24">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-apple/30 bg-background/40 backdrop-blur-md text-apple text-xs uppercase tracking-[0.4em]">
              <Sparkles className="w-3.5 h-3.5" />
              Hotel Der Heidehof · Tagesmenü
            </div>

            {/* Headline */}
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mt-8 leading-[1.02] text-foreground drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
              Die heutige Komposition{" "}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-apple-bright via-apple to-apple-bright bg-clip-text text-transparent italic">
                unserer Küche.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base md:text-lg text-foreground/80 leading-relaxed">
              Saisonal, raffiniert und mit ausgewählten Zutaten. Entdecken Sie das
              Menü Ihres Tagungstages und melden Sie sich anschließend bequem zur
              Bestellung an.
            </p>

            {/* PRIMARY CTA – ghost button */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAnmelden}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 border border-gold/60 text-white hover:bg-gold hover:text-stone-950 uppercase tracking-[0.2em] text-xs transition-all hover:gap-4 min-h-[54px]"
              >
                ANFRAGEN
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#menu"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gold/40 text-gold hover:bg-gold/10 uppercase tracking-[0.2em] text-xs backdrop-blur-sm min-h-[54px] transition-colors"
              >
                Menü ansehen
              </a>
            </div>

          </div>
        </div>

      </section>

      {/* ══ DATE SELECTOR (below hero) ══ */}
      <section className="relative max-w-6xl mx-auto px-6 lg:px-10 pt-12 md:pt-16">
        {(() => {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const current = new Date(date); current.setHours(0, 0, 0, 0);
          const isToday = current.getTime() <= today.getTime();
          return (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => !isToday && setDate(addDays(date, -1))}
                disabled={isToday}
                className="w-12 h-12 rounded-full border border-apple/30 hover:bg-apple/10 backdrop-blur-md bg-background/30 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-background/30"
                aria-label="Vorheriger Tag"
                title={isToday ? "Vergangene Tage sind nicht verfügbar" : "Vorheriger Tag"}
              >
                <ChevronLeft className="w-5 h-5 text-apple" />
              </button>
              <div className="flex items-center gap-3 px-6 py-3 rounded-full border border-apple/30 bg-background/40 backdrop-blur-md min-w-[280px] justify-center">
                <Calendar className="w-4 h-4 text-apple-bright" />
                <span className="font-serif text-lg md:text-xl text-foreground">
                  {format(date, "EEEE, dd. MMMM yyyy", { locale: de })}
                </span>
              </div>
              <button
                onClick={() => setDate(addDays(date, 1))}
                className="w-12 h-12 rounded-full border border-apple/30 hover:bg-apple/10 backdrop-blur-md bg-background/30 flex items-center justify-center transition-colors"
                aria-label="Nächster Tag"
              >
                <ChevronRight className="w-5 h-5 text-apple" />
              </button>
            </div>
          );
        })()}
      </section>

      {/* ══ MENU BODY ══ */}
      <section id="menu" className="relative max-w-6xl mx-auto px-6 lg:px-10 py-16 md:py-24">
        {loading ? (
          <div className="flex items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-3 text-apple" /> Menü wird geladen…
          </div>
        ) : !menu ? (
          <NoMenuFallback date={date} />
        ) : (
          <div className="space-y-24">
            <MealBlock icon={Sun}  eyebrow="Mittag" menu={menu} prefix="lunch"  images={images} />
            <MealBlock icon={Moon} eyebrow="Abend"  menu={menu} prefix="dinner" images={images} />
          </div>
        )}
      </section>

      {/* ══ BOTTOM CTA BAND ══ */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-card/30">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gold/5 blur-[140px]" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="text-gold uppercase tracking-[0.45em] text-xs mb-6 text-center">
            Bereit für Ihre Anfrage?
          </p>
          <h2 className="font-serif text-3xl md:text-5xl text-foreground leading-tight">
            In wenigen Schritten <br className="hidden md:block" />
            <span className="italic text-gold/90">
              als Tagungsgast anmelden.
            </span>
          </h2>
          <p className="mt-7 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Wählen Sie Ihre Gänge, Allergien und Wünsche. Wir senden Ihnen die
            Bestätigung umgehend per E-Mail an Ihr Tagungs-Postfach.
          </p>
          <button
            onClick={handleAnmelden}
            className="group mt-10 inline-flex items-center justify-center gap-2.5 px-10 py-4 border border-gold/60 text-white hover:bg-gold hover:text-stone-950 uppercase tracking-[0.2em] text-xs transition-all hover:gap-4 min-h-[54px]"
          >
            ANFRAGEN
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ───────── subcomponents ───────── */

function MealBlock({ icon: Icon, eyebrow, menu, prefix, images }: any) {
  const appetizer = menu[`${prefix}_appetizer`];
  const dessert = menu[`${prefix}_dessert`];
  const dishes = [
    { type: "fish",       dish: menu[`${prefix}_main_dish_fish`],       Icon: Fish, label: "Fisch" },
    { type: "meat",       dish: menu[`${prefix}_main_dish_meat`],       Icon: Beef, label: "Fleisch" },
    { type: "vegetarian", dish: menu[`${prefix}_main_dish_vegetarian`], Icon: Leaf, label: "Vegetarisch" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 text-apple-bright mb-3 uppercase tracking-[0.4em] text-xs">
        <Icon className="w-4 h-4" /> {eyebrow}
      </div>
      <h3 className="font-serif text-4xl md:text-6xl bg-gradient-to-r from-foreground via-apple to-foreground bg-clip-text text-transparent">
        {prefix === "lunch" ? "Mittagsmenü" : "Abendmenü"}
      </h3>

      {appetizer && (
        <div className="mt-12 text-center">
          <div className="text-xs uppercase tracking-[0.45em] text-apple/80">Vorspeise</div>
          <div className="font-serif text-2xl md:text-3xl italic mt-3 text-foreground">{appetizer}</div>
          <div className="mx-auto w-20 h-px bg-gradient-to-r from-transparent via-apple/60 to-transparent mt-5" />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mt-14">
        {dishes.map(({ type, dish, Icon: DI, label }) => {
          const img = images?.[`${prefix}_${type}`];
          return (
            <div
              key={type}
              className="group rounded-3xl overflow-hidden border border-apple/15 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-md hover:border-apple-bright/40 transition-all duration-500 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.8)] hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden bg-card relative">
                {img ? (
                  <img
                    src={img}
                    alt={dish?.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-apple/30">
                    <DI className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-7">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-apple-bright">
                  <DI className="w-3.5 h-3.5" /> {label}
                </div>
                <h4 className="font-serif text-2xl mt-3 text-foreground">{dish?.name || "—"}</h4>
                {dish?.description && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{dish.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {dessert && (
        <div className="mt-14 text-center">
          <div className="mx-auto w-20 h-px bg-gradient-to-r from-transparent via-apple/60 to-transparent mb-5" />
          <div className="text-xs uppercase tracking-[0.45em] text-apple/80">Dessert</div>
          <div className="font-serif text-2xl md:text-3xl italic mt-3 text-foreground">{dessert}</div>
        </div>
      )}
    </div>
  );
}

function NoMenuFallback({ date }: { date: Date }) {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-apple/15 min-h-[460px] flex items-center justify-center bg-gradient-to-br from-card/80 to-background">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-apple/20 blur-[120px]" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-apple-bright/20 blur-[120px]" />
      </div>
      <div className="relative text-center px-8 py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-apple/40 bg-background/40 backdrop-blur mb-6">
          <UtensilsCrossed className="w-7 h-7 text-apple" />
        </div>
        <div className="text-xs uppercase tracking-[0.5em] text-apple">
          Hotel Der Heidehof
        </div>
        <h3 className="font-serif text-4xl md:text-5xl mt-4 text-foreground">
          Für diesen Tag wird das Menü
          <br />
          <span className="bg-gradient-to-r from-apple-bright via-apple to-apple-bright bg-clip-text text-transparent italic">
            gerade vorbereitet.
          </span>
        </h3>
        <p className="mt-6 text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Unsere Küche stellt das Tagesmenü für den{" "}
          <span className="text-apple">
            {format(date, "dd. MMMM yyyy", { locale: de })}
          </span>{" "}
          gerade liebevoll zusammen. Schauen Sie in Kürze wieder vorbei oder
          wählen Sie einen anderen Tag.
        </p>
      </div>
    </div>
  );
}
