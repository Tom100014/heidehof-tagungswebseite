import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, Wand2, Loader2, Upload, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ImageGenerationDialog } from "@/components/admin/ImageGenerationDialog";
import { ReferenceUploadPanel } from "@/components/admin/ReferenceUploadPanel";
import { detectAllergens, detectDietFlags } from "@/lib/menu/allergen-detector";

type Course = "vorspeise" | "suppe" | "salat" | "hauptgang_fleisch" | "hauptgang_fisch" | "hauptgang_vegi" | "beilage" | "dessert" | "kinder" | "snack";
const COURSES: Course[] = ["vorspeise","suppe","salat","hauptgang_fleisch","hauptgang_fisch","hauptgang_vegi","beilage","dessert","kinder","snack"];
const COURSE_LABELS: Record<Course, string> = {
  vorspeise: "Vorspeise", suppe: "Suppe", salat: "Salat",
  hauptgang_fleisch: "Hauptgang · Fleisch", hauptgang_fisch: "Hauptgang · Fisch", hauptgang_vegi: "Hauptgang · Vegetarisch",
  beilage: "Beilage", dessert: "Dessert", kinder: "Kinder", snack: "Snack",
};

interface Food {
  id: string; slug: string; title: string; description: string | null; course: Course;
  allergens: string[]; is_vegan: boolean; is_vegetarian: boolean; is_glutenfree: boolean;
  price_label: string | null; price_eur: number | null;
  image_url: string | null; image_prompt: string | null;
  is_active: boolean; sort_order: number;
}

export default function AdminSpeisekarte() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Food[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [genTarget, setGenTarget] = useState<Food | null>(null);
  const [filter, setFilter] = useState<Course | "all">("all");
  const [n, setN] = useState({ title: "", description: "", course: "hauptgang_fleisch" as Course, price_label: "", is_vegan: false, is_vegetarian: false, is_glutenfree: false, allergens: "" });

  const load = async () => {
    const { data } = await supabase.from("food_menu" as never).select("*").order("course").order("sort_order");
    setItems((data as unknown as Food[]) ?? []);
  };
  useEffect(() => { void load(); }, []);

  const autofillFromText = () => {
    if (!n.title && !n.description) return;
    const codes = detectAllergens(n.title, n.description);
    const flags = detectDietFlags(n.title, n.description);
    setN((prev) => ({
      ...prev,
      allergens: prev.allergens.trim() ? prev.allergens : codes.join(", "),
      is_vegan: prev.is_vegan || flags.is_vegan,
      is_vegetarian: prev.is_vegetarian || flags.is_vegetarian,
      is_glutenfree: prev.is_glutenfree || flags.is_glutenfree,
    }));
  };

  const add = async () => {
    if (!n.title) return toast.error("Titel erforderlich");
    const slug = n.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);
    // Auto-Allergene wenn Feld leer
    const allergensList = n.allergens.trim()
      ? n.allergens.split(",").map((a) => a.trim()).filter(Boolean)
      : detectAllergens(n.title, n.description);
    const payload = { ...n, slug, allergens: allergensList };
    const { error } = await supabase.from("food_menu" as never).insert(payload as never);
    if (error) toast.error(error.message); else { toast.success("Hinzugefügt"); setN({ ...n, title: "", description: "", price_label: "", allergens: "" }); await load(); }
  };

  // Bearbeiten erfolgt auf eigener Seite /admin/speisekarte/:id/edit

  const del = async (id: string) => {
    if (!confirm("Wirklich löschen?")) return;
    const { error } = await supabase.from("food_menu" as never).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Gelöscht"); await load(); }
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("food_menu" as never).update({ is_active: !is_active } as never).eq("id", id);
    await load();
  };

  const runGenerate = async (
    item: Food,
    prompt: string,
    refUrls: string[],
    references?: Array<{ image_url: string; role: string; user_notes?: string }>
  ) => {
    setBusy(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-menu-image", {
        body: { kind: "food", record_id: item.id, prompt_override: prompt, reference_image_urls: refUrls, references },
      });
      if (error || (data as { error?: string })?.error) throw new Error(error?.message ?? (data as { error?: string }).error);
      toast.success("Bild generiert"); await load();
    } catch (e) { toast.error("Fehler: " + (e as Error).message); } finally { setBusy(null); }
  };

  const upload = async (item: Food, file: File) => {
    setBusy(item.id);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `food/${item.id}-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("menu-media").upload(path, file, { upsert: true });
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from("menu-media").getPublicUrl(path);
      await supabase.from("food_menu" as never).update({ image_url: pub.publicUrl, image_storage_path: path } as never).eq("id", item.id);
      toast.success("Hochgeladen"); await load();
    } catch (e) { toast.error("Upload-Fehler: " + (e as Error).message); } finally { setBusy(null); }
  };

  const visible = filter === "all" ? items : items.filter((i) => i.course === filter);

  return (
    <HeidehofAdminLayout title="Speisekarte">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <ReferenceUploadPanel scope="food" />
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Neues Gericht</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Titel" value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} />
            <Select value={n.course} onValueChange={(v) => setN({ ...n, course: v as Course })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COURSES.map((c) => <SelectItem key={c} value={c}>{COURSE_LABELS[c]}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Preis (z.B. 24,50 €)" value={n.price_label} onChange={(e) => setN({ ...n, price_label: e.target.value })} />
            <div className="flex gap-2">
              <Input placeholder="Allergene (Komma getrennt) – auto wenn leer" value={n.allergens} onChange={(e) => setN({ ...n, allergens: e.target.value })} />
              <Button type="button" variant="outline" size="sm" onClick={autofillFromText} title="Allergene & Diät automatisch aus Titel/Beschreibung erkennen">Auto</Button>
            </div>
          </div>
          <Textarea placeholder="Beschreibung" value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} />
          <div className="flex gap-6 text-sm">
            <label className="flex items-center gap-2"><Checkbox checked={n.is_vegan} onCheckedChange={(v) => setN({ ...n, is_vegan: !!v })} /> Vegan</label>
            <label className="flex items-center gap-2"><Checkbox checked={n.is_vegetarian} onCheckedChange={(v) => setN({ ...n, is_vegetarian: !!v })} /> Vegetarisch</label>
            <label className="flex items-center gap-2"><Checkbox checked={n.is_glutenfree} onCheckedChange={(v) => setN({ ...n, is_glutenfree: !!v })} /> Glutenfrei</label>
          </div>
          <Button onClick={add}><Plus className="w-4 h-4 mr-2" />Hinzufügen</Button>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Alle ({items.length})</Button>
          {COURSES.map((c) => {
            const count = items.filter((i) => i.course === c).length;
            if (!count) return null;
            return <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)}>{COURSE_LABELS[c]} ({count})</Button>;
          })}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((d) => (
            <Card key={d.id} className={`p-4 ${!d.is_active ? "opacity-50" : ""}`}>
              {d.image_url && <img src={d.image_url} alt={d.title} className="w-full h-32 object-cover rounded mb-3" />}
              <div className="font-semibold">{d.title}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {COURSE_LABELS[d.course]} · {d.price_label}
                {d.is_vegan && " · vegan"}{d.is_vegetarian && !d.is_vegan && " · vegetarisch"}{d.is_glutenfree && " · glutenfrei"}
              </div>
              {d.description && <p className="text-sm mb-3 line-clamp-2">{d.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/speisekarte/${d.id}/edit`)}><Pencil className="w-3 h-3 mr-1" />Bearbeiten</Button>
                <Button size="sm" variant="outline" onClick={() => setGenTarget(d)} disabled={busy === d.id}>
                  {busy === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} KI-Bild
                </Button>
                <label className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded cursor-pointer hover:bg-accent">
                  <Upload className="w-3 h-3" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(d, e.target.files[0])} />
                </label>
                <Button size="sm" variant="ghost" onClick={() => toggle(d.id, d.is_active)}>{d.is_active ? "Deaktiv." : "Aktiv."}</Button>
                <Button size="sm" variant="ghost" onClick={() => del(d.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </Card>
          ))}
        </div>

        {genTarget && (
          <ImageGenerationDialog
            open={!!genTarget}
            onOpenChange={(o) => !o && setGenTarget(null)}
            scope="food"
            entityTitle={genTarget.title}
            entityDescription={genTarget.description ?? ""}
            defaultPrompt={genTarget.image_prompt ?? ""}
            onGenerate={async ({ prompt, referenceImageUrls, references, title, description }) => {
              const { error } = await supabase
                .from("food_menu" as never)
                .update({ title, description } as never)
                .eq("id", genTarget.id);
              if (error) {
                toast.error("Speichern fehlgeschlagen: " + error.message);
                return;
              }
              await runGenerate({ ...genTarget, title, description }, prompt, referenceImageUrls, references);
            }}
          />
        )}
      </div>
    </HeidehofAdminLayout>
  );
}
