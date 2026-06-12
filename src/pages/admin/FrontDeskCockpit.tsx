import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { OrderContainer } from "@/components/admin/dashboards/OrderContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence } from "framer-motion";
import { AlertOctagon, BellRing, BedDouble, MessageSquare, RefreshCw, Volume2, VolumeX, Mail } from "lucide-react";
import { hotelNotificationSounds } from "@/utils/hotel-notification-sounds";
import { toast } from "sonner";

type FeedKind = "complaint" | "contact" | "room_order" | "inquiry";

interface FeedItem {
  id: string;
  kind: FeedKind;
  createdAt: string;
  title: string;
  subtitle?: string;
  location?: string;
  guestName?: string;
  body: string;
  urgency: "urgent" | "high" | "normal" | "low";
  status: string;
  raw: any;
}

const URGENCY_TO_TONE: Record<FeedItem["urgency"], "urgent" | "new" | "active" | "done"> = {
  urgent: "urgent",
  high: "new",
  normal: "active",
  low: "done",
};

const URGENCY_RANK: Record<FeedItem["urgency"], number> = { urgent: 0, high: 1, normal: 2, low: 3 };

const KIND_META: Record<FeedKind, { label: string; icon: any; emoji: string }> = {
  complaint: { label: "Beschwerde", icon: AlertOctagon, emoji: "🚨" },
  contact: { label: "Kontakt", icon: Mail, emoji: "✉️" },
  room_order: { label: "Room-Service", icon: BedDouble, emoji: "🛎" },
  inquiry: { label: "Anfrage", icon: MessageSquare, emoji: "💬" },
};

function loadComplaints(rows: any[]): FeedItem[] {
  return rows.map((r) => ({
    id: `c-${r.id}`,
    kind: "complaint" as FeedKind,
    createdAt: r.created_at,
    title: `Beschwerde: ${r.category ?? "Allgemein"}`,
    subtitle: r.guest_type ? `Gast-Typ: ${r.guest_type}` : undefined,
    location: r.room_or_table ?? undefined,
    guestName: r.guest_name ?? undefined,
    body: r.description ?? "",
    urgency: (["urgent", "high", "normal", "low"].includes(r.urgency) ? r.urgency : "normal") as FeedItem["urgency"],
    status: r.status ?? "new",
    raw: r,
  }));
}

function loadContacts(rows: any[]): FeedItem[] {
  return rows.map((r) => {
    let ctx: any = {};
    try { ctx = typeof r.service_context === "string" ? JSON.parse(r.service_context) : r.service_context ?? {}; } catch {}
    return {
      id: `ct-${r.id}`,
      kind: "contact" as FeedKind,
      createdAt: r.created_at,
      title: `Kontakt: ${r.contact_type ?? "Anfrage"}`,
      subtitle: r.contact_value ?? undefined,
      location: r.room_number ?? ctx.identifier ?? undefined,
      guestName: r.name ?? undefined,
      body: ctx.message || (Array.isArray(ctx.selectedComplaints) ? ctx.selectedComplaints.join(", ") : "") || "—",
      urgency: r.status === "neu" ? "high" : "normal",
      status: r.status ?? "neu",
      raw: r,
    };
  });
}

function loadRoomOrders(rows: any[]): FeedItem[] {
  return rows.map((r) => ({
    id: `ro-${r.id}`,
    kind: "room_order" as FeedKind,
    createdAt: r.created_at,
    title: `Room-Service · Zimmer ${r.room_number ?? "—"}`,
    guestName: r.customer_name ?? r.guest_name ?? undefined,
    location: r.room_number ? `Zimmer ${r.room_number}` : undefined,
    body: typeof r.items === "string" ? r.items : JSON.stringify(r.items ?? {}),
    urgency: "normal",
    status: r.status ?? "new",
    raw: r,
  }));
}

export default function FrontDeskCockpit() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [filter, setFilter] = useState<"all" | FeedKind>("all");
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const seen = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const load = async () => {
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    const safeQuery = async (table: string) => {
      try {
        const res = await (supabase.from(table as any) as any).select("*").gte("created_at", since).order("created_at", { ascending: false });
        return res?.data ?? [];
      } catch { return []; }
    };
    const [complaints, contacts, roomOrders] = await Promise.all([
      safeQuery("complaints"),
      safeQuery("contact_requests"),
      safeQuery("orders"),
    ]);

    const combined: FeedItem[] = [
      ...loadComplaints(complaints),
      ...loadContacts(contacts),
      ...loadRoomOrders(roomOrders),
    ];
    combined.sort((a, b) => {
      const u = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
      if (u !== 0) return u;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (!firstLoad.current && !muted) {
      const fresh = combined.filter((c) => !seen.current.has(c.id));
      if (fresh.length > 0) {
        const urgent = fresh.find((f) => f.urgency === "urgent" || f.kind === "complaint");
        if (urgent) hotelNotificationSounds.playComplaintNotification();
        else hotelNotificationSounds.playGeneralHotelNotification();
        toast.success(`${fresh.length} neue${fresh.length > 1 ? "" : "r"} Vorgang`, {
          description: fresh[0].title,
        });
      }
    }
    combined.forEach((c) => seen.current.add(c.id));
    firstLoad.current = false;
    setItems(combined);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("frontdesk_feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => void load())
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_requests" }, () => void load())
      .subscribe();
    const interval = setInterval(() => void load(), 30000);
    return () => {
      void supabase.removeChannel(ch);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markResolved = async (item: FeedItem) => {
    const map = {
      complaint: { table: "complaints", id: item.raw.id, status: "resolved" },
      contact: { table: "contact_requests", id: item.raw.id, status: "erledigt" },
      room_order: { table: "orders", id: item.raw.id, status: "completed" },
      inquiry: { table: "tagungs_inquiries", id: item.raw.id, status: "in_bearbeitung" },
    } as const;
    const m = map[item.kind];
    const { error } = await supabase.from(m.table as any).update({ status: m.status }).eq("id", m.id);
    if (error) toast.error("Update fehlgeschlagen");
    else {
      toast.success("Vorgang aktualisiert");
      void load();
    }
  };

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );

  const counts = useMemo(() => ({
    all: items.length,
    complaint: items.filter((i) => i.kind === "complaint").length,
    contact: items.filter((i) => i.kind === "contact").length,
    room_order: items.filter((i) => i.kind === "room_order").length,
    inquiry: items.filter((i) => i.kind === "inquiry").length,
    urgent: items.filter((i) => i.urgency === "urgent" || i.urgency === "high").length,
  }), [items]);

  return (
    <HeidehofAdminLayout>
      <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BellRing className="h-7 w-7 text-rose-400" /> Front-Desk-Cockpit
            </h1>
            <p className="text-sm text-muted-foreground">
              Alle Hotel-Anliegen live: Beschwerden, Anfragen, Room-Service. Nach Dringlichkeit sortiert.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">
              {counts.urgent} dringend
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
              {muted ? "Stumm" : "Sound"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </header>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Alle <Badge variant="secondary" className="ml-1.5">{counts.all}</Badge></TabsTrigger>
            <TabsTrigger value="complaint">Beschwerden <Badge variant="secondary" className="ml-1.5">{counts.complaint}</Badge></TabsTrigger>
            <TabsTrigger value="contact">Kontakt <Badge variant="secondary" className="ml-1.5">{counts.contact}</Badge></TabsTrigger>
            <TabsTrigger value="room_order">Room-Service <Badge variant="secondary" className="ml-1.5">{counts.room_order}</Badge></TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {visible.map((item) => {
              const meta = KIND_META[item.kind];
              return (
                <OrderContainer
                  key={item.id}
                  tone={URGENCY_TO_TONE[item.urgency]}
                  icon={<span className="text-2xl">{meta.emoji}</span>}
                  title={item.title}
                  subtitle={item.subtitle}
                  location={item.location}
                  guestName={item.guestName}
                  createdAt={item.createdAt}
                  badges={[
                    { label: meta.label, tone: "default" },
                    { label: `Status: ${item.status}`, tone: item.urgency === "urgent" ? "danger" : "default" },
                    ...(item.urgency === "urgent" ? [{ label: "DRINGEND", tone: "danger" as const }] : []),
                  ]}
                  warning={item.urgency === "urgent" ? "Höchste Priorität – sofort bearbeiten" : undefined}
                  actions={[
                    { label: "Erledigt ✓", onClick: () => markResolved(item) },
                  ]}
                >
                  <p className="whitespace-pre-wrap">{item.body}</p>
                </OrderContainer>
              );
            })}
          </AnimatePresence>
        </div>

        {!loading && visible.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border/40 rounded-xl">
            <p className="text-muted-foreground">Keine offenen Vorgänge. Alles im Griff. 🎯</p>
          </div>
        )}
      </div>
    </HeidehofAdminLayout>
  );
}
