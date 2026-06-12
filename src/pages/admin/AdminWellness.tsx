import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Wand2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { ImageGenerationDialog } from "@/components/admin/ImageGenerationDialog";
import { ReferenceUploadPanel } from "@/components/admin/ReferenceUploadPanel";

type GenTarget = { kind: "treatment"; item: Treatment } | { kind: "section"; item: Section };

type Cat = "beauty_men" | "beauty_women" | "depilation" | "massagen" | "hand_fuss" | "sonstiges" | "sauna" | "pool" | "ruhebereich" | "spa_general" | "wellness_general";
type Page = "wellness" | "spa";

interface Treatment {
  id: string; slug: string; title: string; description: string | null;
  category: Cat; target_page: Page;
  duration_label: string | null; price_label: string | null;
  image_url: string | null; image_prompt: string | null;
  is_active: boolean; sort_order: number;
}
interface SectionFeature { icon: string; label: string; }
interface Section {
  id: string; page: Page; slug: string; title: string; subtitle: string | null;
  body_md: string | null; hero_image_url: string | null; opening_hours: string | null;
  master_image_prompt: string | null; is_active: boolean; sort_order: number;
  eyebrow: string | null; features: SectionFeature[] | null;
}

const CATS: Cat[] = ["beauty_women","beauty_men","massagen","hand_fuss","depilation","sonstiges","sauna","pool","ruhebereich","spa_general","wellness_general"];

export default function AdminWellness() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [genTarget, setGenTarget] = useState<GenTarget | null>(null);

  const [newT, setNewT] = useState({ title: "", description: "", category: "massagen" as Cat, target_page: "spa" as Page, duration_label: "", price_label: "" });
  const [newS, setNewS] = useState({ page: "wellness" as Page, slug: "", title: "", subtitle: "", body_md: "", opening_hours: "" });

  const load = async () => {
    const [t, s] = await Promise.all([
      supabase.from("wellness_treatments" as never).select("*").order("sort_order"),
      supabase.from("wellness_sections" as never).select("*").order("sort_order"),
    ]);
    setTreatments((t.data as unknown as Treatment[]) ?? []);
    setSections((s.data as unknown as Section[]) ?? []);
  };
  useEffect(() => { void load(); }, []);

  const addTreatment = async () => {
    if (!newT.title) return toast.error("Titel erforderlich");
    const slug = newT.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);
    const { error } = await supabase.from("wellness_treatments" as never).insert({ ...newT, slug } as never);
    if (error) toast.error(error.message); else { toast.success("Hinzugefügt"); setNewT({ ...newT, title: "", description: "", duration_label: "", price_label: "" }); await load(); }
  };

  const addSection = async () => {
    if (!newS.title || !newS.slug) return toast.error("Titel und Slug erforderlich");
    const { error } = await supabase.from("wellness_sections" as never).insert(newS as never);
    if (error) toast.error(error.message); else { toast.success("Sektion erstellt"); setNewS({ ...newS, slug: "", title: "", subtitle: "", body_md: "", opening_hours: "" }); await load(); }
  };

  const del = async (table: "wellness_treatments" | "wellness_sections", id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from(table as never).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Gelöscht"); await load(); }
  };

  const toggle = async (table: "wellness_treatments" | "wellness_sections", id: string, is_active: boolean) => {
    await supabase.from(table as never).update({ is_active: !is_active } as never).eq("id", id);
    await load();
  };

  const runGenerate = async (
    target: GenTarget,
    prompt: string,
    refUrls: string[],
    references?: Array<{ image_url: string; role: string; user_notes?: string }>
  ) => {
    const id = target.item.id;
    setBusyId(id);
    try {
      const body = target.kind === "treatment"
        ? { treatment_id: id, custom_prompt: prompt, reference_image_urls: refUrls, references }
        : { section_id: id, custom_prompt: prompt, reference_image_urls: refUrls, references };
      const { data, error } = await supabase.functions.invoke("generate-wellness-image", { body });
      if (error || (data as { error?: string })?.error) throw new Error(error?.message ?? (data as { error?: string }).error);
      toast.success("Bild generiert");
      await load();
    } catch (e) {
      toast.error("Generierung fehlgeschlagen: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const uploadImage = async (kind: "treatment" | "section", id: string, file: File) => {
    setBusyId(id);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${kind === "treatment" ? "wellness_treatments" : "wellness_sections"}/${id}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("wellness-media").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("wellness-media").getPublicUrl(path);
      const table = kind === "treatment" ? "wellness_treatments" : "wellness_sections";
      const field = kind === "treatment" ? "image_url" : "hero_image_url";
      const sField = kind === "treatment" ? "image_storage_path" : "hero_storage_path";
      await supabase.from(table as never).update({ [field]: pub.publicUrl, [sField]: path } as never).eq("id", id);
      toast.success("Hochgeladen");
      await load();
    } catch (e) {
      toast.error("Upload-Fehler: " + (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <HeidehofAdminLayout title="Wellness & Spa">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ReferenceUploadPanel scope="wellness" />
        <Tabs defaultValue="treatments">
          <TabsList>
            <TabsTrigger value="treatments">Behandlungen ({treatments.length})</TabsTrigger>
            <TabsTrigger value="sections">Sektionen ({sections.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="treatments" className="space-y-6">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Neue Behandlung</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Titel" value={newT.title} onChange={(e) => setNewT({ ...newT, title: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={newT.category} onValueChange={(v) => setNewT({ ...newT, category: v as Cat })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={newT.target_page} onValueChange={(v) => setNewT({ ...newT, target_page: v as Page })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="spa">Spa</SelectItem><SelectItem value="wellness">Wellness</SelectItem></SelectContent>
                  </Select>
                </div>
                <Input placeholder="Dauer (z.B. 60 Min.)" value={newT.duration_label} onChange={(e) => setNewT({ ...newT, duration_label: e.target.value })} />
                <Input placeholder="Preis (z.B. 89,00 €)" value={newT.price_label} onChange={(e) => setNewT({ ...newT, price_label: e.target.value })} />
              </div>
              <Textarea placeholder="Beschreibung" value={newT.description} onChange={(e) => setNewT({ ...newT, description: e.target.value })} />
              <Button onClick={addTreatment}><Plus className="w-4 h-4 mr-2" />Hinzufügen</Button>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treatments.map((t) => (
                <Card key={t.id} className={`p-4 ${!t.is_active ? "opacity-50" : ""}`}>
                  {t.image_url && <img src={t.image_url} alt={t.title} className="w-full h-32 object-cover rounded mb-3" />}
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-xs text-muted-foreground mb-2">{t.category} · {t.target_page} · {t.duration_label} · {t.price_label}</div>
                  <p className="text-sm mb-3 line-clamp-2">{t.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setGenTarget({ kind: "treatment", item: t })} disabled={busyId === t.id}>
                      {busyId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} KI-Bild
                    </Button>
                    <label className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded cursor-pointer hover:bg-accent">
                      <Upload className="w-3 h-3" /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage("treatment", t.id, e.target.files[0])} />
                    </label>
                    <Button size="sm" variant="ghost" onClick={() => toggle("wellness_treatments", t.id, t.is_active)}>{t.is_active ? "Deaktiv." : "Aktiv."}</Button>
                    <Button size="sm" variant="ghost" onClick={() => del("wellness_treatments", t.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Neue Sektion</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Select value={newS.page} onValueChange={(v) => setNewS({ ...newS, page: v as Page })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="wellness">Wellness</SelectItem><SelectItem value="spa">Spa</SelectItem></SelectContent>
                </Select>
                <Input placeholder="Slug (eindeutig)" value={newS.slug} onChange={(e) => setNewS({ ...newS, slug: e.target.value })} />
                <Input placeholder="Titel" value={newS.title} onChange={(e) => setNewS({ ...newS, title: e.target.value })} />
                <Input placeholder="Untertitel" value={newS.subtitle} onChange={(e) => setNewS({ ...newS, subtitle: e.target.value })} />
                <Input placeholder="Öffnungszeiten" value={newS.opening_hours} onChange={(e) => setNewS({ ...newS, opening_hours: e.target.value })} />
              </div>
              <Textarea placeholder="Beschreibung (Markdown)" value={newS.body_md} onChange={(e) => setNewS({ ...newS, body_md: e.target.value })} />
              <Button onClick={addSection}><Plus className="w-4 h-4 mr-2" />Sektion anlegen</Button>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {sections.map((s) => (
                <SectionEditor
                  key={s.id}
                  section={s}
                  busy={busyId === s.id}
                  onChange={() => void load()}
                  onUpload={(file) => uploadImage("section", s.id, file)}
                  onGenerate={() => setGenTarget({ kind: "section", item: s })}
                  onDelete={() => del("wellness_sections", s.id)}
                  onToggle={() => toggle("wellness_sections", s.id, s.is_active)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
        {genTarget && (
          <ImageGenerationDialog
            open={!!genTarget}
            onOpenChange={(o) => !o && setGenTarget(null)}
            scope="wellness"
            entityTitle={genTarget.item.title}
            entityDescription={
              genTarget.kind === "treatment"
                ? (genTarget.item.description ?? "")
                : (genTarget.item.subtitle ?? genTarget.item.body_md ?? "")
            }
            defaultPrompt={
              genTarget.kind === "treatment"
                ? (genTarget.item.image_prompt ?? "")
                : (genTarget.item.master_image_prompt ?? "")
            }
            onGenerate={async ({ prompt, referenceImageUrls, references, title, description }) => {
              if (genTarget.kind === "treatment") {
                const { error } = await supabase
                   .from("wellness_treatments" as never)
                   .update({ title, description } as never)
                   .eq("id", genTarget.item.id);
                if (error) {
                  toast.error("Speichern fehlgeschlagen: " + error.message);
                  return;
                }
                await runGenerate(
                  { ...genTarget, item: { ...genTarget.item, title, description } },
                  prompt,
                  referenceImageUrls,
                  references
                );
              } else {
                const updatePayload: any = { title };
                if (genTarget.item.subtitle !== null && genTarget.item.subtitle !== undefined) {
                  updatePayload.subtitle = description;
                } else {
                  updatePayload.body_md = description;
                }
                const { error } = await supabase
                   .from("wellness_sections" as never)
                   .update(updatePayload as never)
                   .eq("id", genTarget.item.id);
                if (error) {
                  toast.error("Speichern fehlgeschlagen: " + error.message);
                  return;
                }
                await runGenerate(
                  { ...genTarget, item: { ...genTarget.item, ...updatePayload } },
                  prompt,
                  referenceImageUrls,
                  references
                );
              }
            }}
          />
        )}
      </div>
    </HeidehofAdminLayout>
  );
}

// ---------- SectionEditor ----------

interface SectionEditorProps {
  section: Section;
  busy: boolean;
  onChange: () => void;
  onUpload: (file: File) => void;
  onGenerate: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

const ICON_SUGGESTIONS = [
  "Waves", "Sun", "Sparkles", "Clock", "Flame", "Droplet", "TreePine", "Moon",
  "Dumbbell", "Users", "Utensils", "Coffee", "Wine", "MapPin", "Star", "Heart",
];

function SectionEditor({ section, busy, onChange, onUpload, onGenerate, onDelete, onToggle }: SectionEditorProps) {
  const [draft, setDraft] = useState({
    eyebrow: section.eyebrow ?? "Erlebniswelt",
    title: section.title,
    subtitle: section.subtitle ?? "",
    body_md: section.body_md ?? "",
    opening_hours: section.opening_hours ?? "",
    features: (section.features ?? []) as SectionFeature[],
  });
  const [saving, setSaving] = useState(false);

  const updateFeature = (i: number, patch: Partial<SectionFeature>) => {
    const next = [...draft.features];
    next[i] = { ...next[i], ...patch };
    setDraft({ ...draft, features: next });
  };
  const addFeature = () => setDraft({ ...draft, features: [...draft.features, { icon: "Sparkles", label: "" }] });
  const removeFeature = (i: number) => setDraft({ ...draft, features: draft.features.filter((_, idx) => idx !== i) });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("wellness_sections" as never)
      .update({
        eyebrow: draft.eyebrow.trim() || null,
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim() || null,
        body_md: draft.body_md,
        opening_hours: draft.opening_hours.trim() || null,
        features: draft.features.filter((f) => f.label.trim()),
      } as never)
      .eq("id", section.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Gespeichert"); onChange(); }
  };

  return (
    <Card className={`p-4 space-y-3 ${!section.is_active ? "opacity-50" : ""}`}>
      {section.hero_image_url && <img src={section.hero_image_url} alt={section.title} className="w-full h-40 object-cover rounded" />}
      <div className="text-xs text-muted-foreground">{section.page} · {section.slug}</div>

      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Eyebrow (z.B. Erlebniswelt)" value={draft.eyebrow} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} />
        <Input placeholder="Öffnungszeiten" value={draft.opening_hours} onChange={(e) => setDraft({ ...draft, opening_hours: e.target.value })} />
      </div>
      <Input placeholder="Titel" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      <Input placeholder="Untertitel" value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
      <Textarea rows={4} placeholder="Beschreibung (Markdown)" value={draft.body_md} onChange={(e) => setDraft({ ...draft, body_md: e.target.value })} />

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Feature-Kacheln (2×2)</div>
          <Button size="sm" variant="outline" onClick={addFeature}><Plus className="w-3 h-3 mr-1" />Feature</Button>
        </div>
        {draft.features.map((f, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              list={`icons-${section.id}`}
              className="w-36"
              placeholder="Icon"
              value={f.icon}
              onChange={(e) => updateFeature(i, { icon: e.target.value })}
            />
            <Input
              className="flex-1"
              placeholder="Label (z.B. Mittagessen ab 11:30 Uhr)"
              value={f.label}
              onChange={(e) => updateFeature(i, { label: e.target.value })}
            />
            <Button size="icon" variant="ghost" onClick={() => removeFeature(i)}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
        <datalist id={`icons-${section.id}`}>
          {ICON_SUGGESTIONS.map((n) => <option key={n} value={n} />)}
        </datalist>
        <p className="text-[10px] text-muted-foreground">
          Icon-Namen aus lucide-react (z.B. Waves, Flame, Dumbbell, Utensils, Clock, Sparkles).
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}Speichern
        </Button>
        <Button size="sm" variant="outline" onClick={onGenerate} disabled={busy}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} KI-Bild
        </Button>
        <label className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded cursor-pointer hover:bg-accent">
          <Upload className="w-3 h-3" /> Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
        <Button size="sm" variant="ghost" onClick={onToggle}>{section.is_active ? "Deaktiv." : "Aktiv."}</Button>
        <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="w-3 h-3" /></Button>
      </div>
    </Card>
  );
}

