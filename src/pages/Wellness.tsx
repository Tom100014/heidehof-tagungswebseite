import { useEffect, useState } from "react";
import { SubPageLayout } from "@/components/site/SubPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { SiteImage } from "@/components/site/SiteImage";
import { SpaTabs } from "@/components/sections";
import * as LucideIcons from "lucide-react";
import { spaBusinessSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schemas";

interface WellnessFeature {
  icon: string;
  label: string;
}

interface WellnessSection {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  body_md: string | null;
  hero_image_url: string | null;
  opening_hours: string | null;
  sort_order: number;
  features: WellnessFeature[] | null;
}

const renderIcon = (name: string) => {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon | undefined>)[name];
  if (!Icon) return <Sparkles className="w-5 h-5 text-gold" />;
  return <Icon className="w-5 h-5 text-gold" />;
};

const Wellness = () => {
  const [sections, setSections] = useState<WellnessSection[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("wellness_sections")
        .select("id, slug, title, subtitle, eyebrow, body_md, hero_image_url, opening_hours, sort_order, features")
        .eq("page", "wellness")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setSections((data as unknown as WellnessSection[]) ?? []);
    })();
  }, []);

  return (
    <SubPageLayout
      title="Oriental Spa Ingolstadt."
      titleAccent="400 m² Ruhe — mitten in Bayern."
      seoTitle="Wellnesshotel Ingolstadt – Oriental Spa, Pools & Saunen | Hotel Der Heidehof"
      metaDescription="Wellnesshotel Ingolstadt: 400 m² Oriental Spa mit Innen- & Außenpool, Finnischer Sauna, Salz-Sauna, Dampfbad, Salzgrotte und Japan-Garten. Day-Spa & Übernachtung im 4★ Superior Heidehof."
      eyebrow="Oriental Spa · 4★ Superior · Ingolstadt"
      heroImage="/heidehof/orig/spa-pool.jpg"
      heroSlug="hero-wellness"
      intro="400 m² Oriental Spa. Zwei Pools, drei Saunen, Salzgrotte und Japan-Garten — die einzige Wellness-Oase dieser Klasse im Großraum Ingolstadt."
      breadcrumbs={[{ name: "Wellness", path: "/wellness" }]}
      keywords={["Wellness Hotel Ingolstadt", "Sauna Ingolstadt", "Schwimmbad Ingolstadt", "Hotel mit Pool Bayern", "Spa Hotel Ingolstadt", "Wellness Wochenende Ingolstadt"]}
      jsonLd={[
        spaBusinessSchema(),
        breadcrumbSchema([{ name: "Wellness & Spa", path: "/wellness" }]),
        faqSchema([
          { q: "Wann hat der Spa im Hotel Der Heidehof geöffnet?", a: "Der 400 m² Oriental Spa ist täglich von 10:00 bis 22:00 Uhr geöffnet." },
          { q: "Was kostet die Spa-Nutzung?", a: "In der Premium-Tagungspauschale (ab 199 € p. P.) ist die Spa-Nutzung inklusive. Als Tagesgast buchbar." },
          { q: "Welche Saunen gibt es im Heidehof Ingolstadt?", a: "Himalaya-Salz-Sauna, Finnische Sauna (90°C) und Aromadampfbad stehen zur Verfügung." },
          { q: "Gibt es einen Außenpool?", a: "Ja, neben dem Innenpool mit Grotte gibt es einen beheizten Außenpool und Whirlpool." },
          { q: "Was bietet die Beautyfarm Living Beauty?", a: "Gesichtsbehandlungen, St. Barth Massagen, Peelings, Hand- und Fußpflege, Depilation." },
        ]),
      ]}
    >
      <SpaTabs />
      <div className="space-y-0">
        {sections.map((s, index) => {
          const ctx = {
            category: "wellness" as const,
            topic: s.title,
            details: [s.subtitle ?? "", s.opening_hours ?? ""].filter(Boolean),
            source: "/wellness",
          };
          const isStaticSlot = ["pool", "sauna", "ruhebereich", "fitness", "poolbar"].includes(s.slug);
          const isReversed = index % 2 === 1;
          const features = Array.isArray(s.features) ? s.features : [];

          return (
            <article
              key={s.id}
              id={s.slug}
              className="reveal-up relative min-h-screen flex items-center py-20 lg:py-28 border-t border-gold/15 first:border-t-0"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
                {/* IMAGE */}
                <div
                  className={`relative aspect-[4/3] lg:aspect-[5/6] xl:aspect-[4/5] overflow-hidden rounded-2xl group cine-card border border-gold/15 w-full ${
                    isReversed ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  {isStaticSlot ? (
                    <SiteImage
                      slug={`wellness-${s.slug}`}
                      alt={`${s.title} – ${s.subtitle ?? ""}`}
                      className="absolute inset-0 w-full h-full object-cover transition-transform [transition-duration:1800ms] ease-out group-hover:scale-105"
                    />
                  ) : s.hero_image_url ? (
                    <img
                      src={s.hero_image_url}
                      alt={`${s.title} – ${s.subtitle ?? ""}`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform [transition-duration:1800ms] ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gold/30 bg-gradient-to-br from-stone-900 to-stone-950">
                      <Sparkles className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent" />
                  {/* Top-left overlay label */}
                  {s.subtitle && (
                    <div className="absolute top-6 left-6 flex items-center gap-3">
                      <span className="block h-8 w-px bg-gold/70" />
                      <span className="font-['Inter'] text-[10px] uppercase tracking-[0.4em] text-white/90 font-semibold">
                        {s.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* TEXT */}
                <div className={`w-full lg:max-w-[640px] ${isReversed ? "lg:order-1" : "lg:order-2"}`}>
                  {s.eyebrow && (
                    <p className="font-['Inter'] text-[11px] uppercase tracking-[0.4em] text-gold font-semibold mb-5">
                      {s.eyebrow}
                    </p>
                  )}
                  <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground mb-7 leading-[0.95] tracking-tight">
                    {s.title}<span className="text-gold">.</span>
                  </h2>
                  {s.body_md && (
                    <p className="text-[#F5F0E8]/80 leading-relaxed mb-8 text-lg whitespace-pre-line max-w-prose">
                      {s.body_md}
                    </p>
                  )}

                  {features.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                      {features.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 px-4 py-3.5 rounded-lg border border-gold/20 bg-black/30 backdrop-blur-sm hover:border-gold/45 hover:bg-black/45 transition-colors"
                        >
                          <span className="shrink-0 mt-0.5">{renderIcon(f.icon)}</span>
                          <span className="text-sm text-[#F5F0E8]/90 leading-snug">{f.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <AskClaraButton
                    context={ctx}
                    variant="block"
                    label="Mit Clara anfragen"
                    className="h-12 px-8 whitespace-nowrap"
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </SubPageLayout>
  );
};

export default Wellness;
