import { Minus, Plus, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, type CartItem } from "@/lib/cart/cart-store";

interface AddToCartControlProps {
  item: Omit<CartItem, "quantity">;
  className?: string;
  /** Buttontext, wenn noch nichts im Warenkorb (default: "Bestellen") */
  addLabel?: string;
}

/**
 * Stiller Bestell-Stepper: "Bestellen" → wird zu − [N] +.
 * Klick auf den Stepper-Container öffnet NICHT den Drawer (Card-Click bleibt
 * dafür reserviert), nur der Bag-Button rechts.
 */
export const AddToCartControl = ({
  item,
  className,
  addLabel = "Bestellen",
}: AddToCartControlProps) => {
  const quantity = useCart((s) => s.quantityOf(item.id));
  const add = useCart((s) => s.add);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const openDrawer = useCart((s) => s.open);

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          add(item, 1);
        }}
        className={cn(
          "inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full",
          "border border-gold/45 bg-gold/10 text-gold hover:bg-gold/20 hover:border-gold/70",
          "text-sm font-medium tracking-wide transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
          className,
        )}
        aria-label={`${item.title} bestellen`}
      >
        <Plus className="w-4 h-4" />
        <span>{addLabel}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "flex items-stretch justify-between gap-2 w-full rounded-full",
        "border border-gold/60 bg-gold/10 text-gold p-1",
        className,
      )}
      onClick={stop}
    >
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          decrement(item.id);
        }}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gold/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        aria-label="Eins weniger"
      >
        <Minus className="w-4 h-4" />
      </button>

      <span
        className="flex-1 inline-flex items-center justify-center text-sm font-semibold tabular-nums"
        aria-live="polite"
        aria-label={`${quantity} im Warenkorb`}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={(e) => {
          stop(e);
          increment(item.id);
        }}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-gold/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        aria-label="Eins mehr"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          stop(e);
          openDrawer();
        }}
        className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full bg-gold text-black hover:bg-gold/90 transition-colors text-xs font-semibold uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        aria-label="Warenkorb öffnen"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Korb</span>
      </button>
    </div>
  );
};
