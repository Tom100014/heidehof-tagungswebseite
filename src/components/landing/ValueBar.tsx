import { LucideIcon } from "lucide-react";

export interface ValueBarItem {
  icon?: LucideIcon;
  value: string;
  label: string;
}

interface ValueBarProps {
  items: ValueBarItem[];
  /** Optional className overrides for outer wrapper */
  className?: string;
}

/**
 * Editoriale Werte-Bar unterhalb eines Hero-Videos/Bilds.
 * Ersetzt die alten Glass-Trust-Karten. Hairline-Inline, kein Glas, kein Schatten.
 */
export const ValueBar = ({ items, className = "" }: ValueBarProps) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <div className="grid grid-cols-2 md:grid-cols-4">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div
              key={i}
              className={`flex items-center gap-4 px-5 md:px-8 py-6 md:py-7 ${
                i > 0 ? "md:border-l md:border-gold/15" : ""
              } ${i < 2 ? "border-b md:border-b-0 border-gold/10" : ""}`}
            >
              {Icon && (
                <Icon
                  className="w-4 h-4 text-gold/80 shrink-0"
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <div className="font-serif text-base md:text-lg text-foreground leading-tight truncate">
                  {it.value}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.32em] text-foreground/55 font-medium truncate">
                  {it.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </div>
  );
};
