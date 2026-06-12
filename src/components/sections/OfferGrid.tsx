import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteImage } from "@/components/site/SiteImage";

export interface OfferGridItem {
  slug: string;
  eyebrow?: string;
  title: string;
  body?: string;
  imageSlug: string;
  imageFallback: string;
  priceLabel?: string;
  cta?: { label: string; to?: string; href?: string };
}

export interface OfferGridProps {
  sectionEyebrow?: string;
  sectionTitle?: string;
  sectionLead?: string;
  items: OfferGridItem[];
  /** Columns on desktop. Defaults to 3. */
  columns?: 2 | 3 | 4;
}

const colsClass: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

export const OfferGrid = ({
  sectionEyebrow,
  sectionTitle,
  sectionLead,
  items,
  columns = 3,
}: OfferGridProps) => {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-6 py-20 md:py-28">
      {(sectionEyebrow || sectionTitle || sectionLead) && (
        <header className="mb-12 md:mb-16 max-w-3xl">
          {sectionEyebrow && (
            <p className="text-[11px] uppercase tracking-[0.28em] text-gold mb-4">
              {sectionEyebrow}
            </p>
          )}
          {sectionTitle && (
            <h2 className="font-serif text-foreground text-3xl md:text-5xl leading-tight tracking-tight">
              {sectionTitle}
            </h2>
          )}
          {sectionLead && (
            <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed">
              {sectionLead}
            </p>
          )}
        </header>
      )}

      <ul className={`grid grid-cols-1 ${colsClass[columns]} gap-5 md:gap-6`}>
        {items.map((item) => {
          const inner = (
            <article className="group relative flex flex-col h-full rounded-2xl border border-gold/15 bg-card/30 overflow-hidden transition-all hover:border-gold/40">
              <div className="relative aspect-[4/3] overflow-hidden">
                <SiteImage
                  slug={item.imageSlug}
                  fallback={item.imageFallback}
                  alt={item.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {item.priceLabel && (
                  <span className="absolute top-3 right-3 inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] bg-background/85 text-gold border border-gold/30 backdrop-blur">
                    {item.priceLabel}
                  </span>
                )}
              </div>
              <div className="p-5 md:p-6 flex flex-col flex-1">
                {item.eyebrow && (
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gold/80 mb-2">
                    {item.eyebrow}
                  </p>
                )}
                <h3 className="font-serif text-xl md:text-2xl text-foreground leading-snug">
                  {item.title}
                </h3>
                {item.body && (
                  <p className="mt-3 text-sm md:text-[15px] text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                )}
                {item.cta && (
                  <span className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold group-hover:gap-3 transition-all">
                    {item.cta.label} <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </div>
            </article>
          );
          if (item.cta?.to) {
            return (
              <li key={item.slug}>
                <Link to={item.cta.to} className="block h-full">
                  {inner}
                </Link>
              </li>
            );
          }
          if (item.cta?.href) {
            return (
              <li key={item.slug}>
                <a href={item.cta.href} className="block h-full">
                  {inner}
                </a>
              </li>
            );
          }
          return <li key={item.slug}>{inner}</li>;
        })}
      </ul>
    </section>
  );
};
