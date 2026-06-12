import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ImageIcon, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export type GalleryItem = {
  slug: string;        // folder name in bucket
  path: string;        // full storage path
  url: string;         // public url
  name: string;        // file name
  isVideo: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (item: GalleryItem) => void;
  targetSlug: string;
}

export default function SiteImageGalleryPicker({ open, onClose, onPick, targetSlug }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all: GalleryItem[] = [];

      // 1) site-images bucket (admin uploads, per slot folder)
      const { data: folders, error } = await supabase.storage
        .from("site-images")
        .list("", { limit: 500, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      for (const f of folders ?? []) {
        if (!f.name || f.name.startsWith(".")) continue;
        const { data: files } = await supabase.storage
          .from("site-images")
          .list(f.name, { limit: 500, sortBy: { column: "created_at", order: "desc" } });
        for (const file of files ?? []) {
          if (!file.name || file.name.startsWith(".")) continue;
          const path = `${f.name}/${file.name}`;
          const { data: pub } = supabase.storage.from("site-images").getPublicUrl(path);
          const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(file.name);
          all.push({ slug: f.name, path, url: pub.publicUrl, name: file.name, isVideo });
        }
      }

      // 2) clara_media DB entries (so admin can pick any image that was already imported)
      const { data: claraRows } = await supabase
        .from("clara_media")
        .select("id,title,category,url,storage_path,media_type")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(2000);
      for (const row of claraRows ?? []) {
        if (!row?.url) continue;
        const slug = `clara · ${row.category ?? "general"}`;
        const name = row.title || row.storage_path?.split("/").pop() || `${row.id}`;
        const isVideo = row.media_type === "video";
        // dedupe with bucket listing
        if (all.some((x) => x.url === row.url)) continue;
        all.push({ slug, path: row.storage_path || row.url, url: row.url, name, isVideo });
      }

      setItems(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (open) load(); }, [open, load]);

  const filtered = items.filter((it) =>
    !filter || it.slug.toLowerCase().includes(filter.toLowerCase()) || it.name.toLowerCase().includes(filter.toLowerCase())
  );
  const sameSlug = filtered.filter((i) => i.slug === targetSlug);
  const others = filtered.filter((i) => i.slug !== targetSlug);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Aus Galerie wählen</DialogTitle>
          <DialogDescription>
            Wähle ein bereits hochgeladenes Bild oder Video aus dem Speicher. Klick auf eine Kachel übernimmt sie für die aktuelle Position.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Filtern nach Bereich oder Dateiname…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <div className="overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Galerie lädt…
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              Noch keine Dateien im Speicher.
            </div>
          ) : (
            <div className="space-y-6">
              {sameSlug.length > 0 && (
                <Section title={`Aktuelle Position · ${targetSlug}`} items={sameSlug} onPick={onPick} highlight />
              )}
              {others.length > 0 && (
                <Section title="Weitere Bereiche" items={others} onPick={onPick} />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title, items, onPick, highlight,
}: { title: string; items: GalleryItem[]; onPick: (i: GalleryItem) => void; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-gold/80 mb-2">{title}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {items.map((it) => (
          <button
            key={it.path}
            onClick={() => onPick(it)}
            className={`group relative aspect-square rounded-lg overflow-hidden border bg-muted hover:border-gold transition ${highlight ? "border-zinc-500/60" : "border-border/60"}`}
            title={it.path}
          >
            {it.isVideo ? (
              <video src={it.url} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <img src={it.url} alt={it.name} className="w-full h-full object-cover" loading="lazy" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-xs text-white">
              <div className="truncate font-medium">{it.slug}</div>
              <div className="truncate opacity-70">{it.name}</div>
            </div>
            <div className="absolute inset-0 bg-zinc-500/0 group-hover:bg-zinc-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <Check className="w-6 h-6 text-white drop-shadow" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
