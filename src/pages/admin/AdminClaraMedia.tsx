import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Trash2, Save, ExternalLink, Loader2, Pencil, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/admin/ConfirmDialog";

type Media = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  triggers: string[];
  media_type: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  is_active: boolean;
  sort_order: number;
  storage_path: string | null;
  created_at: string;
};

const CATS = ["general", "spa", "raum", "bankett", "restaurant", "zimmer", "beauty", "outdoor", "pool"];

export default function AdminClaraMedia() {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [editing, setEditing] = useState<Media | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("clara_media").select("*").order("created_at", { ascending: false }).limit(1000);
    if (error) toast.error("Laden fehlgeschlagen: " + error.message);
    else setItems((data as Media[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return items.filter((m) => {
      if (filterCat !== "all" && m.category !== filterCat) return false;
      if (!needle) return true;
      return `${m.title} ${m.description} ${m.category} ${(m.tags ?? []).join(" ")} ${(m.triggers ?? []).join(" ")} ${m.url}`.toLowerCase().includes(needle);
    });
  }, [items, query, filterCat]);

  const toggleActive = async (m: Media, v: boolean) => {
    const { error } = await supabase.from("clara_media").update({ is_active: v }).eq("id", m.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, is_active: v } : x)));
  };

  const remove = async (m: Media) => {
    if (!(await confirmAction({ description: `Bild "${m.title}" wirklich löschen?`, destructive: true, confirmLabel: "Löschen" }))) return;
    if (m.storage_path) {
      await supabase.storage.from("clara-media").remove([m.storage_path]);
    }
    const { error } = await supabase.from("clara_media").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((x) => x.id !== m.id));
    toast.success("Gelöscht");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("clara_media").update({
      title: editing.title,
      description: editing.description,
      category: editing.category,
      tags: editing.tags,
      triggers: editing.triggers,
      caption: editing.caption,
      sort_order: editing.sort_order,
      is_active: editing.is_active,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Gespeichert");
    setItems((prev) => prev.map((x) => (x.id === editing.id ? editing : x)));
    setEditing(null);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((m) => { c[m.category] = (c[m.category] ?? 0) + 1; });
    return c;
  }, [items]);

  const bulkDeleteFiltered = async () => {
    if (!(await confirmAction({ description: `${filtered.length} gefilterte Bilder löschen?`, destructive: true, confirmLabel: "Alle löschen" }))) return;
    const ids = filtered.map((m) => m.id);
    const paths = filtered.map((m) => m.storage_path).filter((p): p is string => !!p);
    if (paths.length) await supabase.storage.from("clara-media").remove(paths);
    const { error } = await supabase.from("clara_media").delete().in("id", ids);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    toast.success(`${ids.length} gelöscht`);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-muted-foreground">
          {items.length} Medien insgesamt – diese zeigt Clara im Gespräch (z. B. wenn Gast nach „Pool" fragt).
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} className="border-gold/30 text-gold">Neu laden</Button>
          {filtered.length > 0 && filtered.length < items.length && (
            <Button variant="outline" onClick={bulkDeleteFiltered} className="border-destructive/40 text-destructive">
              <Trash2 className="w-4 h-4 mr-1" /> {filtered.length} löschen
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {["all", ...CATS].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 text-xs rounded-full border transition ${filterCat === c ? "bg-apple/20 border-apple/40 text-apple-bright" : "border-border text-muted-foreground hover:bg-muted/30"}`}
          >
            {c} {counts[c] ? `(${counts[c]})` : ""}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Titel, Tags, Trigger, URL..." className="pl-9 bg-background/60 border-gold/20" />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Lädt...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Keine Medien gefunden.
        </Card>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((m) => (
            <Card key={m.id} className={`group overflow-hidden border-gold/20 bg-card/40 ${!m.is_active ? "opacity-50" : ""}`}>
              <div className="relative aspect-square bg-muted/30">
                <img
                  src={m.thumbnail_url ?? m.url}
                  alt={m.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white truncate">{m.title}</p>
                  <p className="text-xs text-white/70">{m.category}</p>
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <a href={m.url} target="_blank" rel="noreferrer" className="p-1.5 rounded bg-black/60 text-white hover:bg-black/80"><ExternalLink className="w-3.5 h-3.5" /></a>
                  <button onClick={() => setEditing(m)} className="p-1.5 rounded bg-black/60 text-white hover:bg-black/80"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(m)} className="p-1.5 rounded bg-destructive/80 text-white hover:bg-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate" title={(m.triggers ?? []).join(", ")}>
                  {m.triggers?.length ? `🏷 ${m.triggers.slice(0, 2).join(", ")}` : "—"}
                </span>
                <Switch checked={m.is_active} onCheckedChange={(v) => toggleActive(m, v)} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Medium bearbeiten</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <img src={editing.url} alt={editing.title} className="w-full max-h-64 object-contain rounded bg-muted/20" />
              <div>
                <Label>Titel</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kategorie</Label>
                  <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                    {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Sortierung</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <Label>Tags (komma-getrennt)</Label>
                <Input value={(editing.tags ?? []).join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div>
                <Label>Trigger-Wörter (Clara zeigt Bild bei diesen Begriffen)</Label>
                <Input value={(editing.triggers ?? []).join(", ")} onChange={(e) => setEditing({ ...editing, triggers: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="pool, schwimmbad, wasserwelt" />
              </div>
              <div>
                <Label>Bildunterschrift</Label>
                <Input value={editing.caption ?? ""} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">URL</Label>
                <Input value={editing.url} disabled className="text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <span className="text-sm">Aktiv</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Abbrechen</Button>
            <Button onClick={saveEdit} disabled={saving} className="bg-gold text-background hover:bg-gold/90">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
