import { Fragment } from "react";

export interface MenuItem {
  title: string;
  description?: string;
  price?: string;
  /** Optional badge, e.g. "vegan", "neu", "saison" */
  tag?: string;
}

export interface MenuCategory {
  title: string;
  intro?: string;
  items: MenuItem[];
}

export interface MenuListProps {
  sectionEyebrow?: string;
  sectionTitle?: string;
  sectionLead?: string;
  categories: MenuCategory[];
}

/**
 * Editorial "index" menu list with dotted leader between title and price.
 * No images — designed to give menu pages a distinct, calm typographic identity.
 */
export const MenuList = ({
  sectionEyebrow,
  sectionTitle,
  sectionLead,
  categories,
}: MenuListProps) => {
  return (
    <section className="max-w-4xl mx-auto px-5 sm:px-6 py-16 md:py-24">
      {(sectionEyebrow || sectionTitle || sectionLead) && (
        <header className="mb-12 md:mb-16">
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
            <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              {sectionLead}
            </p>
          )}
        </header>
      )}

      <div className="space-y-14 md:space-y-20">
        {categories.map((cat, ci) => (
          <Fragment key={ci}>
            <div>
              <div className="flex items-baseline gap-4 mb-6">
                <h3 className="font-serif text-2xl md:text-3xl text-foreground tracking-tight">
                  {cat.title}
                </h3>
                <div className="flex-1 h-px bg-gold/25" />
              </div>
              {cat.intro && (
                <p className="text-sm text-muted-foreground italic mb-6 max-w-2xl">
                  {cat.intro}
                </p>
              )}
              <ul className="divide-y divide-gold/10">
                {cat.items.map((item, i) => (
                  <li key={i} className="py-4 flex items-baseline gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-serif text-base md:text-lg text-foreground">
                          {item.title}
                        </span>
                        {item.tag && (
                          <span className="text-[10px] uppercase tracking-[0.18em] text-gold/80 border border-gold/30 px-1.5 py-0.5 rounded">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.price && (
                      <span className="font-serif text-base md:text-lg text-gold whitespace-nowrap tabular-nums">
                        {item.price}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
};
