import { useEffect, useState } from "react";
import { SubPageLayout } from "@/components/site/SubPageLayout";
import { SiteImage } from "@/components/site/SiteImage";
import { SetupsGallery } from "@/components/site/SetupsGallery";
import { AskClaraButton } from "@/components/clara/AskClaraButton";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Feature {
  id: string;
  slug: string;
  number_label: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body_md: string;
  bullets: string[];
  image_url: string | null;
  layout: string;
  sort_order: number;
}

const AusstattungTechnik = () => {
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tech_features" as never)
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      const mapped = (data as unknown as Array<Record<string, unknown>> ?? []).map((r) => ({
        ...r,
        bullets: Array.isArray(r.bullets) ? r.bullets as string[] : [],
      })) as Feature[];
      setFeatures(mapped);
    })();
  }, []);

  return (
    <SubPageLayout
      title="Tagungstechnik Ingolstadt."
      titleAccent="Hybrid-ready. Plug & Present."
      seoTitle="Tagungstechnik Ingolstadt | Hybrid-Ready Konferenztechnik – Heidehof"
      metaDescription="Modernste Tagungstechnik in Ingolstadt: Clever-Touch TV, Beamer, Gigabit-WLAN, Hybrid-Streaming, variable Bestuhlung. 8 Tagungsräume im 4★ Superior Hotel Der Heidehof."
      eyebrow="Ausstattung · Hybrid-Ready · Ingolstadt"
      heroSlug="hero-ausstattung"
      heroImage="/heidehof/ausstattung.jpg"
      intro="Hybrid-ready. Tageslicht in jedem Raum. Veranstaltungsteam vor Ort."
      keywords={["Tagungstechnik Ingolstadt","Hybrid Meeting Ingolstadt","Konferenztechnik Bayern","Hotel Der Heidehof"]}
      breadcrumbs={[{ name: "Ausstattung & Technik", path: "/ausstattung-technik" }]}
      ctaImageSlug="cta-clara-ausstattung-bg"
    >
      <div className="space-y-28 md:space-y-40 mt-8">
        {features.map((f) => {
          const reverse = f.layout === "image-right";
          return (
            <article key={f.id} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              <div className={`relative aspect-[4/5] overflow-hidden cine-card w-full ${reverse ? "lg:order-2" : ""}`}>
                <SiteImage slug={`tech-${f.slug}`} alt={f.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-heide/60 to-transparent" />
              </div>
              <div className={`w-full ${reverse ? "lg:order-1" : ""}`}>
                <p className="eyebrow-cine mb-5">
                  <span className="text-foreground/70">{f.eyebrow}</span>
                </p>
                <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-6">
                  {f.title}
                </h2>
                {f.subtitle && (
                  <p className="text-lg md:text-xl text-foreground/75 leading-relaxed max-w-xl mb-6">{f.subtitle}</p>
                )}
                {f.body_md && (
                  <p className="text-base text-foreground/65 leading-relaxed max-w-xl mb-8">{f.body_md}</p>
                )}
                {f.bullets.length > 0 && (
                  <ul className="divide-y divide-heide/15 border-t border-heide/15 max-w-xl">
                    {f.bullets.map((b) => (
                      <li key={b} className="py-3 text-foreground/85 flex items-center gap-3">
                        <Check className="w-3.5 h-3.5 text-heide shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-32 pt-20 border-t border-heide/20">
        <p className="eyebrow-cine mb-6 text-center"><span className="text-heide">Bestuhlungsvarianten</span></p>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-center mb-8 leading-[0.95]">Sechs Setups</h2>
        <p className="text-foreground/70 md:text-lg max-w-2xl mx-auto text-center mb-16 leading-relaxed">
          Vom intensiven Workshop bis zum festlichen Galadinner — wir richten Ihren Raum exakt nach Ihrem Anlass ein.
        </p>
        <SetupsGallery />
      </section>

      <section className="mt-32 pt-20 border-t border-heide/20 text-center">
        <p className="eyebrow-cine mb-6 justify-center"><span className="text-heide">Hinweis</span></p>
        <p className="font-serif text-3xl md:text-4xl lg:text-5xl leading-[1.05] text-foreground max-w-4xl mx-auto mb-10">
          Sonderwünsche zur technischen Ausstattung setzen wir gerne <span className="italic text-heide">individuell</span> für Ihre Veranstaltung um.
        </p>
        <div className="flex justify-center">
          <AskClaraButton context={{ category: "tagung", topic: "Tagungstechnik & Ausstattung", source: "/ausstattung-technik" }} label="Technik-Anfrage mit Clara" />
        </div>
      </section>
    </SubPageLayout>
  );
};

export default AusstattungTechnik;
