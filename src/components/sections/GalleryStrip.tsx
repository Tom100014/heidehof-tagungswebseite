import { SiteImage } from "@/components/site/SiteImage";

export interface GalleryStripItem {
  slug: string;
  imageSlug: string;
  imageFallback: string;
  alt: string;
  caption?: string;
}

export interface GalleryStripProps {
  sectionEyebrow?: string;
  sectionTitle?: string;
  items: GalleryStripItem[];
}

/**
 * Horizontal snap-scroll strip on mobile, balanced grid on desktop.
 * Replaces ad-hoc image grids spread across subpages.
 */
export const GalleryStrip = ({
  sectionEyebrow,
  sectionTitle,
  items,
}: GalleryStripProps) => {
  return (
    <section className="py-16 md:py-24">
      {(sectionEyebrow || sectionTitle) && (
        <header className="max-w-7xl mx-auto px-5 sm:px-6 mb-10 md:mb-14">
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
        </header>
      )}

      <div
        className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it) => (
          <figure
            key={it.slug}
            className="snap-start shrink-0 w-[78vw] max-w-[360px]"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gold/15">
              <SiteImage
                slug={it.imageSlug}
                fallback={it.imageFallback}
                alt={it.alt}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            {it.caption && (
              <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-foreground/60">
                {it.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <div className="hidden md:block max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-3 gap-5">
          {items.map((it, i) => (
            <figure
              key={it.slug}
              className={i % 5 === 0 ? "col-span-2 row-span-2" : ""}
            >
              <div
                className={`relative overflow-hidden rounded-2xl border border-gold/15 ${
                  i % 5 === 0 ? "aspect-[5/6]" : "aspect-[4/5]"
                }`}
              >
                <SiteImage
                  slug={it.imageSlug}
                  fallback={it.imageFallback}
                  alt={it.alt}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              {it.caption && (
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-foreground/60">
                  {it.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
