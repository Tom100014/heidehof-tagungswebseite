import { useEffect, useMemo, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Wand2, Loader2, Upload, Pencil, Sparkles, Calendar, MapPin, Users, ArrowRight, PartyPopper, Eye } from "lucide-react";
import { toast } from "sonner";
import { ImageGenerationDialog } from "@/components/admin/ImageGenerationDialog";
import { ReferenceUploadPanel } from "@/components/admin/ReferenceUploadPanel";

type EventType = "hochzeit" | "firmenfeier" | "weihnachtsfeier" | "silvester" | "brunch" | "gala" | "live_music" | "sonstiges";
const TYPES: EventType[] = ["hochzeit","firmenfeier","weihnachtsfeier","silvester","brunch","gala","live_music","sonstiges"];

interface EventRow {
  id: string; slug: string; title: string; subtitle: string | null; description_md: string | null;
  event_type: EventType; starts_at: string | null; ends_at: string | null;
  location: string | null; price_label: string | null; capacity: number | null;
  booking_enabled: boolean; agent_bookable: boolean;
  hero_image_url: string | null; image_prompt: string | null;
  is_active: boolean; is_published: boolean; sort_order: number;
}
interface Booking {
  id: string; event_id: string; guest_name: string; email: string | null; phone: string | null;
  party_size: number; notes: string | null; source: string; status: string; created_at: string;
}

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" }) : "";

export default function AdminVeranstaltungen() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [genTarget, setGenTarget] = useState<EventRow | null>(null);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [n, setN] = useState({ title: "", subtitle: "", description_md: "", event_type: "sonstiges" as EventType, starts_at: "", ends_at: "", location: "", price_label: "", capacity: "" });

  const load = async () => {
    const [ev, bk] = await Promise.all([
      supabase.from("events" as never).select("*").order("starts_at", { ascending: true, nullsFirst: false }),
      supabase.from("event_bookings" as never).select("*").order("created_at", { ascending: false }),
    ]);
    setEvents((ev.data as unknown as EventRow[]) ?? []);
    setBookings((bk.data as unknown as Booking[]) ?? []);
  };
  useEffect(() => { void load(); }, []);

  const { upcoming, past, undated } = useMemo(() => {
    const now = Date.now();
    const u: EventRow[] = [], p: EventRow[] = [], nd: EventRow[] = [];
    for (const e of events) {
      if (!e.starts_at) nd.push(e);
      else if (new Date(e.starts_at).getTime() >= now) u.push(e);
      else p.push(e);
    }
    p.reverse();
    return { upcoming: u, past: p, undated: nd };
  }, [events]);

  const add = async () => {
    if (!n.title) return toast.error("Titel erforderlich");
    const slug = n.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);
    const payload = { ...n, slug, starts_at: n.starts_at || null, ends_at: n.ends_at || null, capacity: n.capacity ? parseInt(n.capacity) : null };
    const { error } = await supabase.from("events" as never).insert(payload as never);
    if (error) toast.error(error.message);
    else { toast.success("Event erstellt"); setN({ title: "", subtitle: "", description_md: "", event_type: "sonstiges", starts_at: "", ends_at: "", location: "", price_label: "", capacity: "" }); await load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("events" as never).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Gelöscht"); await load(); }
  };

  const persist = async (id: string, patch: Partial<EventRow>) => {
    const { error } = await supabase.from("events" as never).update(patch as never).eq("id", id);
    if (error) toast.error(error.message);
    await load();
  };

  const runGenerate = async (
    item: EventRow,
    prompt: string,
    refUrls: string[],
    references?: Array<{ image_url: string; role: string; user_notes?: string }>
  ) => {
    setBusy(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-menu-image", {
        body: { kind: "events", record_id: item.id, prompt_override: prompt, reference_image_urls: refUrls, references },
      });
      if (error || (data as { error?: string })?.error) throw new Error(error?.message ?? (data as { error?: string }).error);
      toast.success("Bild generiert"); await load();
      if (editing?.id === item.id) {
        const { data: fresh } = await supabase.from("events" as never).select("*").eq("id", item.id).single();
        if (fresh) setEditing(fresh as unknown as EventRow);
      }
    } catch (e) { toast.error("Fehler: " + (e as Error).message); } finally { setBusy(null); }
  };

  const upload = async (item: EventRow, file: File) => {
    setBusy(item.id);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `events/${item.id}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("menu-media").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("menu-media").getPublicUrl(path);
      await supabase.from("events" as never).update({ hero_image_url: pub.publicUrl, image_storage_path: path } as never).eq("id", item.id);
      toast.success("Hochgeladen"); await load();
      if (editing?.id === item.id) setEditing({ ...editing, hero_image_url: pub.publicUrl });
    } catch (e) { toast.error("Upload-Fehler: " + (e as Error).message); } finally { setBusy(null); }
  };

  const setBookingStatus = async (id: string, status: string) => {
    await supabase.from("event_bookings" as never).update({ status } as never).eq("id", id);
    await load();
  };

  const aiText = async (mode: "generate" | "improve", field: "title" | "subtitle" | "description_md") => {
    if (!editing) return;
    setAiBusy(`${mode}:${field}`);
    try {
      const { data, error } = await supabase.functions.invoke("event-text-ai", {
        body: { mode, field, event: editing },
      });
      if (error) throw error;
      const err = (data as { error?: string })?.error;
      if (err) throw new Error(err);
      const text = (data as { text?: string }).text;
      if (text) setEditing({ ...editing, [field]: text } as EventRow);
      toast.success("KI-Vorschlag eingefügt");
    } catch (e) { toast.error((e as Error).message); } finally { setAiBusy(null); }
  };

  const saveEditing = async () => {
    if (!editing) return;
    const { id, slug, ...patch } = editing;
    await persist(id, patch);
    toast.success("Gespeichert");
    setEditing(null);
  };

  const renderCard = (e: EventRow) => (
    <Card key={e.id} className={`overflow-hidden ${!e.is_active ? "opacity-60" : ""}`}>
      {e.hero_image_url
        ? <img src={e.hero_image_url} alt={e.title} className="w-full h-40 object-cover" />
        : <div className="w-full h-40 bg-muted flex items-center justify-center text-muted-foreground"><PartyPopper className="w-8 h-8" /></div>}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{e.event_type.replace(/_/g, " ")}</div>
            <div className="font-semibold truncate">{e.title}</div>
            {e.starts_at && <div className="text-xs text-muted-foreground">{fmt(e.starts_at)}</div>}
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            {e.is_published ? <Badge variant="default" className="text-xs">Live</Badge> : <Badge variant="secondary" className="text-xs">Entwurf</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" onClick={() => setEditing(e)}><Pencil className="w-3 h-3 mr-1" />Bearbeiten</Button>
          <Button size="sm" variant="outline" onClick={() => setGenTarget(e)} disabled={busy === e.id}>
            {busy === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => del(e.id)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      </div>
    </Card>
  );

  return (
    <HeidehofAdminLayout title="Veranstaltungen">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ReferenceUploadPanel scope="events" />
        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
            <TabsTrigger value="bookings">Buchungen ({bookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-8">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Neues Event anlegen</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Titel" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} />
                <Select value={n.event_type} onValueChange={(v) => setN({ ...n, event_type: v as EventType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Untertitel" value={n.subtitle} onChange={(e) => setN({ ...n, subtitle: e.target.value })} />
                <Input placeholder="Location" value={n.location} onChange={(e) => setN({ ...n, location: e.target.value })} />
                <Input type="datetime-local" value={n.starts_at} onChange={(e) => setN({ ...n, starts_at: e.target.value })} />
                <Input type="datetime-local" value={n.ends_at} onChange={(e) => setN({ ...n, ends_at: e.target.value })} />
                <Input placeholder="Preis-Label" value={n.price_label} onChange={(e) => setN({ ...n, price_label: e.target.value })} />
                <Input type="number" placeholder="Kapazität" value={n.capacity} onChange={(e) => setN({ ...n, capacity: e.target.value })} />
              </div>
              <Textarea placeholder="Beschreibung (Markdown)" value={n.description_md} onChange={(e) => setN({ ...n, description_md: e.target.value })} />
              <Button onClick={add}><Plus className="w-4 h-4 mr-2" />Anlegen</Button>
            </Card>

            {upcoming.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />Anstehend ({upcoming.length})</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{upcoming.map(renderCard)}</div>
              </section>
            )}
            {undated.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3">Ohne Datum ({undated.length})</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{undated.map(renderCard)}</div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Vergangen ({past.length})</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{past.map(renderCard)}</div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3">
            {bookings.length === 0 && <p className="text-muted-foreground p-4">Noch keine Buchungen.</p>}
            {bookings.map((b) => {
              const event = events.find((e) => e.id === b.event_id);
              return (
                <Card key={b.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{b.guest_name} <span className="text-xs text-muted-foreground">({b.party_size} Pers.)</span></div>
                      <div className="text-xs text-muted-foreground">{event?.title ?? b.event_id} · {b.source} · {new Date(b.created_at).toLocaleString("de-DE")}</div>
                      {b.email && <div className="text-sm">{b.email}</div>}
                      {b.phone && <div className="text-sm">{b.phone}</div>}
                      {b.notes && <div className="text-sm mt-2">{b.notes}</div>}
                    </div>
                    <Select value={b.status} onValueChange={(v) => setBookingStatus(b.id, v)}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Neu</SelectItem>
                        <SelectItem value="confirmed">Bestätigt</SelectItem>
                        <SelectItem value="cancelled">Storniert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {genTarget && (
          <ImageGenerationDialog
            open={!!genTarget}
            onOpenChange={(o) => !o && setGenTarget(null)}
            scope="events"
            entityTitle={genTarget.title}
            entityDescription={genTarget.description_md ?? ""}
            defaultPrompt={genTarget.image_prompt ?? ""}
            onGenerate={async ({ prompt, referenceImageUrls, references, title, description }) => {
              const { error } = await supabase
                .from("events" as never)
                .update({ title, description_md: description } as never)
                .eq("id", genTarget.id);
              if (error) {
                toast.error("Speichern fehlgeschlagen: " + error.message);
                return;
              }
              await runGenerate({ ...genTarget, title, description_md: description }, prompt, referenceImageUrls, references);
            }}
          />
        )}

        {/* Full-screen edit dialog with live landing preview */}
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-[98vw] w-[98vw] h-[95vh] p-0 overflow-hidden flex flex-col">
            <DialogHeader className="px-6 py-3 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Event bearbeiten
                {editing?.is_published && <Badge>Live</Badge>}
              </DialogTitle>
            </DialogHeader>
            {editing && (
              <div className="grid lg:grid-cols-2 gap-0 flex-1 min-h-0">
                {/* LEFT: Form */}
                <div className="overflow-y-auto p-6 space-y-4 border-r">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium">Titel</label>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={aiBusy?.endsWith(":title")} onClick={() => aiText("improve", "title")}>
                            {aiBusy === "improve:title" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}Verbessern
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={aiBusy?.endsWith(":title")} onClick={() => aiText("generate", "title")}>Neu</Button>
                        </div>
                      </div>
                      <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                    </div>
                    <Select value={editing.event_type} onValueChange={(v) => setEditing({ ...editing, event_type: v as EventType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="Location" value={editing.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} />
                    <Input type="datetime-local" value={editing.starts_at?.slice(0, 16) ?? ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value || null })} />
                    <Input type="datetime-local" value={editing.ends_at?.slice(0, 16) ?? ""} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value || null })} />
                    <Input placeholder="Preis-Label" value={editing.price_label ?? ""} onChange={(e) => setEditing({ ...editing, price_label: e.target.value })} />
                    <Input type="number" placeholder="Kapazität" value={editing.capacity ?? ""} onChange={(e) => setEditing({ ...editing, capacity: e.target.value ? parseInt(e.target.value) : null })} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium">Untertitel</label>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={aiBusy?.endsWith(":subtitle")} onClick={() => aiText("improve", "subtitle")}>
                          {aiBusy === "improve:subtitle" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}Verbessern
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={aiBusy?.endsWith(":subtitle")} onClick={() => aiText("generate", "subtitle")}>Neu</Button>
                      </div>
                    </div>
                    <Input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium">Beschreibung (Markdown)</label>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={aiBusy?.endsWith(":description_md")} onClick={() => aiText("improve", "description_md")}>
                          {aiBusy === "improve:description_md" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}Verbessern
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" disabled={aiBusy?.endsWith(":description_md")} onClick={() => aiText("generate", "description_md")}>Neu</Button>
                      </div>
                    </div>
                    <Textarea rows={8} value={editing.description_md ?? ""} onChange={(e) => setEditing({ ...editing, description_md: e.target.value })} />
                  </div>

                  <Card className="p-3 space-y-2">
                    <div className="text-xs font-medium">Hero-Bild</div>
                    {editing.hero_image_url && <img src={editing.hero_image_url} alt="" className="w-full h-32 object-cover rounded" />}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setGenTarget(editing)} disabled={busy === editing.id}>
                        {busy === editing.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}KI-Bild
                      </Button>
                      <label className="inline-flex items-center gap-1 text-xs px-3 py-2 border rounded cursor-pointer hover:bg-accent">
                        <Upload className="w-3 h-3" /> Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(ev) => ev.target.files?.[0] && upload(editing, ev.target.files[0])} />
                      </label>
                    </div>
                  </Card>

                  <div className="flex flex-wrap gap-4 pt-2 border-t">
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: !!v })} /> Aktiv</label>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: !!v })} /> Veröffentlicht</label>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={editing.booking_enabled} onCheckedChange={(v) => setEditing({ ...editing, booking_enabled: !!v })} /> Buchbar</label>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={editing.agent_bookable} onCheckedChange={(v) => setEditing({ ...editing, agent_bookable: !!v })} /> Clara darf buchen</label>
                  </div>
                </div>

                {/* RIGHT: Live preview (matches landing page) */}
                <div className="overflow-y-auto bg-stone-950 p-6">
                  <div className="text-xs text-stone-500 mb-3 flex items-center gap-2"><Eye className="w-3 h-3" /> Vorschau (so erscheint es in der Landingpage)</div>
                  <article className="grid md:grid-cols-2 gap-6 items-center bg-stone-950/40 border border-zinc-500/20 rounded-2xl overflow-hidden p-6">
                    {editing.hero_image_url ? (
                      <img src={editing.hero_image_url} alt={editing.title} className="w-full h-64 object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-64 rounded-xl bg-gradient-to-br from-zinc-500/10 to-stone-900 flex items-center justify-center text-zinc-500/40">
                        <PartyPopper className="w-12 h-12" />
                      </div>
                    )}
                    <div>
                      <span className="uppercase tracking-widest text-xs text-zinc-400">{editing.event_type.replace(/_/g, " ")}</span>
                      <h2 className="font-serif text-3xl text-stone-100 my-3">{editing.title || "Titel"}</h2>
                      {editing.subtitle && <p className="text-stone-400 italic mb-3">{editing.subtitle}</p>}
                      {editing.description_md && <p className="text-stone-300 whitespace-pre-line mb-4 text-sm">{editing.description_md}</p>}
                      <div className="space-y-2 text-sm text-stone-400 mb-5">
                        {editing.starts_at && <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{fmt(editing.starts_at)}{editing.ends_at ? ` – ${fmt(editing.ends_at)}` : ""}</p>}
                        {editing.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{editing.location}</p>}
                        {editing.capacity && <p className="flex items-center gap-2"><Users className="w-4 h-4" />max. {editing.capacity} Gäste</p>}
                        {editing.price_label && <p className="text-zinc-400 font-medium">{editing.price_label}</p>}
                      </div>
                      {editing.booking_enabled && (
                        <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-400 text-stone-950 font-medium text-sm">
                          Platz reservieren <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </article>
                </div>
              </div>
            )}
            <div className="px-6 py-3 border-t flex justify-end gap-2 shrink-0 bg-background">
              <Button variant="ghost" onClick={() => setEditing(null)}>Abbrechen</Button>
              <Button onClick={saveEditing}>Speichern</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </HeidehofAdminLayout>
  );
}
