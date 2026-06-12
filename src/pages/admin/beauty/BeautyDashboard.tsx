import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Plus, Trash2, Calendar, Users, Clock, Sparkles,
  LayoutGrid, ListIcon, ChevronLeft, ChevronRight, Building2, Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { useBeautyBookings } from "@/hooks/useBeautyBookings";
import { todayIsoBerlin } from "@/lib/beauty/booking-api";
import { AvailabilityEditor } from "@/components/admin/beauty/AvailabilityEditor";
import { ServicesCalendar, CalendarResource, CalendarBooking } from "@/components/admin/beauty/ServicesCalendar";

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// ─────────────────────────────────────────────────────────────
// OVERVIEW / Setup-Dashboard
// ─────────────────────────────────────────────────────────────
function OverviewPanel({ onJump }: { onJump: (tab: string) => void }) {
  const [stats, setStats] = useState({ staff: 0, facilities: 0, treatments: 0, todayBookings: 0 });

  useEffect(() => {
    const load = async () => {
      const today = todayIsoBerlin();
      const [s, f, t, b] = await Promise.all([
        supabase.from("beauty_staff" as any).select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("beauty_facilities" as any).select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("wellness_treatments" as any).select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("beauty_bookings" as any).select("id", { count: "exact", head: true })
          .gte("starts_at", `${today}T00:00:00+00:00`).lt("starts_at", `${today}T23:59:59+00:00`),
      ]);
      setStats({
        staff: s.count ?? 0, facilities: f.count ?? 0,
        treatments: t.count ?? 0, todayBookings: b.count ?? 0,
      });
    };
    void load();
  }, []);

  const cards = [
    { label: "Mitarbeiter aktiv", value: stats.staff, icon: Users, tab: "staff", hint: "Team verwalten & Skills setzen" },
    { label: "Facilities aktiv", value: stats.facilities, icon: Building2, tab: "facilities", hint: "Räume & Ressourcen" },
    { label: "Behandlungen", value: stats.treatments, icon: Sparkles, tab: "treatments", hint: "Services & Dauer" },
    { label: "Buchungen heute", value: stats.todayBookings, icon: Calendar, tab: "calendar", hint: "Tagesplan ansehen" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <button key={c.label} onClick={() => onJump(c.tab)}
            className="text-left transition hover:-translate-y-0.5">
            <Card className="p-5 hover:border-gold/60 transition">
              <div className="flex items-center justify-between">
                <c.icon className="h-5 w-5 text-gold"/>
                <span className="text-2xl font-semibold">{c.value}</span>
              </div>
              <div className="mt-3 text-sm font-medium">{c.label}</div>
              <div className="text-xs text-muted-foreground">{c.hint}</div>
            </Card>
          </button>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="font-serif text-lg mb-2 flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-gold"/> Schnellzugriff
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Empfohlene Reihenfolge bei der Einrichtung: <strong>Facilities</strong> → <strong>Mitarbeiter</strong> → <strong>Behandlungen</strong> → <strong>Kalender</strong>.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => onJump("facilities")}>Facilities verwalten</Button>
          <Button variant="outline" onClick={() => onJump("staff")}>Mitarbeiter verwalten</Button>
          <Button variant="outline" onClick={() => onJump("treatments")}>Behandlungen</Button>
          <Button onClick={() => onJump("calendar")}>Heute im Kalender</Button>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KALENDER
// ─────────────────────────────────────────────────────────────
function CalendarPanel() {
  const [date, setDate] = useState<string>(todayIsoBerlin());
  const [mode, setMode] = useState<"facility" | "staff">("staff");
  const [staff, setStaff] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(22);
  const [selected, setSelected] = useState<CalendarBooking | null>(null);
  const { bookings, loading } = useBeautyBookings(date);

  useEffect(() => {
    void supabase.from("beauty_staff" as any).select("id,name,color,is_active").eq("is_active", true).order("name")
      .then(({ data }) => setStaff((data as any) ?? []));
    void supabase.from("beauty_facilities" as any).select("id,name,color,sector,is_active").eq("is_active", true).order("sort_order")
      .then(({ data }) => setFacilities((data as any) ?? []));
  }, []);

  const resources: CalendarResource[] = useMemo(() => {
    if (mode === "staff") return staff.map((s) => ({ id: s.id, name: s.name, color: s.color, sector: "Mitarbeiter" }));
    return facilities.map((f) => ({ id: f.id, name: f.name, color: f.color, sector: f.sector || "Allgemein" }));
  }, [mode, staff, facilities]);

  const calBookings: CalendarBooking[] = useMemo(() => {
    return bookings.map((b: any) => ({
      id: b.id,
      resourceId: mode === "staff" ? (b.staff_id ?? null) : (b.facility_id ?? null),
      starts_at: b.starts_at,
      ends_at: b.ends_at,
      title: b.treatment_title,
      subtitle: `${b.guest_name}${b.guest_room ? ` · Zi. ${b.guest_room}` : ""}`,
      status: b.status,
      color: undefined,
    }));
  }, [bookings, mode]);

  const shiftDate = (days: number) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("beauty_bookings" as any).update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Status: ${status}`); setSelected(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => shiftDate(-1)}><ChevronLeft className="h-4 w-4"/></Button>
          <Button size="sm" variant="outline" onClick={() => setDate(todayIsoBerlin())}>Heute</Button>
          <Button size="sm" variant="outline" onClick={() => shiftDate(1)}><ChevronRight className="h-4 w-4"/></Button>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44"/>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs">Von</Label>
            <Input type="number" min={0} max={23} value={startHour} onChange={(e)=>setStartHour(Number(e.target.value))} className="w-16 h-9 text-sm"/>
            <Label className="text-xs">Bis</Label>
            <Input type="number" min={1} max={24} value={endHour} onChange={(e)=>setEndHour(Number(e.target.value))} className="w-16 h-9 text-sm"/>
          </div>
          <div className="rounded-md border border-border p-0.5 inline-flex">
            <button onClick={() => setMode("facility")}
              className={`px-3 py-1.5 text-xs rounded ${mode==="facility"?"bg-gold/15 text-gold":"text-muted-foreground"}`}>
              <Building2 className="h-3.5 w-3.5 inline mr-1"/>Facility
            </button>
            <button onClick={() => setMode("staff")}
              className={`px-3 py-1.5 text-xs rounded ${mode==="staff"?"bg-gold/15 text-gold":"text-muted-foreground"}`}>
              <Users className="h-3.5 w-3.5 inline mr-1"/>Mitarbeiter
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Lade …</div>
      ) : (
        <ServicesCalendar
          resources={resources}
          bookings={calBookings}
          startHour={startHour}
          endHour={endHour}
          onBookingClick={(b) => setSelected(b)}
          emptyLabel={mode === "facility" ? "Noch keine Facilities angelegt." : "Noch keine Mitarbeiter angelegt."}
        />
      )}

      {selected && (
        <Card className="p-4 fixed bottom-4 right-4 w-[360px] z-50 shadow-2xl border-gold/40">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{new Date(selected.starts_at).toLocaleString("de-DE",{timeZone:"Europe/Berlin"})}</div>
              <div className="font-medium">{selected.title}</div>
              <div className="text-sm text-foreground/70">{selected.subtitle}</div>
              <Badge className="mt-2">{selected.status}</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>✕</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {["confirmed","in_service","done","cancelled","no_show"].map((st) => (
              <button key={st} onClick={() => updateStatus(selected.id, st)}
                className={`px-2 py-1 rounded text-[11px] border ${selected.status===st?"bg-gold/15 border-gold text-gold":"border-border hover:border-gold/40"}`}>
                {st}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LISTE
// ─────────────────────────────────────────────────────────────
function ListPanel() {
  const [date, setDate] = useState<string>(todayIsoBerlin());
  const { bookings, loading } = useBeautyBookings(date);

  return (
    <div className="space-y-4">
      <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-44"/>
      {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="p-3">Zeit</th><th className="p-3">Behandlung</th><th className="p-3">Gast</th>
                <th className="p-3">Mitarbeiter</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="p-3">
                    {new Date(b.starts_at).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"})}
                    {" – "}
                    {new Date(b.ends_at).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"})}
                  </td>
                  <td className="p-3">{b.treatment_title}</td>
                  <td className="p-3">{b.guest_name}{b.guest_room ? ` · Zi. ${b.guest_room}` : ""}</td>
                  <td className="p-3">{b.staff_name ?? "—"}</td>
                  <td className="p-3"><Badge>{b.status}</Badge></td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Keine Buchungen</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MITARBEITER
// ─────────────────────────────────────────────────────────────
function StaffPanel() {
  const [staff, setStaff] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const [s, sk, l] = await Promise.all([
      supabase.from("beauty_staff" as any).select("*").order("name"),
      supabase.from("beauty_skills" as any).select("*").order("sort_order"),
      supabase.from("beauty_staff_skills" as any).select("*"),
    ]);
    setStaff((s.data as any) ?? []); setSkills((sk.data as any) ?? []); setLinks((l.data as any) ?? []);
  };
  useEffect(() => { void load(); }, []);

  const addStaff = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("beauty_staff" as any).insert({ name: newName.trim(), is_active: true });
    if (error) toast.error(error.message); else { setNewName(""); toast.success("Mitarbeiter angelegt"); void load(); }
  };
  const toggleSkill = async (staffId: string, skillId: string, on: boolean) => {
    if (on) await supabase.from("beauty_staff_skills" as any).insert({ staff_id: staffId, skill_id: skillId });
    else await supabase.from("beauty_staff_skills" as any).delete().eq("staff_id", staffId).eq("skill_id", skillId);
    void load();
  };
  const toggleActive = async (s: any) => {
    await supabase.from("beauty_staff" as any).update({ is_active: !s.is_active }).eq("id", s.id); void load();
  };
  const updateColor = async (id: string, color: string) => {
    await supabase.from("beauty_staff" as any).update({ color }).eq("id", id); void load();
  };
  const remove = async (id: string) => {
    if (!confirm("Mitarbeiter wirklich löschen?")) return;
    await supabase.from("beauty_staff" as any).delete().eq("id", id); void load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-medium mb-3">Neuen Mitarbeiter anlegen</h3>
        <div className="flex gap-2">
          <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button onClick={addStaff}><Plus className="h-4 w-4 mr-1"/>Anlegen</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {staff.map((s) => {
          const mySkills = new Set(links.filter((l) => l.staff_id === s.id).map((l) => l.skill_id));
          const open = openId === s.id;
          return (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input type="color" value={s.color || "#C9A84C"} onChange={(e)=>updateColor(s.id, e.target.value)}
                    className="h-8 w-8 rounded border border-border bg-transparent"/>
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.is_active ? "aktiv" : "deaktiviert"}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(s)}>{s.is_active ? "Deaktivieren" : "Aktivieren"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">Skills:</div>
              <div className="flex gap-2 flex-wrap mb-3">
                {skills.map((sk) => {
                  const on = mySkills.has(sk.id);
                  return (
                    <button key={sk.id} onClick={() => toggleSkill(s.id, sk.id, !on)}
                      className={`px-2 py-1 rounded text-xs border ${on?"bg-gold/15 border-gold text-gold":"border-border hover:border-gold/40"}`}>
                      {sk.label}
                    </button>
                  );
                })}
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpenId(open ? null : s.id)}>
                <Clock className="h-3.5 w-3.5 mr-1"/>{open ? "Verfügbarkeit schließen" : "Verfügbarkeit"}
              </Button>
              {open && <div className="mt-3 border-t border-border pt-3"><AvailabilityEditor resourceKind="staff" resourceId={s.id}/></div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FACILITIES
// ─────────────────────────────────────────────────────────────
function FacilitiesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newSector, setNewSector] = useState("");
  const [newCap, setNewCap] = useState("1");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from("beauty_facilities" as any).select("*").order("sort_order").order("name");
    setItems((data as any) ?? []);
  };
  useEffect(() => { void load(); }, []);

  const add = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("beauty_facilities" as any).insert({
      name: newName.trim(), sector: newSector.trim() || null, capacity: Number(newCap) || 1, is_active: true,
    });
    if (error) toast.error(error.message); else { setNewName(""); setNewSector(""); setNewCap("1"); toast.success("Facility angelegt"); void load(); }
  };
  const upd = async (id: string, patch: any) => {
    await supabase.from("beauty_facilities" as any).update(patch).eq("id", id); void load();
  };
  const remove = async (id: string) => {
    if (!confirm("Facility löschen?")) return;
    await supabase.from("beauty_facilities" as any).delete().eq("id", id); void load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-medium mb-3">Neue Facility anlegen</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
          <div className="md:col-span-2">
            <Label className="text-xs">Name</Label>
            <Input value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="z. B. Behandlungsraum 1"/>
          </div>
          <div>
            <Label className="text-xs">Bereich</Label>
            <Input value={newSector} onChange={(e)=>setNewSector(e.target.value)} placeholder="Spa, Beauty …"/>
          </div>
          <div>
            <Label className="text-xs">Kapazität</Label>
            <Input type="number" min={1} value={newCap} onChange={(e)=>setNewCap(e.target.value)}/>
          </div>
          <Button onClick={add}><Plus className="h-4 w-4 mr-1"/>Anlegen</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((f) => {
          const open = openId === f.id;
          return (
            <Card key={f.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input type="color" value={f.color || "#C9A84C"} onChange={(e)=>upd(f.id,{color:e.target.value})}
                    className="h-8 w-8 rounded border border-border bg-transparent"/>
                  <div>
                    <Input defaultValue={f.name} onBlur={(e)=>upd(f.id,{name:e.target.value})}
                      className="h-8 text-sm font-medium w-56"/>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {f.sector || "Allgemein"} · Kapazität {f.capacity} · {f.is_active ? "aktiv" : "deaktiviert"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={()=>upd(f.id,{is_active: !f.is_active})}>
                    {f.is_active ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>
                    <Trash2 className="h-4 w-4 text-destructive"/>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <Label className="text-xs">Bereich</Label>
                  <Input defaultValue={f.sector || ""} onBlur={(e)=>upd(f.id,{sector:e.target.value||null})} className="h-9"/>
                </div>
                <div>
                  <Label className="text-xs">Kapazität</Label>
                  <Input type="number" min={1} defaultValue={f.capacity ?? 1} onBlur={(e)=>upd(f.id,{capacity:Number(e.target.value)||1})} className="h-9"/>
                </div>
                <div>
                  <Label className="text-xs">Sortierung</Label>
                  <Input type="number" defaultValue={f.sort_order ?? 0} onBlur={(e)=>upd(f.id,{sort_order:Number(e.target.value)||0})} className="h-9"/>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpenId(open ? null : f.id)}>
                <Clock className="h-3.5 w-3.5 mr-1"/>{open ? "Verfügbarkeit schließen" : "Verfügbarkeit"}
              </Button>
              {open && <div className="mt-3 border-t border-border pt-3"><AvailabilityEditor resourceKind="facility" resourceId={f.id}/></div>}
            </Card>
          );
        })}
        {items.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground lg:col-span-2">
            Noch keine Facilities angelegt. Leg den ersten Raum oben an.
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BEHANDLUNGEN
// ─────────────────────────────────────────────────────────────
function TreatmentsPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);

  const load = async () => {
    const [t, sk] = await Promise.all([
      supabase.from("wellness_treatments" as any).select("id,title,duration_minutes,buffer_minutes,required_skill,bookable,target_page,is_active").order("sort_order"),
      supabase.from("beauty_skills" as any).select("*").order("sort_order"),
    ]);
    setItems((t.data as any) ?? []); setSkills((sk.data as any) ?? []);
  };
  useEffect(() => { void load(); }, []);

  const update = async (id: string, patch: any) => {
    await supabase.from("wellness_treatments" as any).update(patch).eq("id", id); void load();
  };

  return (
    <Card className="p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-left">
            <th className="p-3">Behandlung</th><th className="p-3">Dauer</th><th className="p-3">Puffer</th>
            <th className="p-3">Skill</th><th className="p-3">Buchbar</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} className="border-t border-border">
              <td className="p-3">{t.title}<div className="text-xs text-muted-foreground">{t.target_page}</div></td>
              <td className="p-3"><Input type="number" defaultValue={t.duration_minutes ?? 60} className="w-20" onBlur={(e)=>update(t.id,{duration_minutes:Number(e.target.value)})}/></td>
              <td className="p-3"><Input type="number" defaultValue={t.buffer_minutes ?? 15} className="w-20" onBlur={(e)=>update(t.id,{buffer_minutes:Number(e.target.value)})}/></td>
              <td className="p-3">
                <Select defaultValue={t.required_skill ?? "_none"} onValueChange={(v)=>update(t.id,{required_skill: v==="_none"?null:v})}>
                  <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— kein Skill —</SelectItem>
                    {skills.map((s) => <SelectItem key={s.id} value={s.slug}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-3">
                <input type="checkbox" defaultChecked={t.bookable !== false} onChange={(e)=>update(t.id,{bookable:e.target.checked})}/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// HAUPT-SEITE
// ─────────────────────────────────────────────────────────────
export default function BeautyDashboard() {
  const [tab, setTab] = useState("overview");

  return (
    <HeidehofAdminLayout title="Beauty & Spa">
      <Helmet><title>Beauty-Dashboard · Heidehof Admin</title></Helmet>

      <div className="space-y-6 pb-10">
        <AdminPageHeader
          title="Beauty & Spa — Buchungssystem"
          subtitle="Termine, Facilities, Mitarbeiter, Schichten und Behandlungen verwalten."
          breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Live-Betrieb" }, { label: "Beauty & Spa" }]}
        />

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="overview"><LayoutGrid className="h-4 w-4 mr-1"/>Overview</TabsTrigger>
            <TabsTrigger value="calendar"><Calendar className="h-4 w-4 mr-1"/>Kalender</TabsTrigger>
            <TabsTrigger value="list"><ListIcon className="h-4 w-4 mr-1"/>Liste</TabsTrigger>
            <TabsTrigger value="staff"><Users className="h-4 w-4 mr-1"/>Mitarbeiter</TabsTrigger>
            <TabsTrigger value="facilities"><Building2 className="h-4 w-4 mr-1"/>Facilities</TabsTrigger>
            <TabsTrigger value="treatments"><Sparkles className="h-4 w-4 mr-1"/>Behandlungen</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewPanel onJump={setTab}/></TabsContent>
          <TabsContent value="calendar"><CalendarPanel/></TabsContent>
          <TabsContent value="list"><ListPanel/></TabsContent>
          <TabsContent value="staff"><StaffPanel/></TabsContent>
          <TabsContent value="facilities"><FacilitiesPanel/></TabsContent>
          <TabsContent value="treatments"><TreatmentsPanel/></TabsContent>
        </Tabs>
      </div>
    </HeidehofAdminLayout>
  );
}
