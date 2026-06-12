import { useEffect, useRef, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Upload, ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Feat {
  id: string;
  slug: string;
  number_label: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body_md: string;
  bullets: string[];
  image_url: string | null;
  storage_path: string | null;
  layout: string;
  is_active: boolean;
  sort_order: number;
}

const BUCKET = "site-images";

export default function AdminTechFeatures() {
  const [items, setItems] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tech_features" as never)
      .select("*")
      .order("sort_order");
    if (error) toast.error(error.message);
    const mapped = ((data as unknown as Array<Record<string, unknown>>) ?? []).map((r) => ({
      ...r,
      bullets: Array.isArray(r.bullets) ? (r.bullets as string[]) : [],
    })) as Feat[];
    setItems(mapped);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Feat>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const save = async (f: Feat) => {
    setSavingId(f.id);
    const { error } = await supabase.from("tech_features" as never).update({
      number_label: f.number_label, eyebrow: f.eyebrow, title: f.title,
      subtitle: f.subtitle, body_md: f.body_md, bullets: f.bullets,
      layout: f.layout, is_active: f.is_active, sort_order: f.sort_order,
      image_url: f.image_url, storage_path: f.storage_path,
    } as never).eq("id", f.id);
    if (error) toast.error(error.message); else toast.success("Gespeichert");
    setSavingId(null);
  };

  const handleUpload = async (f: Feat, file: File) => {
    setUploadingId(f.id);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `techfeatures/${f.slug}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await supabase.from("tech_features" as never).update({ image_url: data.publicUrl, storage_path: path } as never).eq("id", f.id);
      update(f.id, { image_url: data.publicUrl, storage_path: path });
      toast.success("Bild hochgeladen");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploadingId(null);
    }
  };

  const addNew = async () => {
    const slug = `feature-${Date.now()}`;
    const { error } = await supabase.from("tech_features" as never).insert({
      slug, title: "Neue Technik", number_label: String(items.length + 1).padStart(2, "0"),
      sort_order: items.length,
    } as never);
    if (error) { toast.error(error.message); return; }
    toast.success("Feature erstellt");
    load();
  };

  const remove = async (f: Feat) => {
    if (!confirm(`Feature „${f.title}" löschen?`)) return;
    const { error } = await supabase.from("tech_features" as never).delete().eq("id", f.id);
    if (error) toast.error(error.message); else { toast.success("Gelöscht"); load(); }
  };

  return (
    <HeidehofAdminLayout title="Tagungstechnik">
      <div className="mb-8 flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Technik-Highlights für die Seite „Ausstattung & Technik". Bild, Titel, Bullets und Layout sind editierbar.
        </p>
        <Button onClick={addNew} className="bg-heide text-background hover:bg-heide/90">
          <Plus className="w-4 h-4 mr-1" /> Neues Feature
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {items.map((f) => (
            <Card key={f.id} className="border-heide/25 bg-card/40 overflow-hidden">
              <div
                className="relative aspect-[4/3] bg-background/50 border-b border-heide/15 group cursor-pointer"
                onClick={() => fileRefs.current[f.id]?.click()}
              >
                {f.image_url ? (
                  <img src={f.image_url} alt={f.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ImagePlus className="w-10 h-10 opacity-40" />
                    <span className="text-xs uppercase tracking-widest">Bild hochladen</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingId === f.id ? (
                    <Loader2 className="w-6 h-6 animate-spin text-heide" />
                  ) : (
                    <div className="text-heide flex items-center gap-2 text-sm">
                      <Upload className="w-4 h-4" /> Bild ersetzen
                    </div>
                  )}
                </div>
                <input
                  ref={(el) => { fileRefs.current[f.id] = el; }}
                  type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(f, e.target.files[0])}
                />
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-[0.3em] text-heide">{f.slug}</span>
                  <button onClick={() => remove(f)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={f.number_label} onChange={(e) => update(f.id, { number_label: e.target.value })}
                    placeholder="01" className="bg-background/60 border-heide/20" />
                  <Input value={f.eyebrow} onChange={(e) => update(f.id, { eyebrow: e.target.value })}
                    placeholder="Eyebrow" className="bg-background/60 border-heide/20 col-span-2" />
                </div>
                <Input value={f.title} onChange={(e) => update(f.id, { title: e.target.value })}
                  className="font-serif text-xl bg-background/60 border-heide/20" placeholder="Titel" />
                <Input value={f.subtitle} onChange={(e) => update(f.id, { subtitle: e.target.value })}
                  placeholder="Subtitle" className="bg-background/60 border-heide/20 text-sm" />
                <Textarea value={f.body_md} rows={3}
                  onChange={(e) => update(f.id, { body_md: e.target.value })}
                  placeholder="Beschreibung" className="bg-background/60 border-heide/20 text-sm" />
                <Textarea value={f.bullets.join("\n")} rows={4}
                  onChange={(e) => update(f.id, { bullets: e.target.value.split("\n").filter(Boolean) })}
                  placeholder="Bullets (eine Zeile pro Eintrag)"
                  className="bg-background/60 border-heide/20 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={f.layout} onChange={(e) => update(f.id, { layout: e.target.value })}
                    className="bg-background/60 border border-heide/20 rounded px-2 text-sm h-9">
                    <option value="image-left">Bild links</option>
                    <option value="image-right">Bild rechts</option>
                  </select>
                  <Input type="number" value={f.sort_order}
                    onChange={(e) => update(f.id, { sort_order: Number(e.target.value) })}
                    placeholder="Sortierung" className="bg-background/60 border-heide/20 text-xs" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Switch checked={f.is_active} onCheckedChange={(v) => update(f.id, { is_active: v })} /> Aktiv
                  </Label>
                  <Button size="sm" onClick={() => save(f)} disabled={savingId === f.id}
                    className="bg-heide text-background hover:bg-heide/90">
                    {savingId === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Speichern</>}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </HeidehofAdminLayout>
  );
}
