import { ShoppingBag } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useCart, formatEur } from "@/lib/cart/cart-store";
import { cn } from "@/lib/utils";

/**
 * Floating Warenkorb-Button (unten rechts).
 * Erscheint nur, wenn mind. 1 Artikel im Korb ist.
 * Auf Admin-Seiten unsichtbar.
 */
export const FloatingCartButton = () => {
  const count = useCart((s) => s.totalCount());
  const total = useCart((s) => s.totalEur());
  const open = useCart((s) => s.open);
  const { pathname } = useLocation();

  if (pathname.startsWith("/admin")) return null;
  if (count === 0) return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Warenkorb öffnen — ${count} Artikel`}
      className={cn(
        "fixed bottom-4 right-4 z-[90] pointer-events-auto",
        "inline-flex items-center gap-3 px-5 py-3 rounded-full",
        "bg-gradient-to-r from-gold to-amber-300 text-black",
        "shadow-[0_8px_30px_-8px_rgba(201,168,76,0.6)] hover:shadow-[0_10px_40px_-8px_rgba(201,168,76,0.85)]",
        "border border-gold/60 backdrop-blur-sm",
        "transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
      )}
    >
      <span className="relative inline-flex">
        <ShoppingBag className="w-5 h-5" strokeWidth={2.2} />
        <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-black text-white text-[11px] font-bold inline-flex items-center justify-center tabular-nums">
          {count}
        </span>
      </span>
      {total > 0 && (
        <span className="text-sm font-semibold tabular-nums">{formatEur(total)}</span>
      )}
      <span className="text-xs font-semibold uppercase tracking-wider border-l border-black/30 pl-3">
        Bestellen
      </span>
    </button>
  );
};
