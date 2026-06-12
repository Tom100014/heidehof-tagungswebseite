import { useState } from "react";
import { Leaf, WheatOff, AlertCircle, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type DietFilter = "vegan" | "vegetarian" | "glutenfree";

// EU allergen numbering (1–14) + common labels
export const ALLERGENS: { code: string; label: string }[] = [
  { code: "A", label: "Gluten" },
  { code: "B", label: "Krebstiere" },
  { code: "C", label: "Eier" },
  { code: "D", label: "Fisch" },
  { code: "E", label: "Erdnüsse" },
  { code: "F", label: "Soja" },
  { code: "G", label: "Milch / Laktose" },
  { code: "H", label: "Schalenfrüchte" },
  { code: "L", label: "Sellerie" },
  { code: "M", label: "Senf" },
  { code: "N", label: "Sesam" },
  { code: "O", label: "Sulfite" },
  { code: "P", label: "Lupinen" },
  { code: "R", label: "Weichtiere" },
];

interface Props {
  diet: Set<DietFilter>;
  excludedAllergens: Set<string>;
  onDietChange: (d: Set<DietFilter>) => void;
  onAllergensChange: (a: Set<string>) => void;
  variant?: "food" | "drink";
}

/**
 * Premium allergen + dietary filter bar used on Speise/Getränkekarte.
 * Keeps a thin pill row visible; opens a panel for full allergen list.
 */
export const MenuFilters = ({
  diet,
  excludedAllergens,
  onDietChange,
  onAllergensChange,
  variant = "food",
}: Props) => {
  const [open, setOpen] = useState(false);
  const toggleDiet = (d: DietFilter) => {
    const next = new Set(diet);
    next.has(d) ? next.delete(d) : next.add(d);
    onDietChange(next);
  };
  const toggleAllergen = (code: string) => {
    const next = new Set(excludedAllergens);
    next.has(code) ? next.delete(code) : next.add(code);
    onAllergensChange(next);
  };
  const clear = () => {
    onDietChange(new Set());
    onAllergensChange(new Set());
  };

  const active = diet.size + excludedAllergens.size;
  const dietOptions: { key: DietFilter; label: string; icon: typeof Leaf }[] =
    variant === "food"
      ? [
          { key: "vegan", label: "Vegan", icon: Leaf },
          { key: "vegetarian", label: "Vegetarisch", icon: Leaf },
          { key: "glutenfree", label: "Glutenfrei", icon: WheatOff },
        ]
      : [{ key: "vegan", label: "Alkoholfrei", icon: Leaf }];

  return (
    <div className="mb-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        {dietOptions.map(({ key, label, icon: Icon }) => {
          const isOn = diet.has(key);
          return (
            <button
              key={key}
              onClick={() => toggleDiet(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors",
                isOn
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-foreground/15 text-foreground/65 hover:text-foreground hover:border-foreground/30",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}

        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors ml-auto",
            excludedAllergens.size > 0 || open
              ? "border-gold bg-gold/10 text-gold"
              : "border-foreground/15 text-foreground/65 hover:text-foreground hover:border-foreground/30",
          )}
          aria-expanded={open}
          aria-controls="allergen-panel"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Allergene ausschließen
          {excludedAllergens.size > 0 && (
            <span className="ml-1 rounded-full bg-gold/30 px-1.5 text-[10px] text-foreground">
              {excludedAllergens.size}
            </span>
          )}
        </button>

        {active > 0 && (
          <button
            onClick={clear}
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground"
          >
            <X className="h-3 w-3" /> Zurücksetzen
          </button>
        )}
      </div>

      {open && (
        <div
          id="allergen-panel"
          className="mt-3 rounded-xl border border-gold/20 bg-[#0a0a0a]/70 p-4"
        >
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/60 mb-3">
            <AlertCircle className="h-3.5 w-3.5 text-gold" />
            Gerichte mit diesen Allergenen ausblenden
          </p>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map(({ code, label }) => {
              const isOn = excludedAllergens.has(code);
              return (
                <button
                  key={code}
                  onClick={() => toggleAllergen(code)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                    isOn
                      ? "border-red-400/60 bg-red-500/10 text-red-200 line-through"
                      : "border-foreground/15 text-foreground/75 hover:text-foreground hover:border-foreground/35",
                  )}
                >
                  <span className="font-mono text-[10px] opacity-70">{code}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Filter logic — pass a row's allergens + dietary booleans + filter sets
 * and get back whether it should be shown.
 */
export function passesMenuFilters(
  row: {
    allergens?: string[] | null;
    is_vegan?: boolean;
    is_vegetarian?: boolean;
    is_glutenfree?: boolean;
  },
  diet: Set<DietFilter>,
  excluded: Set<string>,
): boolean {
  if (diet.has("vegan") && !row.is_vegan) return false;
  if (diet.has("vegetarian") && !(row.is_vegetarian || row.is_vegan)) return false;
  if (diet.has("glutenfree") && !row.is_glutenfree) return false;
  if (excluded.size > 0 && row.allergens && row.allergens.some((a) => excluded.has(a))) return false;
  return true;
}
