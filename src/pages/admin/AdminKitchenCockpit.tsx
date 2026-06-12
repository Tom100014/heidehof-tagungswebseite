import { useEffect, useMemo, useRef, useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChefHat, Users, Fish, Beef, Leaf, AlertTriangle, CheckCircle2,
  ChevronLeft, ChevronRight, CalendarDays, Building, UtensilsCrossed,
  Sparkles, ArrowRight, X,
} from "lucide-react";

/**
 * World-class Kitchen Cockpit
 *
 * Groups every confirmed/active conference order for the selected day
 * by seminar room and by meal (lunch / dinner). For each room we show:
 *   – total persons
 *   – dish counts: vegetarian / meat / fish
 *   – missing-data warnings (no menu, no dish split, totals don't match…)
 *
 * Targets per service (Heidehof Bankett-Standard):
 *   3 vegetarisch · 4 Fleisch · 4 Fisch
 */

const TARGETS = { vegetarian: 3, meat: 4, fish: 4 } as const;
type DishKey = keyof typeof TARGETS;
type MealType = "lunch" | "dinner";

interface OrderItem {
  order_id: string;
  course: string;
  dish_type: DishKey | null;
  quantity: number;
}

interface OrderRow {
  id: string;
  room_id: string | null;
  service_date: string;
  meal_type: MealType | null;
  participants: number;
  status: string;
  company: string | null;
  guest_name: string | null;
}

interface Room { id: string; name: string; capacity: number | null; }
interface MenuRow { id: string; menu_date: string }

interface RoomServiceAgg {
  room: Room;
  meal: MealType;
  persons: number;
  orders: OrderRow[];
  fish: number;
  meat: number;
  vegetarian: number;
  issues: string[];
}

const todayIso = () => format(new Date(), "yyyy-MM-dd");

export default function AdminKitchenCockpit() {
  const [date, setDate] = useState<string>(todayIso());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [menu, setMenu] = useState<MenuRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<OrderRow | null>(null);
  const firstLoadRef = useRef(true);
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  const playKitchenSignal = () => {
    if (typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = ctx;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, ctx.currentTime);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.6);
  };

  const load = async (forDate: string) => {
    setLoading(true);
    const [r, o, m] = await Promise.all([
      supabase.from("conference_rooms").select("id, name, capacity").eq("is_active", true).order("sort_order"),
      supabase.from("conference_orders").select("id, room_id, service_date, meal_type, participants, status, company, guest_name")
        .eq("service_date", forDate)
        .neq("status", "cancelled"),
      supabase.from("conference_menus").select("id, menu_date").eq("menu_date", forDate).maybeSingle(),
    ]);
    setRooms((r.data as Room[]) || []);
    const orderRows = (o.data as OrderRow[]) || [];
    setOrders(orderRows);
    if (firstLoadRef.current) {
      seenOrderIdsRef.current = new Set(orderRows.map((row) => row.id));
      firstLoadRef.current = false;
    }
    setMenu((m.data as MenuRow) || null);

    if (orderRows.length) {
      const ids = orderRows.map((x) => x.id);
      const it = await supabase.from("conference_order_items")
        .select("order_id, course, dish_type, quantity").in("order_id", ids);
      setItems((it.data as OrderItem[]) || []);
    } else {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    firstLoadRef.current = true;
    seenOrderIdsRef.current = new Set();
    setNewOrderAlert(null);
    void load(date);
  }, [date]);

  // realtime
  useEffect(() => {
    const ch = supabase.channel("kitchen-cockpit")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conference_orders" }, (payload) => {
        const row = payload.new as OrderRow;
        void load(date);
        if (row.service_date !== date || seenOrderIdsRef.current.has(row.id)) return;
        seenOrderIdsRef.current.add(row.id);
        setNewOrderAlert(row);
        playKitchenSignal();
        window.setTimeout(() => {
          setNewOrderAlert((current) => (current?.id === row.id ? null : current));
        }, 12000);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conference_orders" }, () => load(date))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "conference_orders" }, () => load(date))
      .on("postgres_changes", { event: "*", schema: "public", table: "conference_order_items" }, () => load(date))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [date]);

  /** Aggregate per (room × meal) */
  const groups: RoomServiceAgg[] = useMemo(() => {
    const itemsByOrder = new Map<string, OrderItem[]>();
    items.forEach((it) => {
      const arr = itemsByOrder.get(it.order_id) || [];
      arr.push(it);
      itemsByOrder.set(it.order_id, arr);
    });

    const out: RoomServiceAgg[] = [];
    const buckets = new Map<string, OrderRow[]>();
    orders.forEach((o) => {
      if (!o.room_id || !o.meal_type) return;
      const k = `${o.room_id}::${o.meal_type}`;
      buckets.set(k, [...(buckets.get(k) || []), o]);
    });

    buckets.forEach((bucketOrders, key) => {
      const [roomId, meal] = key.split("::") as [string, MealType];
      const room = rooms.find((r) => r.id === roomId) || { id: roomId, name: "Unbekannter Raum", capacity: null };
      let fish = 0, meat = 0, vegetarian = 0, persons = 0;
      const issues: string[] = [];

      bucketOrders.forEach((o) => {
        persons += o.participants || 0;
        const its = itemsByOrder.get(o.id) || [];
        its.forEach((it) => {
          if (it.dish_type === "fish") fish += it.quantity || 0;
          else if (it.dish_type === "meat") meat += it.quantity || 0;
          else if (it.dish_type === "vegetarian") vegetarian += it.quantity || 0;
        });
      });

      const totalDishes = fish + meat + vegetarian;
      if (totalDishes === 0) issues.push("Keine Gang-Auswahl gespeichert");
      else if (totalDishes !== persons) issues.push(`Hauptgänge (${totalDishes}) ≠ Teilnehmer (${persons})`);
      if (room.capacity && persons > room.capacity) issues.push(`Über Raumkapazität (${persons}/${room.capacity})`);

      out.push({ room, meal, persons, orders: bucketOrders, fish, meat, vegetarian, issues });
    });

    return out.sort((a, b) => a.room.name.localeCompare(b.room.name) || a.meal.localeCompare(b.meal));
  }, [orders, items, rooms]);

  const orphan = orders.filter((o) => !o.room_id || !o.meal_type);
  const totals = useMemo(() => {
    const t = { persons: 0, fish: 0, meat: 0, vegetarian: 0, lunchRooms: 0, dinnerRooms: 0 };
    groups.forEach((g) => {
      t.persons += g.persons; t.fish += g.fish; t.meat += g.meat; t.vegetarian += g.vegetarian;
      if (g.meal === "lunch") t.lunchRooms++; else t.dinnerRooms++;
    });
    return t;
  }, [groups]);

  const niceDate = format(new Date(date), "EEEE, dd. MMMM yyyy", { locale: de });
  const alertRoomName = newOrderAlert
    ? rooms.find((room) => room.id === newOrderAlert.room_id)?.name ?? "Raum noch offen"
    : "";

  return (
    <HeidehofAdminLayout title="Küchen-Cockpit">
      <div className="space-y-5 max-w-[1400px]">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5" /> Live-Operative · Tagungsküche
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-0.5">Küchen-Cockpit</h2>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">{niceDate}</p>
          </div>

          {/* Date stepper */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-card border border-border rounded-xl p-1">
            <Button size="icon" variant="ghost" onClick={() => setDate(format(subDays(new Date(date), 1), "yyyy-MM-dd"))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 px-2">
              <CalendarDays className="w-4 h-4 text-[hsl(var(--apple))]" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none text-foreground"
              />
              {date !== todayIso() && (
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setDate(todayIso())}>Heute</Button>
              )}
            </div>
            <Button size="icon" variant="ghost" onClick={() => setDate(format(addDays(new Date(date), 1), "yyyy-MM-dd"))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {newOrderAlert && (
          <div
            role="status"
            className="rounded-2xl border border-[hsl(var(--admin-gold)/0.55)] bg-[hsl(var(--admin-gold)/0.14)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-[hsl(var(--admin-gold))] text-[hsl(var(--admin-gold-foreground))]">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Neue Tagungsbestellung für die Küche</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {newOrderAlert.company || newOrderAlert.guest_name || "Gast"} · {alertRoomName} · {newOrderAlert.participants} Personen · {newOrderAlert.meal_type === "dinner" ? "Abend" : "Mittag"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button asChild size="sm">
                  <Link to="/admin/conference-orders">Öffnen</Link>
                </Button>
                <Button size="icon" variant="ghost" aria-label="Hinweis schließen" onClick={() => setNewOrderAlert(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Kpi icon={Users} label="Teilnehmer gesamt" value={totals.persons} accent />
          <Kpi icon={UtensilsCrossed} label="Mittag · Räume" value={totals.lunchRooms} />
          <Kpi icon={UtensilsCrossed} label="Abend · Räume" value={totals.dinnerRooms} />
          <Kpi icon={Sparkles} label="Tagesmenü" value={menu ? "Geplant" : "Fehlt"} warn={!menu} />
          <Kpi icon={AlertTriangle} label="Warnungen" value={groups.reduce((s, g) => s + g.issues.length, 0) + orphan.length} warn={groups.some(g => g.issues.length) || orphan.length > 0} />
        </div>

        {/* Dish totals */}
        <div className="grid grid-cols-3 gap-3">
          <DishTotal icon={Leaf} label="Vegetarisch" value={totals.vegetarian} target={TARGETS.vegetarian} hint="Pro Service: 3 Varianten" />
          <DishTotal icon={Beef} label="Fleisch" value={totals.meat} target={TARGETS.meat} hint="Pro Service: 4 Varianten" />
          <DishTotal icon={Fish} label="Fisch" value={totals.fish} target={TARGETS.fish} hint="Pro Service: 4 Varianten" />
        </div>

        {/* Quick-action row */}
        {!menu && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Kein Tagesmenü für diesen Tag hinterlegt.</p>
              <p className="text-xs text-muted-foreground">Erstellen Sie das Tagesmenü (3× vegetarisch, 4× Fleisch, 4× Fisch) bevor Anfragen eingehen.</p>
            </div>
            <Button asChild size="sm">
              <Link to="/admin/conference-menu">Tagesmenü anlegen <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </div>
        )}

        {/* Body */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Building className="w-4 h-4 text-[hsl(var(--apple))]" /> Aufstellung je Seminarraum
            </h3>
            <Badge variant="outline" className="text-[10px]">{groups.length} Service{groups.length === 1 ? "" : "s"}</Badge>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Lädt…</div>
          ) : groups.length === 0 ? (
            <div className="py-12 text-center">
              <ChefHat className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Keine Bestellungen für diesen Tag.</p>
              <Button asChild variant="link" size="sm" className="mt-1">
                <Link to="/admin/conference-orders">Alle Bestellungen ansehen</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {groups.map((g) => <RoomCard key={g.room.id + g.meal} agg={g} />)}
            </div>
          )}

          {orphan.length > 0 && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs space-y-1">
              <p className="font-semibold text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> {orphan.length} Bestellung(en) ohne Raum-/Service-Zuordnung
              </p>
              <ul className="text-muted-foreground ml-5 list-disc">
                {orphan.map((o) => (
                  <li key={o.id}>{o.company || o.guest_name || o.id} · {o.participants} P. · {!o.room_id ? "kein Raum" : "kein Mittag/Abend"}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </HeidehofAdminLayout>
  );
}

/* ─── pieces ──────────────────────────────────────────────────────── */

function Kpi({ icon: Icon, label, value, accent, warn }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; accent?: boolean; warn?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-4",
      warn ? "bg-amber-500/10 border-amber-500/30" :
      accent ? "bg-[hsl(var(--apple)/0.08)] border-[hsl(var(--apple)/0.3)]" :
      "bg-card border-border"
    )}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn("w-4 h-4", warn ? "text-amber-500" : accent ? "text-[hsl(var(--apple))]" : "text-muted-foreground")} />
      </div>
      <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{label}</p>
      <p className={cn("text-2xl font-bold tabular-nums tracking-tight mt-0.5",
        warn ? "text-amber-500" : "text-foreground"
      )}>{value}</p>
    </div>
  );
}

function DishTotal({ icon: Icon, label, value, target, hint }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; target: number; hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[hsl(var(--apple))]" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono">Ziel {target}</Badge>
      </div>
      <p className="text-3xl font-bold tabular-nums tracking-tight mt-2 text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
    </div>
  );
}

function RoomCard({ agg }: { agg: RoomServiceAgg }) {
  const ok = agg.issues.length === 0;
  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-3 transition-all",
      ok ? "border-border bg-card hover:border-[hsl(var(--apple)/0.4)]"
         : "border-amber-500/40 bg-amber-500/5"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground truncate">{agg.room.name}</h4>
            <Badge variant="outline" className="text-[10px] uppercase">{agg.meal === "lunch" ? "Mittag" : "Abend"}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {agg.orders.length} Bestellung{agg.orders.length === 1 ? "" : "en"}
            {agg.room.capacity ? ` · Raum max. ${agg.room.capacity} P.` : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-2xl font-bold text-foreground tabular-nums">
            <Users className="w-4 h-4 text-[hsl(var(--apple))]" />
            {agg.persons}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Personen</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <DishPill icon={Leaf} value={agg.vegetarian} target={TARGETS.vegetarian} label="Veg." />
        <DishPill icon={Beef} value={agg.meat} target={TARGETS.meat} label="Fleisch" />
        <DishPill icon={Fish} value={agg.fish} target={TARGETS.fish} label="Fisch" />
      </div>

      {agg.issues.length > 0 ? (
        <ul className="space-y-1">
          {agg.issues.map((m) => (
            <li key={m} className="text-xs flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> Vollständig – bereit für die Küche
        </p>
      )}
    </div>
  );
}

function DishPill({ icon: Icon, value, target, label }: {
  icon: React.ComponentType<{ className?: string }>; value: number; target: number; label: string;
}) {
  const empty = value === 0;
  return (
    <div className={cn(
      "rounded-lg border p-2 text-center",
      empty ? "border-dashed border-muted-foreground/30 bg-muted/20" : "border-border bg-background"
    )}>
      <Icon className={cn("w-3.5 h-3.5 mx-auto mb-0.5", empty ? "text-muted-foreground/50" : "text-foreground")} />
      <div className={cn("text-lg font-bold tabular-nums", empty ? "text-muted-foreground/60" : "text-foreground")}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label} <span className="opacity-60">/ {target}</span></div>
    </div>
  );
}
