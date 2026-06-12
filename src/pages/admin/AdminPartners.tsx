import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { partnerSchema, validateOrError } from "@/utils/admin-validation";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Upload, Trash2, Plus, Loader2, ExternalLink, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface PartnerLogo {
  id: string;
  name: string;
  logo_url: string;
  target_url: string;
  storage_path: string | null;
  sort_order: number;
  is_active: boolean;
}

const AdminPartners = () => {
  const [items, setItems] = useState<PartnerLogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partner_logos")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setItems((data || []) as PartnerLogo[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, patch: Partial<PartnerLogo>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    // Validiere nur Felder, die im Schema sind, wenn sie im Patch enthalten sind.
    const current = items.find((p) => p.id === id);
    if (current && (patch.name !== undefined || patch.target_url !== undefined || patch.logo_url !== undefined)) {
      const next = { ...current, ...patch };
      if (next.logo_url && next.target_url) {
        const validation = validateOrError(partnerSchema, {
          name: next.name,
          target_url: next.target_url,
          logo_url: next.logo_url,
        });
        if (!validation.ok) {
          toast.error((validation as { ok: false; error: string }).error);
          return;
        }
      }
    }
    const { error } = await supabase.from("partner_logos").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };

  const handleUpload = async (item: PartnerLogo, file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Nur Bilddateien (PNG, SVG, JPG, WebP)");
    if (file.size > 2 * 1024 * 1024) return toast.error("Maximal 2 MB pro Logo");
    setBusy(item.id);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `partners/${item.id}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("site-images").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("site-images").getPublicUrl(path);
      const old = item.storage_path;
      const { error } = await supabase.from("partner_logos")
        .update({ logo_url: pub.publicUrl, storage_path: path }).eq("id", item.id);
      if (error) throw error;
      if (old) await supabase.storage.from("site-images").remove([old]);
      toast.success("Logo aktualisiert");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally { setBusy(null); }
  };

  const addNew = async () => {
    const max = items.reduce((m, x) => Math.max(m, x.sort_order), 0);
    const { error } = await supabase.from("partner_logos").insert({
      name: "Neuer Partner",
      logo_url: "",
      target_url: "https://",
      sort_order: max + 10,
    });
    if (error) return toast.error(error.message);
    toast.success("Partner hinzugefügt");
    await load();
  };

  const remove = async (item: PartnerLogo) => {
    if (!(await confirmAction({ description: `Partner "${item.name}" löschen?`, destructive: true, confirmLabel: "Bestätigen" }))) return;
    if (item.storage_path) {
      await supabase.storage.from("site-images").remove([item.storage_path]);
    }
    const { error } = await supabase.from("partner_logos").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Gelöscht");
    await load();
  };

  return (
    <HeidehofAdminLayout title="Partner-Logos">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-wrap items-center gap-4 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/70 text-slate-600">Logo-Slider</p>
            <p className="font-serif text-2xl mt-1">{items.length} Partner</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Diese Logos erscheinen als unendlicher Auto-Slider auf der Startseite (Pause beim Hover).
              Lade eigene Logos hoch oder hinterlege ein direktes Logo-URL. Sortierung über die Reihenfolge-Nummer.
            </p>
          </div>
          <Button onClick={addNew} className="bg-gold text-background hover:bg-gold/90">
            <Plus className="w-4 h-4 mr-2" /> Partner hinzufügen
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Lädt …
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id} className="p-5 space-y-4 bg-card/60">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-20 shrink-0 rounded-lg border border-border/60 bg-background/80 flex items-center justify-center overflow-hidden">
                    {item.logo_url ? (
                      <img src={item.logo_url} alt={item.name}
                           className="max-h-full max-w-full object-contain p-2"
                           onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">Kein Logo</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <Input
                      value={item.name}
                      onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))}
                      onBlur={(e) => update(item.id, { name: e.target.value })}
                      placeholder="Partnername"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.target_url}
                        onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, target_url: e.target.value } : x))}
                        onBlur={(e) => update(item.id, { target_url: e.target.value })}
                        placeholder="https://…"
                      />
                      {item.target_url && (
                        <a href={item.target_url} target="_blank" rel="noopener noreferrer"
                           className="text-gold hover:text-gold/80 shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <Input
                  value={item.logo_url}
                  onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, logo_url: e.target.value } : x))}
                  onBlur={(e) => update(item.id, { logo_url: e.target.value })}
                  placeholder="Logo-URL (oder eigenes hochladen)"
                  className="text-xs"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={(el) => (fileInputs.current[item.id] = el)}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(item, f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline" size="sm"
                    onClick={() => fileInputs.current[item.id]?.click()}
                    disabled={busy === item.id}
                  >
                    {busy === item.id
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <Upload className="w-4 h-4 mr-2" />}
                    Logo hochladen
                  </Button>

                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={item.sort_order}
                      onChange={(e) => setItems((p) => p.map((x) => x.id === item.id ? { ...x, sort_order: Number(e.target.value) } : x))}
                      onBlur={(e) => update(item.id, { sort_order: Number(e.target.value) })}
                      className="w-20"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs">
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(v) => update(item.id, { is_active: v })}
                    />
                    {item.is_active ? "Aktiv" : "Versteckt"}
                  </label>

                  <Button variant="ghost" size="sm"
                          onClick={() => remove(item)}
                          className="ml-auto text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </HeidehofAdminLayout>
  );
};

export default AdminPartners;
