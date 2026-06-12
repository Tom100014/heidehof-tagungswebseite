import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { OrderContainer } from "@/components/admin/dashboards/OrderContainer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence } from "framer-motion";
import { UtensilsCrossed, Wine, BedDouble, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { hotelNotificationSounds } from "@/utils/hotel-notification-sounds";
import { toast } from "sonner";
import { foodOrderUpsell } from "@/lib/upselling/suggestions";

type Status = "new" | "pending" | "in_progress" | "in_preparation" | "served" | "completed" | "done" | string;

interface RestaurantOrder {
  id: string;
  guest_name: string | null;
  guest_type: string | null;
  table_or_room: string | null;
  items: any;
  notes: string | null;
  status: Status;
  source: string | null;
  category: string | null;
  created_at: string;
}

const CATEGORY_META: Record<string, { label: string; icon: any; tone: "default" | "warning" | "success" | "danger" }> = {
  fine_dining: { label: "Restaurant", icon: UtensilsCrossed, tone: "default" },
  restaurant: { label: "Restaurant", icon: UtensilsCrossed, tone: "default" },
  bar_max: { label: "Bar Mäx", icon: Wine, tone: "warning" },
  drinks: { label: "Getränke", icon: Wine, tone: "warning" },
  room_service: { label: "Room Service", icon: BedDouble, tone: "success" },
};

const NEW_STATUSES = ["new", "pending", "neu", "offen"];
const ACTIVE_STATUSES = ["in_progress", "in_preparation", "processing", "in_bearbeitung"];
const DONE_STATUSES = ["served", "completed", "done", "abgeschlossen"];

function bucketFor(status: string): "new" | "active" | "done" {
  if (DONE_STATUSES.includes(status)) return "done";
  if (ACTIVE_STATUSES.some((s) => status.startsWith(s))) return "active";
  return "new";
}

function categoryKey(o: RestaurantOrder): string {
  const c = (o.category || "").toLowerCase();
  if (c.includes("bar")) return "bar_max";
  if (c.includes("room") || (o.table_or_room ?? "").toLowerCase().startsWith("zimmer")) return "room_service";
  if (c.includes("drink") || c.includes("getr")) return "drinks";
  return "fine_dining";
}

function parseItems(raw: any): { name: string; quantity: number; notes?: string }[] {
  if (!raw) return [];
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(data)) {
      return data.map((it: any) => ({
        name: it.name || it.title || String(it),
        quantity: Number(it.quantity ?? it.qty ?? 1) || 1,
        notes: it.notes,
      }));
    }
    if (typeof data === "object") {
      return Object.entries(data).map(([k, v]) => ({ name: k, quantity: Number(v) || 1 }));
    }
  } catch {}
  return [{ name: String(raw), quantity: 1 }];
}

export default function FbServiceCockpit() {
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const load = async () => {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString();
    const { data, error } = await supabase
      .from("restaurant_orders")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Bestellungen konnten nicht geladen werden");
      console.error(error);
      return;
    }
    const rows = (data || []) as RestaurantOrder[];

    // Detect new orders for sound
    if (!firstLoad.current && !muted) {
      const fresh = rows.filter((r) => !seenIds.current.has(r.id) && bucketFor(r.status) === "new");
      if (fresh.length > 0) {
        const isBar = fresh.some((f) => categoryKey(f) === "bar_max");
        if (isBar) hotelNotificationSounds.playBarMaxNotification();
        else hotelNotificationSounds.playRestaurantNotification();
        toast.success(`${fresh.length} neue Bestellung${fresh.length > 1 ? "en" : ""}`, {
          description: fresh.map((f) => `${f.guest_name ?? "Gast"} · ${f.table_or_room ?? "—"}`).join(", "),
        });
      }
    }
    rows.forEach((r) => seenIds.current.add(r.id));
    firstLoad.current = false;
    setOrders(rows);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("fb_service_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_orders" }, () => void load())
      .subscribe();
    const interval = setInterval(() => void load(), 30000);
    return () => {
      void supabase.removeChannel(ch);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("restaurant_orders")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error("Update fehlgeschlagen");
    } else {
      toast.success("Status aktualisiert");
      void load();
    }
  };

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => categoryKey(o) === filter);
  }, [orders, filter]);

  const columns = useMemo(() => ({
    new: filtered.filter((o) => bucketFor(o.status) === "new"),
    active: filtered.filter((o) => bucketFor(o.status) === "active"),
    done: filtered.filter((o) => bucketFor(o.status) === "done").slice(0, 10),
  }), [filtered]);

  const renderOrder = (o: RestaurantOrder) => {
    const meta = CATEGORY_META[categoryKey(o)] ?? CATEGORY_META.fine_dining;
    const items = parseItems(o.items);
    const bucket = bucketFor(o.status);
    const hasDrinks = items.some((i) => /wein|wasser|bier|kaffee|tee|saft|drink|cola|sprite|cocktail|champagner/i.test(i.name));
    const upsells = bucket === "new" ? foodOrderUpsell({
      hasDrinks,
      isEvening: new Date(o.created_at).getHours() >= 18,
      itemCount: items.length,
    }) : [];

    const actions = bucket === "new"
      ? [
          { label: "Annehmen", onClick: () => updateStatus(o.id, "in_progress") },
          { label: "Storno", variant: "outline" as const, onClick: () => updateStatus(o.id, "cancelled") },
        ]
      : bucket === "active"
      ? [
          { label: "Serviert ✓", onClick: () => updateStatus(o.id, "served") },
        ]
      : [];

    return (
      <OrderContainer
        key={o.id}
        tone={bucket === "new" ? "new" : bucket === "active" ? "active" : "done"}
        icon={<meta.icon className="h-6 w-6" />}
        title={`${o.table_or_room ?? "Ohne Tisch"} · ${meta.label}`}
        subtitle={o.source ? `Quelle: ${o.source}` : undefined}
        guestName={o.guest_name ?? "Gast"}
        createdAt={o.created_at}
        badges={[
          { label: `${items.reduce((s, i) => s + i.quantity, 0)} Position${items.length > 1 ? "en" : ""}`, tone: meta.tone },
        ]}
        warning={o.notes && /allergi|nuss|gluten|laktose|vegan/i.test(o.notes) ? `Hinweis: ${o.notes}` : undefined}
        upsell={upsells[0]?.title}
        actions={actions}
      >
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-baseline gap-2">
              <span className="font-bold text-base tabular-nums">{it.quantity}×</span>
              <span className="flex-1">{it.name}</span>
              {it.notes && <span className="text-xs text-muted-foreground italic">{it.notes}</span>}
            </li>
          ))}
        </ul>
        {o.notes && !/allergi|nuss|gluten/i.test(o.notes) && (
          <p className="mt-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">{o.notes}</p>
        )}
      </OrderContainer>
    );
  };

  return (
    <HeidehofAdminLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-[1800px] mx-auto">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">F&B Service-Cockpit</h1>
            <p className="text-sm text-muted-foreground">
              Live-Bestellungen aus Speisekarte, Getränkekarte & Bar Mäx. Sound bei jedem neuen Bon.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
              {muted ? "Stumm" : "Sound an"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Aktualisieren
            </Button>
          </div>
        </header>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Alle <Badge variant="secondary" className="ml-1.5">{orders.length}</Badge></TabsTrigger>
            <TabsTrigger value="fine_dining">Restaurant</TabsTrigger>
            <TabsTrigger value="bar_max">Bar Mäx</TabsTrigger>
            <TabsTrigger value="room_service">Room Service</TabsTrigger>
            <TabsTrigger value="drinks">Getränke</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} className="mt-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Neu */}
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-rose-400">
                    🔴 Neu / Offen
                  </h2>
                  <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">{columns.new.length}</Badge>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>
                    {columns.new.map(renderOrder)}
                  </AnimatePresence>
                  {!loading && columns.new.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border/40 rounded-xl">
                      Keine neuen Bestellungen
                    </p>
                  )}
                </div>
              </section>
              {/* In Bearbeitung */}
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-amber-400">
                    🟡 In Bearbeitung
                  </h2>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">{columns.active.length}</Badge>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>{columns.active.map(renderOrder)}</AnimatePresence>
                  {!loading && columns.active.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border/40 rounded-xl">
                      Nichts in Arbeit
                    </p>
                  )}
                </div>
              </section>
              {/* Serviert */}
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-400">
                    🟢 Serviert (letzte 10)
                  </h2>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">{columns.done.length}</Badge>
                </div>
                <div className="space-y-3">
                  <AnimatePresence>{columns.done.map(renderOrder)}</AnimatePresence>
                </div>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </HeidehofAdminLayout>
  );
}
