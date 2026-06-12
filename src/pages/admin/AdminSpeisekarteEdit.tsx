import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { detectAllergens, detectDietFlags, ALLERGEN_LABELS } from "@/lib/menu/allergen-detector";

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

export default function AdminSpeisekarteEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [edit, setEdit] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("food_menu" as never).select("*").eq("id", id).maybeSingle();
      if (error) toast.error(error.message);
      setEdit((data as unknown as Food) ?? null);
      setLoading(false);
    })();
  }, [id]);

  const back = () => navigate("/admin/speisekarte");

  const save = async () => {
    if (!edit) return;
    setSaving(true);
    const { id: rid, ...rest } = edit;
    const { error } = await supabase.from("food_menu" as never).update(rest as never).eq("id", rid);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gespeichert");
    back();
  };

  return (
    <HeidehofAdminLayout title="Gericht bearbeiten">
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={back}><ArrowLeft className="w-4 h-4 mr-2" />Zurück</Button>
          {edit && (
            <Button onClick={save} disabled={saving} className="bg-gold text-background hover:bg-gold/90">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          )}
        </div>

        {loading ? (
          <Card className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></Card>
        ) : !edit ? (
          <Card className="p-12 text-center text-muted-foreground">Gericht nicht gefunden.</Card>
        ) : (
          <Card className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <Input placeholder="Titel" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
              <Select value={edit.course} onValueChange={(v) => setEdit({ ...edit, course: v as Course })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COURSES.map((c) => <SelectItem key={c} value={c}>{COURSE_LABELS[c]}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Preis-Label (z.B. 24,50 €)" value={edit.price_label ?? ""} onChange={(e) => setEdit({ ...edit, price_label: e.target.value })} />
              <Input type="number" step="0.01" placeholder="Preis €" value={edit.price_eur ?? ""} onChange={(e) => setEdit({ ...edit, price_eur: e.target.value ? Number(e.target.value) : null })} />
              <div className="flex gap-2">
                <Input placeholder="Allergene (Komma)" value={(edit.allergens ?? []).join(", ")} onChange={(e) => setEdit({ ...edit, allergens: e.target.value.split(",").map((a) => a.trim()).filter(Boolean) })} />
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const codes = detectAllergens(edit.title, edit.description);
                  const flags = detectDietFlags(edit.title, edit.description);
                  setEdit({ ...edit, allergens: codes, ...flags });
                  toast.success(codes.length ? "Erkannt: " + codes.map((c) => ALLERGEN_LABELS[c]).join(", ") : "Keine Allergene erkannt");
                }}>Auto</Button>
              </div>
              <Input type="number" placeholder="Sortierung" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: Number(e.target.value) || 0 })} />
            </div>
            <Textarea placeholder="Beschreibung" value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2"><Checkbox checked={edit.is_vegan} onCheckedChange={(v) => setEdit({ ...edit, is_vegan: !!v })} /> Vegan</label>
              <label className="flex items-center gap-2"><Checkbox checked={edit.is_vegetarian} onCheckedChange={(v) => setEdit({ ...edit, is_vegetarian: !!v })} /> Vegetarisch</label>
              <label className="flex items-center gap-2"><Checkbox checked={edit.is_glutenfree} onCheckedChange={(v) => setEdit({ ...edit, is_glutenfree: !!v })} /> Glutenfrei</label>
              <label className="flex items-center gap-2"><Checkbox checked={edit.is_active} onCheckedChange={(v) => setEdit({ ...edit, is_active: !!v })} /> Aktiv</label>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Bild-URL</label>
              <Input placeholder="https://..." value={edit.image_url ?? ""} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} />
              {edit.image_url && <img src={edit.image_url} alt="" className="mt-3 max-h-60 rounded border border-border/60" />}
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">KI-Bild Prompt</label>
              <Textarea rows={4} placeholder="z.B. Studio-Foto, Top-Down, dunkler Schiefer-Untergrund, warmes Licht ..." value={edit.image_prompt ?? ""} onChange={(e) => setEdit({ ...edit, image_prompt: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button variant="outline" onClick={back}>Abbrechen</Button>
              <Button onClick={save} disabled={saving} className="bg-gold text-background hover:bg-gold/90">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern & zurück
              </Button>
            </div>
          </Card>
        )}
      </div>
    </HeidehofAdminLayout>
  );
}
