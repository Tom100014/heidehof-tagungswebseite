import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  id?: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  priceLabel?: string | null;
  metaLine?: string | null;
  tags?: string[];
  footer?: ReactNode;
  onClick?: () => void;
  className?: string;
  claraContext?: string;
  claraCategory?: string;
  imageAspect?: "square" | "portrait" | "landscape";
  imageFallback?: ReactNode;
}

const aspectClass = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
} as const;

/**
 * Unified premium card for food / drink / treatment menu pages.
 * Image-led, calm typography, subtle gold accents.
 */
export const MenuItemCard = ({
  id,
  title,
  description,
  imageUrl,
  priceLabel,
  metaLine,
  tags = [],
  footer,
  onClick,
  className,
  claraContext,
  claraCategory,
  imageAspect = "landscape",
  imageFallback,
}: MenuItemCardProps) => {
  const interactive = !!onClick;
  return (
    <article
      id={id}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      data-clara-context={claraContext ?? title}
      data-clara-category={claraCategory}
      data-clara-name={title}
      data-clara-slug={id}
      data-clara-target={id}
      className={cn(
        "group relative flex flex-col bg-[#0a0a0a]/60 border border-gold/15 overflow-hidden rounded-2xl transition-all duration-500",
        interactive && "cursor-pointer hover:border-gold/45 hover:bg-[#0d0d0d]/80",
        className,
      )}
    >
      {/* Image */}
      <div className={cn("relative overflow-hidden bg-[#0a0a0a]", aspectClass[imageAspect])}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          imageFallback ?? (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800/30 to-stone-950" aria-hidden />
          )
        )}
        {/* stronger bottom gradient so the price pill always reads */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

        {priceLabel && (
          <span
            className={cn(
              "absolute bottom-3 right-3 inline-flex items-center rounded-full",
              "px-3.5 py-1.5 text-[13px] font-medium tabular-nums tracking-tight",
              "text-white/95 border border-[hsl(38_45%_82%/0.55)]",
              "bg-black/55 backdrop-blur-md",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_6px_18px_-6px_rgba(0,0,0,0.7)]",
            )}
          >
            {priceLabel}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 md:p-6">
        {metaLine && (
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold/80 mb-2">{metaLine}</p>
        )}
        <h3 className="font-serif text-2xl md:text-[1.6rem] leading-tight text-foreground mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-[15px] text-foreground/80 leading-relaxed mb-4 line-clamp-3">
            {description}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-gold/10">
            {tags.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-foreground/80"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </article>
  );
};
