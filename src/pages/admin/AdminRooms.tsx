import { confirmAction } from "@/components/admin/ConfirmDialog";
import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import {
  Building2, Plus, Pencil, Trash2, Users, X, Sparkles, Upload, Star,
  Wifi, Tv, Snowflake, Presentation, Coffee, Mic, Image as ImageIcon, Loader2, BarChart3,
  Hash, ArrowUp, ArrowDown, Save, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  fetchRooms, upsertRoom, deleteRoom, fetchRoomImages, uploadRoomImage,
  generateRoomImage, setPrimaryImage, deleteRoomImage, fetchRoomStats,
  updateRoomImage, reorderRoomImages,
  type ConferenceRoom, type RoomImage, type RoomStats,
} from "@/services/conference/rooms-service";
import { roomSchema, validateOrError } from "@/utils/admin-validation";

const STYLES = [
  { id: "modern", label: "Modern" },
  { id: "klassisch", label: "Klassisch" },
  { id: "skandinavisch", label: "Skandinavisch" },
  { id: "industrial", label: "Industrial" },
  { id: "botanisch", label: "Botanisch" },
];

const EQUIPMENT_OPTIONS = [
  { id: "wlan", label: "WLAN", icon: Wifi },
  { id: "beamer", label: "Beamer", icon: Tv },
  { id: "klima", label: "Klimaanlage", icon: Snowflake },
  { id: "flipchart", label: "Flipchart", icon: Presentation },
  { id: "kaffee", label: "Kaffeebar", icon: Coffee },
  { id: "mikro", label: "Mikrofon", icon: Mic },
];

export default function AdminRooms() {
  const [rooms, setRooms] = useState<ConferenceRoom[]>([]);
  const [stats, setStats] = useState<Record<string, RoomStats>>({});
  const [drawerRoom, setDrawerRoom] = useState<ConferenceRoom | null>(null);
  const [createMode, setCreateMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const r = await fetchRooms();
    setRooms(r);
    const today = format(new Date(), "yyyy-MM-dd");
    const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const allStats: Record<string, RoomStats> = {};
    await Promise.all(r.map(async (room) => {
      allStats[room.id] = await fetchRoomStats(room.id, weekAgo, today);
    }));
    setStats(allStats);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <HeidehofAdminLayout title="Tagungsräume">
      <div className="p-4 md:p-6 space-y-5 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground/60">
              <span>Admin</span><ChevronRight className="w-3 h-3" />
              <span className="text-[hsl(var(--apple))] font-bold">Tagungsräume</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl text-foreground mt-0.5">
              Räume &amp; <span className="text-[hsl(var(--apple))] italic">Atmosphären</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Tagungsräume mit Bildern, Ausstattung und Live-Statistiken verwalten.</p>
          </div>
          <Button
            onClick={() => setCreateMode(true)}
            className="gap-1.5 bg-[hsl(var(--apple))] hover:bg-[hsl(var(--apple)/0.9)] text-white"
          >
            <Plus className="w-4 h-4" /> Neuer Raum
          </Button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted/40 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-16 text-center">
            <Building2 className="w-10 h-10 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-foreground">Noch keine Räume angelegt</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Beginnen Sie mit Ihrem ersten Tagungsraum.</p>
            <Button onClick={() => setCreateMode(true)} className="bg-[hsl(var(--apple))] text-white">
              Ersten Raum anlegen
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                stats={stats[room.id]}
                onEdit={() => setDrawerRoom(room)}
              />
            ))}
          </div>
        )}
      </div>

      {(drawerRoom || createMode) && (
        <RoomDrawer
          room={drawerRoom}
          onClose={() => { setDrawerRoom(null); setCreateMode(false); }}
          onSaved={async () => { await refresh(); }}
        />
      )}
    </HeidehofAdminLayout>
  );
}

function RoomCard({ room, stats, onEdit }: {
  room: ConferenceRoom; stats?: RoomStats; onEdit: () => void;
}) {
  const utilization = stats && room.capacity > 0
    ? Math.min(100, Math.round((stats.participants / (room.capacity * 7)) * 100))
    : 0;
  return (
    <button
      onClick={onEdit}
      className="group text-left bg-card border border-border hover:border-[hsl(var(--apple)/0.4)] rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-[16/10] overflow-hidden bg-muted relative">
        {room.image_url ? (
          <img src={room.image_url} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
            <Building2 className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur text-xs font-medium text-foreground border border-border">
          <Users className="w-3 h-3 inline mr-1" /> {room.capacity}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-foreground">{room.name}</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{room.style ?? "—"}</span>
        </div>
        {room.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{room.description}</p>}
        {room.equipment?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {room.equipment.slice(0, 4).map((e) => {
              const opt = EQUIPMENT_OPTIONS.find((o) => o.id === e);
              const Icon = opt?.icon ?? Wifi;
              return (
                <span key={e} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                  <Icon className="w-3 h-3" /> {opt?.label ?? e}
                </span>
              );
            })}
          </div>
        )}
        <div className="border-t border-border pt-3 grid grid-cols-3 gap-2 text-center">
          <RoomStat label="Buchungen"  value={stats?.bookings ?? 0} />
          <RoomStat label="Personen"   value={stats?.participants ?? 0} />
          <RoomStat label="Auslastung" value={`${utilization}%`} />
        </div>
        <p className="text-xs text-muted-foreground/50 text-center mt-1 uppercase tracking-[0.15em]">letzte 7 Tage</p>
      </div>
    </button>
  );
}

function RoomStat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="font-serif text-xl text-[hsl(var(--apple))]">{value}</div>
      <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</div>
    </div>
  );
}

function RoomDrawer({ room, onClose, onSaved }: {
  room: ConferenceRoom | null; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"info" | "images" | "stats">("info");
  const [name, setName] = useState(room?.name ?? "");
  const [subtitle, setSubtitle] = useState(room?.subtitle ?? "");
  const [category, setCategory] = useState<"tagungscenter" | "art-center">(room?.category ?? "tagungscenter");
  const [capacity, setCapacity] = useState(room?.capacity ?? 10);
  const [description, setDescription] = useState(room?.description ?? "");
  const [style, setStyle] = useState(room?.style ?? "modern");
  const [equipment, setEquipment] = useState<string[]>(room?.equipment ?? []);
  const [lengthM, setLengthM] = useState<string>(room?.length_m?.toString() ?? "");
  const [widthM, setWidthM] = useState<string>(room?.width_m?.toString() ?? "");
  const [heightM, setHeightM] = useState<string>(room?.height_m?.toString() ?? "");
  const [areaSqm, setAreaSqm] = useState<string>(room?.area_sqm?.toString() ?? "");
  const [capTheater, setCapTheater] = useState<string>(room?.cap_theater?.toString() ?? "");
  const [capParlament, setCapParlament] = useState<string>(room?.cap_parlament?.toString() ?? "");
  const [capUform, setCapUform] = useState<string>(room?.cap_uform?.toString() ?? "");
  const [capBlock, setCapBlock] = useState<string>(room?.cap_block?.toString() ?? "");
  const [capBankett, setCapBankett] = useState<string>(room?.cap_bankett?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const [images, setImages] = useState<RoomImage[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);
  const [statsRange, setStatsRange] = useState(7);

  useEffect(() => {
    if (room) {
      fetchRoomImages(room.id).then(setImages);
      fetchRoomStats(room.id,
        format(subDays(new Date(), statsRange), "yyyy-MM-dd"),
        format(new Date(), "yyyy-MM-dd")
      ).then(setRoomStats);
    }
  }, [room, statsRange]);

  const toggleEq = (id: string) =>
    setEquipment((e) => e.includes(id) ? e.filter(x => x !== id) : [...e, id]);

  const save = async () => {
    const validation = validateOrError(roomSchema, {
      name, subtitle, category, capacity, description, style, equipment,
      length_m: lengthM, width_m: widthM, height_m: heightM, area_sqm: areaSqm,
      cap_theater: capTheater, cap_parlament: capParlament, cap_uform: capUform,
      cap_block: capBlock, cap_bankett: capBankett,
    });
    if (!validation.ok) { toast.error((validation as { ok: false; error: string }).error); return; }
    setSaving(true);
    try {
      await upsertRoom({ ...(room ?? {}), ...validation.data } as ConferenceRoom);
      toast.success("Raum gespeichert");
      await onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!room) return;
    if (!(await confirmAction({ description: "Raum wirklich löschen?", destructive: true, confirmLabel: "Löschen" }))) return;
    try {
      await deleteRoom(room.id);
      toast.success("Raum gelöscht");
      await onSaved(); onClose();
    } catch (e: any) { toast.error(e.message); }
  };

  const onUpload = async (files: FileList | null) => {
    if (!room || !files || files.length === 0) return;
    setUploading(true);
    try {
      const arr = Array.from(files);
      const baseSort = (images[images.length - 1]?.sort_order ?? images.length) + 1;
      const uploaded: RoomImage[] = [];
      for (let i = 0; i < arr.length; i++) {
        const img = await uploadRoomImage(room.id, arr[i]);
        await updateRoomImage(img.id, { sort_order: baseSort + i });
        uploaded.push(img);
      }
      if (images.length === 0 && uploaded[0]) {
        await setPrimaryImage(room.id, uploaded[0].id, uploaded[0].url);
      }
      setImages(await fetchRoomImages(room.id));
      await onSaved();
      toast.success(`${arr.length} Bild${arr.length > 1 ? "er" : ""} hochgeladen`);
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const onGenerate = async () => {
    if (!room) { toast.error("Erst Raum speichern"); return; }
    setAiBusy(true);
    try {
      await generateRoomImage(room.id, aiPrompt || `Eleganter Tagungsraum ${name}, ${capacity} Personen`, style);
      setImages(await fetchRoomImages(room.id));
      await onSaved();
      toast.success("Bild generiert");
    } catch (e: any) { toast.error(e.message); }
    finally { setAiBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <aside
        className="w-full max-w-2xl bg-card border-l border-border flex flex-col overflow-hidden"
        style={{ animation: "slide-in-right .3s ease-out" }}
      >
        {/* Drawer header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60">
                {room ? "Raum bearbeiten" : "Neuer Raum"}
              </p>
              <h2 className="font-serif text-2xl text-foreground mt-0.5">{name || "Neuer Tagungsraum"}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {room && (
            <div className="flex gap-1 mt-4">
              {[
                { id: "info",   label: "Übersicht", icon: Pencil },
                { id: "images", label: "Bilder",    icon: ImageIcon },
                { id: "stats",  label: "Statistik", icon: BarChart3 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    tab === id
                      ? "bg-[hsl(var(--apple)/0.12)] text-[hsl(var(--apple))] border border-[hsl(var(--apple)/0.2)]"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drawer content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {(tab === "info" || !room) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Berlin" />
                </Field>
                <Field label="Untertitel">
                  <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="z.B. Tageslicht-Klassiker" />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Bereich">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "tagungscenter" | "art-center")}
                    className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none"
                  >
                    <option value="tagungscenter">Tagungscenter</option>
                    <option value="art-center">Art Center</option>
                  </select>
                </Field>
                <Field label="Max. Kapazität (Personen)">
                  <Input type="number" value={capacity} onChange={(e) => setCapacity(+e.target.value)} />
                </Field>
              </div>
              <Field label="Beschreibung">
                <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Atmosphäre, Besonderheiten…" />
              </Field>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Länge (m)",  v: lengthM,  set: setLengthM,  p: "9,5" },
                  { label: "Breite (m)", v: widthM,   set: setWidthM,   p: "7" },
                  { label: "Höhe (m)",   v: heightM,  set: setHeightM,  p: "2,7" },
                  { label: "Fläche m²",  v: areaSqm,  set: setAreaSqm,  p: "70" },
                ].map((f) => (
                  <Field key={f.label} label={f.label}>
                    <Input value={f.v} onChange={(e) => f.set(e.target.value)} placeholder={f.p} />
                  </Field>
                ))}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Bestuhlungs-Kapazitäten</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {[
                    { v: capTheater,  set: setCapTheater,  label: "Theater" },
                    { v: capParlament,set: setCapParlament, label: "Parlament" },
                    { v: capUform,    set: setCapUform,    label: "U-Form" },
                    { v: capBlock,    set: setCapBlock,    label: "Block" },
                    { v: capBankett,  set: setCapBankett,  label: "Bankett" },
                  ].map((f) => (
                    <Field key={f.label} label={f.label}>
                      <Input type="number" value={f.v} onChange={(e) => f.set(e.target.value)} />
                    </Field>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Stil</p>
                <div className="flex flex-wrap gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        style === s.id
                          ? "bg-[hsl(var(--apple)/0.12)] text-[hsl(var(--apple))] border border-[hsl(var(--apple)/0.3)]"
                          : "border border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Ausstattung</p>
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map(({ id, label, icon: Icon }) => {
                    const active = equipment.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleEq(id)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          active
                            ? "bg-[hsl(var(--apple)/0.12)] text-[hsl(var(--apple))] border border-[hsl(var(--apple)/0.3)]"
                            : "border border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                {room ? (
                  <Button variant="ghost" onClick={remove} className="text-destructive hover:text-destructive gap-1.5">
                    <Trash2 className="w-4 h-4" /> Löschen
                  </Button>
                ) : <span />}
                <Button onClick={save} disabled={saving || !name} className="bg-[hsl(var(--apple))] text-white hover:bg-[hsl(var(--apple)/0.9)]">
                  {saving ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Speichern…</> : "Speichern"}
                </Button>
              </div>
            </div>
          )}

          {tab === "images" && room && (
            <div className="space-y-4">
              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Mit KI generieren
                </p>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={2}
                  placeholder={`z.B. "Tagungsraum ${name}, ${style}, helles Tageslicht, Boardroom-Bestuhlung"`}
                  className="mb-2"
                />
                <Button onClick={onGenerate} disabled={aiBusy} size="sm" className="bg-[hsl(var(--apple))] text-white">
                  {aiBusy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                  Bild generieren
                </Button>
              </div>

              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5 mb-2">
                  <Upload className="w-3.5 h-3.5" /> Eigene Bilder hochladen
                </p>
                <label className="block">
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { onUpload(e.target.files); e.target.value = ""; }} />
                  <Button asChild variant="outline" size="sm" disabled={uploading}>
                    <span className="cursor-pointer">{uploading ? "Lade…" : "Dateien wählen"}</span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">Mehrere Bilder gleichzeitig wählbar.</p>
              </div>

              {images.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Noch keine Bilder.</p>
              ) : (
                <div className="space-y-3">
                  {images.map((img, idx) => (
                    <RoomImageRow
                      key={img.id}
                      img={img}
                      isFirst={idx === 0}
                      isLast={idx === images.length - 1}
                      onSetPrimary={async () => { await setPrimaryImage(room.id, img.id, img.url); setImages(await fetchRoomImages(room.id)); await onSaved(); }}
                      onDelete={async () => { if (await confirmAction({ description: "Bild löschen?", destructive: true })) { await deleteRoomImage(img); setImages(await fetchRoomImages(room.id)); } }}
                      onSave={async (patch) => { await updateRoomImage(img.id, patch); setImages(await fetchRoomImages(room.id)); }}
                      onMove={async (dir) => {
                        const next = [...images];
                        const j = dir === "up" ? idx - 1 : idx + 1;
                        if (j < 0 || j >= next.length) return;
                        [next[idx], next[j]] = [next[j], next[idx]];
                        setImages(next.map((it, i) => ({ ...it, sort_order: i + 1 })));
                        await reorderRoomImages(next.map((it, i) => ({ id: it.id, sort_order: i + 1 })));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "stats" && room && (
            <div className="space-y-4">
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                {[7, 30, 90, 365].map((d) => (
                  <button
                    key={d}
                    onClick={() => setStatsRange(d)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      statsRange === d ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground"
                    )}
                  >
                    {d === 7 ? "Woche" : d === 30 ? "Monat" : d === 90 ? "Quartal" : "Jahr"}
                  </button>
                ))}
              </div>
              {roomStats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Buchungen",    value: roomStats.bookings },
                    { label: "Personen",     value: roomStats.participants },
                    { label: "🐟 Fisch",    value: roomStats.fish },
                    { label: "🥩 Fleisch",  value: roomStats.meat },
                    { label: "🌿 Vegetarisch", value: roomStats.vegetarian },
                    { label: "Auslastung",  value: `${room.capacity > 0 ? Math.round((roomStats.participants / (room.capacity * statsRange)) * 100) : 0}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
                      <div className="font-serif text-3xl text-[hsl(var(--apple))]">{value}</div>
                      <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function RoomImageRow({
  img, isFirst, isLast, onSetPrimary, onDelete, onSave, onMove,
}: {
  img: RoomImage;
  isFirst: boolean;
  isLast: boolean;
  onSetPrimary: () => Promise<void>;
  onDelete: () => Promise<void>;
  onSave: (patch: { tags?: string[]; caption?: string | null }) => Promise<void>;
  onMove: (dir: "up" | "down") => Promise<void>;
}) {
  const [tagsInput, setTagsInput] = useState((img.tags ?? []).join(" "));
  const [caption, setCaption] = useState(img.caption ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const parseTags = (s: string) =>
    s.split(/[\s,]+/).map((t) => t.trim().replace(/^#+/, "").toLowerCase()).filter(Boolean);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ tags: parseTags(tagsInput), caption: caption.trim() || null });
      setDirty(false);
      toast.success("Bild aktualisiert");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 flex gap-3">
      <div className="relative w-32 h-24 shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
        <img src={img.url} alt={img.caption ?? ""} className="w-full h-full object-cover" />
        {img.is_primary && (
          <div className="absolute top-1 left-1 bg-[hsl(var(--apple))] text-white px-1.5 py-0.5 rounded-full text-xs uppercase tracking-wider flex items-center gap-1">
            <Star className="w-2.5 h-2.5" /> Haupt
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">#{img.sort_order || 0}</span>
          <button disabled={isFirst} onClick={() => onMove("up")} className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground"><ArrowUp className="w-3 h-3" /></button>
          <button disabled={isLast}  onClick={() => onMove("down")} className="p-1 rounded hover:bg-muted disabled:opacity-30 text-muted-foreground"><ArrowDown className="w-3 h-3" /></button>
        </div>
        <Input
          value={tagsInput}
          onChange={(e) => { setTagsInput(e.target.value); setDirty(true); }}
          placeholder="#tageslicht #boardroom"
          className="h-7 text-xs"
        />
        <Input
          value={caption}
          onChange={(e) => { setCaption(e.target.value); setDirty(true); }}
          placeholder="Bildunterschrift"
          className="h-7 text-xs"
        />
        <div className="flex items-center gap-1.5">
          {!img.is_primary && (
            <button onClick={onSetPrimary} className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:bg-muted flex items-center gap-1">
              <Star className="w-3 h-3" /> Hauptbild
            </button>
          )}
          <Button size="sm" variant="outline" disabled={!dirty || saving} onClick={handleSave} className="h-6 text-xs px-2">
            <Save className="w-3 h-3 mr-1" />{saving ? "…" : "Speichern"}
          </Button>
          <button onClick={onDelete} className="ml-auto text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
