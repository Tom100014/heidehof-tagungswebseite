import { useEffect, useRef, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Upload, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import {
  fetchRoomSetups,
  updateRoomSetup,
  uploadSetupImage,
  type RoomSetup,
} from "@/services/conference/setups-service";

export default function AdminSetups() {
  const [items, setItems] = useState<RoomSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchRoomSetups());
    } catch (e) {
      toast.error("Konnte Bestuhlungen nicht laden");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<RoomSetup>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const save = async (s: RoomSetup) => {
    setSavingId(s.id);
    try {
      await updateRoomSetup(s.id, {
        title: s.title, description: s.description, capacity_range: s.capacity_range,
        ideal_for: s.ideal_for,
      });
      toast.success("Gespeichert");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSavingId(null);
    }
  };

  const handleUpload = async (s: RoomSetup, file: File) => {
    setUploadingId(s.id);
    try {
      const url = await uploadSetupImage(s.id, s.slug, file);
      update(s.id, { image_url: url });
      toast.success("Bild hochgeladen");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <HeidehofAdminLayout title="Bestuhlungsvarianten">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          Diese 6 Bestuhlungsformen werden auf der Seite Ausstattung & Technik gezeigt. Laden Sie professionelle Fotos oder Renderings hoch.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((s) => (
            <Card key={s.id} className="border-gold/20 bg-card/40 overflow-hidden">
              <div
                className="relative aspect-[4/3] bg-background/50 border-b border-gold/15 group cursor-pointer"
                onClick={() => fileRefs.current[s.id]?.click()}
              >
                {s.image_url ? (
                  <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <ImagePlus className="w-10 h-10 opacity-40" />
                    <span className="text-xs uppercase tracking-widest">Bild hochladen</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingId === s.id ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gold" />
                  ) : (
                    <div className="text-gold flex items-center gap-2 text-sm">
                      <Upload className="w-4 h-4" /> Bild ersetzen
                    </div>
                  )}
                </div>
                <input
                  ref={(el) => { fileRefs.current[s.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(s, e.target.files[0])}
                />
              </div>

              <div className="p-5 space-y-3">
                <div className="text-xs uppercase tracking-[0.3em] text-gold">{s.slug}</div>
                <Input
                  value={s.title}
                  onChange={(e) => update(s.id, { title: e.target.value })}
                  className="font-serif text-xl bg-background/60 border-gold/20"
                />
                <Textarea
                  value={s.description ?? ""}
                  onChange={(e) => update(s.id, { description: e.target.value })}
                  rows={3}
                  placeholder="Beschreibung"
                  className="bg-background/60 border-gold/20 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={s.capacity_range ?? ""}
                    onChange={(e) => update(s.id, { capacity_range: e.target.value })}
                    placeholder="Kapazität (z.B. 12 – 30)"
                    className="bg-background/60 border-gold/20 text-xs"
                  />
                  <Input
                    value={s.ideal_for ?? ""}
                    onChange={(e) => update(s.id, { ideal_for: e.target.value })}
                    placeholder="Ideal für…"
                    className="bg-background/60 border-gold/20 text-xs"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={() => save(s)}
                    disabled={savingId === s.id}
                    className="bg-gold text-background hover:bg-gold/90"
                  >
                    {savingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Speichern</>}
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
