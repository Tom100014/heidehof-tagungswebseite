import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChefHat, UtensilsCrossed, BarChart3, FileImage, Image as ImageIcon,
  ArrowRight, Soup, Activity, ClipboardList, Users, Calendar,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HubLink {
  to: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface KpiData {
  ordersToday: number;
  participantsToday: number;
  menuPlanned: boolean;
  upcoming7d: number;
}

function HubGrid({ items }: { items: HubLink[] }) {
  // 4 items → sauberes 2×2, sonst 3er-Raster
  const lgCols = items.length === 4 ? "lg:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3";
  return (
    <div className={cn("grid sm:grid-cols-2 gap-3", lgCols)}>

      {items.map(({ to, title, desc, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="group rounded-2xl bg-card border border-border p-5 hover:border-[hsl(var(--apple)/0.5)] hover:shadow-lg transition-all flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--apple)/0.1)] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[hsl(var(--apple))]" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-1 group-hover:text-[hsl(var(--apple))] transition-all" />
          </div>
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">{desc}</p>
        </Link>
      ))}
    </div>
  );
}

export default function AdminKueche() {
  const [kpi, setKpi] = useState<KpiData>({
    ordersToday: 0,
    participantsToday: 0,
    menuPlanned: false,
    upcoming7d: 0,
  });
  const [kpiLoading, setKpiLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const in7 = format(new Date(Date.now() + 7 * 86400000), "yyyy-MM-dd");

      const [{ data: ordersToday }, { data: menuToday }, { data: upcoming }] = await Promise.all([
        supabase.from("conference_orders").select("id, participants").eq("service_date", today),
        supabase.from("conference_menus").select("id").eq("menu_date", today).maybeSingle(),
        supabase.from("conference_orders").select("id").gte("service_date", today).lte("service_date", in7),
      ]);

      setKpi({
        ordersToday: ordersToday?.length ?? 0,
        participantsToday: ordersToday?.reduce((s: number, o: any) => s + (o.participants ?? 1), 0) ?? 0,
        menuPlanned: !!menuToday,
        upcoming7d: upcoming?.length ?? 0,
      });
      setKpiLoading(false);
    };

    load();
    const ch = supabase.channel("kueche-kpi")
      .on("postgres_changes", { event: "*", schema: "public", table: "conference_orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const kpiCards = [
    { icon: ClipboardList, label: "Bestellungen heute", value: kpi.ordersToday,       warn: false },
    { icon: Users,         label: "Teilnehmer heute",   value: kpi.participantsToday, warn: false },
    { icon: UtensilsCrossed,label: "Tagesmenü",         value: kpi.menuPlanned ? "Geplant" : "Fehlt", warn: !kpi.menuPlanned },
    { icon: Calendar,      label: "Bestellungen 7 Tage",value: kpi.upcoming7d,        warn: false },
  ];

  return (
    <HeidehofAdminLayout title="Küche & Tagungsmenü">
      <div className="space-y-5 max-w-[1400px]">

        {/* Page heading */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold">Operatives Zentrum</p>
          <h2 className="text-xl font-bold text-foreground mt-0.5">Tagungsküche · Menüplanung · Auswertung</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Heute, {format(new Date(), "EEEE dd. MMMM yyyy", { locale: de })}
          </p>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map(({ icon: Icon, label, value, warn }) => (
            <div key={label} className={cn(
              "rounded-xl border p-4",
              warn ? "bg-amber-500/10 border-amber-500/25" : "bg-card border-border"
            )}>
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn("w-4 h-4", warn ? "text-amber-400" : "text-[hsl(var(--apple))]")} />
                {warn && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium">{label}</p>
              <p className={cn(
                "text-2xl font-bold tabular-nums tracking-tight mt-0.5",
                warn ? "text-amber-400" : "text-foreground"
              )}>
                {kpiLoading ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cockpit" className="w-full">
          <TabsList className="bg-muted/50 border border-border p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="cockpit" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg gap-2 px-4 py-2 text-sm">
              <ChefHat className="w-4 h-4" /> Live-Cockpit
            </TabsTrigger>
            <TabsTrigger value="menue" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg gap-2 px-4 py-2 text-sm">
              <UtensilsCrossed className="w-4 h-4" /> Tagungsmenü
            </TabsTrigger>
            <TabsTrigger value="auswertung" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg gap-2 px-4 py-2 text-sm">
              <BarChart3 className="w-4 h-4" /> Auswertungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cockpit" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Live-Übersicht & Aufstellpläne</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Echtzeit-Bestellungen pro Tagungsraum, Mengen für Fisch / Fleisch / Vegetarisch. PDF-Report täglich 10:30.
                </p>
              </div>
              <HubGrid items={[
                { to: "/admin/kitchen",           title: "Küchen-Cockpit",      desc: "Live-Übersicht aller Bestellungen pro Raum & Service.", icon: ChefHat },
                { to: "/admin/conference-orders", title: "Tagungs-Bestellungen",desc: "Alle eingegangenen Menü-Bestellungen verwalten.",       icon: UtensilsCrossed },
              ]} />
            </div>
          </TabsContent>

          <TabsContent value="menue" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Tagungsmenü-Atelier</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Gerichte mit KI-Bildern erstellen. Referenzbilder für Besteck, Teller und Tisch — einheitlicher Look.
                </p>
              </div>
              <HubGrid items={[
                { to: "/admin/dishes",          title: "Gerichte (KI-Bilder)",    desc: "Tagesgerichte mit Referenzbildern & Prompts erstellen.",     icon: UtensilsCrossed },
                { to: "/admin/conference-menu", title: "Tagesmenü zusammenstellen",desc: "Vorspeise, Hauptgang (3 Varianten), Dessert pro Tag.",        icon: ChefHat },
                { to: "/admin/menu-cards",      title: "Speisekarten-Archiv",     desc: "Alle erzeugten Speisekarten als PDF.",                       icon: FileImage },
                { to: "/admin/image-studio",    title: "Bild-Studio & Referenzen",desc: "Referenzbilder für Besteck, Teller, Tischsets pflegen.",      icon: ImageIcon },
              ]} />
            </div>
          </TabsContent>

          <TabsContent value="auswertung" className="mt-4">
            <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-foreground">Statistiken & Analyse</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Bestellstatistiken, Clara-Konversationen und Admin-Aktivitätshistorie.
                </p>
              </div>
              <HubGrid items={[
                { to: "/admin/analytics",     title: "Statistiken",              desc: "Bestellungen, Anfragen, Auslastung pro Zeitraum.",     icon: BarChart3 },
                { to: "/admin/clara-cockpit", title: "Sprachassistent-Cockpit",  desc: "Clara-Konversationen, Tools, Kosten.",                 icon: Activity },
                { to: "/admin/aktivitaet",    title: "Aktivitätsprotokoll",      desc: "Audit-Log aller Admin-Aktionen.",                     icon: Soup },
              ]} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </HeidehofAdminLayout>
  );
}
