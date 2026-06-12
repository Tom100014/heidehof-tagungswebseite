import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { knowledgeSchema, validateOrError } from "@/utils/admin-validation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Download, Plus, Save, Search, Trash2, Upload, Loader2, BookOpen, Image as ImageIcon, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { buildKnowledgeDrafts } from "@/utils/clara-knowledge-import";

type Entry = {
  id: string;
  title: string;
  category: string;
  content: string;
  is_active: boolean;
  sort_order: number;
};

const CATEGORIES = ["raum", "pauschale", "technik", "spa", "restaurant", "outdoor", "general", "preise", "kontakt"];

export default function AdminKnowledge() {
  const [items, setItems] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [importingImages, setImportingImages] = useState(false);
  const [crawlerOpen, setCrawlerOpen] = useState(false);
  const [crawlMode, setCrawlMode] = useState<"default" | "full" | "url" | "manual">("default");
  const [crawlUrl, setCrawlUrl] = useState("https://www.der-heidehof.de/");
  const [crawlDepth, setCrawlDepth] = useState(1);
  const [crawlCategory, setCrawlCategory] = useState("general");
  const [crawlTriggers, setCrawlTriggers] = useState("");
  const [crawlTitlePrefix, setCrawlTitlePrefix] = useState("Bild");
  const [crawlManualUrls, setCrawlManualUrls] = useState("");

  const runCrawler = async () => {
    setImportingImages(true);
    try {
      let body: Record<string, unknown> = {};
      if (crawlMode === "full") {
        body = { mode: "full", url: "https://www.der-heidehof.de/", maxPages: 80, maxPerPage: 25 };
      } else if (crawlMode === "url") {
        body = {
          url: crawlUrl.trim(),
          depth: crawlDepth,
          category: crawlCategory,
          triggers: crawlTriggers.split(",").map(s => s.trim()).filter(Boolean),
          titlePrefix: crawlTitlePrefix,
        };
      } else if (crawlMode === "manual") {
        body = {
          urls: crawlManualUrls.split(/\s+/).map(s => s.trim()).filter(Boolean),
          category: crawlCategory,
          triggers: crawlTriggers.split(",").map(s => s.trim()).filter(Boolean),
          titlePrefix: crawlTitlePrefix,
        };
      }
      const { data, error } = await supabase.functions.invoke("clara-import-heidehof-images", { body });
      if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? "Fehler");
      toast.success(`${data.total_imported} Bilder importiert (${data.embedded_queued} werden indexiert)`);
      setCrawlerOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Import fehlgeschlagen");
    } finally {
      setImportingImages(false);
    }
  };


  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("clara_knowledge").select("*").order("sort_order");
    if (error) toast.error("Laden fehlgeschlagen");
    else setItems((data as Entry[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: Entry) => {
    const validation = validateOrError(knowledgeSchema, {
      title: e.title,
      category: e.category,
      content: e.content,
    });
    if (!validation.ok) {
      toast.error((validation as { ok: false; error: string }).error);
      return;
    }
    setSaving(e.id);
    const { error } = await supabase.from("clara_knowledge").update({
      title: e.title,
      category: e.category,
      content: e.content,
      is_active: e.is_active,
      sort_order: e.sort_order,
    }).eq("id", e.id);
    if (error) toast.error("Fehler: " + error.message);
    else toast.success("Gespeichert");
    setSaving(null);
  };

  const remove = async (id: string) => {
    if (!(await confirmAction({ description: "Eintrag löschen?", destructive: true, confirmLabel: "Bestätigen" }))) return;
    const { error } = await supabase.from("clara_knowledge").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setItems(items.filter((i) => i.id !== id));
      toast.success("Gelöscht");
    }
  };

  const add = async () => {
    const { data, error } = await supabase.from("clara_knowledge").insert({
      title: "Neuer Eintrag",
      category: "general",
      content: "",
      sort_order: items.length,
      is_active: true,
    }).select().single();
    if (error) toast.error(error.message);
    else if (data) setItems([...items, data as Entry]);
  };

  const importMarkdown = async (file: File) => {
    const content = await file.text();
    const { data, error } = await supabase.from("clara_knowledge").insert({
      title: file.name.replace(/\.md$/i, ""),
      category: "general",
      content,
      sort_order: items.length,
      is_active: true,
    }).select().single();
    if (error) return toast.error(error.message);
    setItems([...items, data as Entry]);
    toast.success("Markdown importiert");
  };

  const importStaticKnowledge = async () => {
    if (!(await confirmAction({ description: "Heidehof-Stammdaten als neue Einträge anlegen? (Bestehende werden NICHT überschrieben.)", destructive: true, confirmLabel: "Bestätigen" }))) return;
    const drafts = buildKnowledgeDrafts(items.length);
    const { data, error } = await supabase
      .from("clara_knowledge")
      .insert(drafts)
      .select();
    if (error) return toast.error("Import fehlgeschlagen: " + error.message);
    setItems([...items, ...((data as Entry[]) ?? [])]);
    toast.success(`${drafts.length} Stammdaten-Einträge importiert`);
  };

  const exportMarkdown = () => {
    const body = items
      .map((e) => `# ${e.title}\n\nKategorie: ${e.category}\nAktiv: ${e.is_active ? "ja" : "nein"}\n\n${e.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clara-wissensbasis.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const update = (id: string, patch: Partial<Entry>) => setItems(items.map((i) => i.id === id ? { ...i, ...patch } : i));

  const filteredItems = items.filter((e) => {
    const needle = query.toLowerCase().trim();
    if (!needle) return true;
    return `${e.title} ${e.category} ${e.content}`.toLowerCase().includes(needle);
  });

  return (
    <div className="p-4 lg:p-8">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end mb-6">
        <p className="text-sm text-muted-foreground">
          Diese Inhalte nutzt Clara live im Gespräch mit Tagungsgästen. {items.length} Einträge.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={importStaticKnowledge} className="border-apple/40 text-apple-bright">
            <BookOpen className="w-4 h-4 mr-2" /> Stammdaten importieren
          </Button>
          <Button variant="outline" onClick={() => { setCrawlMode("default"); setCrawlerOpen(true); }} disabled={importingImages} className="border-apple/40 text-apple-bright">
            {importingImages ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />} Bilder-Crawler
          </Button>
          <Button variant="outline" asChild className="border-apple/40 text-apple-bright">
            <a href="/admin/clara-media"><ImageIcon className="w-4 h-4 mr-2" /> Medienbank öffnen</a>
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-gold/30 px-4 text-sm text-gold hover:bg-gold/10">
            <Upload className="w-4 h-4 mr-2" /> Markdown importieren
            <input type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={(e) => e.target.files?.[0] && importMarkdown(e.target.files[0])} />
          </label>
          <Button variant="outline" onClick={exportMarkdown} className="border-gold/30 text-gold"><Download className="w-4 h-4 mr-2" /> Export</Button>
          <Button onClick={add} className="bg-gold text-background hover:bg-gold/90"><Plus className="w-4 h-4 mr-2" /> Eintrag hinzufügen</Button>
        </div>
      </div>


      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Wissensbasis durchsuchen..." className="pl-9 bg-background/60 border-gold/20" />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Lädt...</div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((e) => (
            <Card key={e.id} className="border-gold/20 bg-card/40 p-5 space-y-3">
              <div className="grid md:grid-cols-[1fr_180px_120px_auto] gap-3 items-start">
                <Input value={e.title} onChange={(ev) => update(e.id, { title: ev.target.value })} className="bg-background/60 border-gold/20" placeholder="Titel" />
                <select value={e.category} onChange={(ev) => update(e.id, { category: ev.target.value })} className="h-10 px-3 bg-background/60 border border-gold/20 rounded-md text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <Input type="number" value={e.sort_order} onChange={(ev) => update(e.id, { sort_order: Number(ev.target.value) })} className="bg-background/60 border-gold/20" />
                <div className="flex items-center gap-2"><Switch checked={e.is_active} onCheckedChange={(v) => update(e.id, { is_active: v })} /><span className="text-xs text-muted-foreground">aktiv</span></div>
              </div>
              <Textarea value={e.content} onChange={(ev) => update(e.id, { content: ev.target.value })} rows={6} className="bg-background/60 border-gold/20 font-mono text-xs" placeholder="Markdown-Inhalt für Clara..." />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => remove(e.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-1" /> Löschen</Button>
                <Button size="sm" onClick={() => save(e)} disabled={saving === e.id} className="bg-gold text-background hover:bg-gold/90"><Save className="w-4 h-4 mr-1" /> {saving === e.id ? "Speichert..." : "Speichern"}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={crawlerOpen} onOpenChange={setCrawlerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Bilder-Crawler</DialogTitle>
            <DialogDescription>
              Lädt Bilder von beliebigen Webseiten in die Clara-Medienbank, kategorisiert sie und erzeugt automatisch Embeddings.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 border-b border-border/40 pb-3">
            {[
              { v: "default", label: "Heidehof Standard (24 Seiten)" },
              { v: "full", label: "Vollständig (ganze Website)" },
              { v: "url", label: "Webseite crawlen" },
              { v: "manual", label: "Manuelle Bild-URLs" },
            ].map((m) => (
              <button
                key={m.v}
                onClick={() => setCrawlMode(m.v as typeof crawlMode)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${crawlMode === m.v ? "bg-apple/20 text-apple-bright" : "text-muted-foreground hover:bg-muted/30"}`}
              >{m.label}</button>
            ))}
          </div>

          {crawlMode === "default" && (
            <p className="text-sm text-muted-foreground">
              Crawlt 24 kuratierte Heidehof-Seiten (Spa, Pool, Sauna, Fitness, Tagungsräume, Bankett, Restaurants, Bar, Zimmer, Beauty, Umgebung, Arrangements) und kategorisiert die Bilder automatisch. Bis zu 25 Bilder pro Seite.
            </p>
          )}

          {crawlMode === "full" && (
            <div className="rounded-md border border-apple/30 bg-apple/5 p-3 text-sm space-y-2">
              <p className="text-apple-bright font-medium">Komplettes Site-Crawling</p>
              <p className="text-muted-foreground">
                Durchläuft <strong>der-heidehof.de</strong> automatisch (max. 80 Unterseiten, 25 Bilder pro Seite) und erkennt Kategorie + Trigger-Wörter selbständig aus dem URL-Pfad. Empfohlen für die einmalige Vollbefüllung. Dauert 2–4 Minuten.
              </p>
            </div>
          )}

          {crawlMode === "url" && (
            <div className="grid gap-3">
              <div>
                <Label>Start-URL</Label>
                <Input value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} placeholder="https://www.beispiel.de/seite" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Crawl-Tiefe</Label>
                  <select value={crawlDepth} onChange={(e) => setCrawlDepth(Number(e.target.value))} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                    <option value={0}>0 – nur diese Seite</option>
                    <option value={1}>1 – + alle internen Links</option>
                    <option value={2}>2 – tief (max. 15 Seiten)</option>
                  </select>
                </div>
                <div>
                  <Label>Kategorie</Label>
                  <select value={crawlCategory} onChange={(e) => setCrawlCategory(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                    {["general","spa","raum","bankett","restaurant","zimmer","beauty","outdoor"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Trigger-Wörter (komma-getrennt)</Label>
                <Input value={crawlTriggers} onChange={(e) => setCrawlTriggers(e.target.value)} placeholder="pool, schwimmbad, sauna" />
              </div>
              <div>
                <Label>Titel-Präfix</Label>
                <Input value={crawlTitlePrefix} onChange={(e) => setCrawlTitlePrefix(e.target.value)} />
              </div>
            </div>
          )}

          {crawlMode === "manual" && (
            <div className="grid gap-3">
              <div>
                <Label>Bild-URLs (eine pro Zeile)</Label>
                <Textarea value={crawlManualUrls} onChange={(e) => setCrawlManualUrls(e.target.value)} rows={6} placeholder="https://.../bild1.jpg&#10;https://.../bild2.png" className="font-mono text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kategorie</Label>
                  <select value={crawlCategory} onChange={(e) => setCrawlCategory(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
                    {["general","spa","raum","bankett","restaurant","zimmer","beauty","outdoor"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Titel-Präfix</Label>
                  <Input value={crawlTitlePrefix} onChange={(e) => setCrawlTitlePrefix(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Trigger-Wörter (komma-getrennt)</Label>
                <Input value={crawlTriggers} onChange={(e) => setCrawlTriggers(e.target.value)} placeholder="pool, schwimmbad" />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCrawlerOpen(false)} disabled={importingImages}>Abbrechen</Button>
            <Button onClick={runCrawler} disabled={importingImages} className="bg-apple text-background hover:bg-apple/90">
              {importingImages ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
              Crawl starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
