import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SiteImage } from "@/components/site/SiteImage";

export interface StoryBlockProps {
  eyebrow: string;
  title: string;
  highlight?: string;
  body: ReactNode;
  imageSlug: string;
  imageFallback: string;
  imageAlt: string;
  /** Position of image. Defaults to "right". */
  imageSide?: "left" | "right";
  /** Optional quote / pull-figure rendered below body. */
  pullquote?: { value: string; caption?: string };
  cta?: { label: string; to?: string; href?: string };
}

export const StoryBlock = ({
  eyebrow,
  title,
  highlight,
  body,
  imageSlug,
  imageFallback,
  imageAlt,
  imageSide = "right",
  pullquote,
  cta,
}: StoryBlockProps) => {
  const words = title.split(" ");
  const accent = highlight ?? words[words.length - 1];
  const imageFirst = imageSide === "left";
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-6 py-20 md:py-28 grid md:grid-cols-12 gap-10 md:gap-16 items-center">
      <div className={`md:col-span-6 ${imageFirst ? "md:order-2" : ""}`}>
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold mb-4">{eyebrow}</p>
        <h2 className="font-serif text-foreground text-3xl md:text-5xl leading-tight tracking-tight">
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
        </h2>
        <div className="mt-6 text-muted-foreground text-base md:text-lg leading-relaxed space-y-4">
          {body}
        </div>
        {pullquote && (
          <figure className="mt-8 border-l-2 border-gold/40 pl-5">
            <div className="font-serif text-foreground text-2xl md:text-3xl italic leading-snug">
              {pullquote.value}
            </div>
            {pullquote.caption && (
              <figcaption className="mt-2 text-xs uppercase tracking-[0.2em] text-foreground/60">
                {pullquote.caption}
              </figcaption>
            )}
          </figure>
        )}
        {cta && (
          <div className="mt-8">
            {cta.to ? (
              <Link
                to={cta.to}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-gold hover:gap-3 transition-all"
              >
                {cta.label} <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <a
                href={cta.href}
                className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-gold hover:gap-3 transition-all"
              >
                {cta.label} <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
      <div className={`md:col-span-6 ${imageFirst ? "md:order-1" : ""}`}>
        <div className="relative aspect-[4/5] md:aspect-[5/6] overflow-hidden rounded-2xl border border-gold/15">
          <SiteImage
            slug={imageSlug}
            fallback={imageFallback}
            alt={imageAlt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>
    </section>
  );
};
