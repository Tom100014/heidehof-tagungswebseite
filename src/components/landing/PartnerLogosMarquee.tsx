import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteMedia } from "@/components/site/SiteMedia";

interface PartnerLogo {
  id: string;
  name: string;
  logo_url: string;
  target_url: string;
}

/**
 * Partner-Sektion mit optionalem Hintergrund-Bild oder -Video (slug: "partner-bg").
 * - Logos als Endlos-Marquee, Pause beim Hover
 * - 30% größer als Standard (Padding, Logo-Höhen, Headline)
 */
export const PartnerLogosMarquee = () => {
  const [logos, setLogos] = useState<PartnerLogo[]>([]);

  useEffect(() => {
    supabase
      .from("partner_logos")
      .select("id,name,logo_url,target_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setLogos((data || []) as PartnerLogo[]));
  }, []);

  if (logos.length === 0) return null;

  const loop = [...logos, ...logos];

  return (
    <section
      aria-labelledby="partner-logos-heading"
      className="relative overflow-hidden py-20 md:py-28"
    >
      {/* Optionaler Hintergrund (Bild oder Video) – wird über Admin gepflegt */}
      <div className="absolute inset-0 -z-10">
        <SiteMedia
          slug="partner-bg"
          alt=""
          className="w-full h-full object-cover"
          videoClassName="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/85" />
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center mb-14">
        <p className="text-gold uppercase tracking-[0.45em] text-xs md:text-sm mb-4">
          Vertrauen durch Qualität
        </p>
        <h2
          id="partner-logos-heading"
          className="font-serif text-3xl md:text-5xl lg:text-6xl text-foreground leading-tight"
        >
          Partner &amp; Marken aus der Region Ingolstadt
        </h2>
      </div>

      <div className="group relative w-full overflow-hidden">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-background to-transparent" />

        <div
          className="flex w-max gap-16 md:gap-24 partner-marquee-track"
          style={{
            animation: `partner-marquee ${Math.max(40, logos.length * 4)}s linear infinite`,
          }}
        >
          {loop.map((p, i) => (
            <a
              key={`${p.id}-${i}`}
              href={p.target_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={p.name}
              title={p.name}
              className="shrink-0 flex items-center justify-center h-[101px] md:h-[118px] min-w-[200px] opacity-80 hover:opacity-100 transition-all duration-300"
            >
              {p.logo_url && (
                <img
                  src={p.logo_url}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="max-h-[101px] md:max-h-[118px] w-auto object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity duration-300"
                  onError={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                  }}
                />
              )}
            </a>
          ))}
        </div>
      </div>

      <p className="max-w-3xl mx-auto px-6 mt-16 text-base md:text-lg text-muted-foreground text-center leading-relaxed">
        Vertrauen durch Qualität: Das Conference &amp; Spa Resort Der Heidehof arbeitet
        eng mit führenden Partnern aus den Bereichen Automobil (Audi), Handel
        (MediaMarktSaturn) und Premium-Wellness zusammen, um Gästen in der Region
        Ingolstadt einen exzellenten Standard zu bieten.
      </p>

      <style>{`
        @keyframes partner-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .group:hover .partner-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .partner-marquee-track {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default PartnerLogosMarquee;
