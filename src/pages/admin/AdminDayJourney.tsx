import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Upload,
  ArrowUp,
  ArrowDown,
  ImageIcon,
  Film,
  Trash2,
  Plus,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import type { DayJourneyStep } from "@/hooks/useDayJourney";

const BUCKET = "site-content";
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_IMAGE = 10 * 1024 * 1024;

type Slot = "media" | "video" | "video_webm" | "poster" | "mobile";

const AdminDayJourney = () => {
  const [items, setItems] = useState<DayJourneyStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("day_journey_steps" as never)
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as unknown as DayJourneyStep[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (id: string, patch: Partial<DayJourneyStep>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    const { error } = await supabase
      .from("day_journey_steps" as never)
      .update(patch as never)
      .eq("id", id);
    if (error) toast.error(error.message);
  };

  const uploadFile = async (item: DayJourneyStep, file: File, slot: Slot) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (slot === "poster" && !isImage) {
      toast.error("Poster muss ein Bild sein");
      return;
    }
    if ((slot === "video" || slot === "video_webm") && !isVideo) {
      toast.error("Bitte eine Videodatei wählen");
      return;
    }
    if (!isVideo && !isImage) {
      toast.error("Nur Bild oder Video erlaubt");
      return;
    }
    const limit = isVideo ? MAX_VIDEO : MAX_IMAGE;
    if (file.size > limit) {
      toast.error(`Maximal ${Math.round(limit / (1024 * 1024))} MB`);
      return;
    }
    setBusy(`${item.id}:${slot}`);
    try {
      const ext = file.name.split(".").pop() || (isVideo ? "mp4" : "jpg");
      const path = `day-journey/${item.slug}-${slot}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = pub.publicUrl;
      const patch: Partial<DayJourneyStep> = {};
      if (slot === "media") {
        patch.media_type = isVideo ? "video" : "image";
        patch.media_url = url;
      } else if (slot === "video") {
        patch.video_url = url;
      } else if (slot === "video_webm") {
        patch.video_webm_url = url;
      } else if (slot === "poster") {
        patch.poster_url = url;
      } else if (slot === "mobile") {
        patch.mobile_media_url = url;
        patch.mobile_media_type = isVideo ? "video" : "image";
      }
      await update(item.id, patch);
      toast.success("Aktualisiert");
    } finally {
      setBusy(null);
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i.id === id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
    const a = items[idx];
    const b = items[swapIdx];
    await Promise.all([
      supabase.from("day_journey_steps" as never).update({ sort_order: b.sort_order } as never).eq("id", a.id),
      supabase.from("day_journey_steps" as never).update({ sort_order: a.sort_order } as never).eq("id", b.id),
    ]);
    await load();
  };

  const addStep = async () => {
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), 0);
    const slug = `kapitel-${Date.now()}`;
    const { error } = await supabase.from("day_journey_steps" as never).insert({
      slug,
      sort_order: maxOrder + 1,
      icon: "MapPin",
      eyebrow: "NEUES KAPITEL",
      title: "Neues Kapitel",
      body: "",
      story_md: "",
      media_type: "image",
    } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Kapitel angelegt");
      await load();
    }
  };

  const duplicateStep = async (item: DayJourneyStep) => {
    const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), 0);
    const { id, created_at, updated_at, ...rest } = item as unknown as Record<string, unknown>;
    void id;
    void created_at;
    void updated_at;
    const { error } = await supabase.from("day_journey_steps" as never).insert({
      ...rest,
      slug: `${item.slug}-copy-${Date.now()}`,
      sort_order: maxOrder + 1,
    } as never);
    if (error) toast.error(error.message);
    else {
      toast.success("Dupliziert");
      await load();
    }
  };

  const removeStep = async (item: DayJourneyStep) => {
    if (!confirm(`Kapitel "${item.title}" wirklich löschen?`)) return;
    const { error } = await supabase.from("day_journey_steps" as never).delete().eq("id", item.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Gelöscht");
      await load();
    }
  };

  const triggerUpload = (item: DayJourneyStep, slot: Slot, accept: string) => {
    const key = `${item.id}:${slot}`;
    let input = fileInputs.current[key];
    if (!input) {
      input = document.createElement("input");
      input.type = "file";
      input.accept = accept;
      input.style.display = "none";
      document.body.appendChild(input);
      fileInputs.current[key] = input;
    }
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) void uploadFile(item, f, slot);
      (e.target as HTMLInputElement).value = "";
    };
    input.click();
  };

  return (
    <HeidehofAdminLayout title="Ein Tag bei uns – Cinema Steps">
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-wrap items-start gap-4 justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold/70">Cinema-Reise</p>
            <p className="font-serif text-2xl mt-1">
              {items.length} Kapitel · Hintergrund-Video oder Bild pro Kapitel
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Sichtbar auf{" "}
              <a href="/ein-tag-bei-uns" target="_blank" rel="noreferrer" className="underline text-gold">
                /ein-tag-bei-uns
              </a>
              . Empfohlen für Hero-Videos: <strong>1920×1080, MP4 H.264, 6–12 s Loop, ohne Ton, &lt; 8 MB</strong>.
              Optional zusätzlich WebM für moderne Browser und ein leichteres Mobile-Medium.
            </p>
          </div>
          <Button onClick={addStep} className="bg-gold-dark hover:bg-gold-dark/90 text-white">
            <Plus className="w-4 h-4 mr-2" /> Kapitel hinzufügen
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Lädt …
          </div>
        ) : (
          <div className="space-y-5">
            {items.map((item, idx) => {
              const previewIsVideo = !!item.video_url || item.media_type === "video";
              const previewUrl = item.video_url || item.media_url;
              const previewPoster = item.poster_url || item.media_url || undefined;
              return (
                <Card key={item.id} className={`p-5 bg-card/60 ${item.is_active ? "" : "opacity-60"}`}>
                  <div className="grid lg:grid-cols-12 gap-5">
                    {/* Live preview */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="relative aspect-video bg-muted rounded-md overflow-hidden border border-border/60">
                        {previewUrl ? (
                          previewIsVideo ? (
                            <video
                              key={previewUrl}
                              src={previewUrl}
                              poster={previewPoster}
                              muted
                              loop
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                              style={{ objectPosition: item.object_position || "center" }}
                            />
                          ) : (
                            <img
                              src={previewUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              style={{ objectPosition: item.object_position || "center" }}
                            />
                          )
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                            Kein Medium
                          </div>
                        )}
                        {/* Overlay preview like front-end */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20 pointer-events-none" />
                        <div className="absolute inset-0 p-4 flex flex-col justify-end pointer-events-none">
                          <p className="text-[9px] tracking-[0.3em] uppercase text-gold/90">{item.eyebrow}</p>
                          <p className="font-serif text-white text-lg leading-tight line-clamp-2 mt-1">{item.title}</p>
                        </div>
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-background/80 text-[10px] tracking-widest uppercase flex items-center gap-1">
                          {previewIsVideo ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          {previewIsVideo ? "video" : "image"}
                        </div>
                      </div>

                      {/* Upload slots */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerUpload(item, "video", "video/*")}
                          disabled={busy === `${item.id}:video`}
                        >
                          {busy === `${item.id}:video` ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Film className="w-4 h-4 mr-2" />
                          )}
                          MP4-Video
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerUpload(item, "video_webm", "video/webm")}
                          disabled={busy === `${item.id}:video_webm`}
                        >
                          {busy === `${item.id}:video_webm` ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Film className="w-4 h-4 mr-2" />
                          )}
                          WebM (optional)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerUpload(item, "poster", "image/*")}
                          disabled={busy === `${item.id}:poster`}
                        >
                          {busy === `${item.id}:poster` ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4 mr-2" />
                          )}
                          Poster-Bild
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerUpload(item, "media", "image/*,video/*")}
                          disabled={busy === `${item.id}:media`}
                        >
                          {busy === `${item.id}:media` ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Fallback (Bild/Video)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="col-span-2"
                          onClick={() => triggerUpload(item, "mobile", "image/*,video/*")}
                          disabled={busy === `${item.id}:mobile`}
                        >
                          {busy === `${item.id}:mobile` ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Mobile-Medium (optional)
                        </Button>
                      </div>

                      {/* URL hints */}
                      <div className="text-[10px] text-muted-foreground space-y-0.5 break-all">
                        {item.video_url && <div>🎬 {item.video_url.split("/").pop()}</div>}
                        {item.video_webm_url && <div>🎬 webm: {item.video_webm_url.split("/").pop()}</div>}
                        {item.poster_url && <div>🖼 poster: {item.poster_url.split("/").pop()}</div>}
                        {item.mobile_media_url && <div>📱 {item.mobile_media_url.split("/").pop()}</div>}
                      </div>
                    </div>

                    {/* Edit fields */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground w-10">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <Input
                          value={item.slug}
                          onChange={(e) =>
                            setItems((p) => p.map((x) => (x.id === item.id ? { ...x, slug: e.target.value } : x)))
                          }
                          onBlur={(e) => update(item.id, { slug: e.target.value.trim() })}
                          className="font-mono text-xs uppercase w-40"
                        />
                        <Input
                          value={item.icon}
                          onChange={(e) =>
                            setItems((p) => p.map((x) => (x.id === item.id ? { ...x, icon: e.target.value } : x)))
                          }
                          onBlur={(e) => update(item.id, { icon: e.target.value.trim() })}
                          placeholder="Icon (MapPin, Monitor, Coffee, Waves, Utensils, Dumbbell)"
                          className="text-xs flex-1 min-w-[160px]"
                        />
                        <label className="flex items-center gap-2 text-xs whitespace-nowrap">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={(v) => update(item.id, { is_active: v })}
                          />
                          {item.is_active ? "Aktiv" : "Versteckt"}
                        </label>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" disabled={idx === 0} onClick={() => move(item.id, -1)}>
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={idx === items.length - 1}
                            onClick={() => move(item.id, 1)}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => duplicateStep(item)} title="Duplizieren">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(item)}
                            title="Löschen"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Input
                        value={item.eyebrow}
                        onChange={(e) =>
                          setItems((p) => p.map((x) => (x.id === item.id ? { ...x, eyebrow: e.target.value } : x)))
                        }
                        onBlur={(e) => update(item.id, { eyebrow: e.target.value })}
                        placeholder="Eyebrow (z. B. IHR TAG · 01 · ANKOMMEN)"
                        className="text-xs uppercase tracking-widest"
                      />
                      <Input
                        value={item.title}
                        onChange={(e) =>
                          setItems((p) => p.map((x) => (x.id === item.id ? { ...x, title: e.target.value } : x)))
                        }
                        onBlur={(e) => update(item.id, { title: e.target.value })}
                        placeholder="Hero-Titel"
                        className="font-serif text-lg"
                      />
                      <Textarea
                        value={item.body}
                        onChange={(e) =>
                          setItems((p) => p.map((x) => (x.id === item.id ? { ...x, body: e.target.value } : x)))
                        }
                        onBlur={(e) => update(item.id, { body: e.target.value })}
                        placeholder="Kurzer Hero-Text (2 Sätze)"
                        rows={2}
                        className="text-sm"
                      />
                      <Textarea
                        value={item.story_md}
                        onChange={(e) =>
                          setItems((p) => p.map((x) => (x.id === item.id ? { ...x, story_md: e.target.value } : x)))
                        }
                        onBlur={(e) => update(item.id, { story_md: e.target.value })}
                        placeholder="Lange Story unter dem Hero"
                        rows={3}
                        className="text-sm"
                      />

                      {/* Video settings */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/40">
                        <label className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Auto-Advance (s)
                          </span>
                          <Input
                            type="number"
                            min={2}
                            max={60}
                            value={item.autoplay_seconds ?? 9}
                            onChange={(e) =>
                              setItems((p) =>
                                p.map((x) =>
                                  x.id === item.id ? { ...x, autoplay_seconds: Number(e.target.value) } : x,
                                ),
                              )
                            }
                            onBlur={(e) =>
                              update(item.id, {
                                autoplay_seconds: Math.max(2, Math.min(60, Number(e.target.value) || 9)),
                              })
                            }
                            className="h-8 text-sm"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Object-Position
                          </span>
                          <Input
                            value={item.object_position ?? "center"}
                            onChange={(e) =>
                              setItems((p) =>
                                p.map((x) => (x.id === item.id ? { ...x, object_position: e.target.value } : x)),
                              )
                            }
                            onBlur={(e) => update(item.id, { object_position: e.target.value.trim() || "center" })}
                            placeholder="center | top | 50% 30%"
                            className="h-8 text-sm"
                          />
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                          <Switch
                            checked={item.loop ?? true}
                            onCheckedChange={(v) => update(item.id, { loop: v })}
                          />
                          Video-Loop
                        </label>
                        <label className="flex items-center gap-2 text-xs">
                          <Switch
                            checked={item.muted ?? true}
                            onCheckedChange={(v) => update(item.id, { muted: v })}
                          />
                          Stumm
                        </label>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </HeidehofAdminLayout>
  );
};

export default AdminDayJourney;
