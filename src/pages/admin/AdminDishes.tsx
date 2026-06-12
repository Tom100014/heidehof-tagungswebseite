import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { dishSchema, validateOrError } from "@/utils/admin-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Sparkles, Loader2, ImageIcon, Wand2, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { ImageGenerationDialog } from "@/components/admin/ImageGenerationDialog";

type Category = "vegetarian" | "meat" | "fish" | "vegan" | "dessert" | "starter";
type Meal = "breakfast" | "lunch" | "coffee" | "dinner";

interface Dish {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  meal_type: Meal;
  service_date: string;
  is_active: boolean;
  image_url: string | null;
  image_prompt: string | null;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "vegetarian", label: "Vegetarisch" },
  { value: "meat", label: "Fleisch" },
  { value: "fish", label: "Fisch" },
  { value: "vegan", label: "Vegan" },
  { value: "starter", label: "Vorspeise" },
  { value: "dessert", label: "Dessert" },
];

const MEALS: { value: Meal; label: string }[] = [
  { value: "breakfast", label: "Frühstück" },
  { value: "lunch", label: "Mittag" },
  { value: "coffee", label: "Kaffeepause" },
  { value: "dinner", label: "Abend" },
];

export default function AdminDishes() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  const [filterDate, setFilterDate] = useState(today);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [genTarget, setGenTarget] = useState<Dish | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "vegetarian" as Category,
    meal_type: "lunch" as Meal,
    service_date: today,
    image_prompt: "",
  });

  const load = async () => {
    const { data } = await supabase
      .from("conference_dishes" as never)
      .select("*")
      .eq("service_date", filterDate)
      .order("meal_type")
      .order("category");
    setDishes((data as unknown as Dish[]) ?? []);
  };

  useEffect(() => {
    load();
  }, [filterDate]);

  const add = async () => {
    const validation = validateOrError(dishSchema, {
      title: form.title,
      description: form.description,
      category: form.category,
      meal_type: form.meal_type,
      service_date: form.service_date,
    });
    if (!validation.ok) {
      toast.error((validation as { ok: false; error: string }).error);
      return;
    }
    const { error } = await supabase.from("conference_dishes" as never).insert({
      title: form.title,
      description: form.description,
      category: form.category,
      meal_type: form.meal_type,
      service_date: form.service_date,
      image_prompt: form.image_prompt || null,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Speise hinzugefügt");
    setForm({ ...form, title: "", description: "", image_prompt: "" });
    if (form.service_date === filterDate) load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("conference_dishes" as never).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const runGenerate = async (
    item: Dish,
    prompt: string,
    refUrls: string[],
    references?: Array<{ image_url: string; role: string; user_notes?: string }>
  ) => {
    setGeneratingId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-dish-image", {
        body: {
          dish_id: item.id,
          title: item.title,
          description: item.description,
          prompt: prompt,
          reference_image_urls: refUrls,
          references,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Fehler");
      toast.success("Bild generiert");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGeneratingId(null);
    }
  };

  const removeImage = async (dish: Dish) => {
    if (!(await confirmAction({ description: "Bild wirklich löschen?", destructive: true, confirmLabel: "Bestätigen" }))) return;
    const { error } = await supabase
      .from("conference_dishes" as never)
      .update({ image_url: null, image_storage_path: null } as never)
      .eq("id", dish.id);
    if (error) return toast.error(error.message);
    toast.success("Bild entfernt");
    load();
  };

  return (
    <HeidehofAdminLayout title="Speisen-Karte">
      <div className="luxe-bg -m-6 p-6 md:p-10 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 reveal">
            <div className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Cuisine du Jour</div>
            <h1 className="font-display text-5xl gold-text mt-2">Speisen-Atelier</h1>
            <p className="text-amber-100/65 mt-2 max-w-2xl">
              Pflegen Sie das tägliche Menü und lassen Sie pro Speise ein appetitliches KI-Foto im
              Heidehof-Stil generieren – mit eigenem Prompt für volle Kontrolle.
            </p>
            <div className="gold-divider mt-6" />
          </div>

          <Card className="glass-card rounded-3xl p-7 mb-8 reveal reveal-delay-1 border-amber-300/15">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-amber-300/80">Datum</label>
                <Input
                  type="date"
                  value={form.service_date}
                  onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                  className="mt-2 bg-stone-900/60 border-amber-300/20 text-amber-100 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-amber-300/80">Mahlzeit</label>
                <Select value={form.meal_type} onValueChange={(v) => setForm({ ...form, meal_type: v as Meal })}>
                  <SelectTrigger className="mt-2 bg-stone-900/60 border-amber-300/20 text-amber-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEALS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-amber-300/80">Kategorie</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger className="mt-2 bg-stone-900/60 border-amber-300/20 text-amber-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.25em] text-amber-300/80">Titel</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="z.B. Rinderfilet mit Pfifferlingen"
                  className="mt-2 bg-stone-900/60 border-amber-300/20 text-amber-100"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs uppercase tracking-[0.25em] text-amber-300/80">Beschreibung</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Beschreibung (optional)"
                className="mt-2 bg-stone-900/60 border-amber-300/20 text-amber-100"
              />
            </div>
            <div className="mt-4">
              <label className="text-xs uppercase tracking-[0.25em] text-amber-300/80 flex items-center gap-2">
                <Wand2 className="w-3 h-3" /> Bild-Prompt (optional, sonst automatisch)
              </label>
              <Textarea
                value={form.image_prompt}
                onChange={(e) => setForm({ ...form, image_prompt: e.target.value })}
                placeholder="z.B. Top-Ansicht, dunkler Schiefer, dramatisches Licht, gold-grüne Akzente, Michelin-Stil..."
                className="mt-2 bg-stone-900/60 border-amber-300/20 text-amber-100 min-h-[80px]"
              />
            </div>
            <Button onClick={add} className="btn-luxe mt-5">
              <Plus className="w-4 h-4 mr-2" /> Speise hinzufügen
            </Button>
          </Card>

          <Card className="glass-card rounded-2xl p-4 mb-6 border-amber-300/10 flex items-center gap-3">
            <label className="text-xs uppercase tracking-[0.25em] text-amber-300/80">Anzeigen für:</label>
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto bg-stone-900/60 border-amber-300/20 text-amber-100 [color-scheme:dark]"
            />
          </Card>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {dishes.map((d, i) => {
              const isGen = generatingId === d.id;
              return (
                <Card
                  key={d.id}
                  className="glass-card overflow-hidden border-amber-300/15 reveal flex flex-col"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="relative aspect-[4/3] bg-stone-900/60 overflow-hidden">
                    {d.image_url ? (
                      <img src={d.image_url} alt={d.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-amber-300/40">
                        <ImageIcon className="w-10 h-10 mb-2" />
                        <span className="text-xs uppercase tracking-widest">Noch kein Bild</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-amber-200 border border-amber-300/30">
                        {MEALS.find((m) => m.value === d.meal_type)?.label}
                      </span>
                      <span className="text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 text-amber-200/80 border border-amber-300/20">
                        {CATEGORIES.find((c) => c.value === d.category)?.label}
                      </span>
                    </div>
                    {d.image_url && (
                      <button
                        onClick={() => removeImage(d)}
                        title="Bild löschen"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-red-500/80 text-white flex items-center justify-center backdrop-blur transition-colors"
                      >
                        <ImageOff className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="font-serif text-xl text-amber-100">{d.title}</div>
                    {d.description && (
                      <div className="text-sm text-amber-100/60 mt-1">{d.description}</div>
                    )}

                    <div className="flex gap-2 mt-auto pt-3 border-t border-amber-300/10">
                      <Button
                        size="sm"
                        onClick={() => setGenTarget(d)}
                        disabled={isGen}
                        className="btn-luxe flex-1"
                      >
                        {isGen ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {d.image_url ? "Neu generieren" : "Bild generieren"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(d.id)}
                        className="text-red-300/80 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
            {dishes.length === 0 && (
              <div className="glass-card rounded-3xl p-16 text-center col-span-full text-amber-100/60">
                <Sparkles className="w-10 h-10 mx-auto text-amber-300/60 mb-3" />
                Noch keine Speisen für diesen Tag.
              </div>
            )}
          </div>
        </div>
        {genTarget && (
          <ImageGenerationDialog
            open={!!genTarget}
            onOpenChange={(o) => !o && setGenTarget(null)}
            scope="conference_menu"
            entityTitle={genTarget.title}
            entityDescription={genTarget.description ?? ""}
            defaultPrompt={genTarget.image_prompt ?? ""}
            onGenerate={async ({ prompt, referenceImageUrls, references, title, description }) => {
              const { error } = await supabase
                .from("conference_dishes" as never)
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
