import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader2, Upload, Wand2, ImageIcon, Check, Plus, Trash2, Sparkles, HelpCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  type HotelReferenceImage,
  type ReferenceScope,
  SCOPE_LABELS,
  listReferenceImagesByScope,
  uploadReferenceImageFile,
  createReferenceImage,
  listLayouts,
} from "@/services/images/reference-library";

export interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: ReferenceScope;
  /** Title of the entity being generated for, e.g. "Carpaccio vom Rind" */
  entityTitle: string;
  /** Description of the entity being generated for */
  entityDescription?: string;
  /** Optional default prompt (e.g. category master prompt or saved item prompt) */
  defaultPrompt?: string;
  /** Called with the user-edited prompt + selected reference image URLs + title + description */
  onGenerate: (args: {
    prompt: string;
    referenceImageUrls: string[];
    references?: Array<{
      image_url: string;
      role: string;
      user_notes?: string;
    }>;
    title: string;
    description: string;
  }) => Promise<void>;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "ref";

export function ImageGenerationDialog({
  open, onOpenChange, scope, entityTitle, entityDescription = "", defaultPrompt = "", onGenerate,
}: ImageGenerationDialogProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [titleInput, setTitleInput] = useState(entityTitle);
  const [descriptionInput, setDescriptionInput] = useState(entityDescription);

  const [refs, setRefs] = useState<HotelReferenceImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refConfigs, setRefConfigs] = useState<Record<string, { role: string; user_notes: string }>>({});

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const loadRefs = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listReferenceImagesByScope(scope);
      setRefs(list);
    } catch (e) {
      toast.error("Referenzen laden fehlgeschlagen: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    if (open) {
      setTitleInput(entityTitle);
      setDescriptionInput(entityDescription);
      
      const initDefaults = async () => {
        let initialPrompt = defaultPrompt;
        const selectedRefs = new Set<string>();
        const initialConfigs: Record<string, { role: string; user_notes: string }> = {};

        try {
          const layouts = await listLayouts();
          const scopeSlugMap: Record<ReferenceScope, string> = {
            drinks: "barkarte",
            food: "speisekarte-restaurant",
            wellness: "wellness-spa",
            conference_menu: "tagungsmenue",
            events: "tagungsraum-setup",
          };
          const targetSlug = scopeSlugMap[scope];
          const matchedLayout = layouts.find((l) => l.slug === targetSlug);

          if (matchedLayout) {
            if (!initialPrompt) {
              initialPrompt = matchedLayout.prompt_text;
            }
            if (matchedLayout.reference_image_ids && matchedLayout.reference_image_ids.length > 0) {
              matchedLayout.reference_image_ids.forEach((id) => {
                selectedRefs.add(id);
                initialConfigs[id] = { role: "Hintergrund / Umgebung", user_notes: "" };
              });
            }
          }
        } catch (e) {
          console.error("Fehler beim Laden der Standard-Prompts:", e);
        }

        setPrompt(initialPrompt);
        setSelected(selectedRefs);
        setRefConfigs(initialConfigs);
      };

      void initDefaults();
      void loadRefs();
    }
  }, [open, defaultPrompt, entityTitle, entityDescription, scope, loadRefs]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setRefConfigs((prevConfigs) => {
          const nextConfigs = { ...prevConfigs };
          delete nextConfigs[id];
          return nextConfigs;
        });
      } else if (next.size < 6) {
        next.add(id);
        setRefConfigs((prevConfigs) => ({
          ...prevConfigs,
          [id]: { role: "Hintergrund / Umgebung", user_notes: "" },
        }));
      } else {
        toast.warning("Maximal 6 Referenzen pro Generierung");
      }
      return next;
    });
  };

  const handleGenerateDescription = async () => {
    if (!titleInput.trim()) {
      toast.error("Titel darf nicht leer sein");
      return;
    }
    setGeneratingDesc(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-image-prompt", {
        body: {
          entityTitle: titleInput.trim(),
          scope,
          mode: "description",
        },
      });

      if (error || (data as { error?: string })?.error) {
        throw new Error(error?.message ?? (data as { error?: string }).error);
      }

      if (data?.description) {
        setDescriptionInput(data.description);
        toast.success("Beschreibung erfolgreich generiert!");
      }
    } catch (e) {
      toast.error("Beschreibungsgeneierung fehlgeschlagen: " + (e as Error).message);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleOptimizePrompt = async () => {
    if (!titleInput.trim()) {
      toast.error("Titel darf nicht leer sein");
      return;
    }
    setOptimizing(true);
    try {
      const selectedRefsPayload = refs
        .filter((r) => selected.has(r.id))
        .map((r) => ({
          id: r.id,
          label: r.label,
          description: r.description,
          image_url: r.image_url,
          role: refConfigs[r.id]?.role ?? "Hintergrund / Umgebung",
          user_notes: refConfigs[r.id]?.user_notes ?? "",
        }));

      const { data, error } = await supabase.functions.invoke("optimize-image-prompt", {
        body: {
          entityTitle: titleInput.trim(),
          entityDescription: descriptionInput.trim(),
          scope,
          references: selectedRefsPayload,
        },
      });

      if (error || (data as { error?: string })?.error) {
        throw new Error(error?.message ?? (data as { error?: string }).error);
      }

      if (data?.prompt) {
        setPrompt(data.prompt);
        toast.success("Prompt erfolgreich mit KI optimiert!");
      }
    } catch (e) {
      toast.error("Prompt-Optimierung fehlgeschlagen: " + (e as Error).message);
    } finally {
      setOptimizing(false);
    }
  };

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
      toast.success("Referenz hochgeladen");
      setNewLabel(""); setNewDesc(""); setPendingFile(null);
      await loadRefs();
    } catch (e) {
      toast.error("Upload-Fehler: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!prompt.trim()) { toast.error("Prompt darf nicht leer sein"); return; }
    setBusy(true);
    try {
      const selectedRefs = refs.filter((r) => selected.has(r.id));
      const urls = selectedRefs.map((r) => r.image_url);
      const referencesPayload = selectedRefs.map((r) => ({
        image_url: r.image_url,
        role: refConfigs[r.id]?.role ?? "Hintergrund / Umgebung",
        user_notes: refConfigs[r.id]?.user_notes?.trim() || undefined,
      }));
      await onGenerate({
        prompt: prompt.trim(),
        referenceImageUrls: urls,
        references: referencesPayload,
        title: titleInput.trim(),
        description: descriptionInput.trim(),
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const selectedRefsList = refs.filter((r) => selected.has(r.id));

  // Escape closes the full-page editor
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy && !optimizing) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while full-page editor is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onOpenChange, busy, optimizing]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-zinc-950 text-zinc-100 flex flex-col animate-in fade-in duration-200">
      {/* Header with back button */}
      <header className="px-6 py-4 border-b border-zinc-800 shrink-0 bg-zinc-950 flex items-center gap-4">
        <button
          type="button"
          onClick={() => !busy && !optimizing && onOpenChange(false)}
          disabled={busy || optimizing}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-xs text-zinc-300 disabled:opacity-40 transition"
          aria-label="Zurück"
        >
          <ArrowLeft className="h-4 w-4" /> Zurück
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-amber-500 truncate">
            <Sparkles className="h-5 w-5 animate-pulse text-amber-400 shrink-0" />
            <span className="truncate">KI-Bildstudio – {entityTitle}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Bereich: <Badge variant="outline" className="ml-1 border-amber-500/30 text-amber-400 bg-amber-500/5">{SCOPE_LABELS[scope]}</Badge>
          </p>
        </div>
      </header>


        {/* Main Body Split Panel */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800 overflow-hidden bg-zinc-950">
          
          {/* LEFT PANEL: Workspace (Inputs, Reference Mapping, Prompt Generator) */}
          <div className="flex-[5] min-h-0 flex flex-col gap-4 p-5 overflow-y-auto shrink-0">
            
            {/* 1. Product details (editable) */}
            <div className="space-y-3 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
              <h3 className="text-sm font-semibold text-amber-400/90 tracking-wide uppercase">1. Produktdaten für die KI</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="entity-title" className="text-xs text-zinc-400">Produktname / Titel</Label>
                  <Input
                    id="entity-title"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="h-9 bg-zinc-900 border-zinc-800 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/60 text-sm text-zinc-100"
                    placeholder="z.B. Aperol Spritz"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="entity-desc" className="text-xs text-zinc-400">Kurzbeschreibung (Details, Zutaten, Deko)</Label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={generatingDesc || !titleInput.trim()}
                      className="text-xs text-amber-400 hover:text-amber-300 disabled:text-zinc-600 transition-colors flex items-center gap-0.5"
                    >
                      {generatingDesc ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-2.5 w-2.5" />
                      )}
                      KI-Vorschlag
                    </button>
                  </div>
                  <Input
                    id="entity-desc"
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="h-9 bg-zinc-900 border-zinc-800 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/60 text-sm text-zinc-100"
                    placeholder="z.B. eisgekühlt, Orangenscheibe, Strohhalm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Selected references & Role mapper */}
            <div className="space-y-3 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md flex-1 min-h-[220px] flex flex-col">
              <h3 className="text-sm font-semibold text-amber-400/90 tracking-wide uppercase flex items-center justify-between">
                <span>2. Referenzbilder konfigurieren ({selected.size}/6)</span>
                {selected.size > 0 && <span className="text-xs text-zinc-400 normal-case">Rollen steuern das Zusammenfügen der KI</span>}
              </h3>
              
              {selected.size === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-lg p-6 text-center text-zinc-500">
                  <ImageIcon className="h-10 w-10 mb-2 stroke-[1.2] text-zinc-600" />
                  <p className="text-xs max-w-sm">
                    Noch keine Referenzbilder ausgewählt. Wähle rechts in der Bibliothek Bilder aus, um Stil, Glasform oder Hintergrund exakt vorzugeben.
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1 pr-1">
                  <div className="space-y-3">
                    {selectedRefsList.map((r, idx) => (
                      <div 
                        key={r.id} 
                        className="flex gap-3 p-3 rounded-lg border border-amber-500/10 bg-zinc-950/60 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 group"
                      >
                        {/* Reference Thumbnail */}
                        <div className="relative w-16 h-16 rounded-md overflow-hidden border border-zinc-800 shrink-0 shadow-inner">
                          <img src={r.image_url} alt={r.label} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => toggle(r.id)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200"
                            title="Entfernen"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </button>
                        </div>

                        {/* Config Inputs */}
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium truncate text-zinc-200">{r.label}</span>
                            <Badge variant="outline" className="text-xs py-0 px-1.5 border-amber-500/30 text-amber-400 bg-amber-500/5">
                              Ref #{idx + 1}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium text-zinc-400 block mb-0.5">Rolle dieses Bildes</label>
                              <Select
                                value={refConfigs[r.id]?.role ?? "Hintergrund / Umgebung"}
                                onValueChange={(val) => setRefConfigs(prev => ({ 
                                  ...prev, 
                                  [r.id]: { ...(prev[r.id] ?? { user_notes: "" }), role: val } 
                                }))}
                              >
                                <SelectTrigger className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                  <SelectItem value="Hintergrund / Umgebung" className="text-xs focus:bg-amber-500 focus:text-white">Hintergrund / Umgebung</SelectItem>
                                  <SelectItem value="Geschirr / Glas / Behälter" className="text-xs focus:bg-amber-500 focus:text-white">Geschirr / Gläser / Gefäß</SelectItem>
                                  <SelectItem value="Beleuchtung / Lichtstimmung" className="text-xs focus:bg-amber-500 focus:text-white">Licht & Stimmung</SelectItem>
                                  <SelectItem value="Stil / Komposition / Winkel" className="text-xs focus:bg-amber-500 focus:text-white">Stil / Komposition</SelectItem>
                                  <SelectItem value="Detail-Element / Dekoration" className="text-xs focus:bg-amber-500 focus:text-white">Detail-Element / Deko</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-zinc-400 block mb-0.5">Details (z.B. "nur die Gläser")</label>
                              <Input
                                placeholder="z. B. 'Nur die Form des Kelchglases übernehmen'"
                                value={refConfigs[r.id]?.user_notes ?? ""}
                                onChange={(e) => setRefConfigs(prev => ({ 
                                  ...prev, 
                                  [r.id]: { ...(prev[r.id] ?? { role: "Hintergrund / Umgebung" }), user_notes: e.target.value } 
                                }))}
                                className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* 3. Image Prompt Field with KI Optimizer */}
            <div className="space-y-2 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md shrink-0">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="gen-prompt" className="text-xs text-zinc-400">3. Bild-Prompt (Frei editierbarer Befehl)</Label>
                
                <Button 
                  type="button"
                  onClick={handleOptimizePrompt}
                  disabled={optimizing || !titleInput.trim()}
                  className="h-7 text-xs bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-semibold border-0 shadow-lg shadow-amber-950/20 transition-all duration-300 gap-1 rounded-md px-2.5 py-0"
                >
                  {optimizing ? (
                    <Loader2 className="h-3 w-3 animate-spin text-zinc-950" />
                  ) : (
                    <Wand2 className="h-3 w-3 text-zinc-950" />
                  )}
                  {optimizing ? "Analysiere Referenzen..." : "✨ Prompt mit KI optimieren"}
                </Button>
              </div>
              
              <Textarea
                id="gen-prompt" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="bg-zinc-900 border-zinc-800 focus-visible:ring-amber-500/30 focus-visible:border-amber-500/60 text-sm text-zinc-200 placeholder:text-zinc-600"
                placeholder="Beschreibe das gewünschte Bild – Stil, Komposition, Beleuchtung, Hintergrund … oder nutze oben den KI-Prompt-Optimierer."
              />
            </div>

          </div>

          {/* RIGHT PANEL: Reference Selector & Library */}
          <div className="flex-[4] min-h-0 flex flex-col p-5 overflow-hidden">
            <h3 className="text-sm font-semibold text-zinc-300 tracking-wide uppercase mb-3 flex items-center gap-1.5 shrink-0">
              <ImageIcon className="h-4 w-4 text-zinc-400" /> Referenz-Bibliothek
            </h3>

            <Tabs defaultValue="select" className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <TabsList className="shrink-0 self-start bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg mb-3">
                <TabsTrigger value="select" className="text-xs px-3 py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 rounded-md">
                  Auswählen ({selected.size})
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs px-3 py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 rounded-md">
                  <Plus className="h-3 w-3 mr-1" />
                  Hochladen
                </TabsTrigger>
              </TabsList>

              {/* Gallery List Tab */}
              <TabsContent value="select" className="flex-1 min-h-0 m-0 overflow-hidden data-[state=active]:flex flex-col">
                {loading ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 text-xs">
                    <Loader2 className="h-6 w-6 mb-2 animate-spin text-amber-500" /> Lade Referenzbilder …
                  </div>
                ) : refs.length === 0 ? (
                  <div className="text-center text-xs text-zinc-500 py-12 flex-1 flex flex-col items-center justify-center">
                    Keine Referenzen für „{SCOPE_LABELS[scope]}" gefunden.
                    <span className="text-xs text-zinc-600 mt-1 block">Lade oben über den Tab "Hochladen" neue Bilder hoch.</span>
                  </div>
                ) : (
                  <ScrollArea className="flex-1 min-h-0 pr-1">
                    <div className="grid grid-cols-3 gap-2 pb-2">
                      {refs.map((r) => {
                        const isSel = selected.has(r.id);
                        const selIndex = selectedRefsList.indexOf(r);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => toggle(r.id)}
                            className={`relative aspect-square rounded-lg overflow-hidden border transition-all duration-300 group shadow-md ${
                              isSel 
                                ? "border-amber-500 ring-2 ring-amber-500/20" 
                                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900"
                            }`}
                            title={r.label + (r.description ? "\n" + r.description : "")}
                          >
                            <img src={r.image_url} alt={r.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1.5 text-xs text-zinc-200 truncate font-medium">
                              {r.label}
                            </div>
                            
                            {isSel && (
                              <div className="absolute top-1.5 right-1.5 bg-amber-500 text-zinc-950 font-bold rounded-full h-5 w-5 flex items-center justify-center text-xs shadow-md shadow-black/40">
                                {selIndex !== -1 ? selIndex + 1 : <Check className="h-3 w-3" />}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>

              {/* Upload Form Tab */}
              <TabsContent value="upload" className="flex-1 min-h-0 m-0 overflow-y-auto data-[state=active]:flex flex-col gap-3 pr-1">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Bilddatei wählen</Label>
                  <Input
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 file:bg-zinc-800 file:border-0 file:text-zinc-200 file:text-xs file:rounded-md file:mr-2"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Bezeichnung *</Label>
                  <Input
                    value={newLabel} 
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="z. B. 'Edles Kristallglas mit Eis'"
                    className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Beschreibung (optional)</Label>
                  <Textarea
                    value={newDesc} 
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={2}
                    placeholder="Wofür ist diese Referenz typisch? Stil, Hintergrund, Beleuchtung..."
                    className="text-xs bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                  />
                </div>
                
                <Button 
                  onClick={onUpload} 
                  disabled={uploading || !pendingFile || !newLabel.trim()} 
                  className="self-start mt-2 h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                >
                  {uploading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1" />
                  )}
                  Referenz speichern
                </Button>
              </TabsContent>
            </Tabs>
          </div>

        </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 shrink-0 bg-zinc-950 flex items-center justify-between gap-3">
        <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-500">
          <HelpCircle className="h-3 w-3" />
          <span>Tipp: Kombiniere Hintergrund- & Objekt-Referenzen für maximale Konsistenz.</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy || optimizing}
            className="text-xs border border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100"
          >
            Abbrechen
          </Button>
          <Button
            onClick={submit}
            disabled={busy || optimizing || !prompt.trim()}
            className="text-xs bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-zinc-950 font-bold border-0 shadow-lg shadow-amber-950/20"
          >
            {busy ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin text-zinc-950" />
            ) : (
              <Wand2 className="h-3 w-3 mr-1 text-zinc-950" />
            )}
            Generieren ({selected.size} Ref.)
          </Button>
        </div>
      </footer>
    </div>,
    document.body
  );
}

