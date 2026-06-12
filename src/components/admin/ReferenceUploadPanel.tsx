import { useEffect, useState, useCallback } from "react";
import { Loader2, Upload, ImageIcon, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  type HotelReferenceImage,
  type ReferenceScope,
  SCOPE_LABELS,
  listReferenceImagesByScope,
  uploadReferenceImageFile,
  createReferenceImage,
  deleteReferenceImage,
} from "@/services/images/reference-library";

interface Props {
  scope: ReferenceScope;
  /** Optional headline override */
  title?: string;
  defaultOpen?: boolean;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "ref";

export function ReferenceUploadPanel({ scope, title, defaultOpen = true }: Props) {
  const [refs, setRefs] = useState<HotelReferenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRefs(await listReferenceImagesByScope(scope));
    } catch (e) {
      toast.error("Referenzen laden fehlgeschlagen: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => { void load(); }, [load]);

  const onUpload = async () => {
    if (!pendingFile || !newLabel.trim()) {
      toast.error("Datei und Bezeichnung erforderlich");
      return;
    }
    setUploading(true);
    try {
      const slug = `${scope}-${slugify(newLabel)}-${Date.now().toString(36)}`;
      const { url, path } = await uploadReferenceImageFile(pendingFile, slug);
      await createReferenceImage({
        slug, label: newLabel.trim(), description: newDesc.trim(),
        category: scope, scopes: [scope], image_url: url, storage_path: path,
      });
      toast.success("Referenz hinzugefügt");
      setNewLabel(""); setNewDesc(""); setPendingFile(null);
      await load();
    } catch (e) {
      toast.error("Upload fehlgeschlagen: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Diese Referenz wirklich löschen?")) return;
    try {
      await deleteReferenceImage(id);
      toast.success("Gelöscht");
      await load();
    } catch (e) {
      toast.error("Löschen fehlgeschlagen: " + (e as Error).message);
    }
  };

  return (
    <Card className="p-4 mb-6 border-dashed">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">
            {title ?? `Referenzbilder · ${SCOPE_LABELS[scope]}`}
          </h3>
          <Badge variant="secondary">{refs.length}</Badge>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            Lade hier Referenzbilder für <strong>{SCOPE_LABELS[scope]}</strong> hoch (z. B. Tellerstil,
            Hintergrund, Lichtstimmung). Diese können beim Generieren einzelner Bilder ausgewählt
            werden, damit alle Motive konsistent zur Marke wirken.
          </p>

          {loading ? (
            <div className="flex items-center text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Lade …
            </div>
          ) : refs.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {refs.map((r) => (
                <div key={r.id} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
                  <img src={r.image_url} alt={r.label} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-xs text-white truncate">
                    {r.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded p-1 opacity-0 group-hover:opacity-100 transition"
                    title="Referenz löschen"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Noch keine Referenzen für diesen Bereich.
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3 pt-3 border-t">
            <div className="md:col-span-1">
              <Label className="text-xs">Bilddatei</Label>
              <Input
                type="file" accept="image/*"
                onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs">Bezeichnung *</Label>
              <Input
                value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                placeholder="z. B. Heller Holzteller"
              />
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs">Beschreibung</Label>
              <Textarea
                value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                rows={1}
                placeholder="Stil / Hintergrund …"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button
                onClick={onUpload}
                disabled={uploading || !pendingFile || !newLabel.trim()}
                size="sm"
              >
                {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                Referenz speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
