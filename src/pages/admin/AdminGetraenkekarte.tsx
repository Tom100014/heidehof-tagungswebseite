import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Plus, Wand2, Loader2, Upload, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ImageGenerationDialog } from "@/components/admin/ImageGenerationDialog";
import { ReferenceUploadPanel } from "@/components/admin/ReferenceUploadPanel";

type Cat = "aperitif" | "weisswein" | "rotwein" | "rose" | "dessertwein" | "bier" | "softdrink" | "wasser" | "kaffee" | "tee" | "spirituose" | "cocktail" | "longdrink" | "digestif";
const CATS: Cat[] = ["aperitif","weisswein","rotwein","rose","dessertwein","bier","softdrink","wasser","kaffee","tee","cocktail","longdrink","spirituose","digestif"];
const CAT_LABELS: Record<Cat, string> = {
  aperitif: "Aperitif & Champagner", weisswein: "Weißwein", rotwein: "Rotwein", rose: "Roséwein",
  dessertwein: "Dessertwein", bier: "Bier", softdrink: "Softdrinks", wasser: "Wasser",
  kaffee: "Kaffee", tee: "Tee", spirituose: "Spirituosen / Whisky", cocktail: "Cocktails",
  longdrink: "Longdrinks", digestif: "Digestifs / Grappa / Bitters",
};

interface Drink {
  id: string; slug: string; title: string; description: string | null; category: Cat;
  producer: string | null; region: string | null; volume_label: string | null;
  price_label: string | null; price_eur: number | null;
  image_url: string | null; image_prompt: string | null;
  is_active: boolean; sort_order: number;
}

export default function AdminGetraenkekarte() {
  const [items, setItems] = useState<Drink[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState<Drink | null>(null);
  const [genTarget, setGenTarget] = useState<Drink | null>(null);
  const [filter, setFilter] = useState<Cat | "all">("all");
  const [n, setN] = useState({ title: "", description: "", category: "weisswein" as Cat, producer: "", region: "", volume_label: "", price_label: "" });

  const load = async () => {
    const { data } = await supabase.from("drinks_menu" as never).select("*").order("category").order("sort_order");
    setItems((data as unknown as Drink[]) ?? []);
  };
  useEffect(() => { void load(); }, []);

  const add = async () => {
    if (!n.title) return toast.error("Titel erforderlich");
    const slug = n.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);
    const { error } = await supabase.from("drinks_menu" as never).insert({ ...n, slug } as never);
    if (error) toast.error(error.message); else { toast.success("Hinzugefügt"); setN({ ...n, title: "", description: "", producer: "", region: "", volume_label: "", price_label: "" }); await load(); }
  };

  const saveEdit = async () => {
    if (!edit) return;
    const { id, ...rest } = edit;
    const { error } = await supabase.from("drinks_menu" as never).update(rest as never).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Gespeichert"); setEdit(null); await load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("drinks_menu" as never).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Gelöscht"); await load(); }
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("drinks_menu" as never).update({ is_active: !is_active } as never).eq("id", id);
    await load();
  };

  const runGenerate = async (
    item: Drink,
    prompt: string,
    refUrls: string[],
    references?: Array<{ image_url: string; role: string; user_notes?: string }>
  ) => {
    setBusy(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-menu-image", {
        body: { kind: "drinks", record_id: item.id, prompt_override: prompt, reference_image_urls: refUrls, references },
      });
      if (error || (data as { error?: string })?.error) throw new Error(error?.message ?? (data as { error?: string }).error);
      toast.success("Bild generiert"); await load();
    } catch (e) { toast.error("Fehler: " + (e as Error).message); } finally { setBusy(null); }
  };

  const upload = async (item: Drink, file: File) => {
    setBusy(item.id);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `drinks/${item.id}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("menu-media").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("menu-media").getPublicUrl(path);
      await supabase.from("drinks_menu" as never).update({ image_url: pub.publicUrl, image_storage_path: path } as never).eq("id", item.id);
      toast.success("Hochgeladen"); await load();
    } catch (e) { toast.error("Upload-Fehler: " + (e as Error).message); } finally { setBusy(null); }
  };

  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <HeidehofAdminLayout title="Getränkekarte">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ReferenceUploadPanel scope="drinks" />
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Neues Getränk</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Titel" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} />
            <Select value={n.category} onValueChange={(v) => setN({ ...n, category: v as Cat })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Produzent / Marke" value={n.producer} onChange={(e) => setN({ ...n, producer: e.target.value })} />
            <Input placeholder="Region" value={n.region} onChange={(e) => setN({ ...n, region: e.target.value })} />
            <Input placeholder="Volumen (z.B. 0,2 l)" value={n.volume_label} onChange={(e) => setN({ ...n, volume_label: e.target.value })} />
            <Input placeholder="Preis (z.B. 8,50 €)" value={n.price_label} onChange={(e) => setN({ ...n, price_label: e.target.value })} />
          </div>
          <Textarea placeholder="Beschreibung" value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} />
          <Button onClick={add}><Plus className="w-4 h-4 mr-2" />Hinzufügen</Button>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Alle ({items.length})</Button>
          {CATS.map((c) => {
            const count = items.filter((i) => i.category === c).length;
            if (!count) return null;
            return <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)}>{CAT_LABELS[c]} ({count})</Button>;
          })}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((d) => (
            <Card key={d.id} className={`p-4 ${!d.is_active ? "opacity-50" : ""}`}>
              {d.image_url && <img src={d.image_url} alt={d.title} className="w-full h-32 object-cover rounded mb-3" />}
              <div className="font-semibold">{d.title}</div>
              <div className="text-xs text-muted-foreground mb-2">{CAT_LABELS[d.category]} · {[d.producer, d.region, d.volume_label].filter(Boolean).join(" · ")} · {d.price_label}</div>
              {d.description && <p className="text-sm mb-3 line-clamp-2">{d.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEdit(d)}><Pencil className="w-3 h-3 mr-1" />Bearbeiten</Button>
                <Button size="sm" variant="outline" onClick={() => setGenTarget(d)} disabled={busy === d.id}>
                  {busy === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} KI-Bild
                </Button>
                <label className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded cursor-pointer hover:bg-accent">
                  <Upload className="w-3 h-3" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(d, e.target.files[0])} />
                </label>
                <Button size="sm" variant="ghost" onClick={() => toggle(d.id, d.is_active)}>{d.is_active ? "Deaktiv." : "Aktiv."}</Button>
                <Button size="sm" variant="ghost" onClick={() => del(d.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </Card>
          ))}
        </div>

        <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Getränk bearbeiten</DialogTitle></DialogHeader>
            {edit && (
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <Input placeholder="Titel" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
                  <Select value={edit.category} onValueChange={(v) => setEdit({ ...edit, category: v as Cat })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Produzent" value={edit.producer ?? ""} onChange={(e) => setEdit({ ...edit, producer: e.target.value })} />
                  <Input placeholder="Region" value={edit.region ?? ""} onChange={(e) => setEdit({ ...edit, region: e.target.value })} />
                  <Input placeholder="Volumen" value={edit.volume_label ?? ""} onChange={(e) => setEdit({ ...edit, volume_label: e.target.value })} />
                  <Input placeholder="Preis-Label" value={edit.price_label ?? ""} onChange={(e) => setEdit({ ...edit, price_label: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Preis €" value={edit.price_eur ?? ""} onChange={(e) => setEdit({ ...edit, price_eur: e.target.value ? Number(e.target.value) : null })} />
                  <Input type="number" placeholder="Sortierung" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) || 0 })} />
                </div>
                <Textarea placeholder="Beschreibung" value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={edit.is_active} onCheckedChange={(v) => setEdit({ ...edit, is_active: !!v })} /> Aktiv</label>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Bild-URL</label>
                  <Input placeholder="https://..." value={edit.image_url ?? ""} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">KI-Bild Prompt (eigener Prompt überschreibt Kategorie-Default)</label>
                  <Textarea rows={4} placeholder="z.B. Glas Aperol Spritz auf dunkler Bar, warmes Licht, Eiswürfel, Orangenscheibe ..." value={edit.image_prompt ?? ""} onChange={(e) => setEdit({ ...edit, image_prompt: e.target.value })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEdit(null)}>Abbrechen</Button>
              <Button onClick={saveEdit}>Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {genTarget && (
          <ImageGenerationDialog
            open={!!genTarget}
            onOpenChange={(o) => !o && setGenTarget(null)}
            scope="drinks"
            entityTitle={genTarget.title}
            entityDescription={genTarget.description ?? ""}
            defaultPrompt={genTarget.image_prompt ?? ""}
            onGenerate={async ({ prompt, referenceImageUrls, references, title, description }) => {
              const { error } = await supabase
                .from("drinks_menu" as never)
                .update({ title, description } as never)
                .eq("id", genTarget.id);
              if (error) {
                toast.error("Speichern fehlgeschlagen: " + error.message);
                return;
              }
              await runGenerate({ ...genTarget, title, description }, prompt, referenceImageUrls, references);
            }}
          />
        )}
      </div>
    </HeidehofAdminLayout>
  );
}
