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

interface Pkg {
  id: string;
  slug: string;
  number_label: string;
  eyebrow: string;
  title: string;
  price_value: string;
  price_suffix: string;
  price_note: string;
  highlights: string[];
  inclusions: string[];
  image_url: string | null;
  storage_path: string | null;
  badge: string | null;
  is_bestseller: boolean;
  is_active: boolean;
  sort_order: number;
}

const BUCKET = "site-images";

export default function AdminTagungsPackages() {
  const [items, setItems] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tagungs_packages" as never)
      .select("*")
      .order("sort_order");
    if (error) toast.error(error.message);
    const mapped = ((data as unknown as Array<Record<string, unknown>>) ?? []).map((r) => ({
      ...r,
      highlights: Array.isArray(r.highlights) ? (r.highlights as string[]) : [],
      inclusions: Array.isArray(r.inclusions) ? (r.inclusions as string[]) : [],
    })) as Pkg[];
    setItems(mapped);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Pkg>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const save = async (p: Pkg) => {
    setSavingId(p.id);
    const { error } = await supabase.from("tagungs_packages" as never).update({
      number_label: p.number_label,
      eyebrow: p.eyebrow,
      title: p.title,
      price_value: p.price_value,
      price_suffix: p.price_suffix,
      price_note: p.price_note,
      highlights: p.highlights,
      inclusions: p.inclusions,
      badge: p.badge,
      is_bestseller: p.is_bestseller,
      is_active: p.is_active,
      sort_order: p.sort_order,
      image_url: p.image_url,
      storage_path: p.storage_path,
    } as never).eq("id", p.id);
    if (error) toast.error(error.message); else toast.success("Gespeichert");
    setSavingId(null);
  };

  const handleUpload = async (p: Pkg, file: File) => {
    setUploadingId(p.id);
    try {
      const isVideo = file.type.startsWith("video/");
      const ext = file.name.split(".").pop() ?? (isVideo ? "mp4" : "jpg");
      const siteSlug = `pkg-${p.slug}`;
      const path = `${siteSlug}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("site-images")
        .upload(path, file, { upsert: false, contentType: file.type, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("site-images").getPublicUrl(path);
      const { error: siteErr } = await supabase.from("site_images").upsert({
        slug: siteSlug,
        url: data.publicUrl,
        alt: p.title,
        storage_path: path,
        media_type: isVideo ? "video" : "image",
      });
      if (siteErr) throw siteErr;
      await supabase.from("tagungs_packages" as never).update({ image_url: data.publicUrl, storage_path: path } as never).eq("id", p.id);
      update(p.id, { image_url: data.publicUrl, storage_path: path });
      toast.success("Vollbild-Hintergrund aktualisiert");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploadingId(null);
    }
  };


  const addNew = async () => {
    const slug = `paket-${Date.now()}`;
    const { data, error } = await supabase.from("tagungs_packages" as never).insert({
      slug, title: "Neues Paket", number_label: String(items.length + 1).padStart(2, "0"),
      sort_order: items.length,
    } as never).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Paket erstellt");
    load();
  };

  const remove = async (p: Pkg) => {
    if (!confirm(`Paket „${p.title}" löschen?`)) return;
    const { error } = await supabase.from("tagungs_packages" as never).delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Gelöscht"); load(); }
  };

  return (
    <HeidehofAdminLayout title="Tagungspauschalen">
      <div className="mb-8 flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Pauschalen für die Seite „Tagungspauschalen". Bild, Titel, Preis, Highlights & Leistungen sind 1:1 editierbar.
        </p>
        <Button onClick={addNew} className="bg-heide text-background hover:bg-heide/90">
          <Plus className="w-4 h-4 mr-1" /> Neues Paket
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {items.map((p) => (
            <Card key={p.id} className="border-heide/25 bg-card/40 overflow-hidden">
              <div
                className="relative aspect-[4/3] bg-background/50 border-b border-heide/15 group cursor-pointer"
                onClick={() => fileRefs.current[p.id]?.click()}
              >
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ImagePlus className="w-10 h-10 opacity-40" />
                    <span className="text-xs uppercase tracking-widest">Bild hochladen</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingId === p.id ? (
                    <Loader2 className="w-6 h-6 animate-spin text-heide" />
                  ) : (
                    <div className="text-heide flex items-center gap-2 text-sm">
                      <Upload className="w-4 h-4" /> Bild ersetzen
                    </div>
                  )}
                </div>
                <input
                  ref={(el) => { fileRefs.current[p.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(p, e.target.files[0])}
                />
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-[0.3em] text-heide">{p.slug}</span>
                  <button onClick={() => remove(p)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input value={p.number_label} onChange={(e) => update(p.id, { number_label: e.target.value })}
                    placeholder="01" className="bg-background/60 border-heide/20" />
                  <Input value={p.eyebrow} onChange={(e) => update(p.id, { eyebrow: e.target.value })}
                    placeholder="Eyebrow" className="bg-background/60 border-heide/20 col-span-2" />
                </div>
                <Input value={p.title} onChange={(e) => update(p.id, { title: e.target.value })}
                  className="font-serif text-xl bg-background/60 border-heide/20" placeholder="Titel" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={p.price_value} onChange={(e) => update(p.id, { price_value: e.target.value })}
                    placeholder="59" className="bg-background/60 border-heide/20" />
                  <Input value={p.price_suffix} onChange={(e) => update(p.id, { price_suffix: e.target.value })}
                    placeholder="€ pro Person / Tag" className="bg-background/60 border-heide/20" />
                </div>
                <Input value={p.price_note} onChange={(e) => update(p.id, { price_note: e.target.value })}
                  placeholder="Preis-Hinweis" className="bg-background/60 border-heide/20 text-xs" />
                <Textarea value={p.highlights.join("\n")} rows={4}
                  onChange={(e) => update(p.id, { highlights: e.target.value.split("\n").filter(Boolean) })}
                  placeholder="Highlights (eine Zeile pro Eintrag)" className="bg-background/60 border-heide/20 text-sm" />
                <Textarea value={p.inclusions.join("\n")} rows={6}
                  onChange={(e) => update(p.id, { inclusions: e.target.value.split("\n").filter(Boolean) })}
                  placeholder="Leistungen / Checkliste (eine Zeile pro Eintrag)"
                  className="bg-background/60 border-heide/20 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <Input value={p.badge ?? ""} onChange={(e) => update(p.id, { badge: e.target.value })}
                    placeholder="Badge (optional)" className="bg-background/60 border-heide/20 text-xs" />
                  <Input type="number" value={p.sort_order} onChange={(e) => update(p.id, { sort_order: Number(e.target.value) })}
                    placeholder="Sortierung" className="bg-background/60 border-heide/20 text-xs" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4">
                    <Label className="flex items-center gap-2 text-xs">
                      <Switch checked={p.is_bestseller} onCheckedChange={(v) => update(p.id, { is_bestseller: v })} /> Bestseller
                    </Label>
                    <Label className="flex items-center gap-2 text-xs">
                      <Switch checked={p.is_active} onCheckedChange={(v) => update(p.id, { is_active: v })} /> Aktiv
                    </Label>
                  </div>
                  <Button size="sm" onClick={() => save(p)} disabled={savingId === p.id}
                    className="bg-heide text-background hover:bg-heide/90">
                    {savingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Speichern</>}
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
