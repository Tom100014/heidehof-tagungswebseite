import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Save, Loader2, Sparkles, Search, Plus, X, GripVertical, Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type { HotelReferenceImage, PromptLayout } from "@/services/images/reference-library";

const CATEGORIES = [
  { value: "menu", label: "Speisekarte / Gastronomie" },
  { value: "wellness", label: "Wellness & Spa" },
  { value: "rooms", label: "Zimmer & Räume" },
  { value: "marketing", label: "Marketing / Sonstiges" },
];

export type ReferenceRole =
  | "background" | "plates" | "cutlery" | "glassware"
  | "lighting" | "style" | "decoration" | "subject";

export const ROLE_OPTIONS: { value: ReferenceRole; label: string; hint: string }[] = [
  { value: "background",  label: "Hintergrund / Umgebung", hint: "Wand, Boden, Licht, Atmosphäre des Raums" },
  { value: "plates",      label: "Teller / Geschirr",       hint: "Form, Farbe, Material des Tellers" },
  { value: "cutlery",     label: "Besteck",                 hint: "Stil und Anordnung des Bestecks" },
  { value: "glassware",   label: "Gläser / Behälter",       hint: "Glas-Stil, Karaffen, Tassen" },
  { value: "lighting",    label: "Beleuchtung / Stimmung",  hint: "Lichtfarbe, Schatten, Mood" },
  { value: "style",       label: "Stil / Komposition",      hint: "Kameraperspektive, Bildaufbau" },
  { value: "decoration",  label: "Deko-Elemente",           hint: "Blumen, Servietten, Garnitur" },
  { value: "subject",     label: "Hauptmotiv-Referenz",     hint: "Referenz für das Gericht selbst" },
];

interface ReferenceRoleMap {
  [referenceImageId: string]: { role: ReferenceRole; notes?: string };
}

type EditingLayout = Partial<PromptLayout> & { reference_roles?: ReferenceRoleMap };

export default function AdminImagePresetEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "neu";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [layout, setLayout] = useState<EditingLayout | null>(null);
  const [refImages, setRefImages] = useState<HotelReferenceImage[]>([]);
  const [refSearch, setRefSearch] = useState("");
  const [refCategory, setRefCategory] = useState<string>("all");
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const { data: refs, error: rErr } = await supabase
          .from("hotel_reference_images" as never)
          .select("*")
          .eq("is_active", true)
          .order("category")
          .order("sort_order");
        if (rErr) throw rErr;
        setRefImages((refs ?? []) as unknown as HotelReferenceImage[]);

        if (isNew) {
          setLayout({
            slug: "", label: "", emoji: "✨", category: "menu",
            description: "", prompt_text: "",
            reference_image_ids: [], reference_roles: {},
            is_active: true, is_builtin: false, sort_order: 10,
          });
        } else {
          const { data, error } = await supabase
            .from("prompt_layouts" as never)
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (error) throw error;
          if (!data) {
            toast.error("Preset nicht gefunden");
            navigate("/admin/image-prompts");
            return;
          }
          const row = data as unknown as PromptLayout & { reference_roles?: ReferenceRoleMap };
          setLayout({ ...row, reference_roles: row.reference_roles ?? {} });
        }
      } catch (e) {
        toast.error("Laden fehlgeschlagen: " + (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, navigate]);

  const selectedRefs = useMemo(() => {
    if (!layout?.reference_image_ids) return [];
    return layout.reference_image_ids
      .map((rid) => refImages.find((r) => r.id === rid))
      .filter(Boolean) as HotelReferenceImage[];
  }, [layout?.reference_image_ids, refImages]);

  const refCategories = useMemo(
    () => Array.from(new Set(refImages.map((r) => r.category))),
    [refImages],
  );

  const filteredRefs = useMemo(() => {
    return refImages.filter((img) => {
      const matchS =
        img.label.toLowerCase().includes(refSearch.toLowerCase()) ||
        (img.description ?? "").toLowerCase().includes(refSearch.toLowerCase());
      const matchC = refCategory === "all" || img.category === refCategory;
      return matchS && matchC;
    });
  }, [refImages, refSearch, refCategory]);

  if (loading || !layout) {
    return (
      <HeidehofAdminLayout title="Bild-Preset bearbeiten">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      </HeidehofAdminLayout>
    );
  }

  const addReference = (refId: string) => {
    const ids = layout.reference_image_ids ?? [];
    if (ids.includes(refId)) return;
    if (ids.length >= 6) {
      toast.warning("Maximal 6 Referenzen pro Preset.");
      return;
    }
    const inferredRole = inferRole(refImages.find((r) => r.id === refId));
    setLayout({
      ...layout,
      reference_image_ids: [...ids, refId],
      reference_roles: {
        ...(layout.reference_roles ?? {}),
        [refId]: { role: inferredRole, notes: "" },
      },
    });
  };

  const removeReference = (refId: string) => {
    const ids = (layout.reference_image_ids ?? []).filter((x) => x !== refId);
    const roles = { ...(layout.reference_roles ?? {}) };
    delete roles[refId];
    setLayout({ ...layout, reference_image_ids: ids, reference_roles: roles });
  };

  const setRole = (refId: string, role: ReferenceRole) => {
    setLayout({
      ...layout,
      reference_roles: {
        ...(layout.reference_roles ?? {}),
        [refId]: { ...(layout.reference_roles?.[refId] ?? { role }), role },
      },
    });
  };

  const setNotes = (refId: string, notes: string) => {
    setLayout({
      ...layout,
      reference_roles: {
        ...(layout.reference_roles ?? {}),
        [refId]: { ...(layout.reference_roles?.[refId] ?? { role: "background" }), notes },
      },
    });
  };

  const move = (refId: string, dir: -1 | 1) => {
    const ids = [...(layout.reference_image_ids ?? [])];
    const i = ids.indexOf(refId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setLayout({ ...layout, reference_image_ids: ids });
  };

  const handleOptimize = async () => {
    if (!layout.label) {
      toast.error("Bitte zuerst einen Titel eintragen");
      return;
    }
    setOptimizing(true);
    try {
      const refs = selectedRefs.map((r) => ({
        id: r.id,
        label: r.label,
        description: r.description,
        image_url: r.image_url,
        role: ROLE_OPTIONS.find((o) => o.value === layout.reference_roles?.[r.id]?.role)?.label ?? "Stil",
        user_notes: layout.reference_roles?.[r.id]?.notes ?? "",
      }));
      const { data, error } = await supabase.functions.invoke("optimize-image-prompt", {
        body: {
          entityTitle: layout.label,
          entityDescription: layout.description,
          scope: layout.category,
          references: refs,
          mode: "prompt",
        },
      });
      if (error) throw error;
      const prompt = (data as { prompt?: string })?.prompt;
      if (prompt) {
        setLayout({ ...layout, prompt_text: prompt });
        toast.success("Prompt von KI optimiert");
      }
    } catch (e) {
      toast.error("Optimierung fehlgeschlagen: " + (e as Error).message);
    } finally {
      setOptimizing(false);
    }
  };

  const handleSave = async () => {
    if (!layout.label?.trim() || !layout.slug?.trim()) {
      toast.error("Bezeichnung und Code-Slug sind Pflicht");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: layout.slug.trim().toLowerCase(),
        label: layout.label.trim(),
        emoji: layout.emoji || "✨",
        category: layout.category || "menu",
        description: layout.description?.trim() || "",
        prompt_text: layout.prompt_text?.trim() || "",
        reference_image_ids: layout.reference_image_ids ?? [],
        reference_roles: layout.reference_roles ?? {},
        is_active: layout.is_active ?? true,
        is_builtin: layout.is_builtin ?? false,
        sort_order: Number(layout.sort_order ?? 0),
      };
      const { error } = isNew
        ? await supabase.from("prompt_layouts" as never).insert(payload as never)
        : await supabase.from("prompt_layouts" as never).update(payload as never).eq("id", id!);
      if (error) throw error;
      toast.success(isNew ? "Preset erstellt" : "Preset gespeichert");
      navigate("/admin/image-prompts");
    } catch (e) {
      toast.error("Speichern fehlgeschlagen: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HeidehofAdminLayout title={isNew ? "Neues Bild-Preset" : `Preset: ${layout.label ?? ""}`}>
      <div className="flex flex-col gap-6 pb-24">
        {/* Header mit Zurück-Button */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/image-prompts")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Übersicht
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="text-sm text-muted-foreground">
              Strukturiertes Referenz-Bild-System
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
          {/* Linke Spalte: Felder */}
          <Card className="border-gold/20 bg-card/40">
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1.5">
                  <Label>Bezeichnung *</Label>
                  <Input
                    value={layout.label ?? ""}
                    onChange={(e) => setLayout({ ...layout, label: e.target.value })}
                    placeholder="z. B. À-la-carte Hauptgericht"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Emoji</Label>
                  <Input
                    value={layout.emoji ?? ""}
                    maxLength={4}
                    onChange={(e) => setLayout({ ...layout, emoji: e.target.value })}
                    className="text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Code-Slug *</Label>
                  <Input
                    value={layout.slug ?? ""}
                    disabled={layout.is_builtin}
                    onChange={(e) => setLayout({ ...layout, slug: e.target.value })}
                    placeholder="speisekarte-hauptgang"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kategorie</Label>
                  <Select
                    value={layout.category ?? "menu"}
                    onValueChange={(v) => setLayout({ ...layout, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Kurzbeschreibung</Label>
                <Input
                  value={layout.description ?? ""}
                  onChange={(e) => setLayout({ ...layout, description: e.target.value })}
                  placeholder="Wofür wird dieses Preset verwendet?"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Prompt-Text</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="gap-2"
                  >
                    {optimizing
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Wand2 className="h-3.5 w-3.5" />}
                    KI-Optimierung
                  </Button>
                </div>
                <Textarea
                  value={layout.prompt_text ?? ""}
                  onChange={(e) => setLayout({ ...layout, prompt_text: e.target.value })}
                  rows={10}
                  placeholder="Beschreibe das Hauptmotiv. Du kannst dich im Text auf Referenzen beziehen: 'Hintergrund wie Referenz 1, Teller wie Referenz 2, Besteck wie Referenz 3.'"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Die rechts zugeordneten Rollen werden automatisch strukturiert an die KI gesendet –
                  du musst sie nicht selbst beschreiben.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Sortierung</Label>
                  <Input
                    type="number"
                    value={layout.sort_order ?? 0}
                    onChange={(e) => setLayout({ ...layout, sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rechte Spalte: Referenzen mit Rollen */}
          <Card className="border-gold/20 bg-card/40">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gold">
                  Referenzen mit Rollen ({selectedRefs.length}/6)
                </h3>
              </div>

              {selectedRefs.length === 0 ? (
                <div className="text-xs text-muted-foreground italic border border-dashed border-border rounded-md p-4 text-center">
                  Noch keine Referenzen zugewiesen. Wähle unten aus der Bibliothek.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedRefs.map((ref, idx) => {
                    const role = layout.reference_roles?.[ref.id]?.role ?? "background";
                    const notes = layout.reference_roles?.[ref.id]?.notes ?? "";
                    return (
                      <div
                        key={ref.id}
                        className="rounded-lg border border-border bg-background/40 p-3 space-y-2"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="relative shrink-0">
                            <img
                              src={ref.image_url}
                              alt={ref.label}
                              className="w-16 h-16 rounded object-cover border border-gold/30"
                            />
                            <div className="absolute -top-1.5 -left-1.5 h-5 w-5 rounded-full bg-gold text-black text-xs font-bold flex items-center justify-center shadow">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{ref.label}</div>
                            <Select value={role} onValueChange={(v) => setRole(ref.id, v as ReferenceRole)}>
                              <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    <span className="text-xs">{o.label}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6"
                              onClick={() => move(ref.id, -1)} title="Hoch">
                              <GripVertical className="h-3 w-3 rotate-180" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6"
                              onClick={() => move(ref.id, 1)} title="Runter">
                              <GripVertical className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300"
                              onClick={() => removeReference(ref.id)} title="Entfernen">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <Input
                          value={notes}
                          onChange={(e) => setNotes(ref.id, e.target.value)}
                          placeholder="Notiz (optional, z. B. 'nur die Tellerform übernehmen')"
                          className="h-7 text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 border-t border-border space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Aus Bibliothek hinzufügen
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={refSearch}
                      onChange={(e) => setRefSearch(e.target.value)}
                      placeholder="Suchen..."
                      className="h-8 text-xs pl-7"
                    />
                  </div>
                  <Select value={refCategory} onValueChange={setRefCategory}>
                    <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      {refCategories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {filteredRefs.map((img) => {
                    const selected = (layout.reference_image_ids ?? []).includes(img.id);
                    return (
                      <button
                        key={img.id}
                        type="button"
                        disabled={selected}
                        onClick={() => addReference(img.id)}
                        className={`relative aspect-square rounded-md overflow-hidden border transition ${
                          selected
                            ? "border-gold/60 opacity-40 cursor-not-allowed"
                            : "border-border hover:border-gold"
                        }`}
                        title={img.label}
                      >
                        <img src={img.image_url} alt={img.label} className="w-full h-full object-cover" />
                        {!selected && (
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                            <Plus className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sticky Save Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gold/20 bg-background/95 backdrop-blur-md px-6 py-3">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              {selectedRefs.map((r, i) => (
                <Badge key={r.id} variant="outline" className="text-[10px]">
                  {i + 1}: {ROLE_OPTIONS.find((o) => o.value === (layout.reference_roles?.[r.id]?.role ?? "background"))?.label}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate("/admin/image-prompts")} disabled={saving}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Speichern
              </Button>
            </div>
          </div>
        </div>
      </div>
    </HeidehofAdminLayout>
  );
}

function inferRole(img: HotelReferenceImage | undefined): ReferenceRole {
  if (!img) return "background";
  const txt = `${img.label} ${img.category} ${(img.tags ?? []).join(" ")}`.toLowerCase();
  if (/teller|plate|geschirr/.test(txt)) return "plates";
  if (/besteck|cutlery|gabel|messer/.test(txt)) return "cutlery";
  if (/glas|glass|karaffe|tasse/.test(txt)) return "glassware";
  if (/licht|light|mood|stimmung/.test(txt)) return "lighting";
  if (/deko|garnitur|blume/.test(txt)) return "decoration";
  if (/stil|style|komposit/.test(txt)) return "style";
  if (/raum|background|hintergrund|interior|restaurant|wellness/.test(txt)) return "background";
  return "background";
}
