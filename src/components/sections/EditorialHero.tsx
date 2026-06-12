import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { SiteMedia } from "@/components/site/SiteMedia";

export type EditorialHeroVariant = "full" | "split";

export interface EditorialHeroProps {
  variant?: EditorialHeroVariant;
  eyebrow: string;
  title: string;
  /** Optional: a single word in the title to render as italic gold accent. Defaults to last word. */
  highlight?: string;
  lead?: string;
  imageSlug: string;
  imageFallback: string;
  primaryCta?: { label: string; onClick?: () => void; to?: string; href?: string };
  secondaryCta?: { label: string; to?: string; href?: string };
  /** Optional content rendered below CTAs (e.g. live badge, weather strip). */
  meta?: ReactNode;
}

/**
 * One hero archetype, two layouts.
 *  - "full":  cinematic full-bleed image with overlay (landing-style)
 *  - "split": image on the right (desktop), typography on the left
 *
 * Used by all service subpages to replace bespoke hero copies.
 */
export const EditorialHero = ({
  variant = "split",
  eyebrow,
  title,
  highlight,
  lead,
  imageSlug,
  imageFallback,
  primaryCta,
  secondaryCta,
  meta,
}: EditorialHeroProps) => {
  const renderTitle = () => {
    const words = title.split(" ");
    const accent = highlight ?? words[words.length - 1];
    return (
      <>
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
      </>
    );
  };

  const CTAButton = ({
    cta,
    primary,
  }: {
    cta: { label: string; onClick?: () => void; to?: string; href?: string };
    primary: boolean;
  }) => {
    const base = primary
      ? "inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[52px] rounded-2xl text-xs uppercase tracking-[0.18em] bg-gold text-background hover:bg-gold/90 transition-all"
      : "inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[52px] rounded-2xl text-xs uppercase tracking-[0.18em] border border-gold/35 text-foreground hover:bg-gold/10 transition-all";
    const content = (
      <>
        {cta.label}
        {primary && <ArrowRight className="w-4 h-4" />}
      </>
    );
    if (cta.to) return <Link to={cta.to} className={base}>{content}</Link>;
    if (cta.href) return <a href={cta.href} className={base}>{content}</a>;
    return (
      <button type="button" onClick={cta.onClick} className={base}>
        {content}
      </button>
    );
  };

  if (variant === "full") {
    return (
      <section className="relative min-h-[78svh] md:min-h-[92svh] flex items-end overflow-hidden">
        <SiteMedia
          slug={imageSlug}
          fallback={imageFallback}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6 pb-12 sm:pb-20">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold mb-4">{eyebrow}</p>
          <h1 className="font-serif text-white text-[2.4rem] leading-[1.04] sm:text-5xl md:text-7xl tracking-tight max-w-4xl">
            {renderTitle()}
          </h1>
          {lead && (
            <p className="text-white/85 max-w-2xl mt-6 text-base md:text-lg leading-relaxed">
              {lead}
            </p>
          )}
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-3 pt-7">
              {primaryCta && <CTAButton cta={primaryCta} primary />}
              {secondaryCta && <CTAButton cta={secondaryCta} primary={false} />}
            </div>
          )}
          {meta && <div className="mt-6">{meta}</div>}
        </div>
      </section>
    );
  }

  // split variant
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 pt-28 md:pt-40 pb-16 md:pb-24 grid md:grid-cols-12 gap-10 md:gap-16 items-center">
        <div className="md:col-span-6 order-2 md:order-1">
          <p className="text-[11px] uppercase tracking-[0.28em] text-gold mb-5">{eyebrow}</p>
          <h1 className="font-serif text-foreground text-[2.4rem] leading-[1.05] sm:text-5xl md:text-6xl tracking-tight">
            {renderTitle()}
          </h1>
          {lead && (
            <p className="text-muted-foreground max-w-xl mt-6 text-base md:text-lg leading-relaxed">
              {lead}
            </p>
          )}
          {(primaryCta || secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-3 pt-7">
              {primaryCta && <CTAButton cta={primaryCta} primary />}
              {secondaryCta && <CTAButton cta={secondaryCta} primary={false} />}
            </div>
          )}
          {meta && <div className="mt-6">{meta}</div>}
        </div>
        <div className="md:col-span-6 order-1 md:order-2">
          <div className="relative aspect-[4/5] md:aspect-[5/6] overflow-hidden rounded-2xl border border-gold/15">
            <SiteMedia
              slug={imageSlug}
              fallback={imageFallback}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
