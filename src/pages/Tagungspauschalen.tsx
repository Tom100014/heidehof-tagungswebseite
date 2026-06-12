import { useEffect, useState } from "react";
import { SubPageLayout } from "@/components/site/SubPageLayout";
import { SiteImage } from "@/components/site/SiteImage";
import { faqSchema, offerSchema } from "@/lib/seo/schemas";
import { writeClaraInquiryContext } from "@/lib/clara/inquiry-context";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { openClaraBubble } from "@/components/clara/ClaraFloatingBubble";
import { Check, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Pkg {
  id: string;
  slug: string;
  number_label: string;
  eyebrow: string;
  title: string;
  price_value: string;
  price_suffix: string;
  price_note: string;
  highlights: string[];
  inclusions: string[];
  image_url: string | null;
  badge: string | null;
  is_bestseller: boolean;
  sort_order: number;
}

const tagesablauf = [
  { time: "08:00", text: "Welcome Coffee & Patisserie auf der Terrasse" },
  { time: "09:00", text: "Beginn Tagung – Raum bereit, Technik geprüft" },
  { time: "10:30", text: "Vormittagspause: Kaffee, Smoothies, Obst" },
  { time: "12:30", text: "3-Gang-Mittagsmenü im Restaurant" },
  { time: "15:00", text: "Nachmittagspause mit hausgemachtem Kuchen" },
  { time: "18:00", text: "Tagungsende · optional Abendessen / SPA" },
];

const faqs = [
  { q: "Ab wie vielen Personen sind die Pauschalen buchbar?", a: "Beide Pauschalen ab 10 Personen. Für kleinere Gruppen erstellen wir gerne ein individuelles Angebot." },
  { q: "Wie funktioniert die Stornierung?", a: "Bis 4 Wochen vor Anreise kostenfrei, bis 14 Tage 50 %, danach 80 %." },
  { q: "Können Allergien & Sonderwünsche berücksichtigt werden?", a: "Selbstverständlich. Bitte teilen Sie uns Allergien bis 5 Tage vor Anreise mit." },
  { q: "Wird eine Sammelrechnung gestellt?", a: "Ja, auf Wunsch konsolidierte Tagungsrechnung – alternativ Einzelrechnungen." },
  { q: "Sind Getränke beim Essen inklusive?", a: "Mineralwasser ja. Andere Getränke nach Verbrauch oder über ein Getränkepaket." },
];

const PackageSection = ({ p, index }: { p: Pkg; index: number }) => {
  const reverse = index % 2 === 1;
  const ctx = {
    category: "tagung" as const,
    topic: p.title,
    details: [p.eyebrow, `${p.price_value} ${p.price_suffix}`, ...p.inclusions.slice(0, 2)],
    source: "tagungspauschalen",
  };
  const handleInquiry = () => { writeClaraInquiryContext(ctx); openClaraBubble(ctx); };

  return (
    <article
      id={p.slug}
      className="relative min-h-[80vh] w-full flex items-center overflow-hidden rounded-3xl"
    >
      {/* Full-Bleed Bild */}
      <div className="absolute inset-0 -z-10">
        <SiteImage
          slug={`pkg-${p.slug}`}
          alt={p.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/75 to-background/95" />
      </div>

      {(p.badge || p.is_bestseller) && (
        <div className="absolute top-6 right-6 px-4 py-1.5 backdrop-blur-md bg-background/80 border border-heide/50 text-[10px] uppercase tracking-[0.32em] text-heide-glow z-10">
          {p.badge || "Bestseller"}
        </div>
      )}

      {/* Glas-Card */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className={`flex ${reverse ? "md:justify-end" : "md:justify-start"}`}>
          <div
            className="
              w-full max-w-2xl
              rounded-2xl border border-heide/25
              bg-[#0a0a0c]/92 backdrop-blur-xl
              shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]
              ring-1 ring-white/5
              p-7 md:p-10
            "
          >
            <p className="eyebrow-cine mb-5">
              <span className="text-foreground/85">{p.eyebrow}</span>
            </p>

            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[0.95] tracking-tight mb-6 text-foreground">
              {p.title}
            </h2>

            <div className="flex items-baseline gap-3 mb-1">
              <span className="font-serif text-5xl md:text-6xl text-gold tabular-nums leading-none">{p.price_value}</span>
              <span className="text-foreground/80 text-sm">{p.price_suffix}</span>
            </div>
            {p.price_note && (
              <p className="eyebrow-cine mb-7 pb-6 border-b border-heide/20 text-foreground/75">{p.price_note}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-7">
              {p.highlights.length > 0 && (
                <div>
                  <p className="eyebrow-cine mb-3 text-heide">Tagungstechnik</p>
                  <ul className="space-y-2">
                    {p.highlights.map((t) => (
                      <li key={t} className="text-foreground/95 flex items-start gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-heide shrink-0 mt-1" /> <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="eyebrow-cine mb-3 text-heide">Inklusivleistungen</p>
                <ul className="space-y-2">
                  {p.inclusions.map((i) => (
                    <li key={i} className="text-foreground/95 flex items-start gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-heide shrink-0 mt-1" /> <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInquiry}
              className="group inline-flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-heide border-b border-heide/50 pb-2 hover:border-heide-glow hover:text-heide-glow transition-colors"
            >
              {p.title} mit Clara anfragen
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const Tagungspauschalen = () => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tagungs_packages" as never)
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      const mapped = (data as unknown as Array<Record<string, unknown>> ?? []).map((r) => ({
        ...r,
        highlights: Array.isArray(r.highlights) ? r.highlights as string[] : [],
        inclusions: Array.isArray(r.inclusions) ? r.inclusions as string[] : [],
      })) as Pkg[];
      setPackages(mapped);
    })();
  }, []);

  return (
    <SubPageLayout
      title="Tagungspauschalen."
      titleAccent="Ab 69 € p. P. — All-Inclusive ab 199 €."
      seoTitle="Tagungspauschalen Ingolstadt ab 69 € | Vollpension 199 € – Heidehof"
      metaDescription="Konferenzpauschale Ingolstadt ab 69 € p. P.: Tagungsraum, Kaffeebuffet 08–18 Uhr, 3-Gang-Mittagsmenü. Vollpension mit Übernachtung & Spa ab 199 € im 4★ Superior Heidehof."
      eyebrow="Tagungsangebote · Ingolstadt"
      heroSlug="hero-tagungspauschalen"
      heroImage="/heidehof/orig/zimmer-1.jpg"
      intro="Konferenz ab 69 € p. P. Vollpension mit Übernachtung & Spa ab 199 €."
      keywords={["Tagungspauschale Ingolstadt","Konferenzpauschale 69 Euro","Vollpension Tagung Bayern","Hotel Der Heidehof"]}
      breadcrumbs={[{ name: "Tagungspauschalen", path: "/tagungspauschalen" }]}
      ctaImageSlug="cta-clara-pauschalen-bg"
      jsonLd={[offerSchema(), faqSchema(faqs)]}
    >
      <div className="space-y-10 md:space-y-14 mt-8">
        {packages.map((p, i) => <PackageSection key={p.id} p={p} index={i} />)}
      </div>

      <section className="mt-32 pt-20 border-t border-heide/20">
        <p className="eyebrow-cine mb-6 text-center"><span className="text-heide">Beispiel-Tagesablauf</span></p>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-16 leading-[0.95]">Ein Tag im Heidehof</h2>
        <ul className="divide-y divide-heide/15 border-t border-b border-heide/15 max-w-3xl mx-auto">
          {tagesablauf.map((t) => (
            <li key={t.time} className="py-6 flex items-baseline gap-6 md:gap-10">
              <Clock className="w-4 h-4 text-heide/80 shrink-0 self-center" />
              <span className="font-serif text-2xl md:text-3xl text-gold tabular-nums w-20 shrink-0">{t.time}</span>
              <p className="text-foreground/80 leading-relaxed text-base md:text-lg">{t.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-32 pt-20 border-t border-heide/20">
        <p className="eyebrow-cine mb-6 text-center"><span className="text-heide">FAQ</span></p>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-16 leading-[0.95]">Häufige Fragen</h2>
        <ul className="divide-y divide-heide/15 border-t border-b border-heide/15 max-w-3xl mx-auto">
          {faqs.map((f, i) => (
            <li key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left py-6 flex items-baseline justify-between gap-4 hover:text-heide transition-colors">
                <span className="font-serif text-xl md:text-2xl leading-tight">{f.q}</span>
                <span className={`text-heide text-2xl transition-transform shrink-0 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === i && (<p className="pb-6 text-foreground/75 leading-relaxed max-w-2xl">{f.a}</p>)}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-24 flex justify-center">
        <AskClaraButton
          context={{ category: "tagung", topic: "Individuelles Tagungspaket", source: "tagungspauschalen", trigger: "pauschalen-final" }}
          label="Individuelles Angebot mit Clara"
        />
      </div>
    </SubPageLayout>
  );
};

export default Tagungspauschalen;
