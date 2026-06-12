import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Save, Upload, Trash2, FileText, Search, History, Undo2,
  Image as ImageIcon, Loader2, Sparkles, ExternalLink, Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ============== PAGE / SECTION DEFINITIONS ==============
type FieldType = "text" | "textarea";
interface Field { key: string; label: string; type: FieldType; hint?: string; placeholder?: string }
interface MediaField { key: string; label: string; hint?: string; accept?: string }
interface SectionDef {
  key: string; label: string; description?: string;
  fields: Field[]; media: MediaField[];
}
interface PageDef {
  page: string; route: string; label: string;
  sections: SectionDef[];
  hasSeo?: boolean;
}

const PAGES: PageDef[] = [
  {
    page: "landing", route: "/", label: "Startseite", hasSeo: true,
    sections: [{
      key: "hero", label: "Hero", description: "Der erste Eindruck der Startseite",
      fields: [
        { key: "hero_eyebrow", label: "Kleine Zeile oben", type: "text", placeholder: "z. B. CONFERENCE & SPA RESORT" },
        { key: "hero_title_line1", label: "Titel · Zeile 1", type: "text" },
        { key: "hero_title_line2", label: "Titel · Zeile 2", type: "text" },
        { key: "hero_title_accent", label: "Akzent (kursiv)", type: "text" },
        { key: "hero_subtitle", label: "Untertitel", type: "textarea" },
      ],
      media: [{ key: "hero_image", label: "Hero-Bild oder -Video", accept: "image/*,video/*" }],
    }],
  },
  {
    page: "tagungsraeume", route: "/tagungsraeume", label: "Tagungsräume", hasSeo: true,
    sections: [{
      key: "hero", label: "Hero",
      fields: [
        { key: "hero_title", label: "Seitentitel", type: "text" },
        { key: "hero_subtitle", label: "Untertitel", type: "textarea" },
      ],
      media: [{ key: "hero_image", label: "Hero-Bild" }],
    }],
  },
  {
    page: "tagungspauschalen", route: "/tagungspauschalen", label: "Tagungspauschalen", hasSeo: true,
    sections: [{
      key: "hero", label: "Hero",
      fields: [
        { key: "hero_title", label: "Seitentitel", type: "text" },
        { key: "hero_subtitle", label: "Untertitel", type: "textarea" },
      ],
      media: [{ key: "hero_image", label: "Hero-Bild" }],
    }],
  },
  {
    page: "ausstattung", route: "/ausstattung-technik", label: "Ausstattung & Technik", hasSeo: true,
    sections: [{
      key: "hero", label: "Hero",
      fields: [
        { key: "hero_title", label: "Seitentitel", type: "text" },
        { key: "hero_subtitle", label: "Untertitel", type: "textarea" },
      ],
      media: [{ key: "hero_image", label: "Hero-Bild" }],
    }],
  },
  {
    page: "outdoor", route: "/outdoor-aktiv", label: "Outdoor & Aktiv", hasSeo: true,
    sections: [{
      key: "hero", label: "Hero",
      fields: [
        { key: "hero_title", label: "Seitentitel", type: "text" },
        { key: "hero_subtitle", label: "Untertitel", type: "textarea" },
      ],
      media: [{ key: "hero_image", label: "Hero-Bild" }],
    }],
  },
  {
    page: "wellness", route: "/wellness", label: "Wellness", hasSeo: true,
    sections: [{
      key: "hero", label: "Hero",
      fields: [
        { key: "hero_title", label: "Seitentitel", type: "text" },
        { key: "hero_subtitle", label: "Untertitel", type: "textarea" },
      ],
      media: [{ key: "hero_image", label: "Hero-Bild" }],
    }],
  },
  {
    page: "spa", route: "/spa", label: "Oriental Spa", hasSeo: true,
    sections: [{
      key: "hero", label: "Hero",
      fields: [
        { key: "hero_title", label: "Seitentitel", type: "text" },
        { key: "hero_subtitle", label: "Untertitel", type: "textarea" },
      ],
      media: [{ key: "hero_image", label: "Hero-Bild" }],
    }],
  },
  {
    page: "anfrage", route: "/tagungsraeume", label: "Anfrage / Clara", hasSeo: true,
    sections: [{
      key: "hero", label: "Hero & Fallback",
      fields: [
        { key: "hero_title", label: "Titel über Clara", type: "text" },
        { key: "hero_subtitle", label: "Untertitel", type: "textarea" },
      ],
      media: [{
        key: "iframe_fallback", label: "Fallback Bild oder Video",
        hint: "Wird angezeigt, wenn die Heidehof-Webseite den iframe blockiert.",
        accept: "image/*,video/*",
      }],
    }],
  },
  {
    page: "impressum", route: "/impressum", label: "Impressum", hasSeo: true,
    sections: [{
      key: "content", label: "Pflichtangaben",
      fields: [
        { key: "anbieter", label: "Anbieter", type: "textarea" },
        { key: "kontakt", label: "Kontakt", type: "textarea" },
        { key: "geschaeftsfuehrung", label: "Geschäftsführung", type: "textarea" },
        { key: "registergericht", label: "Registergericht", type: "textarea" },
        { key: "ust_id", label: "USt-IdNr.", type: "text" },
      ],
      media: [],
    }],
  },
  {
    page: "datenschutz", route: "/datenschutz", label: "Datenschutz", hasSeo: true,
    sections: [{
      key: "content", label: "Datenschutzerklärung",
      fields: [{ key: "verantwortlicher", label: "Verantwortlicher", type: "textarea" }],
      media: [],
    }],
  },
];

interface SeoState {
  title: string; description: string; keywords: string; og_image_url: string; noindex: boolean;
}
const emptySeo = (): SeoState => ({ title: "", description: "", keywords: "", og_image_url: "", noindex: false });

const isVideoUrl = (u: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);
const sectionDomId = (page: string, section: string) => `sec-${page}-${section}`;
const pageDomId = (page: string) => `page-${page}`;

// ============== MAIN COMPONENT ==============

export default function AdminInhalte() {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string>(pageDomId("landing"));

  // Per-page state, keyed by page slug
  const [texts, setTexts] = useState<Record<string, Record<string, string>>>({});
  const [savedTexts, setSavedTexts] = useState<Record<string, Record<string, string>>>({});
  const [media, setMedia] = useState<Record<string, Record<string, { url: string; storage_path: string | null; alt: string | null }>>>({});
  const [seo, setSeo] = useState<Record<string, SeoState>>({});
  const [savedSeo, setSavedSeo] = useState<Record<string, SeoState>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState<{ page: string; section_key: string } | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; value_de: string; created_at: string }>>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ============== INITIAL LOAD (all pages once) ==============
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [tRes, mRes, sRes] = await Promise.all([
      supabase.from("site_content").select("page,section_key,value_de"),
      supabase.from("site_media").select("page,section_key,url,storage_path,alt"),
      supabase.from("site_seo").select("*"),
    ]);
    const tx: Record<string, Record<string, string>> = {};
    (tRes.data ?? []).forEach((r) => {
      (tx[r.page] ??= {})[r.section_key] = r.value_de ?? "";
    });
    const mx: Record<string, Record<string, { url: string; storage_path: string | null; alt: string | null }>> = {};
    (mRes.data ?? []).forEach((r) => {
      (mx[r.page] ??= {})[r.section_key] = { url: r.url, storage_path: r.storage_path, alt: r.alt };
    });
    const sx: Record<string, SeoState> = {};
    (sRes.data ?? []).forEach((r) => {
      sx[r.route] = {
        title: r.title ?? "", description: r.description ?? "",
        keywords: r.keywords ?? "", og_image_url: r.og_image_url ?? "",
        noindex: r.noindex ?? false,
      };
    });
    setTexts(tx);
    setSavedTexts(JSON.parse(JSON.stringify(tx)));
    setMedia(mx);
    setSeo(sx);
    setSavedSeo(JSON.parse(JSON.stringify(sx)));
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ============== DIRTY ==============
  const dirty = useMemo(() => {
    if (JSON.stringify(texts) !== JSON.stringify(savedTexts)) return true;
    if (JSON.stringify(seo) !== JSON.stringify(savedSeo)) return true;
    return false;
  }, [texts, savedTexts, seo, savedSeo]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ============== ACTIVE SECTION TRACKING ==============
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { root, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    root.querySelectorAll("[data-jump]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [loading]);

  // ============== FILTER ==============
  const filteredPages = useMemo(() => {
    if (!search) return PAGES;
    const q = search.toLowerCase();
    return PAGES.filter((p) => p.label.toLowerCase().includes(q) ||
      p.sections.some((s) => s.label.toLowerCase().includes(q)));
  }, [search]);

  // ============== HELPERS ==============
  const setText = (page: string, key: string, value: string) =>
    setTexts((s) => ({ ...s, [page]: { ...(s[page] ?? {}), [key]: value } }));

  const setSeoField = (route: string, patch: Partial<SeoState>) =>
    setSeo((s) => ({ ...s, [route]: { ...(s[route] ?? emptySeo()), ...patch } }));

  // ============== SAVE ALL ==============
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Build text upserts only for changed rows
      const textRows: { page: string; section_key: string; value_de: string }[] = [];
      for (const [page, fields] of Object.entries(texts)) {
        for (const [section_key, value_de] of Object.entries(fields)) {
          if ((savedTexts[page]?.[section_key] ?? "") !== value_de) {
            textRows.push({ page, section_key, value_de });
          }
        }
      }
      if (textRows.length) {
        const { error } = await supabase.from("site_content")
          .upsert(textRows, { onConflict: "page,section_key" });
        if (error) throw error;
      }

      // SEO
      const seoRows: Array<{
        route: string; title: string | null; description: string | null;
        keywords: string | null; og_image_url: string | null; noindex: boolean;
      }> = [];
      for (const [route, s] of Object.entries(seo)) {
        if (JSON.stringify(s) !== JSON.stringify(savedSeo[route] ?? emptySeo())) {
          seoRows.push({
            route,
            title: s.title || null, description: s.description || null,
            keywords: s.keywords || null, og_image_url: s.og_image_url || null,
            noindex: s.noindex,
          });
        }
      }
      if (seoRows.length) {
        const { error } = await supabase.from("site_seo")
          .upsert(seoRows, { onConflict: "route" });
        if (error) throw error;
      }

      setSavedTexts(JSON.parse(JSON.stringify(texts)));
      setSavedSeo(JSON.parse(JSON.stringify(seo)));
      toast.success(`${textRows.length + seoRows.length} Änderung(en) gespeichert`, {
        description: "Live in wenigen Sekunden auf der Webseite.",
      });
    } catch (e: unknown) {
      toast.error("Speichern fehlgeschlagen", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardAll = () => {
    setTexts(JSON.parse(JSON.stringify(savedTexts)));
    setSeo(JSON.parse(JSON.stringify(savedSeo)));
    toast("Alle Änderungen verworfen");
  };

  // ============== MEDIA UPLOAD ==============
  const uploadMedia = async (page: string, m: MediaField, file: File) => {
    const uploadId = `${page}:${m.key}`;
    setUploadingKey(uploadId);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${page}/${m.key}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-content").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-content").getPublicUrl(path);
      const url = pub.publicUrl;
      const old = media[page]?.[m.key];
      if (old?.storage_path) {
        await supabase.storage.from("site-content").remove([old.storage_path]).catch(() => {});
      }
      const { error: dbErr } = await supabase.from("site_media")
        .upsert({ page, section_key: m.key, url, storage_path: path, alt: m.label }, { onConflict: "page,section_key" });
      if (dbErr) throw dbErr;
      setMedia((s) => ({ ...s, [page]: { ...(s[page] ?? {}), [m.key]: { url, storage_path: path, alt: m.label } } }));
      toast.success("Medium hochgeladen");
    } catch (e: unknown) {
      toast.error("Upload fehlgeschlagen", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setUploadingKey(null);
    }
  };

  const removeMedia = async (page: string, m: MediaField) => {
    const cur = media[page]?.[m.key];
    if (!cur) return;
    if (cur.storage_path) {
      await supabase.storage.from("site-content").remove([cur.storage_path]).catch(() => {});
    }
    await supabase.from("site_media").delete().eq("page", page).eq("section_key", m.key);
    setMedia((s) => {
      const next = { ...s };
      const pageMedia = { ...(next[page] ?? {}) };
      delete pageMedia[m.key];
      next[page] = pageMedia;
      return next;
    });
    toast("Medium entfernt");
  };

  // ============== HISTORY ==============
  const openHistory = async (page: string, section_key: string) => {
    setHistoryKey({ page, section_key });
    setHistoryOpen(true);
    const { data } = await supabase.from("site_content_history")
      .select("id,value_de,created_at")
      .eq("page", page).eq("section_key", section_key)
      .order("created_at", { ascending: false }).limit(20);
    setHistory(data ?? []);
  };

  const restoreHistory = (value: string) => {
    if (!historyKey) return;
    setText(historyKey.page, historyKey.section_key, value);
    setHistoryOpen(false);
    toast("Vorherige Version geladen — bitte oben speichern");
  };

  // ============== SCROLL TO ==============
  const jumpTo = (id: string) => {
    const el = scrollRef.current?.querySelector(`#${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Per-page dirty count for the nav badge
  const isPageDirty = (page: string) => {
    const tDirty = JSON.stringify(texts[page] ?? {}) !== JSON.stringify(savedTexts[page] ?? {});
    const route = PAGES.find((p) => p.page === page)?.route;
    const sDirty = route ? JSON.stringify(seo[route] ?? emptySeo()) !== JSON.stringify(savedSeo[route] ?? emptySeo()) : false;
    return tDirty || sDirty;
  };

  return (
    <HeidehofAdminLayout title="Inhalte & SEO Studio · Onepage">
      <div className="flex flex-col xl:flex-row h-[calc(100vh-9rem)]">

        {/* LEFT: Sticky Sprung-Navigation */}
        <aside className="w-full xl:w-72 border-r border-border bg-card/40 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Seite oder Sektion suchen…"
                className="pl-9 h-9 bg-background"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {filteredPages.map((p) => {
              const pDirty = isPageDirty(p.page);
              return (
                <div key={p.page} className="mb-2">
                  <button
                    onClick={() => jumpTo(pageDomId(p.page))}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all",
                      activeId.startsWith(`page-${p.page}`) || activeId.startsWith(`sec-${p.page}-`)
                        ? "bg-apple-surface text-apple-deep"
                        : "text-foreground hover:bg-[hsl(var(--apple)/0.06)]"
                    )}
                  >
                    <span className="truncate">{p.label}</span>
                    {pDirty && <span className="w-1.5 h-1.5 rounded-full bg-apple apple-pulse" />}
                  </button>
                  <div className="ml-3 mt-1 space-y-0.5 border-l border-[hsl(var(--apple)/0.18)] pl-2">
                    {p.sections.map((sec) => {
                      const id = sectionDomId(p.page, sec.key);
                      return (
                        <button
                          key={sec.key}
                          onClick={() => jumpTo(id)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 rounded text-xs transition-colors",
                            activeId === id ? "bg-[hsl(var(--apple)/0.1)] text-apple-deep" : "text-muted-foreground hover:text-apple"
                          )}
                        >
                          {sec.label}
                        </button>
                      );
                    })}
                    {p.hasSeo && (
                      <button
                        onClick={() => jumpTo(`seo-${p.page}`)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1.5",
                          activeId === `seo-${p.page}` ? "bg-[hsl(var(--apple)/0.1)] text-apple-deep" : "text-muted-foreground hover:text-apple"
                        )}
                      >
                        <Sparkles className="w-3 h-3" /> SEO
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER: Onepage Editor */}
        <section className="flex-1 flex flex-col min-w-0">
          {/* Sticky Toolbar */}
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-apple shrink-0" />
              <h2 className="text-sm font-medium truncate">Onepage CMS</h2>
              {dirty && <Badge className="bg-apple text-white text-xs ml-2">ungespeicherte Änderungen</Badge>}
            </div>
            <div className="flex items-center gap-2">
              {dirty && (
                <Button size="sm" variant="ghost" onClick={handleDiscardAll}>Verwerfen</Button>
              )}
              <Button size="sm" variant="apple" onClick={handleSaveAll} disabled={saving || !dirty}>
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Alle Änderungen speichern
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 space-y-3">
                <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
                <div className="h-24 bg-muted rounded animate-pulse" />
                <div className="h-24 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-12">
                {PAGES.map((p) => (
                  <div key={p.page} id={pageDomId(p.page)} data-jump className="scroll-mt-20">
                    {/* Page header */}
                    <div className="flex items-center justify-between border-b-2 border-[hsl(var(--apple)/0.4)] pb-3 mb-6">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-apple">Seite</p>
                        <h2 className="font-serif text-3xl text-foreground mt-1">{p.label}</h2>
                        <p className="text-xs text-muted-foreground mt-1">{p.route}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => window.open(p.route, "_blank")}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Live
                      </Button>
                    </div>

                    {/* Sections */}
                    {p.sections.map((sec) => (
                      <Card key={sec.key} id={sectionDomId(p.page, sec.key)} data-jump className="p-5 mb-6 scroll-mt-20 border-[hsl(var(--apple)/0.18)]">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium text-foreground">{sec.label}</h3>
                            {sec.description && <p className="text-xs text-muted-foreground mt-0.5">{sec.description}</p>}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {sec.fields.map((f) => (
                            <div key={f.key} className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">{f.label}</Label>
                                <button
                                  onClick={() => openHistory(p.page, f.key)}
                                  className="text-xs text-muted-foreground hover:text-apple flex items-center gap-1"
                                >
                                  <History className="w-3 h-3" /> Verlauf
                                </button>
                              </div>
                              {f.type === "textarea" ? (
                                <Textarea
                                  value={texts[p.page]?.[f.key] ?? ""}
                                  onChange={(e) => setText(p.page, f.key, e.target.value)}
                                  placeholder={f.placeholder}
                                  rows={3}
                                  className="bg-background"
                                />
                              ) : (
                                <Input
                                  value={texts[p.page]?.[f.key] ?? ""}
                                  onChange={(e) => setText(p.page, f.key, e.target.value)}
                                  placeholder={f.placeholder}
                                  className="bg-background"
                                />
                              )}
                              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                            </div>
                          ))}

                          {sec.media.length > 0 && (
                            <div className="pt-3 border-t border-border space-y-3">
                              <h4 className="text-xs uppercase tracking-wider text-apple font-semibold">Medien</h4>
                              {sec.media.map((m) => {
                                const cur = media[p.page]?.[m.key];
                                const isUploading = uploadingKey === `${p.page}:${m.key}`;
                                return (
                                  <div key={m.key} className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border border-border">
                                    <div className="w-24 h-20 rounded bg-background overflow-hidden flex items-center justify-center shrink-0 border border-border">
                                      {cur?.url ? (
                                        isVideoUrl(cur.url) ? (
                                          <video src={cur.url} className="w-full h-full object-cover" muted />
                                        ) : (
                                          <img src={cur.url} alt={cur.alt ?? ""} className="w-full h-full object-cover" />
                                        )
                                      ) : (
                                        <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium">{m.label}</p>
                                      {m.hint && <p className="text-xs text-muted-foreground">{m.hint}</p>}
                                      <div className="flex gap-2 mt-2">
                                        <label className="cursor-pointer">
                                          <input
                                            type="file" accept={m.accept ?? "image/*"} className="hidden"
                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMedia(p.page, m, f); e.currentTarget.value = ""; }}
                                          />
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-background/40 backdrop-blur border border-border/60 text-foreground hover:bg-background/60 hover:border-foreground/40 transition-colors">
                                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                            {cur ? "Ersetzen" : "Hochladen"}
                                          </span>
                                        </label>
                                        {cur && (
                                          <Button size="sm" variant="ghost" onClick={() => removeMedia(p.page, m)} className="text-destructive hover:text-destructive h-7 px-2">
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}

                    {p.hasSeo && (
                      <Card id={`seo-${p.page}`} data-jump className="p-5 mb-6 scroll-mt-20 border-[hsl(var(--apple)/0.18)]">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-4 h-4 text-apple" />
                          <h3 className="font-medium text-foreground">SEO & Sichtbarkeit</h3>
                        </div>
                        <SeoEditor
                          seo={seo[p.route] ?? emptySeo()}
                          setSeo={(patch) => setSeoField(p.route, patch)}
                          route={p.route}
                        />
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sticky save bar at bottom when dirty */}
          {dirty && !loading && (
            <div className="border-t border-border px-4 md:px-6 py-3 bg-apple-surface flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
              <div className="flex items-center gap-2 text-sm text-apple-deep">
                <span className="w-2 h-2 rounded-full bg-apple apple-pulse" />
                Du hast ungespeicherte Änderungen
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={handleDiscardAll}>Verwerfen</Button>
                <Button size="sm" variant="apple" onClick={handleSaveAll} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                  Alles speichern
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-full sm:w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="w-4 h-4 text-apple" /> Versionsverlauf
            </SheetTitle>
            <p className="text-xs text-muted-foreground">{historyKey?.page} / {historyKey?.section_key}</p>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Noch keine früheren Versionen.</p>
            ) : history.map((h) => (
              <Card key={h.id} className="p-3 border-[hsl(var(--apple)/0.18)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("de-DE")}</span>
                  <Button size="sm" variant="ghost" onClick={() => restoreHistory(h.value_de)} className="h-7 text-xs">
                    <Undo2 className="w-3 h-3 mr-1" /> Wiederherstellen
                  </Button>
                </div>
                <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-4">{h.value_de || <em className="text-muted-foreground">leer</em>}</p>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </HeidehofAdminLayout>
  );
}

// ============== SEO EDITOR ==============
function SeoEditor({ seo, setSeo, route }: { seo: SeoState; setSeo: (patch: Partial<SeoState>) => void; route: string }) {
  const titleLen = seo.title.length;
  const descLen = seo.description.length;
  const titleColor = titleLen === 0 ? "text-muted-foreground" : titleLen > 60 ? "text-destructive" : titleLen >= 40 ? "text-apple" : "text-amber-500";
  const descColor = descLen === 0 ? "text-muted-foreground" : descLen > 160 ? "text-destructive" : descLen >= 120 ? "text-apple" : "text-amber-500";

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-neutral-50 border-[hsl(var(--apple)/0.18)]">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Google-Vorschau</p>
        <p className="text-xs text-[#202124]">https://hotel-der-heidehof.de{route}</p>
        <h3 className="text-base text-[#1a0dab] hover:underline cursor-pointer leading-snug mt-1 truncate">
          {seo.title || "Seitentitel hier eingeben"}
        </h3>
        <p className="text-sm text-[#4d5156] line-clamp-2">
          {seo.description || "Meta-Beschreibung erscheint hier in der Google-Suche."}
        </p>
      </Card>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Seitentitel</Label>
          <span className={cn("text-xs", titleColor)}>{titleLen} / 60</span>
        </div>
        <Input value={seo.title} onChange={(e) => setSeo({ title: e.target.value })} className="bg-background" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Meta-Beschreibung</Label>
          <span className={cn("text-xs", descColor)}>{descLen} / 160</span>
        </div>
        <Textarea value={seo.description} onChange={(e) => setSeo({ description: e.target.value })} rows={3} className="bg-background" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Keywords (komma-getrennt)</Label>
        <Input value={seo.keywords} onChange={(e) => setSeo({ keywords: e.target.value })} className="bg-background" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">OG-Bild URL</Label>
        <Input value={seo.og_image_url} onChange={(e) => setSeo({ og_image_url: e.target.value })} placeholder="https://…" className="bg-background" />
      </div>

      <div className="flex items-center justify-between p-3 rounded-md border border-border">
        <div>
          <p className="text-sm font-medium">Suchmaschinen ausschließen</p>
          <p className="text-xs text-muted-foreground">Setzt noindex — Seite erscheint nicht bei Google.</p>
        </div>
        <Switch checked={seo.noindex} onCheckedChange={(v) => setSeo({ noindex: v })} />
      </div>
    </div>
  );
}
