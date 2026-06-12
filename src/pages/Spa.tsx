import { useEffect, useMemo, useState } from "react";
import { SubPageLayout } from "@/components/site/SubPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Sparkles } from "lucide-react";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";
import { SiteImage } from "@/components/site/SiteImage";
import { SpaTabs } from "@/components/sections";
import { MenuItemCard } from "@/components/site/MenuItemCard";
import { BookTreatmentButton } from "@/components/beauty/BookTreatmentButton";

interface Treatment {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration_label: string | null;
  price_label: string | null;
  image_url: string | null;
  tags: string[];
  sort_order: number;
}

interface Section {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  body_md: string | null;
  hero_image_url: string | null;
  opening_hours: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  beauty_men: "Beauty for Men",
  beauty_women: "Beauty for Women",
  depilation: "Depilation",
  massagen: "Massagen",
  hand_fuss: "Hand & Fuß",
  sonstiges: "Sonstiges",
};

const CATEGORY_ORDER = ["beauty_women", "beauty_men", "massagen", "hand_fuss", "depilation", "sonstiges"];

const FALLBACK_SECTIONS: Section[] = [
  {
    id: "fb-spa-oriental",
    slug: "spa-oriental",
    title: "Orientalische Spa-Welten",
    subtitle: "Tradition trifft Moderne",
    body_md: "Entfliehen Sie dem Alltag in unserer orientalisch inspirierten Oase. Sanfte Dampfbäder, wohltuende Wärme und ein Ambiente, das Körper und Geist zur Ruhe kommen lässt.",
    hero_image_url: "/heidehof/spa-hero.jpg",
    opening_hours: "Täglich von 10:00 bis 21:00 Uhr nach Vereinbarung",
  },
  {
    id: "fb-spa-klapp",
    slug: "spa-klapp",
    title: "Klapp Cosmetics",
    subtitle: "Präzision & High-Tech Pflege",
    body_md: "Als einer der Pioniere im Beauty-Bereich steht Klapp Cosmetics für innovative Treatments und Wirkstoffe. Exklusive Gesichtsbehandlungen, perfekt abgestimmt auf Ihre Hautbedürfnisse.",
    hero_image_url: "/heidehof/spa-hero.jpg",
    opening_hours: "Termine nach Vereinbarung",
  },
  {
    id: "fb-spa-stbarth",
    slug: "spa-stbarth",
    title: "Ligne St. Barth",
    subtitle: "Die Magie der Karibik",
    body_md: "Erleben Sie die pure Exotik der Karibik. Natürliche Elixiere, duftende Öle aus Papaya, Avocado und Kokos verwöhnen Ihre Haut nachhaltig.",
    hero_image_url: "/heidehof/spa-hero.jpg",
    opening_hours: "Termine nach Vereinbarung",
  },
];

const FALLBACK_TREATMENTS: Treatment[] = [
  { id: "fb-t-women-1", slug: "klapp-hyaluronic-women", title: "Klapp Hyaluronic Multi-Effect Treatment", description: "Intensive Feuchtigkeitspflege mit dreifach aktiven Hyaluron-Komplexen. Polstert die Haut von innen auf, glättet feine Fältchen und verleiht sofortige Frische.", category: "beauty_women", duration_label: "60 Min.", price_label: "89,00 €", image_url: null, tags: ["Klapp"], sort_order: 1 },
  { id: "fb-t-women-2", slug: "st-barth-freshness", title: "Ligne St. Barth Freshness", description: "Exotische Gesichts- und Dekolletébehandlung mit frischem Papaya-Mousse, Avocadoöl und grünem Ton.", category: "beauty_women", duration_label: "60 Min.", price_label: "95,00 €", image_url: null, tags: ["St. Barth"], sort_order: 2 },
  { id: "fb-t-women-3", slug: "klapp-classic-women", title: "Klapp Classic Wellness-Behandlung", description: "Individuelle Basispflege mit Hautreinigung, Peeling, Tiefenreinigung, Wirkstoffampulle, Gesichtsmassage und Abschlusspflege.", category: "beauty_women", duration_label: "75 Min.", price_label: "85,00 €", image_url: null, tags: ["Klapp"], sort_order: 3 },
  { id: "fb-t-men-1", slug: "klapp-men-supreme", title: "Klapp Men Supreme Power", description: "Belebende Intensivbehandlung für die beanspruchte Männerhaut. Tiefenwirksame Reinigung, mildert Stresssymptome.", category: "beauty_men", duration_label: "60 Min.", price_label: "79,00 €", image_url: null, tags: ["Klapp"], sort_order: 4 },
  { id: "fb-t-men-2", slug: "st-barth-men-short", title: "Ligne St. Barth Men Short Break", description: "Schnelle Frische und Tiefenreinigung, abgerundet durch eine entspannende Nacken- und Gesichtsmassage.", category: "beauty_men", duration_label: "45 Min.", price_label: "65,00 €", image_url: null, tags: ["St. Barth"], sort_order: 5 },
  { id: "fb-t-mass-1", slug: "heidehof-ganzkoerper", title: "Heidehof Classic Ganzkörpermassage", description: "Klassische Massagegriffe lockern verspannte Muskeln, fördern die Durchblutung und sorgen für ein Gefühl vollkommener Leichtigkeit.", category: "massagen", duration_label: "50 Min.", price_label: "75,00 €", image_url: null, tags: ["Classic"], sort_order: 6 },
  { id: "fb-t-mass-2", slug: "st-barth-harmony", title: "Ligne St. Barth Harmony Massage", description: "Verwöhnende Ganzkörpermassage mit Kokosnussöl, Avocadoöl oder Efeugel.", category: "massagen", duration_label: "50 Min.", price_label: "85,00 €", image_url: null, tags: ["St. Barth"], sort_order: 7 },
  { id: "fb-t-mass-3", slug: "hot-stone-relax", title: "Heidehof Hot Stone Massage", description: "Tiefenwärme heißer Lavasteine in Verbindung mit fließenden Bewegungen und edlen Aromaölen.", category: "massagen", duration_label: "60 Min.", price_label: "90,00 €", image_url: null, tags: ["Hot Stone"], sort_order: 8 },
  { id: "fb-t-hand-1", slug: "premium-manikuere", title: "Premium Maniküre", description: "Intensivpflege für Hände und Nägel: Handbad, Nagelhautpflege, Feilen, pflegende Handmassage und auf Wunsch professioneller Farblack.", category: "hand_fuss", duration_label: "45 Min.", price_label: "49,00 €", image_url: null, tags: ["Maniküre"], sort_order: 9 },
  { id: "fb-t-hand-2", slug: "premium-pedikuere", title: "Premium Pediküre", description: "Wohltuendes Fußbad, professionelle Entfernung von Hornhaut, Nagelpflege und entspannende Fußmassage.", category: "hand_fuss", duration_label: "45 Min.", price_label: "55,00 €", image_url: null, tags: ["Pediküre"], sort_order: 10 },
];

const Spa = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");

  useEffect(() => {
    void (async () => {
      const [t, s] = await Promise.all([
        supabase.from("wellness_treatments")
          .select("id, slug, title, description, category, duration_label, price_label, image_url, tags, sort_order")
          .eq("target_page", "spa").eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase.from("wellness_sections")
          .select("id, slug, title, subtitle, body_md, hero_image_url, opening_hours")
          .eq("page", "spa").eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);
      const dbTreatments = (t.data ?? []) as Treatment[];
      const dbSections = (s.data ?? []) as Section[];
      setTreatments(dbTreatments.length > 0 ? dbTreatments : FALLBACK_TREATMENTS);
      setSections(dbSections.length > 0 ? dbSections : FALLBACK_SECTIONS);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Treatment[]>();
    for (const t of treatments) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return CATEGORY_ORDER
      .filter((c) => map.has(c))
      .map((c) => ({ category: c, items: map.get(c)! }));
  }, [treatments]);

  const visible = activeCat === "all" ? grouped : grouped.filter((g) => g.category === activeCat);

  return (
    <SubPageLayout
      title="Beauty & Massage."
      titleAccent="Rituale, die spürbar wirken."
      seoTitle="Massage & Beauty Ingolstadt – Oriental Spa | Hotel Der Heidehof"
      metaDescription="Massagen, Hot Stone, Klapp Cosmetics & Ligne St. Barth Gesichtsbehandlungen, Maniküre & Pediküre im Oriental Spa des 4★ Superior Hotel Der Heidehof Ingolstadt. Termine online anfragen."
      eyebrow="Spa · Beauty · Massage · Ingolstadt"
      heroImage="/heidehof/spa-hero.jpg"
      heroSlug="spa-hero"
      intro="Klapp Cosmetics. Ligne St. Barth. Behandlungen mit Substanz — empfohlen von unseren Stammgästen, gebucht von Reisenden aus ganz Bayern."
      breadcrumbs={[{ name: "Spa", path: "/spa" }]}
      keywords={["Spa Ingolstadt", "Massage", "Beauty", "Oriental Spa", "Heidehof"]}
      jsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "HealthAndBeautyBusiness",
          name: "Oriental Spa · Hotel Der Heidehof",
          url: "https://der-heidehof.de/spa",
        },
        ...treatments.slice(0, 10).map((t) => ({
          "@context": "https://schema.org",
          "@type": "Service",
          name: t.title,
          description: t.description ?? "",
          category: CATEGORY_LABEL[t.category] ?? t.category,
          offers: t.price_label ? { "@type": "Offer", price: t.price_label, priceCurrency: "EUR" } : undefined,
        })),
      ]}
    >
      <SpaTabs />

      {/* ── Editoriale 50/50-Rows ── */}
      <div className="space-y-24 md:space-y-32 mt-8">
        {sections.map((s, i) => {
          const isStaticSlot = ["spa-oriental", "spa-klapp", "spa-stbarth"].includes(s.slug);
          const reverse = i % 2 === 1;
          return (
            <article key={s.id} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className={`relative aspect-[4/5] overflow-hidden cine-card w-full ${reverse ? "lg:order-2" : ""}`}>
                {isStaticSlot ? (
                  <SiteImage slug={s.slug} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : s.hero_image_url ? (
                  <img src={s.hero_image_url} alt={s.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
              </div>
              <div className={`w-full ${reverse ? "lg:order-1" : ""}`}>
                <p className="eyebrow-cine mb-5">
                  <span className="text-gold">{s.subtitle ?? "Spa"}</span>
                </p>
                <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-8">
                  {s.title}
                </h2>
                {s.body_md && (
                  <p className="text-lg md:text-xl text-foreground/75 leading-relaxed mb-8 max-w-xl">
                    {s.body_md}
                  </p>
                )}
                {s.opening_hours && (
                  <p className="flex items-center gap-3 text-sm text-foreground/55 mb-8">
                    <Clock className="w-4 h-4 text-gold" /> {s.opening_hours}
                  </p>
                )}
                <AskClaraButton
                  context={{ category: "wellness", topic: s.title, source: "/spa" }}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Behandlungen als Editorial-Liste ── */}
      <section className="mt-32 pt-16 border-t border-gold/15">
        <p className="eyebrow-cine mb-6 text-center">
          <span className="text-gold">Behandlungen</span>
        </p>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-12 leading-[0.95]">
          Treatments & Rituale
        </h2>

        {/* Filter — minimal, kein Pill-Bootstrap-Look */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center mb-16 text-xs uppercase tracking-[0.25em]">
          <button
            onClick={() => setActiveCat("all")}
            className={`pb-1 border-b transition-colors ${activeCat === "all" ? "text-gold border-gold" : "text-foreground/50 border-transparent hover:text-foreground/80"}`}
          >
            Alle
          </button>
          {CATEGORY_ORDER.filter((c) => grouped.some((g) => g.category === c)).map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`pb-1 border-b transition-colors ${activeCat === c ? "text-gold border-gold" : "text-foreground/50 border-transparent hover:text-foreground/80"}`}
            >
              {CATEGORY_LABEL[c] ?? c}
            </button>
          ))}
        </div>

        {visible.map(({ category, items }) => (
          <div key={category} id={category} className="mb-20">
            <div className="flex items-baseline justify-between mb-8 border-b border-gold/15 pb-4">
              <h3 className="font-serif text-2xl md:text-3xl text-foreground/95">
                {CATEGORY_LABEL[category] ?? category}
              </h3>
              <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/45">
                {items.length} {items.length === 1 ? "Treatment" : "Treatments"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {items.map((t) => {
                const ctx = {
                  category: "wellness" as const,
                  topic: t.title,
                  details: [t.duration_label ?? "", t.price_label ?? ""].filter(Boolean),
                  source: "/spa",
                };
                const tags = [t.duration_label, ...(t.tags ?? [])].filter(Boolean) as string[];
                return (
                  <div key={t.id} className="flex flex-col gap-3">
                    <MenuItemCard
                      id={t.slug}
                      title={t.title}
                      description={t.description}
                      imageUrl={t.image_url}
                      priceLabel={t.price_label}
                      tags={tags}
                      imageAspect="landscape"
                      imageFallback={
                        <div className="absolute inset-0 flex items-center justify-center text-gold/25 bg-gradient-to-br from-stone-900 to-stone-950">
                          <Sparkles className="w-12 h-12" />
                        </div>
                      }
                      onClick={() => openClaraBubble(ctx)}
                    />
                    <BookTreatmentButton
                      treatmentId={t.id.startsWith("fb-") ? undefined : t.id}
                      treatmentSlug={t.slug}
                      treatmentTitle={t.title}
                      priceLabel={t.price_label}
                      durationLabel={t.duration_label}
                      className="self-start"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="text-center mt-16">
          <AskClaraButton
            context={{ category: "wellness", topic: "Spa-Termin Anfrage", source: "/spa", trigger: "spa-cta" }}
          />
        </div>
      </section>
    </SubPageLayout>
  );
};

export default Spa;
