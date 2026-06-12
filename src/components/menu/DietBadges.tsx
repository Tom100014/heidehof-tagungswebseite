import { Leaf, WheatOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  isVegan?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  allergens?: string[] | null;
  className?: string;
}

/** Compact diet + allergen badge row (luxury minimal). */
export const DietBadges = ({
  isVegan,
  isVegetarian,
  isGlutenFree,
  allergens,
  className,
}: Props) => {
  const items: { label: string; icon?: typeof Leaf; tone?: "good" | "neutral" }[] = [];
  if (isVegan) items.push({ label: "Vegan", icon: Leaf, tone: "good" });
  else if (isVegetarian) items.push({ label: "Vegetarisch", icon: Leaf, tone: "good" });
  if (isGlutenFree) items.push({ label: "Glutenfrei", icon: WheatOff, tone: "good" });

  if (items.length === 0 && (!allergens || allergens.length === 0)) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <span
            key={i}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.15em]",
              it.tone === "good"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/25"
                : "bg-white/[0.04] text-foreground/70 border border-white/15",
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {it.label}
          </span>
        );
      })}
      {allergens && allergens.length > 0 && (
        <span
          title={`Allergene: ${allergens.join(", ")}`}
          className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-foreground/60"
        >
          <span className="font-mono">{allergens.join("·")}</span>
        </span>
      )}
    </div>
  );
};
