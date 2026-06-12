import { ReactNode } from "react";

export interface IndexHeroProps {
  eyebrow: string;
  title: string;
  /** Optional: word to highlight italic-gold. Defaults to last word. */
  highlight?: string;
  lead?: string;
  /** Optional accessory line, e.g. "Heute: Saisonale Karte" */
  accessory?: ReactNode;
}

/**
 * Typographic hero without imagery — for menu pages, legal pages, technical lists.
 * Establishes a calm, editorial tone in contrast to image-heavy service heroes.
 */
export const IndexHero = ({ eyebrow, title, highlight, lead, accessory }: IndexHeroProps) => {
  const words = title.split(" ");
  const accent = highlight ?? words[words.length - 1];
  return (
    <section className="relative">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 pt-28 md:pt-44 pb-14 md:pb-24">
        <p className="text-[11px] uppercase tracking-[0.32em] text-gold mb-6">{eyebrow}</p>
        <h1 className="font-serif text-foreground text-[2.6rem] leading-[1.02] sm:text-6xl md:text-8xl tracking-tight">
          {words.map((w, i) => {
            const isAccent = w === accent;
            const space = i < words.length - 1 ? " " : "";
            return (
              <span key={i} className={isAccent ? "italic text-gold" : undefined}>
                {w}
                {space}
              </span>
            );
          })}
        </h1>
        {lead && (
          <p className="text-muted-foreground max-w-2xl mt-8 text-base md:text-lg leading-relaxed">
            {lead}
          </p>
        )}
        {accessory && <div className="mt-8 text-sm text-foreground/70">{accessory}</div>}
        <div className="mt-10 h-px w-24 bg-gold/40" />
      </div>
    </section>
  );
};
