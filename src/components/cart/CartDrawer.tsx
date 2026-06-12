import { useMemo, useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { useCart, formatEur, parsePriceLabel, type GuestType } from "@/lib/cart/cart-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { foodOrderUpsell } from "@/lib/upselling/suggestions";
import { useNavigate } from "react-router-dom";


type Step = "review" | "details" | "sending" | "done";

interface GuestOption {
  value: GuestType;
  label: string;
  icon: string;
  locationLabel: string;
  locationPlaceholder: string;
  /** wenn true, ist die Nummer/Location pflicht — sonst muss der Gast E-Mail angeben */
  locationRequired: boolean;
}

const GUEST_OPTIONS: GuestOption[] = [
  { value: "hotelgast", label: "Hotel", icon: "🛏", locationLabel: "Zimmernummer", locationPlaceholder: "z. B. 214", locationRequired: true },
  { value: "tagungsgast", label: "Tagung", icon: "📋", locationLabel: "Tagungsraum", locationPlaceholder: "z. B. Berlin", locationRequired: true },
  { value: "restaurantgast", label: "Restaurant", icon: "🍽", locationLabel: "Tischnummer", locationPlaceholder: "z. B. 7", locationRequired: true },
  { value: "poolgast", label: "Pool / Liege", icon: "🏖", locationLabel: "Liegen­nummer", locationPlaceholder: "z. B. Liege 12", locationRequired: true },
  { value: "bargast", label: "Bar (Max)", icon: "🍸", locationLabel: "Barplatz", locationPlaceholder: "z. B. Platz 3", locationRequired: false },
  { value: "spa_tagesgast", label: "Spa-Tagesgast", icon: "💆", locationLabel: "Spa-Schlüssel Nr.", locationPlaceholder: "z. B. 47", locationRequired: false },
  { value: "besucher", label: "Besucher", icon: "✨", locationLabel: "Treffpunkt", locationPlaceholder: "z. B. Lobby", locationRequired: false },
];

export const CartDrawer = () => {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const guestContext = useCart((s) => s.guestContext);
  const setGuestContext = useCart((s) => s.setGuestContext);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.totalEur());
  const count = useCart((s) => s.totalCount());

  const [step, setStep] = useState<Step>("review");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [reference, setReference] = useState(guestContext.reference ?? "");
  const [notes, setNotes] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const upsells = useMemo(() => {
    const hasDrinks = items.some((i) => i.kind === "drink" || /wein|wasser|bier|saft|cocktail|kaffee|tee/i.test(i.title));
    const isEvening = new Date().getHours() >= 17;
    return foodOrderUpsell({ hasDrinks, isEvening, itemCount: items.length });
  }, [items]);


  if (!isOpen) return null;

  const guestType = guestContext.guestType ?? "hotelgast";
  const activeOption = GUEST_OPTIONS.find((o) => o.value === guestType) ?? GUEST_OPTIONS[0];

  // Wenn der Gast keine Nummer/Schlüssel hat, ist E-Mail Pflicht (Datenschutz).
  const hasLocation = reference.trim().length > 0;
  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const contactIsEmail = emailLike.test(contact.trim());
  const emailRequired = !activeOption.locationRequired || !hasLocation;

  const submit = async () => {
    setErrorMsg(null);
    if (!name.trim()) { setErrorMsg("Bitte Namen angeben."); return; }
    if (activeOption.locationRequired && !hasLocation) {
      setErrorMsg(`Bitte ${activeOption.locationLabel} angeben — oder wählen Sie einen anderen Gasttyp.`);
      return;
    }
    if (emailRequired && !contactIsEmail) {
      setErrorMsg("Ohne Zimmer-/Schlüsselnummer benötigen wir Ihre E-Mail, damit wir Sie erreichen können.");
      return;
    }
    if (emailRequired && !privacyAccepted) {
      setErrorMsg("Bitte bestätigen Sie die Datenschutz­hinweise zur E-Mail-Nutzung.");
      return;
    }

    setStep("sending");
    try {
      const payload = {
        guest_type: guestType,
        guest_name: name.trim(),
        contact: contact.trim() || null,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        items: items.map((i) => ({
          id: i.id,
          kind: i.kind,
          title: i.title,
          quantity: i.quantity,
          price_label: i.priceLabel ?? null,
          price_eur: i.priceEur ?? parsePriceLabel(i.priceLabel) ?? null,
          scheduled_for: i.scheduledFor ?? null,
        })),
        total_eur: total,
        source: "silent_order_web",
      };

      const { error } = await supabase.functions.invoke("submit-silent-order", {
        body: payload,
      });
      if (error) throw new Error(error.message ?? "Bestellung fehlgeschlagen");

      setStep("done");
      toast.success("Bestellung übermittelt", {
        description: "Wir kümmern uns sofort darum.",
      });
      setTimeout(() => {
        clear();
        close();
        setStep("review");
        setName(""); setContact(""); setReference(""); setNotes("");
      }, 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStep("details");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Warenkorb"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
        onClick={close}
      />
      <aside className="relative w-full sm:max-w-md h-full bg-gradient-to-b from-neutral-950 to-neutral-900 border-l border-gold/30 shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <header className="flex items-center justify-between p-5 border-b border-gold/15">
          <div className="flex items-center gap-3">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-full bg-gold/15 text-gold">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-serif text-xl text-foreground">Ihre Bestellung</h2>
              <p className="text-xs text-foreground/55">
                {count} {count === 1 ? "Artikel" : "Artikel"} · {formatEur(total)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Schließen"
            className="p-2 rounded-full hover:bg-white/5 text-foreground/60 hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 && step !== "done" && (
            <div className="text-center py-16 text-foreground/55">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gold/40" />
              <p className="font-serif text-lg">Noch keine Artikel ausgewählt.</p>
              <p className="text-sm mt-2">
                Tippen Sie auf <em>Bestellen</em> bei einem Gericht, Getränk oder einer Behandlung.
              </p>
            </div>
          )}

          {items.length > 0 && step === "review" && (
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex gap-3 p-3 rounded-xl border border-white/10 bg-black/30"
                >
                  {i.imageUrl && (
                    <img
                      src={i.imageUrl}
                      alt={i.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground line-clamp-2">{i.title}</p>
                    {i.priceLabel && (
                      <p className="text-xs text-gold/80 tabular-nums">{i.priceLabel}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center rounded-full border border-gold/40 bg-gold/5 text-gold">
                        <button
                          type="button"
                          onClick={() => decrement(i.id)}
                          className="w-7 h-7 inline-flex items-center justify-center hover:bg-gold/15 rounded-l-full"
                          aria-label="Eins weniger"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-sm font-semibold tabular-nums min-w-[28px] text-center">
                          {i.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increment(i.id)}
                          className="w-7 h-7 inline-flex items-center justify-center hover:bg-gold/15 rounded-r-full"
                          aria-label="Eins mehr"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(i.id)}
                        className="ml-auto p-1.5 rounded-full text-foreground/40 hover:bg-red-500/10 hover:text-red-300"
                        aria-label="Entfernen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && step === "review" && (
            <div className="mt-2 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-serif text-base text-foreground">Etwas dazu bestellen?</p>
                <span className="text-[10px] uppercase tracking-wider text-gold/70">Empfehlung</span>
              </div>
              {upsells.length > 0 ? (
                <ul className="space-y-2">
                  {upsells.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-black/30 border border-white/5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-foreground/60 mt-0.5">{s.description}</p>
                      </div>
                      {s.href && (
                        <button
                          type="button"
                          onClick={() => { close(); navigate(s.href!); }}
                          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-gold/40 text-gold text-xs font-semibold hover:bg-gold/10"
                        >
                          <Plus className="w-3 h-3" /> {s.cta}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-foreground/55">
                  Sie haben bereits eine schöne Auswahl. Möchten Sie noch etwas hinzufügen?
                </p>
              )}
              <button
                type="button"
                onClick={close}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-white/15 text-foreground/80 hover:bg-white/5 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Weiter einkaufen
              </button>
            </div>
          )}


          {step === "details" && (
            <div className="space-y-4">
              <p className="text-sm text-foreground/70">
                Damit wir Ihre Bestellung an den richtigen Ort bringen — wo befinden Sie sich?
              </p>

              {/* Gasttyp als visuelle Karten */}
              <div>
                <span className="text-xs uppercase tracking-wider text-foreground/60 mb-2 block">
                  Ich bin gerade …
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {GUEST_OPTIONS.map((o) => {
                    const active = o.value === guestType;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          setGuestContext({ guestType: o.value });
                          setReference("");
                          setErrorMsg(null);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors",
                          active
                            ? "border-gold bg-gold/15 text-foreground"
                            : "border-white/10 bg-black/30 text-foreground/70 hover:border-white/25",
                        )}
                      >
                        <span className="text-lg leading-none" aria-hidden>{o.icon}</span>
                        <span className="text-xs font-medium leading-tight">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-foreground/60 mb-1.5 block">
                  Name *
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-foreground focus:border-gold/60 focus:outline-none"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-foreground/60 mb-1.5 block">
                  {activeOption.locationLabel}{activeOption.locationRequired ? " *" : " (falls vorhanden)"}
                </span>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={activeOption.locationPlaceholder}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-foreground focus:border-gold/60 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-foreground/60 mb-1.5 block">
                  E-Mail{emailRequired ? " *" : " (optional)"}
                </span>
                <input
                  type="email"
                  inputMode="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="name@email.de"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-foreground focus:border-gold/60 focus:outline-none"
                />
                {emailRequired && (
                  <span className="text-[11px] text-foreground/55 mt-1 block">
                    Ohne Zimmer-/Schlüssel­nummer benötigen wir Ihre E-Mail, damit wir Sie zur Bestellung erreichen können.
                  </span>
                )}
              </label>

              {emailRequired && (
                <label className="flex items-start gap-2 text-[11px] text-foreground/65 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 accent-gold"
                  />
                  <span>
                    Ich willige ein, dass meine E-Mail-Adresse ausschließlich zur Abwicklung
                    dieser Bestellung verwendet wird. Details in der{" "}
                    <a href="/datenschutz" target="_blank" rel="noreferrer" className="text-gold underline">
                      Datenschutzerklärung
                    </a>.
                  </span>
                </label>
              )}

              <label className="block">
                <span className="text-xs uppercase tracking-wider text-foreground/60 mb-1.5 block">
                  Anmerkungen (Allergien, Wunschzeit …)
                </span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-foreground focus:border-gold/60 focus:outline-none resize-none"
                />
              </label>



              {errorMsg && (
                <p className="rounded-md border border-red-400/30 bg-red-950/30 px-3 py-2 text-xs text-red-200">
                  {errorMsg}
                </p>
              )}
            </div>
          )}

          {step === "sending" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
              <p className="text-sm text-foreground/70">Bestellung wird übermittelt …</p>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              <p className="font-serif text-xl text-foreground">Danke!</p>
              <p className="text-sm text-foreground/70 max-w-xs">
                Ihre Bestellung ist beim Hotel eingegangen. Wir kümmern uns
                sofort darum.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (step === "review" || step === "details") && (
          <footer className="border-t border-gold/15 p-5 space-y-3 bg-black/40">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-foreground/60">Summe</span>
              <span className="font-serif text-2xl text-gold tabular-nums">
                {formatEur(total)}
              </span>
            </div>

            {step === "review" ? (
              <button
                type="button"
                onClick={() => setStep("details")}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full",
                  "bg-gradient-to-r from-gold to-amber-300 text-black font-semibold text-sm tracking-wider uppercase",
                  "hover:from-amber-300 hover:to-gold transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                )}
              >
                Weiter zur Bestellung
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStep("review")}
                  className="px-4 py-3 rounded-full border border-white/15 text-foreground/80 hover:bg-white/5 text-sm"
                >
                  Zurück
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="px-4 py-3 rounded-full bg-gradient-to-r from-gold to-amber-300 text-black font-semibold text-sm uppercase tracking-wider hover:from-amber-300 hover:to-gold"
                >
                  Jetzt bestellen
                </button>
              </div>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
};
