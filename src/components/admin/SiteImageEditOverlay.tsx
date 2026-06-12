import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ImageIcon, X, ExternalLink, Upload, Loader2, CheckCircle2, Settings2 } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  getActiveSiteImageSlugs,
  subscribeActiveSiteImageSlugs,
} from "@/hooks/useSiteImageRegistry";
import { supabase } from "@/integrations/supabase/client";
import { refreshSiteImages, useSiteImagesState } from "@/hooks/useSiteImages";
import { toast } from "sonner";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"]);
const SUPPORTED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function readableUploadError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "");
  if (message.toLowerCase().includes("mime type")) {
    return "Dieses Format ist nicht erlaubt. Nutze JPG, PNG, WEBP, AVIF oder MP4/WebM/MOV.";
  }
  return message || "Upload fehlgeschlagen";
}

function getFileExtension(file: File, isVideo: boolean): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext) return ext;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/svg+xml") return "svg";
  if (file.type === "image/avif") return "avif";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";
  return isVideo ? "mp4" : "jpg";
}

/**
 * Admin-only floating panel. Lists every <SiteImage> slug currently rendered on
 * the page. Admin can upload an image/video DIRECTLY here without leaving the page —
 * the preview updates live (refreshSiteImages re-fetches the registry).
 */
export function SiteImageEditOverlay() {
  const isAdmin = useIsAdmin();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [slugs, setSlugs] = useState<string[]>([]);
  const { map } = useSiteImagesState();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!isAdmin) return;
    const update = () => setSlugs(getActiveSiteImageSlugs());
    update();
    const t = window.setInterval(update, 800);
    const unsub = subscribeActiveSiteImageSlugs(update);
    return () => {
      window.clearInterval(t);
      unsub();
    };
  }, [isAdmin, location.pathname]);

  async function uploadFor(slug: string, file: File) {
    const isVideo = SUPPORTED_VIDEO_TYPES.has(file.type);
    const isImage = SUPPORTED_IMAGE_TYPES.has(file.type);
    if (!isImage && !isVideo) {
      toast.error("Bitte JPG, PNG, WEBP, AVIF oder MP4/WebM/MOV hochladen");
      return;
    }
    const maxBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(isVideo ? "Max. 100 MB pro Video" : "Max. 10 MB pro Bild");
      return;
    }
    setBusySlug(slug);
    try {
      const ext = getFileExtension(file, isVideo);
      const path = `${slug}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("site-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("site-images").getPublicUrl(path);

      const { data: existingRow } = await supabase
        .from("site_images")
        .select("storage_path,alt,brightness")
        .eq("slug", slug)
        .maybeSingle();

      const mediaType = isVideo ? "video" : "image";

      const { error: upsertError } = await supabase.from("site_images").upsert({
        slug,
        url: pub.publicUrl,
        alt: existingRow?.alt ?? "",
        storage_path: path,
        brightness: existingRow?.brightness ?? 1.1,
        media_type: mediaType,
      });
      if (upsertError) throw upsertError;

      map[slug] = {
        url: pub.publicUrl,
        alt: existingRow?.alt ?? "",
        brightness: existingRow?.brightness ?? 1.1,
        media_type: mediaType,
      };

      if (existingRow?.storage_path && existingRow.storage_path !== path) {
        await supabase.storage.from("site-images").remove([existingRow.storage_path]);
      }

      await refreshSiteImages();
      toast.success(isVideo ? "Video aktualisiert" : "Bild aktualisiert");
      setJustDone(slug);
      window.setTimeout(() => setJustDone((s) => (s === slug ? null : s)), 2200);
    } catch (e: unknown) {
      toast.error(readableUploadError(e));
    } finally {
      setBusySlug(null);
    }
  }

  if (!isAdmin) return null;
  if (location.pathname.startsWith("/admin")) return null;
  if (slugs.length === 0) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-[9998] inline-flex items-center gap-2 rounded-full bg-zinc-600 hover:bg-zinc-500 text-white shadow-2xl shadow-zinc-900/40 px-4 py-2.5 text-xs font-semibold border border-zinc-400/40 backdrop-blur transition-colors print:hidden md:bottom-24"
          aria-label="Bildplätze dieser Seite bearbeiten"
        >
          <ImageIcon className="w-4 h-4" />
          Bildplätze ({slugs.length})
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 z-[9998] w-[min(360px,calc(100vw-2rem))] max-h-[80vh] flex flex-col rounded-2xl border border-zinc-500/30 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-zinc-900/40 text-white overflow-hidden md:bottom-24">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-600/15">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-300/80">Direkt-Upload</p>
              <p className="text-sm font-medium">Bildplätze auf dieser Seite</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white"
              aria-label="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-2 text-[11px] text-white/60 border-b border-white/5">
            Bild direkt hier hochladen – die Seite aktualisiert sich sofort.
          </div>

          <ul className="overflow-y-auto flex-1 divide-y divide-white/5">
            {slugs.map((slug) => {
              const entry = map[slug];
              const busy = busySlug === slug;
              const done = justDone === slug;
              return (
                <li key={slug} className="px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Thumb */}
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0 flex items-center justify-center">
                      {entry?.url && entry.media_type !== "video" ? (
                        <img src={entry.url} alt="" className="w-full h-full object-cover" />
                      ) : entry?.url && entry.media_type === "video" ? (
                        <video src={entry.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-white/30" />
                      )}
                    </div>
                    {/* Slug + actions */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-mono text-zinc-300 truncate">{slug}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input
                          ref={(el) => { fileRefs.current[slug] = el; }}
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadFor(slug, f);
                            e.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => fileRefs.current[slug]?.click()}
                          disabled={busy}
                          className="inline-flex items-center gap-1 rounded bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 text-white text-[10px] font-semibold px-2 py-1"
                        >
                          {busy ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : done ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          {busy ? "Lädt …" : done ? "Fertig" : "Hochladen"}
                        </button>
                        <a
                          href={`/admin/images?slug=${encodeURIComponent(slug)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-white/5 hover:bg-white/10 text-white/70 text-[10px] px-2 py-1"
                          title="Erweiterte Optionen (KI, Alt-Text, Helligkeit)"
                        >
                          <Settings2 className="w-3 h-3" />
                          Mehr
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <a
            href="/admin/images"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-center text-[11px] text-white/60 hover:text-white border-t border-white/10 hover:bg-white/5 inline-flex items-center justify-center gap-1"
          >
            Alle Bildplätze öffnen <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </>
  );
}

export default SiteImageEditOverlay;
