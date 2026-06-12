import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { Loader2, Trash2, Upload, ArrowUp, ArrowDown, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface ImpressionImage {
  id: string;
  title: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  is_active: boolean;
}

const BUCKET = "site-images";

const AdminImpressionen = () => {
  const [items, setItems] = useState<ImpressionImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadingNew, setUploadingNew] = useState(false);
  const newFileInput = useRef<HTMLInputElement | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("impressionen_images")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as ImpressionImage[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (id: string, patch: Partial<ImpressionImage>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const { error } = await supabase.from("impressionen_images").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const uploadFile = async (file: File, itemId: string | null): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error("Nur Bilddateien erlaubt");
      return null;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Maximal 8 MB pro Bild");
      return null;
    }
    const ext = file.name.split(".").pop() || "jpg";
    const path = `impressionen/${itemId ?? "new"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return pub.publicUrl;
  };

  const handleReplace = async (item: ImpressionImage, file: File) => {
    setBusy(item.id);
    try {
      const url = await uploadFile(file, item.id);
      if (!url) return;
      await update(item.id, { image_url: url });
      toast.success("Bild aktualisiert");
    } finally {
      setBusy(null);
    }
  };

  const handleAddNew = async (file: File) => {
    setUploadingNew(true);
    try {
      const url = await uploadFile(file, null);
      if (!url) return;
      const max = items.reduce((m, x) => Math.max(m, x.sort_order), 0);
      const { error } = await supabase.from("impressionen_images").insert({
        title: "Neues Bild",
        caption: null,
        image_url: url,
        sort_order: max + 10,
        is_active: true,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Bild hinzugefügt");
      await load();
    } finally {
      setUploadingNew(false);
    }
  };

  const remove = async (item: ImpressionImage) => {
    if (!(await confirmAction({ description: `Bild "${item.title}" löschen?`, destructive: true, confirmLabel: "Löschen" }))) return;
    const { error } = await supabase.from("impressionen_images").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    setItems((prev) => prev.filter((p) => p.id !== item.id));
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[idx];
    const b = items[swapIdx];
    await Promise.all([
      supabase.from("impressionen_images").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("impressionen_images").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    await load();
  };

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <HeidehofAdminLayout title="Impressionen-Bilder">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-wrap items-center gap-4 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/70 text-slate-600">Atmosphäre erleben</p>
            <p className="font-serif text-2xl mt-1">{items.length} Bilder · {activeCount} aktiv</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Diese Bilder erscheinen im Frontend in der Sektion „Atmosphäre erleben" (Tagungsräume).
              Nur aktive Bilder werden angezeigt. Reihenfolge bestimmt die Anzeige-Position.
            </p>
          </div>
          <div>
            <input
              ref={newFileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleAddNew(f);
                e.target.value = "";
              }}
            />
            <Button
              onClick={() => newFileInput.current?.click()}
              disabled={uploadingNew}
              className="bg-gold text-background hover:bg-gold/90"
            >
              {uploadingNew ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Bild hinzufügen
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Lädt …
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">Noch keine Bilder vorhanden.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, idx) => (
              <Card
                key={item.id}
                className={`p-0 overflow-hidden bg-card/60 ${item.is_active ? "" : "opacity-60"}`}
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = "0.3";
                    }}
                  />
                  {!item.is_active && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-background/80 text-xs uppercase tracking-widest text-destructive font-semibold">
                      Versteckt
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <Input
                    value={item.title}
                    onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, title: e.target.value } : x))}
                    onBlur={(e) => update(item.id, { title: e.target.value.trim() })}
                    placeholder="Titel"
                    className="font-serif"
                  />
                  <Input
                    value={item.caption ?? ""}
                    onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, caption: e.target.value } : x))}
                    onBlur={(e) => update(item.id, { caption: e.target.value.trim() || null })}
                    placeholder="Untertitel (optional)"
                    className="text-sm"
                  />

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      ref={(el) => (fileInputs.current[item.id] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleReplace(item, f);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputs.current[item.id]?.click()}
                      disabled={busy === item.id}
                    >
                      {busy === item.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                      Ersetzen
                    </Button>

                    <div className="flex items-center gap-1">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Button variant="ghost" size="icon" disabled={idx === 0} onClick={() => move(item.id, -1)} aria-label="Nach oben">
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={idx === items.length - 1} onClick={() => move(item.id, 1)} aria-label="Nach unten">
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>

                    <label className="flex items-center gap-2 text-xs ml-auto">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={(v) => update(item.id, { is_active: v })}
                      />
                      {item.is_active ? "Aktiv" : "Versteckt"}
                    </label>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(item)}
                      className="text-destructive hover:text-destructive"
                      aria-label="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HeidehofAdminLayout>
  );
};

export default AdminImpressionen;
