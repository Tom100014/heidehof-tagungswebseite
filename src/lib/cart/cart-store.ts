/**
 * Globaler Warenkorb für das stille Bestellsystem.
 *
 * - Speichert Artikel aus Speisekarte, Getränkekarte und Spa/Wellness
 * - Persistiert in localStorage (Survives Reloads, Tab-Wechsel)
 * - Trägt einen optionalen `guestContext`, der beim Checkout in die richtige
 *   Tabelle (conference_orders, room_orders, restaurant_orders) routet.
 *
 * Voice-Bestellungen (Clara) hängen sich später an dieselbe Pipeline.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItemKind = "food" | "drink" | "treatment";

export interface CartItem {
  /** stabiler Produkt-Slug oder UUID — Dedupe-Key */
  id: string;
  kind: CartItemKind;
  title: string;
  priceLabel?: string | null;
  priceEur?: number | null;
  imageUrl?: string | null;
  quantity: number;
  /** für Spa: gewünschter Termin (ISO) */
  scheduledFor?: string | null;
  note?: string | null;
}

export type GuestType =
  | "tagungsgast"
  | "hotelgast"
  | "restaurantgast"
  | "poolgast"
  | "bargast"
  | "spa_tagesgast"
  | "besucher";


export interface GuestContext {
  guestType?: GuestType;
  /** Tagungsraum-Name oder ID, falls Tagungsgast */
  room?: string;
  /** Zimmernummer, falls Hotelgast */
  roomNumber?: string;
  /** frei für Notizen / Tischnummer */
  reference?: string;
}

interface CartState {
  items: CartItem[];
  guestContext: GuestContext;
  isOpen: boolean;

  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQuantity: (id: string, qty: number) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  setGuestContext: (ctx: Partial<GuestContext>) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;

  /** Helfer für Komponenten */
  quantityOf: (id: string) => number;
  totalCount: () => number;
  totalEur: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      guestContext: {},
      isOpen: false,

      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),

      setQuantity: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.id !== id)
              : s.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
        })),

      increment: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        })),

      decrement: (id) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id);
          if (!item) return s;
          if (item.quantity <= 1) {
            return { items: s.items.filter((i) => i.id !== id) };
          }
          return {
            items: s.items.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity - 1 } : i,
            ),
          };
        }),

      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      setGuestContext: (ctx) =>
        set((s) => ({ guestContext: { ...s.guestContext, ...ctx } })),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      quantityOf: (id) => get().items.find((i) => i.id === id)?.quantity ?? 0,
      totalCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
      totalEur: () =>
        get().items.reduce(
          (sum, i) => sum + (i.priceEur ?? parsePriceLabel(i.priceLabel) ?? 0) * i.quantity,
          0,
        ),
    }),
    {
      name: "heidehof_cart_v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, guestContext: s.guestContext }),
    },
  ),
);

/** Best-effort Preis-Parser für "EUR 18,50" / "18,50 €" / "18.50". */
export function parsePriceLabel(label?: string | null): number | null {
  if (!label) return null;
  const match = label.replace(/\s/g, "").match(/([0-9]+[.,]?[0-9]*)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
