import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, ChevronDown, MapPin, Users, Utensils, Sparkles, Check, Fish, Beef, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchMenuByDate, type ConferenceMenu, type MainDish } from "@/services/conference/menu-service";
import { createConferenceOrder, type DishType, type MealType } from "@/services/conference/orders-service";
import { toast } from "sonner";

interface Room { id: string; name: string; capacity: number; }
interface DailyAssets { pdf_url: string | null; images: Record<string, string> | null; }

type Selection = Record<MealType, DishType | null>;
type Quantities = Record<MealType, number>;

const todayISO = () => format(new Date(), "yyyy-MM-dd");

const dishIcon = (t: DishType) => t === "fish" ? Fish : t === "meat" ? Beef : Leaf;
const dishLabel = (t: DishType) => t === "fish" ? "Fisch" : t === "meat" ? "Fleisch" : "Vegetarisch";

export default function ConferenceMenuOrder() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [menu, setMenu] = useState<ConferenceMenu | null>(null);
  const [assets, setAssets] = useState<DailyAssets | null>(null);

  const [serviceDate, setServiceDate] = useState(todayISO());
  const [roomId, setRoomId] = useState<string>("");
  const [participants, setParticipants] = useState(8);
  const [guestName, setGuestName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [selection, setSelection] = useState<Selection>({ lunch: null, dinner: null });
  const [quantities, setQuantities] = useState<Quantities>({ lunch: 0, dinner: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.from("conference_rooms").select("id,name,capacity").eq("is_active", true).order("sort_order")
      .then(({ data }) => { if (data) { setRooms(data); if (!roomId && data[0]) setRoomId(data[0].id); } });
  }, []);

  useEffect(() => {
    fetchMenuByDate(serviceDate).then(setMenu).catch(() => setMenu(null));
    supabase.from("daily_menu_assets").select("pdf_url,images").eq("menu_date", serviceDate).maybeSingle()
      .then(({ data }) => setAssets(data as any));
    setSelection({ lunch: null, dinner: null });
    setQuantities({ lunch: 0, dinner: 0 });
  }, [serviceDate]);

  const totalSelected = quantities.lunch + quantities.dinner;
  const canSubmit = roomId && guestName && participants > 0 && totalSelected > 0 && menu;

  async function handleSubmit() {
    if (!canSubmit || !menu) return;
    setSubmitting(true);
    try {
      for (const meal of ["lunch", "dinner"] as MealType[]) {
        const sel = selection[meal];
        const qty = quantities[meal];
        if (!sel || qty <= 0) continue;
        await createConferenceOrder({
          guest_name: guestName, company, email, notes,
          service_date: serviceDate, room_id: roomId, meal_type: meal,
          menu_id: menu.id!, participants,
          items: [
            { menu_id: menu.id!, course: "appetizer", dish_type: null, quantity: qty },
            { menu_id: menu.id!, course: "main", dish_type: sel, quantity: qty },
            { menu_id: menu.id!, course: "dessert", dish_type: null, quantity: qty },
          ],
        });
      }
      setDone(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Fehler beim Senden");
    } finally { setSubmitting(false); }
  }

  if (done) return <DoneScreen onRestart={() => window.location.reload()} />;

  return (
    <div className="luxe-bg min-h-screen relative">
      <Hero date={serviceDate} bg={assets?.images?.lunch_meat || assets?.images?.lunch_fish || null} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10 grid lg:grid-cols-[1fr,380px] gap-8 pb-32">
        <div className="space-y-12">
          {/* Section 1: Tagung */}
          <section className="glass-card rounded-3xl p-8 reveal">
            <SectionTitle eyebrow="01 — Ihre Tagung" title="Wir freuen uns auf Sie" />
            <div className="grid sm:grid-cols-2 gap-5 mt-8">
              <Field label="Datum" icon={Calendar}>
                <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)}
                  className="w-full bg-transparent text-luxe-cream text-lg outline-none [color-scheme:dark]" />
              </Field>
              <Field label="Personen" icon={Users}>
                <Stepper value={participants} onChange={setParticipants} min={1} max={120} />
              </Field>
            </div>

            <div className="mt-6">
              <label className="text-xs uppercase tracking-[0.25em] text-amber-200/70 flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Tagungsraum</label>
              <div className="flex flex-wrap gap-2 mt-3">
                {rooms.map((r) => (
                  <button key={r.id} type="button" onClick={() => setRoomId(r.id)}
                    className={`px-5 py-2.5 rounded-full text-sm transition-all ${roomId === r.id
                      ? "bg-amber-300 text-stone-900 shadow-[0_8px_30px_-10px_rgba(217,180,90,0.7)]"
                      : "border border-amber-300/30 text-amber-100/80 hover:border-amber-300/70 hover:bg-amber-300/5"}`}>
                    {r.name}<span className="opacity-60 ml-2 text-xs">{r.capacity} P.</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 mt-6">
              <Field label="Name *"><input value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full bg-transparent text-luxe-cream outline-none" placeholder="Max Mustermann" /></Field>
              <Field label="Firma"><input value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-transparent text-luxe-cream outline-none" /></Field>
              <Field label="E-Mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent text-luxe-cream outline-none" /></Field>
            </div>
          </section>

          {/* Section 2: Tageskarte */}
          {(assets?.pdf_url || assets?.images) && (
            <section className="reveal reveal-delay-1">
              <SectionTitle eyebrow="02 — Tageskarte" title="Heute im Hause" />
              <div className="mt-6 flex flex-wrap gap-4">
                {assets?.pdf_url && (
                  <a href={assets.pdf_url} target="_blank" rel="noreferrer" className="btn-luxe inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Speisekarte ansehen
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Section 3: Mittag */}
          {menu && <MealSection meal="lunch" menu={menu} assets={assets} selection={selection} quantities={quantities}
            onSelect={(d) => setSelection(s => ({ ...s, lunch: d }))}
            onQty={(q) => setQuantities(s => ({ ...s, lunch: q }))} maxQty={participants} />}

          {/* Section 4: Abend */}
          {menu && <MealSection meal="dinner" menu={menu} assets={assets} selection={selection} quantities={quantities}
            onSelect={(d) => setSelection(s => ({ ...s, dinner: d }))}
            onQty={(q) => setQuantities(s => ({ ...s, dinner: q }))} maxQty={participants} />}

          {!menu && (
            <div className="glass-card rounded-3xl p-12 text-center text-amber-100/70">
              <Utensils className="w-10 h-10 mx-auto mb-4 text-amber-200/60" />
              Für dieses Datum wurde noch kein Tagesmenü gepflegt.
            </div>
          )}
        </div>

        {/* Sticky Sidebar */}
        <aside className="lg:sticky lg:top-8 self-start">
          <div className="glass-card rounded-3xl p-7 reveal reveal-delay-2">
            <div className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Ihre Auswahl</div>
            <h3 className="font-display text-2xl mt-2 apple-text">Bestellübersicht</h3>
            <div className="apple-divider my-5" />
            <SummaryLine label="Mittag" sel={selection.lunch} qty={quantities.lunch} menu={menu} meal="lunch" />
            <SummaryLine label="Abend" sel={selection.dinner} qty={quantities.dinner} menu={menu} meal="dinner" />
            <div className="apple-divider my-5" />
            <div className="text-sm">
              <label className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Anmerkungen / Allergien</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="mt-2 w-full rounded-xl bg-stone-900/50 border border-amber-300/15 p-3 text-amber-50 outline-none focus:border-amber-300/50" />
            </div>
            <button disabled={!canSubmit || submitting} onClick={handleSubmit} className="btn-luxe w-full mt-5">
              {submitting ? "Wird gesendet…" : "Bestellung absenden"}
            </button>
            {!canSubmit && <p className="text-xs text-amber-100/50 mt-3 text-center">Bitte Tagung, Name und mind. eine Mahlzeit wählen.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Hero({ date, bg }: { date: string; bg: string | null }) {
  return (
    <header className="relative h-[70vh] overflow-hidden">
      <div className="absolute inset-0 ken-burns" style={{
        backgroundImage: `url(${bg ?? "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80"})`,
        backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.55) saturate(1.05)",
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-stone-950" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-amber-300/30 bg-black/30 backdrop-blur text-amber-200 text-xs uppercase tracking-[0.35em] reveal">
          Hotel der Heidehof · Tagungsmenü
        </div>
        <h1 className="font-display text-6xl md:text-8xl mt-6 apple-text reveal reveal-delay-1">Menüauswahl</h1>
        <p className="mt-4 text-amber-100/80 text-lg reveal reveal-delay-2">{format(new Date(date), "EEEE, dd. MMMM yyyy", { locale: de })}</p>
        <ChevronDown className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-6 text-amber-200/60 animate-bounce" />
      </div>
    </header>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.35em] text-amber-300/80">{eyebrow}</div>
      <h2 className="font-display text-4xl md:text-5xl mt-2 text-luxe-cream" style={{ color: "hsl(var(--luxe-cream))" }}>{title}</h2>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-amber-300/15 bg-stone-900/40 px-4 py-3">
      <label className="text-xs uppercase tracking-[0.25em] text-amber-200/70 flex items-center gap-2">{Icon && <Icon className="w-3.5 h-3.5" />} {label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-9 h-9 rounded-full border border-amber-300/30 text-amber-200 hover:bg-amber-300/10">−</button>
      <span className="text-xl font-display apple-text w-10 text-center">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-9 h-9 rounded-full border border-amber-300/30 text-amber-200 hover:bg-amber-300/10">+</button>
    </div>
  );
}

function MealSection({ meal, menu, assets, selection, quantities, onSelect, onQty, maxQty }: {
  meal: MealType; menu: ConferenceMenu; assets: DailyAssets | null;
  selection: Selection; quantities: Quantities;
  onSelect: (d: DishType) => void; onQty: (q: number) => void; maxQty: number;
}) {
  const prefix = meal === "lunch" ? "lunch" : "dinner";
  const appetizer = (menu as any)[`${prefix}_appetizer`] as string;
  const dessert = (menu as any)[`${prefix}_dessert`] as string;
  const dishes: { type: DishType; dish: MainDish }[] = [
    { type: "fish", dish: (menu as any)[`${prefix}_main_dish_fish`] },
    { type: "meat", dish: (menu as any)[`${prefix}_main_dish_meat`] },
    { type: "vegetarian", dish: (menu as any)[`${prefix}_main_dish_vegetarian`] },
  ];
  const sel = selection[meal];
  return (
    <section className="reveal reveal-delay-2">
      <SectionTitle eyebrow={meal === "lunch" ? "03 — Mittag" : "04 — Abend"} title={meal === "lunch" ? "Mittagsmenü" : "Abendmenü"} />
      {appetizer && (
        <div className="text-center mt-10">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Vorspeise</div>
          <div className="font-display text-2xl italic mt-2 text-amber-50">{appetizer}</div>
          <div className="apple-divider w-32 mx-auto mt-4" />
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-6 mt-10">
        {dishes.map(({ type, dish }, i) => {
          const Icon = dishIcon(type);
          const img = assets?.images?.[`${prefix}_${type}`];
          const isSelected = sel === type;
          return (
            <button key={type} type="button" onClick={() => onSelect(type)}
              className={`dish-card glass-card text-left ${isSelected ? "selected" : ""}`}
              style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="aspect-[4/3] overflow-hidden bg-stone-800 relative">
                {img ? <img src={img} alt={dish?.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                  : <div className="w-full h-full flex items-center justify-center text-amber-300/30"><Icon className="w-16 h-16" /></div>}
                {isSelected && <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-amber-300 text-stone-900 flex items-center justify-center apple-ring-pulse"><Check className="w-5 h-5" /></div>}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-amber-300/80"><Icon className="w-3.5 h-3.5" /> {dishLabel(type)}</div>
                <h3 className="font-display text-2xl mt-2 text-amber-50">{dish?.name || "—"}</h3>
                {dish?.description && <p className="text-sm text-amber-100/65 mt-2 leading-relaxed">{dish.description}</p>}
              </div>
            </button>
          );
        })}
      </div>
      {dessert && (
        <div className="text-center mt-10">
          <div className="apple-divider w-32 mx-auto mb-4" />
          <div className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Dessert</div>
          <div className="font-display text-2xl italic mt-2 text-amber-50">{dessert}</div>
        </div>
      )}
      {sel && (
        <div className="mt-8 flex items-center justify-center gap-5 reveal">
          <span className="text-amber-100/70 text-sm uppercase tracking-[0.25em]">Portionen</span>
          <Stepper value={quantities[meal]} onChange={onQty} min={0} max={maxQty} />
        </div>
      )}
    </section>
  );
}

function SummaryLine({ label, sel, qty, menu, meal }: { label: string; sel: DishType | null; qty: number; menu: ConferenceMenu | null; meal: MealType }) {
  if (!sel || !qty || !menu) return <div className="flex justify-between py-2 text-amber-100/40 text-sm"><span>{label}</span><span>—</span></div>;
  const dish = (menu as any)[`${meal}_main_dish_${sel}`] as MainDish;
  return (
    <div className="py-3 border-b border-amber-300/10 last:border-0">
      <div className="flex justify-between text-amber-100/90"><span className="text-xs uppercase tracking-[0.2em]">{label}</span><span className="text-sm font-display apple-text">×{qty}</span></div>
      <div className="text-sm text-amber-50 mt-1">{dish?.name}</div>
      <div className="text-xs text-amber-200/60">{dishLabel(sel)}</div>
    </div>
  );
}

function DoneScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="luxe-bg min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-12 max-w-lg text-center reveal">
        <div className="w-24 h-24 rounded-full mx-auto bg-amber-300/15 flex items-center justify-center apple-ring-pulse">
          <Check className="w-12 h-12 text-amber-300" />
        </div>
        <h2 className="font-display text-4xl mt-6 apple-text">Vielen Dank</h2>
        <p className="text-amber-100/75 mt-4">Ihre Bestellung wurde erfolgreich übermittelt. Unsere Küche bereitet alles für Sie vor.</p>
        <button onClick={onRestart} className="btn-luxe mt-8">Neue Bestellung</button>
      </div>
    </div>
  );
}
