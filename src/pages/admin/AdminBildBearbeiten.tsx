import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Search, RefreshCw, ImageOff, Download, Film, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { refreshSiteImages } from "@/hooks/useSiteImages";

interface SiteImageRow {
  slug: string;
  url: string | null;
  alt: string | null;
  media_type: string | null;
  updated_at: string | null;
}

export default function AdminBildBearbeiten() {
  const [searchParams] = useSearchParams();
  const initialSlug = searchParams.get("slug");
  const [images, setImages] = useState<SiteImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_images")
      .select("slug,url,alt,media_type,updated_at")
      .order("slug", { ascending: true });
    if (error) toast.error(error.message);
    setImages((data ?? []) as SiteImageRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Only images can be AI-edited; videos are shown as disabled with a hint.
  const editableImages = useMemo(
    () => images.filter((i) => i.url && (i.media_type ?? "image") !== "video"),
    [images],
  );
  const videoEntries = useMemo(
    () => images.filter((i) => (i.media_type ?? "image") === "video"),
    [images],
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const base = editableImages;
    if (!q) return base;
    return base.filter((i) => i.slug.toLowerCase().includes(q) || (i.alt ?? "").toLowerCase().includes(q));
  }, [editableImages, filter]);

  // Auto-select first editable if pre-selected slug is missing/video.
  useEffect(() => {
    if (!images.length) return;
    const cur = images.find((i) => i.slug === selectedSlug);
    const isVideo = cur && (cur.media_type ?? "image") === "video";
    if (!cur || !cur.url || isVideo) {
      setSelectedSlug(editableImages[0]?.slug ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const selected = images.find((i) => i.slug === selectedSlug) ?? null;
  const selectedIsVideo = selected ? (selected.media_type ?? "image") === "video" : false;

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = `${filename}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error(e);
      toast.error("Download fehlgeschlagen");
    }
  };

  const handleGenerate = async () => {
    if (!selected) return toast.error("Bitte zuerst ein Bild auswählen");
    if (selectedIsVideo) return toast.error("Videos können nicht KI-bearbeitet werden");
    if (!prompt.trim()) return toast.error("Bitte Anweisung eingeben");
    setBusy(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("edit-site-image", {
        body: { slug: selected.slug, edit_prompt: prompt.trim(), source_url: selected.url },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Unbekannter Fehler");
      setResult(data.image_url);
      toast.success("Bild aktualisiert");
      await load();
      await refreshSiteImages();
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <HeidehofAdminLayout title="Bild-Bearbeitung">
      <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
        {/* Liste */}
        <Card className="border-gold/20 bg-card/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Slug oder Alt-Text suchen…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <Button size="icon" variant="ghost" onClick={load} disabled={loading} aria-label="Neu laden">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> {editableImages.length} Bilder</span>
            {videoEntries.length > 0 && (
              <span className="inline-flex items-center gap-1" title="Videos können nicht KI-bearbeitet werden">
                <Film className="h-3 w-3" /> {videoEntries.length} Videos ausgeblendet
              </span>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto space-y-1 pr-1">
            {filtered.map((img) => (
              <div
                key={img.slug}
                className={`w-full rounded-md border flex items-center gap-2 transition ${
                  selectedSlug === img.slug
                    ? "border-primary bg-primary/10"
                    : "border-border/60 hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <button
                  onClick={() => { setSelectedSlug(img.slug); setResult(null); setPrompt(""); }}
                  className="flex-1 min-w-0 text-left px-3 py-2 flex items-center gap-3"
                >
                  {img.url ? (
                    <img
                      src={img.url}
                      alt=""
                      className="h-10 w-14 rounded object-cover shrink-0 bg-muted/30"
                      loading="lazy"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = "none";
                        const sib = el.nextElementSibling as HTMLElement | null;
                        if (sib) sib.style.display = "grid";
                      }}
                    />
                  ) : null}
                  <div
                    className="h-10 w-14 rounded bg-muted/50 grid place-items-center shrink-0"
                    style={{ display: img.url ? "none" : "grid" }}
                  >
                    <ImageOff className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{img.slug}</div>
                    {img.alt && <div className="text-[11px] text-muted-foreground truncate">{img.alt}</div>}
                  </div>
                </button>
                {img.url && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="mr-1 shrink-0 h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleDownload(img.url!, img.slug); }}
                    aria-label="Bild herunterladen"
                    title="Bild herunterladen"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="text-xs text-muted-foreground p-3">Keine Bilder gefunden.</div>
            )}
          </div>
        </Card>

        {/* Editor */}
        <div className="space-y-4">
          <Card className="border-gold/20 bg-card/40 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">
                {selected ? selected.slug : "Bild auswählen"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Wähle links ein Bild aus und beschreibe unten die gewünschte Änderung. Die KI ersetzt das Originalbild auf der Website durch das neu generierte Ergebnis.
              </p>
            </div>

            {!selected && (
              <div className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                Bitte links ein Bild auswählen.
              </div>
            )}

            {selected && selectedIsVideo && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-200 flex items-start gap-3">
                <Film className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Dieser Slot enthält ein Video.</strong> Videos können nicht von der KI bearbeitet werden.
                  Lade in der Bildverwaltung ein Bild hoch oder wähle einen anderen Slot.
                </div>
              </div>
            )}

            {selected?.url && !selectedIsVideo && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Original</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleDownload(selected.url!, `${selected.slug}-original`)}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Download
                    </Button>
                  </div>
                  <div className="aspect-video w-full rounded-md border border-border overflow-hidden bg-muted/30">
                    <img
                      src={selected.url}
                      alt="Original"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.opacity = "0.2"; }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ergebnis</Label>
                    {result && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleDownload(result, `${selected.slug}-ergebnis`)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" /> Download
                      </Button>
                    )}
                  </div>
                  <div className="aspect-video w-full rounded-md border border-dashed border-border/60 overflow-hidden bg-muted/20 grid place-items-center">
                    {busy ? (
                      <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        KI generiert…
                      </div>
                    ) : result ? (
                      <img src={result} alt="Ergebnis" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs text-muted-foreground">Noch nichts generiert</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="prompt">Was soll geändert werden?</Label>
              <Textarea
                id="prompt"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={'z. B. „Mache das Bild heller und füge sanftes Morgenlicht hinzu", oder „Tausche die Tischdeko gegen weiße Tulpen aus"'}
              />
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Heller & wärmer",
                  "Mehr Tiefenschärfe",
                  "Goldenes Abendlicht",
                  "Cleaner Hintergrund",
                  "Cinematic Look",
                ].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px]"
                    onClick={() => setPrompt((p) => (p ? p + ", " : "") + s.toLowerCase())}
                    type="button"
                  >
                    + {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/40">
              <p className="text-[11px] text-muted-foreground">
                Das Originalbild wird nach erfolgreicher Generierung <strong>ersetzt</strong>.
              </p>
              <Button onClick={handleGenerate} disabled={busy || !selected || selectedIsVideo || !prompt.trim()} size="lg">
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Bild bearbeiten
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </HeidehofAdminLayout>
  );
}
