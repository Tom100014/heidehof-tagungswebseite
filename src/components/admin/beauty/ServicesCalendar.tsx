import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CalendarResource {
  id: string;
  name: string;
  color?: string | null;
  sector?: string | null;
}

export interface CalendarBooking {
  id: string;
  resourceId: string | null;
  starts_at: string;
  ends_at: string;
  title: string;
  subtitle?: string;
  status: string;
  color?: string | null;
}

interface Props {
  resources: CalendarResource[];
  bookings: CalendarBooking[];
  startHour?: number;
  endHour?: number;
  slotMinutes?: number;
  onBookingClick?: (b: CalendarBooking) => void;
  emptyLabel?: string;
}

/**
 * Visueller Services-Kalender im Raster.
 * Spalten = Zeitslots (oben), Zeilen = Ressourcen (nach sector gruppiert).
 */
export function ServicesCalendar({
  resources,
  bookings,
  startHour = 8,
  endHour = 22,
  slotMinutes = 30,
  onBookingClick,
  emptyLabel = "Keine Ressourcen",
}: Props) {
  const totalMinutes = (endHour - startHour) * 60;
  const slots = useMemo(() => {
    const arr: string[] = [];
    for (let m = 0; m < totalMinutes; m += slotMinutes) {
      const h = startHour + Math.floor(m / 60);
      const mm = m % 60;
      arr.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    }
    return arr;
  }, [startHour, endHour, slotMinutes, totalMinutes]);

  const groups = useMemo(() => {
    const map = new Map<string, CalendarResource[]>();
    for (const r of resources) {
      const k = r.sector || "Allgemein";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.entries());
  }, [resources]);

  const PX_PER_MIN = 2; // 60 min = 120 px
  const ROW_HEIGHT = 64;

  const computeBlock = (b: CalendarBooking) => {
    const dayStart = new Date(b.starts_at);
    dayStart.setHours(startHour, 0, 0, 0);
    const startMs = new Date(b.starts_at).getTime() - dayStart.getTime();
    const endMs = new Date(b.ends_at).getTime() - dayStart.getTime();
    const left = Math.max(0, (startMs / 60000) * PX_PER_MIN);
    const width = Math.max(20, ((endMs - startMs) / 60000) * PX_PER_MIN);
    return { left, width };
  };

  if (resources.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">{emptyLabel}</Card>
    );
  }

  const gridWidth = totalMinutes * PX_PER_MIN;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          {/* Zeitleiste */}
          <div className="flex sticky top-0 z-10 bg-card border-b border-border">
            <div className="w-48 flex-shrink-0 p-2 text-xs font-medium text-muted-foreground border-r border-border">
              Ressource
            </div>
            <div className="relative" style={{ width: gridWidth }}>
              <div className="flex">
                {slots.map((s, i) => (
                  <div
                    key={s}
                    className={`flex-shrink-0 text-[10px] text-muted-foreground border-r border-border/40 px-1 py-2 ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                    style={{ width: slotMinutes * PX_PER_MIN }}
                  >
                    {i % 2 === 0 ? s : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gruppen */}
          {groups.map(([sector, rs]) => (
            <div key={sector}>
              <div className="flex bg-muted/30 border-b border-border">
                <div className="w-48 flex-shrink-0 px-2 py-1.5 text-xs uppercase tracking-wide text-gold font-medium">
                  {sector}
                </div>
                <div style={{ width: gridWidth }} />
              </div>
              {rs.map((r) => {
                const mine = bookings.filter((b) => b.resourceId === r.id);
                return (
                  <div key={r.id} className="flex border-b border-border/40 hover:bg-muted/10">
                    <div className="w-48 flex-shrink-0 p-2 border-r border-border flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color || "#C9A84C" }}/>
                      <span className="text-sm truncate">{r.name}</span>
                    </div>
                    <div className="relative" style={{ width: gridWidth, height: ROW_HEIGHT }}>
                      {/* Slot-Gitter */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {slots.map((s, i) => (
                          <div
                            key={s}
                            className={`border-r border-border/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                            style={{ width: slotMinutes * PX_PER_MIN }}
                          />
                        ))}
                      </div>
                      {mine.map((b) => {
                        const { left, width } = computeBlock(b);
                        const bg = b.color || r.color || "#C9A84C";
                        return (
                          <button
                            key={b.id}
                            onClick={() => onBookingClick?.(b)}
                            className="absolute top-1.5 bottom-1.5 rounded-md text-left px-2 py-1 text-[11px] text-slate-900 shadow-md hover:scale-[1.02] transition-transform overflow-hidden"
                            style={{ left, width, background: bg }}
                            title={`${b.title} — ${b.subtitle ?? ""}`}
                          >
                            <div className="font-medium truncate">{b.title}</div>
                            <div className="truncate opacity-80">{b.subtitle}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
