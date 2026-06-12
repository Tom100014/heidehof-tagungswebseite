import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Sparkles, Utensils, ClipboardList, AlertTriangle, RefreshCw,
  ArrowUpRight, Activity, MessageCircle, Inbox, Hotel, CalendarDays,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { de } from "date-fns/locale";

type DepartmentKey = "beauty" | "fb" | "conference" | "hotel";

type DepartmentCard = {
  key: DepartmentKey;
  label: string;
  href: string;
  icon: typeof Sparkles;
  accent: string;
  kpis: { label: string; value: number | string; hint?: string }[];
  alert?: string;
};

type RecentItem = {
  id: string;
  ts: string;
  department: DepartmentKey;
  title: string;
  meta: string;
  status?: string;
};

const DEPARTMENT_META: Record<DepartmentKey, { label: string; href: string; icon: typeof Sparkles; accent: string }> = {
  beauty:     { label: "Beauty & Spa",          href: "/admin/beauty",             icon: Sparkles,      accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30" },
  fb:         { label: "F&B / Küche",           href: "/admin/kitchen",            icon: Utensils,      accent: "from-rose-500/20 to-rose-500/5 border-rose-500/30" },
  conference: { label: "Tagungen",              href: "/admin/conference-orders",  icon: ClipboardList, accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30" },
  hotel:      { label: "Hotel allgemein",       href: "/admin/inbox",              icon: Hotel,         accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30" },
};

export default function DirectorCockpit() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<DepartmentCard[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());
  const [totals, setTotals] = useState({ openTotal: 0, todayTotal: 0, alerts: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const dayStart = startOfDay(now).toISOString();
    const dayEnd   = endOfDay(now).toISOString();
    const since7d  = subDays(now, 7).toISOString();

    const [
      beautyToday, beautyOpen, beautyWeek,
      restToday, restOpen, roomToday, roomOpen,
      confToday, confOpen, tagungOpen,
      complaintsOpen, complaintsToday, eventOpen,
    ] = await Promise.all([
      supabase.from("beauty_bookings").select("id,status,starts_at,treatment_title,staff_name,guest_name,created_at").gte("starts_at", dayStart).lte("starts_at", dayEnd).order("starts_at"),
      supabase.from("beauty_bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("beauty_bookings").select("id", { count: "exact", head: true }).gte("starts_at", since7d),

      supabase.from("restaurant_orders").select("id,status,category,created_at,guest_name,table_or_room").gte("created_at", dayStart).order("created_at", { ascending: false }),
      supabase.from("restaurant_orders").select("id", { count: "exact", head: true }).is("read_at", null),
      supabase.from("room_orders").select("id,status,category,created_at,room_number,guest_name").gte("created_at", dayStart).order("created_at", { ascending: false }),
      supabase.from("room_orders").select("id", { count: "exact", head: true }).is("read_at", null),

      supabase.from("conference_orders").select("id,status,service_date,guest_name,company,participants,created_at").gte("created_at", dayStart).order("created_at", { ascending: false }),
      supabase.from("conference_orders").select("id", { count: "exact", head: true }).is("read_at", null),
      supabase.from("tagungs_inquiries").select("id", { count: "exact", head: true }).is("read_at", null),

      supabase.from("complaints").select("id,category,urgency,created_at,guest_name,description").is("read_at", null).order("created_at", { ascending: false }).limit(20),
      supabase.from("complaints").select("id", { count: "exact", head: true }).gte("created_at", dayStart),
      supabase.from("event_bookings").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]);

    const beautyTodayList = beautyToday.data ?? [];
    const restTodayList   = restToday.data ?? [];
    const roomTodayList   = roomToday.data ?? [];
    const confTodayList   = confToday.data ?? [];
    const complaintsList  = complaintsOpen.data ?? [];

    const cardsBuilt: DepartmentCard[] = [
      {
        ...DEPARTMENT_META.beauty, key: "beauty",
        kpis: [
          { label: "Termine heute",   value: beautyTodayList.length },
          { label: "Offene Anfragen", value: beautyOpen.count ?? 0 },
          { label: "Buchungen 7 Tage", value: beautyWeek.count ?? 0 },
        ],
        alert: (beautyOpen.count ?? 0) > 0 ? `${beautyOpen.count} Beauty-Anfragen warten` : undefined,
      },
      {
        ...DEPARTMENT_META.fb, key: "fb",
        kpis: [
          { label: "Restaurant heute", value: restTodayList.length },
          { label: "Zimmer-Service",   value: roomTodayList.length },
          { label: "Ungelesen",        value: (restOpen.count ?? 0) + (roomOpen.count ?? 0) },
        ],
        alert: ((restOpen.count ?? 0) + (roomOpen.count ?? 0)) > 5 ? `${(restOpen.count ?? 0) + (roomOpen.count ?? 0)} offene Bestellungen` : undefined,
      },
      {
        ...DEPARTMENT_META.conference, key: "conference",
        kpis: [
          { label: "Catering heute",   value: confTodayList.length },
          { label: "Offene Bestellungen", value: confOpen.count ?? 0 },
          { label: "Tagungsanfragen",  value: tagungOpen.count ?? 0 },
        ],
        alert: (tagungOpen.count ?? 0) > 0 ? `${tagungOpen.count} ungelesene Tagungsanfragen` : undefined,
      },
      {
        ...DEPARTMENT_META.hotel, key: "hotel",
        kpis: [
          { label: "Beschwerden offen", value: complaintsList.length },
          { label: "Beschwerden heute", value: complaintsToday.count ?? 0 },
          { label: "Event-Buchungen",   value: eventOpen.count ?? 0 },
        ],
        alert: complaintsList.some((c: any) => c.urgency === "high") ? "Dringende Beschwerde offen" : undefined,
      },
    ];

    const recentItems: RecentItem[] = [
      ...beautyTodayList.slice(0, 8).map((b: any) => ({
        id: `b-${b.id}`, ts: b.starts_at, department: "beauty" as DepartmentKey,
        title: `${b.treatment_title} – ${b.guest_name}`,
        meta: b.staff_name ? `bei ${b.staff_name}` : "Beauty",
        status: b.status,
      })),
      ...restTodayList.slice(0, 5).map((o: any) => ({
        id: `r-${o.id}`, ts: o.created_at, department: "fb" as DepartmentKey,
        title: `${o.category ?? "Restaurant"} – ${o.guest_name ?? "Gast"}`,
        meta: o.table_or_room ?? "Restaurant", status: o.status,
      })),
      ...roomTodayList.slice(0, 5).map((o: any) => ({
        id: `ro-${o.id}`, ts: o.created_at, department: "fb" as DepartmentKey,
        title: `Zimmer-Service – ${o.guest_name ?? "Gast"}`,
        meta: o.room_number ? `Zimmer ${o.room_number}` : "Roomservice", status: o.status,
      })),
      ...confTodayList.slice(0, 5).map((o: any) => ({
        id: `c-${o.id}`, ts: o.created_at, department: "conference" as DepartmentKey,
        title: `${o.company ?? o.guest_name} – ${o.participants ?? "?"} P.`,
        meta: o.service_date ? `am ${o.service_date}` : "Tagung", status: o.status,
      })),
      ...complaintsList.slice(0, 5).map((c: any) => ({
        id: `cp-${c.id}`, ts: c.created_at, department: "hotel" as DepartmentKey,
        title: `${c.urgency === "high" ? "⚠️ " : ""}${c.category} – ${c.guest_name ?? "Anonym"}`,
        meta: (c.description ?? "").slice(0, 60),
      })),
    ].sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 15);

    const openTotal =
      (beautyOpen.count ?? 0) +
      (restOpen.count ?? 0) + (roomOpen.count ?? 0) +
      (confOpen.count ?? 0) + (tagungOpen.count ?? 0) +
      complaintsList.length;

    const todayTotal =
      beautyTodayList.length + restTodayList.length +
      roomTodayList.length + confTodayList.length +
      (complaintsToday.count ?? 0);

    const alerts = cardsBuilt.filter((c) => c.alert).length;

    setCards(cardsBuilt);
    setRecent(recentItems);
    setTotals({ openTotal, todayTotal, alerts });
    setRefreshedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Realtime: refresh on any relevant change (debounced via setTimeout)
  useEffect(() => {
    let t: any;
    const trigger = () => { clearTimeout(t); t = setTimeout(() => void load(), 1500); };
    const ch = supabase
      .channel("director-cockpit")
      .on("postgres_changes", { event: "*", schema: "public", table: "beauty_bookings" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_orders" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_orders" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "conference_orders" }, trigger)
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, trigger)
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(ch); };
  }, [load]);

  return (
    <HeidehofAdminLayout
      title="Direktor-Cockpit"
      actions={<span className="text-xs text-muted-foreground">Live · aktualisiert {format(refreshedAt, "HH:mm:ss", { locale: de })}</span>}
    >
      <div className="space-y-6">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryStat icon={CalendarDays} label="Vorgänge heute" value={totals.todayTotal} tone="primary" />
          <SummaryStat icon={Inbox}        label="Offen / unbearbeitet" value={totals.openTotal} tone="warning" />
          <SummaryStat icon={AlertTriangle} label="Abteilungen mit Alarm" value={totals.alerts} tone={totals.alerts ? "danger" : "muted"} />
          <div className="flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Aktualisieren
            </Button>
          </div>
        </div>

        {/* Department cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.key} to={c.href} className="group">
                <Card className={cn(
                  "p-5 h-full border bg-gradient-to-br transition-all group-hover:shadow-lg group-hover:-translate-y-0.5",
                  c.accent
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-background/60 backdrop-blur">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="font-semibold">{c.label}</div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="space-y-2">
                    {c.kpis.map((k) => (
                      <div key={k.label} className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{k.label}</span>
                        <span className="text-xl font-semibold tabular-nums">{k.value}</span>
                      </div>
                    ))}
                  </div>
                  {c.alert && (
                    <div className="mt-4 flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                      <AlertTriangle className="h-3.5 w-3.5" /> {c.alert}
                    </div>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Live feed */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Live-Feed · alle Abteilungen</h2>
            </div>
            <Badge variant="outline" className="text-xs">{recent.length} Vorgänge</Badge>
          </div>
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              {loading ? "Lade…" : "Keine aktuellen Vorgänge."}
            </div>
          ) : (
            <ul className="divide-y divide-border/50">
              {recent.map((r) => {
                const Meta = DEPARTMENT_META[r.department];
                const Icon = Meta.icon;
                return (
                  <li key={r.id}>
                    <Link to={Meta.href} className="flex items-center gap-3 py-2.5 hover:bg-muted/40 -mx-2 px-2 rounded">
                      <div className="p-1.5 rounded bg-muted/60"><Icon className="h-3.5 w-3.5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{r.title}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {Meta.label} · {r.meta}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.ts), "HH:mm", { locale: de })}
                      </div>
                      {r.status && <Badge variant="outline" className="text-[10px] capitalize">{r.status}</Badge>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </HeidehofAdminLayout>
  );
}

function SummaryStat({
  icon: Icon, label, value, tone,
}: { icon: typeof Sparkles; label: string; value: number | string; tone: "primary" | "warning" | "danger" | "muted" }) {
  const toneClass = {
    primary: "from-primary/15 to-primary/5 border-primary/30 text-primary",
    warning: "from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-600 dark:text-amber-400",
    danger:  "from-destructive/15 to-destructive/5 border-destructive/30 text-destructive",
    muted:   "from-muted/40 to-muted/10 border-border text-muted-foreground",
  }[tone];
  return (
    <Card className={cn("p-4 border bg-gradient-to-br", toneClass)}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-3xl font-bold tabular-nums text-foreground">{value}</div>
    </Card>
  );
}
