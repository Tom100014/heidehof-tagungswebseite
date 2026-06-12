import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { adminSecurity, type AdminRole } from "@/utils/admin-security";
import {
  Gauge, Sparkles, UtensilsCrossed, Activity, ClipboardList, Hotel,
  Inbox, DoorOpen, Armchair, FileText, Zap, Megaphone, BookOpen, Waves,
  CalendarDays, Image as ImageIcon, BarChart3, Mail, Plug, Settings,
  HelpCircle, AlertTriangle, RefreshCw, ArrowRight,
} from "lucide-react";

type Tone = "ok" | "warn" | "alert";

type Tile = {
  id: string;
  label: string;
  href: string;
  icon: typeof Gauge;
  roles?: AdminRole[];
  load?: () => Promise<{ count: number; tone: Tone; hint?: string }>;
  staticHint?: string;
};

const FULL: AdminRole[] = ["admin", "director"];
const SERVICE: AdminRole[] = ["admin", "director", "service"];
const KITCHEN: AdminRole[] = ["admin", "director", "kitchen"];
const CONF: AdminRole[] = ["admin", "director", "conference"];

/* ───────── Count-Helpers ───────── */
const todayBerlinRange = () => {
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
};

const countTable = async (
  table: string,
  build: (q: any) => any = (q) => q,
): Promise<number> => {
  try {
    const q = build(
      supabase.from(table as any).select("id", { count: "exact", head: true }),
    );
    const { count, error } = await q;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
};

const openStatuses = ["new", "pending", "open", "neu", "offen"];

/* ───────── Tile-Konfiguration ───────── */
const TILES: Record<string, Tile[]> = {
  "Live-Betrieb": [
    {
      id: "direktion", label: "Direktor-Cockpit", href: "/admin/direktion", icon: Gauge, roles: FULL,
      staticHint: "Abteilungsübergreifende Auswertung",
      load: async () => ({ count: 0, tone: "ok", hint: "Live-Auswertung" }),
    },
    {
      id: "front-desk", label: "Front-Desk", href: "/admin/front-desk", icon: Hotel, roles: SERVICE,
      load: async () => {
        const open = await countTable("complaints", (q) => q.in("status", openStatuses));
        return {
          count: open,
          tone: open >= 5 ? "alert" : open > 0 ? "warn" : "ok",
          hint: open === 1 ? "1 offene Meldung" : `${open} offene Meldungen`,
        };
      },
    },
    {
      id: "fb", label: "F&B Service", href: "/admin/fb-service", icon: UtensilsCrossed, roles: SERVICE,
      load: async () => {
        const open = await countTable("restaurant_orders", (q) => q.in("status", openStatuses));
        return {
          count: open,
          tone: open >= 10 ? "alert" : open > 0 ? "warn" : "ok",
          hint: open === 1 ? "1 offene Bestellung" : `${open} offene Bestellungen`,
        };
      },
    },
    {
      id: "kitchen", label: "Küche", href: "/admin/kitchen", icon: Activity, roles: KITCHEN,
      load: async () => {
        const open = await countTable("conference_orders", (q) => q.in("status", openStatuses));
        return {
          count: open,
          tone: open >= 5 ? "alert" : open > 0 ? "warn" : "ok",
          hint: open === 1 ? "1 Auftrag offen" : `${open} Aufträge offen`,
        };
      },
    },
    {
      id: "service", label: "Service-Station", href: "/admin/service", icon: UtensilsCrossed, roles: SERVICE,
      load: async () => {
        const { startIso, endIso } = todayBerlinRange();
        const today = await countTable("restaurant_orders", (q) => q.gte("created_at", startIso).lte("created_at", endIso));
        return {
          count: today,
          tone: today >= 20 ? "alert" : today > 0 ? "warn" : "ok",
          hint: today === 1 ? "1 Bestellung heute" : `${today} Bestellungen heute`,
        };
      },
    },
    {
      id: "inbox", label: "Posteingang", href: "/admin/inbox", icon: Inbox,
      roles: ["admin", "director", "service", "conference"],
      load: async () => {
        const unread = await countTable("clara_conversations", (q) => q.eq("inquiry_sent", false));
        return {
          count: unread,
          tone: unread >= 10 ? "alert" : unread > 0 ? "warn" : "ok",
          hint: unread === 1 ? "1 ungelesen" : `${unread} ungelesen`,
        };
      },
    },
    {
      id: "beauty", label: "Beauty & Spa", href: "/admin/beauty", icon: Sparkles, roles: FULL,
      load: async () => {
        const { startIso, endIso } = todayBerlinRange();
        const today = await countTable("beauty_bookings", (q) => q.gte("starts_at", startIso).lte("starts_at", endIso));
        return {
          count: today,
          tone: today > 0 ? "warn" : "ok",
          hint: today === 1 ? "1 Termin heute" : `${today} Termine heute`,
        };
      },
    },
  ],
  "Tagungen & Räume": [
    {
      id: "conference-orders", label: "Tagungen", href: "/admin/conference-orders", icon: ClipboardList, roles: CONF,
      load: async () => {
        const open = await countTable("tagungs_inquiries", (q) => q.in("status", openStatuses));
        return {
          count: open,
          tone: open >= 5 ? "alert" : open > 0 ? "warn" : "ok",
          hint: open === 1 ? "1 offene Anfrage" : `${open} offene Anfragen`,
        };
      },
    },
    {
      id: "leads", label: "Leads", href: "/admin/leads", icon: Megaphone, roles: CONF,
      staticHint: "Lead-Pipeline",
    },
    { id: "rooms", label: "Zimmer & Räume", href: "/admin/rooms", icon: DoorOpen, roles: [...FULL, "conference"], staticHint: "Räume verwalten" },
    { id: "setups", label: "Raum-Setups", href: "/admin/setups", icon: Armchair, roles: [...FULL, "conference"], staticHint: "Bestuhlungen" },
    { id: "packages", label: "Tagungspakete", href: "/admin/tagungspauschalen", icon: FileText, roles: [...FULL, "conference"], staticHint: "Pauschalen" },
    { id: "tech", label: "Tagungstechnik", href: "/admin/tagungstechnik", icon: Zap, roles: [...FULL, "conference"], staticHint: "Ausstattung" },
  ],
  "Inhalte & Karten": [
    { id: "speisen", label: "Speisen", href: "/admin/speisen", icon: BookOpen, roles: [...FULL, "service", "kitchen"], staticHint: "Karte & Tagungsmenüs" },
    { id: "getraenke", label: "Getränke", href: "/admin/getraenkekarte", icon: BookOpen, roles: SERVICE, staticHint: "Bar & Karte" },
    { id: "wellness", label: "Wellness & Spa", href: "/admin/wellness", icon: Waves, roles: FULL, staticHint: "Behandlungen" },
    { id: "veranstaltungen", label: "Veranstaltungen", href: "/admin/veranstaltungen", icon: CalendarDays, roles: [...FULL, "conference"], staticHint: "Events" },
    { id: "medien", label: "Medien", href: "/admin/medien", icon: ImageIcon, roles: FULL, staticHint: "Bilder & Studio" },
    { id: "clara", label: "Clara", href: "/admin/clara", icon: Sparkles, roles: FULL, staticHint: "KI-Assistentin" },
    { id: "inhalte", label: "Website-Inhalte", href: "/admin/inhalte", icon: FileText, roles: FULL, staticHint: "Texte & Sektionen" },
  ],
  "System": [
    { id: "auswertung", label: "Auswertung", href: "/admin/auswertung", icon: BarChart3, roles: FULL, staticHint: "KI & Analytics" },
    { id: "email", label: "E-Mail-Routing", href: "/admin/email-routing", icon: Mail, roles: FULL, staticHint: "Postfächer & Regeln" },
    { id: "integrations", label: "Integrationen", href: "/admin/integrations", icon: Plug, roles: FULL, staticHint: "Drittsysteme" },
    { id: "mews", label: "Mews PMS", href: "/admin/mews", icon: Plug, roles: FULL, staticHint: "PMS-Verbindung" },
    { id: "einstellungen", label: "Einstellungen", href: "/admin/einstellungen", icon: Settings, roles: FULL, staticHint: "System & Konten" },
    { id: "hilfe", label: "Hilfe", href: "/admin/hilfe", icon: HelpCircle, staticHint: "Anleitung" },
  ],
};

/* ───────── Status-Dot ───────── */
const TONE_DOT: Record<Tone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  alert: "bg-rose-500 animate-pulse",
};

const TONE_LABEL: Record<Tone, string> = {
  ok: "Ruhig",
  warn: "Offen",
  alert: "Dringend",
};

/* ───────── KPI-Berechnung ───────── */
type Kpis = {
  open: number;
  urgent: number;
  todayNew: number;
  alertDepts: number;
};

async function loadKpis(): Promise<Kpis> {
  const { startIso, endIso } = todayBerlinRange();
  const [openLeads, openOrders, openComplaints, openRoom, urgentComplaints, todayNewOrders, todayNewInq] = await Promise.all([
    countTable("tagungs_inquiries", (q) => q.in("status", openStatuses)),
    countTable("restaurant_orders", (q) => q.in("status", openStatuses)),
    countTable("complaints", (q) => q.in("status", openStatuses)),
    countTable("room_orders", (q) => q.in("status", openStatuses)),
    countTable("complaints", (q) => q.eq("urgency", "high").in("status", openStatuses)),
    countTable("restaurant_orders", (q) => q.gte("created_at", startIso).lte("created_at", endIso)),
    countTable("tagungs_inquiries", (q) => q.gte("created_at", startIso).lte("created_at", endIso)),
  ]);

  const open = openLeads + openOrders + openComplaints + openRoom;
  const urgent = urgentComplaints;
  const todayNew = todayNewOrders + todayNewInq;

  let alertDepts = 0;
  if (openOrders >= 10) alertDepts++;
  if (openComplaints >= 5 || urgentComplaints > 0) alertDepts++;
  if (openLeads >= 5) alertDepts++;
  if (openRoom >= 5) alertDepts++;

  return { open, urgent, todayNew, alertDepts };
}

/* ───────── Tile-State ───────── */
type TileState = { count: number; tone: Tone; hint?: string; loading: boolean };
const initialState: TileState = { count: 0, tone: "ok", hint: undefined, loading: true };

/* ───────── Komponente ───────── */
export default function AdminCommandCenter() {
  const [roles, setRoles] = useState<AdminRole[]>(FULL);
  const [kpis, setKpis] = useState<Kpis>({ open: 0, urgent: 0, todayNew: 0, alertDepts: 0 });
  const [kpiLoading, setKpiLoading] = useState(true);
  const [tileState, setTileState] = useState<Record<string, TileState>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    adminSecurity.getRoles().then((r) => {
      if (mounted && r.length > 0) setRoles(r);
    });
    return () => { mounted = false; };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    setKpiLoading(true);
    const [k] = await Promise.all([loadKpis()]);
    setKpis(k);
    setKpiLoading(false);

    const allTiles = Object.values(TILES).flat();
    const updates: Record<string, TileState> = {};
    await Promise.all(
      allTiles.map(async (t) => {
        if (!t.load) {
          updates[t.id] = { count: 0, tone: "ok", hint: t.staticHint, loading: false };
          return;
        }
        const r = await t.load();
        updates[t.id] = { ...r, loading: false };
      }),
    );
    setTileState((prev) => ({ ...prev, ...updates }));
    setRefreshing(false);
  };

  useEffect(() => { void refresh(); }, []);

  const canUse = (t: Tile) => !t.roles || t.roles.some((r) => roles.includes(r));

  const sections = useMemo(() => {
    return Object.entries(TILES).map(([title, tiles]) => ({
      title,
      tiles: tiles.filter(canUse),
    })).filter((s) => s.tiles.length > 0);
  }, [roles]);

  const kpiCards = [
    { label: "Offene Vorgänge", value: kpis.open, hint: "Über alle Abteilungen", icon: Activity, tone: kpis.open > 0 ? "warn" : "ok" as Tone },
    { label: "Sofort prüfen", value: kpis.urgent, hint: "Hohe Dringlichkeit", icon: AlertTriangle, tone: kpis.urgent > 0 ? "alert" : "ok" as Tone },
    { label: "Heute neu", value: kpis.todayNew, hint: "Anfragen & Bestellungen", icon: CalendarDays, tone: "ok" as Tone },
    { label: "Alarm-Abteilungen", value: kpis.alertDepts, hint: "Bereiche mit Stau", icon: Gauge, tone: kpis.alertDepts > 0 ? "alert" : "ok" as Tone },
  ];

  return (
    <HeidehofAdminLayout title="Kommandozentrale">
      <div className="space-y-7 pb-10">
        <AdminPageHeader
          title="Kommandozentrale"
          subtitle="Alle Skills auf einen Blick — mit Live-Status, direkten Sprüngen in jeden Bereich und einer ruhigen Übersicht für Direktion und Empfang."
          actions={
            <button
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="Aktualisieren"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              Aktualisieren
            </button>
          }
        />

        {/* KPI-Leiste */}
        <section aria-label="Kennzahlen" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map(({ label, value, hint, icon: Icon, tone }) => (
            <Card key={label} className="p-4 flex items-start gap-3">
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                tone === "alert" ? "bg-rose-500/15 text-rose-500" :
                tone === "warn" ? "bg-amber-500/15 text-amber-500" :
                "bg-emerald-500/15 text-emerald-500"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-semibold leading-tight mt-0.5">
                  {kpiLoading ? <span className="inline-block w-8 h-6 bg-muted rounded animate-pulse" /> : value}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{hint}</p>
              </div>
            </Card>
          ))}
        </section>

        {/* Skill-Sektionen */}
        {sections.map((section) => (
          <section key={section.title} aria-label={section.title} className="space-y-3">
            <h2 className="text-[11px] uppercase tracking-[0.22em] font-semibold text-muted-foreground">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {section.tiles.map((tile) => {
                const Icon = tile.icon;
                const state = tileState[tile.id] ?? { ...initialState, hint: tile.staticHint };
                return (
                  <Link
                    key={tile.id}
                    to={tile.href}
                    className={cn(
                      "group relative bg-card border border-border rounded-xl p-4",
                      "hover:border-[hsl(var(--apple)/0.6)] hover:bg-muted/30 hover:-translate-y-0.5",
                      "transition-all duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--apple)/0.1)] flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--apple)/0.18)] transition-colors">
                        <Icon className="w-5 h-5 text-[hsl(var(--apple))]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{tile.label}</h3>
                          <span
                            className={cn("w-2 h-2 rounded-full flex-shrink-0", TONE_DOT[state.tone])}
                            title={TONE_LABEL[state.tone]}
                            aria-label={TONE_LABEL[state.tone]}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {state.loading ? (
                            <span className="inline-block w-24 h-3 bg-muted rounded animate-pulse" />
                          ) : (
                            state.hint ?? tile.staticHint ?? "Öffnen"
                          )}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </HeidehofAdminLayout>
  );
}
