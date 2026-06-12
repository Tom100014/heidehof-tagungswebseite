import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trash2, Upload, Sparkles, Loader2, Printer, Download, Wand2, Layout, Plus, Pencil, X,
} from "lucide-react";
import { toast } from "sonner";

interface MenuCard {
  id: string;
  service_date: string;
  meal_type: string | null;
  image_url: string;
  storage_path: string | null;
  source: string;
  notes: string | null;
}
interface Dish { id: string; title: string; description: string | null; meal_type: string }
interface Layout { id: string; name: string; description: string | null; prompt: string | null; image_url: string }

const MEALS = [
  { value: "all", label: "Ganzer Tag" },
  { value: "breakfast", label: "Frühstück" },
  { value: "lunch", label: "Mittag" },
  { value: "coffee", label: "Kaffeepause" },
  { value: "dinner", label: "Abend" },
];

export default function AdminMenuCards() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [meal, setMeal] = useState("all");
  const [cards, setCards] = useState<MenuCard[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [layoutId, setLayoutId] = useState<string>("none");
  const [customPrompt, setCustomPrompt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<MenuCard | null>(null);
  const [showLayoutMgr, setShowLayoutMgr] = useState(false);

  const load = async () => {
    const [c, d, l] = await Promise.all([
      supabase.from("conference_menu_cards" as never).select("*").eq("service_date", date).order("created_at", { ascending: false }),
      supabase.from("conference_dishes" as never).select("id,title,description,meal_type").eq("service_date", date),
      supabase.from("menu_layout_templates" as never).select("*").eq("is_active", true).order("sort_order"),
    ]);
    setCards((c.data as unknown as MenuCard[]) ?? []);
    setDishes((d.data as unknown as Dish[]) ?? []);
    setLayouts((l.data as unknown as Layout[]) ?? []);
  };
  useEffect(() => { load(); }, [date]);

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${date}/${meal}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("menu-cards").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("menu-cards").getPublicUrl(path);
      const { error: insErr } = await supabase.from("conference_menu_cards" as never).insert({
        service_date: date, meal_type: meal === "all" ? null : meal,
        image_url: pub.publicUrl, storage_path: path, source: "upload",
      } as never);
      if (insErr) throw insErr;
      toast.success("Speisekarte hochgeladen");
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  const generate = async () => {
    const filtered = meal === "all" ? dishes : dishes.filter((d) => d.meal_type === meal);
    if (filtered.length === 0 && !customPrompt.trim()) {
      return toast.error("Bitte zuerst Speisen anlegen oder einen Prompt eingeben");
    }
    setGenerating(true);
    try {
      const layout = layouts.find((l) => l.id === layoutId);
      const { data, error } = await supabase.functions.invoke("generate-menu-card", {
        body: {
          service_date: date,
          meal_type: meal === "all" ? null : meal,
          dishes: filtered.map((d) => ({ title: d.title, description: d.description })),
          layout_image_url: layout?.image_url ?? null,
          layout_prompt: layout?.prompt ?? null,
          custom_prompt: customPrompt.trim() || null,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Unbekannter Fehler");
      toast.success("Speisekarte generiert");
      setCustomPrompt("");
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setGenerating(false); }
  };

  const remove = async (card: MenuCard) => {
    if (!(await confirmAction({ description: "Speisekarte löschen?", destructive: true, confirmLabel: "Bestätigen" }))) return;
    if (card.storage_path) await supabase.storage.from("menu-cards").remove([card.storage_path]);
    await supabase.from("conference_menu_cards" as never).delete().eq("id", card.id);
    load();
  };

  const printCard = (card: MenuCard) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Speisekarte</title>
      <style>html,body{margin:0;padding:0;background:#000}img{width:100vw;height:100vh;object-fit:contain;display:block}@media print{@page{size:A4 portrait;margin:0}}</style>
      </head><body><img src="${card.image_url}" onload="window.print();setTimeout(()=>window.close(),500)"/></body></html>`);
    w.document.close();
  };

  return (
    <HeidehofAdminLayout title="Speisekarten">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gold/70 text-slate-600">Cartes du Jour</p>
              <h2 className="font-serif text-2xl mt-1">Speisekarten erstellen</h2>
              <p className="text-xs text-muted-foreground mt-1">Hochladen, per KI im Heidehof-Stil generieren oder ein Layout-Template als Vorlage nutzen.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowLayoutMgr(true)} className="border-border/60">
              <Layout className="w-3.5 h-3.5 mr-2" /> Layout-Vorlagen ({layouts.length})
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Datum</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="mt-2 bg-background/60 border-border/60 [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Mahlzeit</label>
              <Select value={meal} onValueChange={setMeal}>
                <SelectTrigger className="mt-2 bg-background/60 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>{MEALS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Layout-Vorlage</label>
              <Select value={layoutId} onValueChange={setLayoutId}>
                <SelectTrigger className="mt-2 bg-background/60 border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standard Heidehof-Stil</SelectItem>
                  {layouts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-1.5">
              <Wand2 className="w-3 h-3" /> Eigener Gestaltungs-Prompt (optional, überschreibt alles)
            </label>
            <Textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="z.B. „Speisekarte im Stil eines klassischen französischen Bistros, schwarzer Hintergrund, Goldschrift"
              className="mt-2 bg-background/60 border-border/60 min-h-[70px]" />
          </div>

          <div className="flex flex-wrap gap-3 mt-5">
            <label className="inline-flex">
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
              <Button asChild disabled={uploading} variant="outline" className="border-border/60">
                <span>{uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Hochladen</span>
              </Button>
            </label>
            <Button onClick={generate} disabled={generating} className="bg-gold text-background hover:bg-gold/90">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              KI-Speisekarte generieren
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{dishes.length} Speise(n) für {date}.</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cards.map((c) => (
            <Card key={c.id} className="overflow-hidden border-border/60 bg-card/60 group">
              <div className="relative">
                <img src={c.image_url} alt="Speisekarte" className="w-full aspect-[3/4] object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end justify-center gap-2 opacity-0 group-hover:opacity-100 p-3">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="secondary" onClick={() => printCard(c)}><Printer className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="secondary" asChild>
                    <a href={c.image_url} download target="_blank" rel="noreferrer"><Download className="w-3.5 h-3.5" /></a>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => remove(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="p-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground uppercase tracking-wider">
                  {c.meal_type ?? "Ganzer Tag"} · {c.source === "ai" ? "KI" : "Upload"}
                </span>
              </div>
            </Card>
          ))}
          {cards.length === 0 && (
            <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed border-border/60 bg-card/30">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-gold/50" />
              Noch keine Speisekarte für diesen Tag.
            </Card>
          )}
        </div>
      </div>

      {editing && <EditDialog card={editing} layouts={layouts} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {showLayoutMgr && <LayoutManager onClose={() => { setShowLayoutMgr(false); load(); }} />}
    </HeidehofAdminLayout>
  );
}

/* ---------------- Edit Dialog: re-generate variant from existing card ---------------- */
function EditDialog({ card, layouts, onClose, onSaved }: { card: MenuCard; layouts: Layout[]; onClose: () => void; onSaved: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [layoutId, setLayoutId] = useState("none");
  const [busy, setBusy] = useState(false);

  const regen = async () => {
    setBusy(true);
    try {
      const { data: ds } = await supabase.from("conference_dishes" as never)
        .select("title,description,meal_type").eq("service_date", card.service_date);
      const dishes = (ds as any[] ?? []).filter((d) => !card.meal_type || d.meal_type === card.meal_type);
      const layout = layouts.find((l) => l.id === layoutId);
      const { data, error } = await supabase.functions.invoke("generate-menu-card", {
        body: {
          service_date: card.service_date, meal_type: card.meal_type,
          dishes, layout_image_url: layout?.image_url ?? card.image_url,
          layout_prompt: layout?.prompt ?? null, custom_prompt: prompt.trim() || null,
        },
      });
      if (error || !data?.success) throw new Error(data?.error ?? error?.message ?? "Fehler");
      toast.success("Neue Variante erstellt");
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border/60 rounded-2xl max-w-2xl w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/70 text-slate-600">Speisekarte bearbeiten</p>
            <h3 className="font-serif text-xl mt-1">Neue Variante generieren</h3>
            <p className="text-xs text-muted-foreground mt-1">Die aktuelle Karte dient als Layout-Referenz. Beschreibe deine Änderungen oder wähle ein anderes Template.</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <img src={card.image_url} alt="" className="w-full max-h-72 object-contain rounded border border-border/60" />
        <div>
          <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Layout-Vorlage</label>
          <Select value={layoutId} onValueChange={setLayoutId}>
            <SelectTrigger className="mt-2 bg-background/60 border-border/60"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aktuelle Karte als Vorlage</SelectItem>
              {layouts.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Änderungs-Prompt</label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="z.B. „mehr Goldakzente, Sub-Headlines kursiv, Datum unten zentriert"
            className="mt-2 bg-background/60 border-border/60 min-h-[100px]" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button onClick={regen} disabled={busy} className="bg-gold text-background hover:bg-gold/90">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Neu generieren
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Layout Templates Manager ---------------- */
function LayoutManager({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<Layout[]>([]);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("menu_layout_templates" as never).select("*").order("sort_order");
    setList((data as unknown as Layout[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim() || !file) return toast.error("Name und Bild erforderlich");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `templates/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("menu-layouts").upload(path, file);
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("menu-layouts").getPublicUrl(path);
      const { error } = await supabase.from("menu_layout_templates" as never).insert({
        name, prompt, image_url: pub.publicUrl, storage_path: path,
      } as never);
      if (error) throw error;
      toast.success("Template angelegt");
      setName(""); setPrompt(""); setFile(null);
      load();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const del = async (l: Layout) => {
    if (!(await confirmAction({ description: "Template löschen?", destructive: true, confirmLabel: "Bestätigen" }))) return;
    await supabase.from("menu_layout_templates" as never).delete().eq("id", l.id);
    load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-card border border-border/60 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/70 text-slate-600">Layout-Vorlagen</p>
            <h3 className="font-serif text-xl mt-1">Speisekarten-Layouts verwalten</h3>
            <p className="text-xs text-muted-foreground mt-1">Lade ein Beispiel-Bild hoch (z. B. eine PDF-gerenderte Karte). Die KI nutzt es als visuelles Vorbild und ersetzt nur die Speisen.</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Template-Name (z.B. Gold-Klassik)" value={name} onChange={(e) => setName(e.target.value)} className="bg-background/60 border-border/60" />
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="bg-background/60 border-border/60" />
          </div>
          <Textarea placeholder="Stil-Beschreibung / Prompt-Notizen für die KI" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="bg-background/60 border-border/60" />
          <Button onClick={add} disabled={busy} className="bg-gold text-background hover:bg-gold/90">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Template hinzufügen
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {list.map((l) => (
            <Card key={l.id} className="overflow-hidden border-border/60 bg-card/60">
              <img src={l.image_url} alt={l.name} className="w-full aspect-[3/4] object-cover" />
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-sm">{l.name}</p>
                    {l.prompt && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{l.prompt}</p>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del(l)} className="text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {list.length === 0 && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-6">Noch keine Templates.</p>
          )}
        </div>
      </div>
    </div>
  );
}
