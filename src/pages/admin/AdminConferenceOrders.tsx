import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search, Clock, CheckCircle, AlertTriangle, Calendar, Users, Building, Mail,
  ChefHat, Fish, Beef, Leaf, ChevronDown, ChevronUp, Trash2, UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { adminSecurity } from "@/utils/admin-security";
import { useSearchParams } from "react-router-dom";

type Status = "new" | "confirmed" | "in_kitchen" | "completed" | "cancelled";

interface OrderItem {
  id: string;
  course: string;
  dish_type: "fish" | "meat" | "vegetarian" | null;
  quantity: number;
}

interface Order {
  id: string;
  guest_name: string;
  company: string | null;
  email: string | null;
  service_date: string;
  meal_type: "lunch" | "dinner";
  participants: number;
  notes: string | null;
  parsedNotes: any;
  room_id: string;
  room_name: string;
  status: Status;
  created_at: string;
  items: OrderItem[];
}

const STATUS_META: Record<Status, { label: string; cls: string; icon: any }> = {
  new:        { label: "Neu",            cls: "bg-amber-100 text-amber-800 border-amber-200",      icon: Clock },
  confirmed:  { label: "Bestätigt",      cls: "bg-zinc-100 text-zinc-800 border-zinc-200", icon: CheckCircle },
  in_kitchen: { label: "In der Küche",   cls: "bg-blue-100 text-blue-800 border-blue-200",          icon: ChefHat },
  completed:  { label: "Abgeschlossen",  cls: "bg-stone-100 text-stone-700 border-stone-200",       icon: CheckCircle },
  cancelled:  { label: "Storniert",      cls: "bg-red-100 text-red-800 border-red-200",             icon: AlertTriangle },
};

const safeParse = (s: string | null) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const fmtDate = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }); };
const fmtDateTime = (s: string) => { const d = new Date(s); return isNaN(d.getTime()) ? "—" : d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); };

const AdminConferenceOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "conference-orders"],
    queryFn: async (): Promise<Order[]> => {
      const [{ data: ordersData, error }, { data: roomsData }, { data: itemsData }] = await Promise.all([
        supabase.from("conference_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("conference_rooms").select("id, name"),
        supabase.from("conference_order_items").select("*"),
      ]);
      if (error) throw error;
      const roomMap = new Map((roomsData || []).map((r: any) => [r.id, r.name]));
      const itemsByOrder = new Map<string, OrderItem[]>();
      (itemsData || []).forEach((it: any) => {
        const arr = itemsByOrder.get(it.order_id) || [];
        arr.push(it);
        itemsByOrder.set(it.order_id, arr);
      });
      return (ordersData || []).map((o: any) => ({
        id: o.id,
        guest_name: o.guest_name || "—",
        company: o.company,
        email: o.email,
        service_date: o.service_date,
        meal_type: o.meal_type,
        participants: o.participants ?? 1,
        notes: o.notes,
        parsedNotes: safeParse(o.notes),
        room_id: o.room_id,
        room_name: roomMap.get(o.room_id) || "Unbekannter Raum",
        status: (o.status || "new") as Status,
        created_at: o.created_at,
        items: itemsByOrder.get(o.id) || [],
      }));
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-conf-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "conference_orders" },
        () => queryClient.invalidateQueries({ queryKey: ["admin", "conference-orders"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "conference_order_items" },
        () => queryClient.invalidateQueries({ queryKey: ["admin", "conference-orders"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  useEffect(() => {
    const focusOrderId = searchParams.get("order");
    if (!focusOrderId) return;
    setExpanded(focusOrderId);
    window.requestAnimationFrame(() => {
      document.getElementById(`conference-order-${focusOrderId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [searchParams]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("conference_orders").update({ status }).eq("id", id);
      if (error) throw error;
      await adminSecurity.logAction({ action: "update_status", entity: "conference_order", entityId: id, diff: { status } });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "conference-orders"] });
      const prev = queryClient.getQueryData<Order[]>(["admin", "conference-orders"]);
      queryClient.setQueryData<Order[]>(["admin", "conference-orders"],
        (old) => (old || []).map((o) => (o.id === id ? { ...o, status } : o)));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["admin", "conference-orders"], ctx.prev);
      toast.error("Fehler beim Aktualisieren");
    },
    onSuccess: () => toast.success("Status aktualisiert"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("conference_order_items").delete().eq("order_id", id);
      const { error } = await supabase.from("conference_orders").delete().eq("id", id);
      if (error) throw error;
      await adminSecurity.logAction({ action: "delete", entity: "conference_order", entityId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "conference-orders"] });
      toast.success("Bestellung gelöscht");
    },
    onError: () => toast.error("Löschen fehlgeschlagen"),
  });

  const setStatus = (id: string, status: Status) => statusMutation.mutate({ id, status });

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "Bestellung löschen?",
      description: "Diese Aktion kann nicht rückgängig gemacht werden. Alle Positionen werden ebenfalls entfernt.",
      destructive: true,
      confirmLabel: "Löschen",
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  const filtered = useMemo(
    () => orders.filter((o) => {
      const q = searchTerm.toLowerCase();
      const ms = !q ||
        (o.company || "").toLowerCase().includes(q) ||
        o.guest_name.toLowerCase().includes(q) ||
        (o.email || "").toLowerCase().includes(q) ||
        o.room_name.toLowerCase().includes(q);
      const mst = statusFilter === "all" || o.status === statusFilter;
      return ms && mst;
    }),
    [orders, searchTerm, statusFilter]
  );

  const totals = useMemo(() => ({
    total: orders.length,
    new: orders.filter((o) => o.status === "new").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    in_kitchen: orders.filter((o) => o.status === "in_kitchen").length,
    completed: orders.filter((o) => o.status === "completed").length,
  }), [orders]);

  return (
    <HeidehofAdminLayout title="Tagungsbestellungen">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground font-semibold">
            <ChefHat className="w-3.5 h-3.5" /> Bestellungen
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1">Tagungsbestellungen</h1>
          <p className="text-sm text-muted-foreground mt-1">Konferenz- und Eventbestellungen verwalten</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Building} color="text-foreground" label="Gesamt" value={totals.total} />
          <StatCard icon={Clock} color="text-amber-600" label="Neu" value={totals.new} />
          <StatCard icon={CheckCircle} color="text-zinc-600" label="Bestätigt" value={totals.confirmed} />
          <StatCard icon={ChefHat} color="text-blue-600" label="In Küche" value={totals.in_kitchen} />
          <StatCard icon={CheckCircle} color="text-stone-600" label="Abgeschl." value={totals.completed} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Firma, Gast, Raum oder E-Mail …" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="new">Neu</SelectItem>
              <SelectItem value="confirmed">Bestätigt</SelectItem>
              <SelectItem value="in_kitchen">In der Küche</SelectItem>
              <SelectItem value="completed">Abgeschlossen</SelectItem>
              <SelectItem value="cancelled">Storniert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-4 md:p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Bestellungen ({filtered.length})</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10 text-muted-foreground">Lädt…</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">Keine Bestellungen.</div>
              ) : (
                filtered.map((o) => {
                  const m = STATUS_META[o.status];
                  const isOpen = expanded === o.id;
                  const fish = o.items.filter((i) => i.dish_type === "fish").reduce((s, i) => s + (i.quantity || 0), 0);
                  const meat = o.items.filter((i) => i.dish_type === "meat").reduce((s, i) => s + (i.quantity || 0), 0);
                  const veg = o.items.filter((i) => i.dish_type === "vegetarian").reduce((s, i) => s + (i.quantity || 0), 0);
                  const lunch = o.parsedNotes?.lunch;
                  const dinner = o.parsedNotes?.dinner;

                  return (
                    <Card key={o.id} id={`conference-order-${o.id}`} className="border-border scroll-mt-24">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-foreground">{o.company || o.guest_name}</h4>
                              <Badge variant="outline" className={`${m.cls} gap-1 font-medium`}>
                                <m.icon className="h-3 w-3" /> {m.label}
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                {o.meal_type === "lunch" ? "Mittag" : "Abend"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Kontakt: <span className="text-foreground">{o.guest_name}</span></p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {fmtDate(o.service_date)}</div>
                              <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {o.participants} Teilnehmer</div>
                              <div className="flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> <span className="text-foreground font-medium truncate">{o.room_name}</span></div>
                              {o.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5" /> {o.email}</div>}
                            </div>

                            {/* Kitchen quick chips */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {fish > 0 && <Chip icon={Fish} label={`${fish}× Fisch`} cls="bg-sky-50 text-sky-800 border-sky-200" />}
                              {meat > 0 && <Chip icon={Beef} label={`${meat}× Fleisch`} cls="bg-rose-50 text-rose-800 border-rose-200" />}
                              {veg > 0 && <Chip icon={Leaf} label={`${veg}× Vegetarisch`} cls="bg-zinc-50 text-zinc-800 border-zinc-200" />}
                              {fish + meat + veg === 0 && <span className="text-xs text-muted-foreground">Keine Hauptgang-Auswahl gespeichert</span>}
                            </div>

                            <p className="text-xs text-muted-foreground/70 pt-1">Eingegangen: {fmtDateTime(o.created_at)}</p>
                          </div>

                          <div className="flex flex-row md:flex-col gap-2 md:items-end shrink-0">
                            {o.status === "new" && (
                              <Button size="sm" onClick={() => setStatus(o.id, "confirmed")}>Bestätigen</Button>
                            )}
                            {o.status === "confirmed" && (
                              <Button size="sm" onClick={() => setStatus(o.id, "in_kitchen")}>An Küche</Button>
                            )}
                            {o.status === "in_kitchen" && (
                              <Button size="sm" onClick={() => setStatus(o.id, "completed")}>Abschließen</Button>
                            )}
                            {o.status !== "cancelled" && o.status !== "completed" && (
                              <Button size="sm" variant="outline" onClick={() => setStatus(o.id, "cancelled")}>Stornieren</Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => setExpanded(isOpen ? null : o.id)}>
                              {isOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                              Details
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(o.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="border-t pt-3 space-y-3">
                            {(lunch || dinner) && (
                              <div className="grid md:grid-cols-2 gap-3">
                                {lunch && (
                                  <div className="rounded-lg border bg-amber-50/40 p-3">
                                    <div className="text-xs uppercase tracking-wider text-amber-700 font-semibold flex items-center gap-1.5"><UtensilsCrossed className="h-3.5 w-3.5" /> Mittagsmenü</div>
                                    <div className="text-sm font-medium mt-1">{lunch.name || "—"}</div>
                                    {lunch.category && <div className="text-xs text-muted-foreground">{lunch.category}</div>}
                                  </div>
                                )}
                                {dinner && (
                                  <div className="rounded-lg border bg-blue-50/40 p-3">
                                    <div className="text-xs uppercase tracking-wider text-blue-700 font-semibold flex items-center gap-1.5"><UtensilsCrossed className="h-3.5 w-3.5" /> Abendmenü</div>
                                    <div className="text-sm font-medium mt-1">{dinner.name || "—"}</div>
                                    {dinner.category && <div className="text-xs text-muted-foreground">{dinner.category}</div>}
                                  </div>
                                )}
                              </div>
                            )}
                            {o.parsedNotes?.guestType && (
                              <div className="text-xs text-muted-foreground">
                                Gast-Typ: <span className="text-foreground font-medium">{o.parsedNotes.guestType === "overnight_guest" ? "Übernachtungsgast" : "Tagesgast"}</span>
                              </div>
                            )}
                            {o.items.length > 0 && (
                              <div className="text-xs">
                                <div className="text-muted-foreground uppercase tracking-wider mb-1">Küchen-Positionen</div>
                                <div className="flex flex-wrap gap-2">
                                  {o.items.map((it) => (
                                    <span key={it.id} className="px-2 py-1 rounded bg-stone-100 text-stone-700 border border-stone-200">
                                      {it.course} · {it.dish_type || "—"} · {it.quantity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!lunch && !dinner && o.notes && (
                              <div className="text-xs text-muted-foreground whitespace-pre-wrap">{o.notes}</div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HeidehofAdminLayout>
  );
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function Chip({ icon: Icon, label, cls }: { icon: any; label: string; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export default AdminConferenceOrders;
