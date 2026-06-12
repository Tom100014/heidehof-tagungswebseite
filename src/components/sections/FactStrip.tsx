export interface Fact {
  value: string;
  label: string;
  sub?: string;
}

export interface FactStripProps {
  facts: Fact[];
  /** Subtle eyebrow label above the strip. */
  eyebrow?: string;
}

/**
 * Editorial Hairline Strip — keine Box, keine Karten. Nur große Serif-Zahlen
 * über Hairline-Trennern. Awwwards-tauglich, ruhig, ohne Bootstrap-Optik.
 */
export const FactStrip = ({ facts, eyebrow }: FactStripProps) => {
  return (
    <section aria-label="Hotel Kennzahlen" className="relative bg-background">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 md:py-20">
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.42em] text-gold/70 mb-10 text-center font-medium">
            {eyebrow}
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {facts.map((f, i) => (
            <div
              key={i}
              className={`text-center px-4 md:px-8 py-6 md:py-0 ${
                i > 0 ? "md:border-l md:border-gold/12" : ""
              } ${i < 2 ? "border-b md:border-b-0 border-gold/10" : ""}`}
            >
              <div className="font-serif text-5xl md:text-6xl lg:text-7xl text-foreground/95 leading-none tabular-nums tracking-tight">
                {f.value}
              </div>
              <div className="mt-4 text-[10px] uppercase tracking-[0.32em] text-gold/85 font-medium">
                {f.label}
              </div>
              {f.sub && (
                <div className="mt-1 text-[11px] text-foreground/55 font-light">
                  {f.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
    </section>
  );
};
