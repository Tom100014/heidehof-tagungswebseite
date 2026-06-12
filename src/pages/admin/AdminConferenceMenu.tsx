import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChefHat, Save, Sparkles, Loader2, CalendarDays, Fish, Beef, Leaf, Image as ImageIcon, ImageOff } from "lucide-react";
import { toast } from "sonner";
import {
  fetchMenuByDate,
  saveMenu,
  generateMenusWithAI,
  regenerateDailyAssets,
  regenerateDishImage,
  fetchMenuImages,
  type ConferenceMenu,
  type MainDish,
} from "@/services/conference/menu-service";


const emptyDish = (type: MainDish["type"]): MainDish => ({
  id: `${type}-${Date.now()}`,
  name: "",
  description: "",
  type,
});

const emptyMenu = (date: string): ConferenceMenu => ({
  menu_date: date,
  lunch_appetizer: "",
  lunch_main_dish_fish: emptyDish("fish"),
  lunch_main_dish_meat: emptyDish("meat"),
  lunch_main_dish_vegetarian: emptyDish("vegetarian"),
  lunch_dessert: "",
  dinner_appetizer: "",
  dinner_main_dish_fish: emptyDish("fish"),
  dinner_main_dish_meat: emptyDish("meat"),
  dinner_main_dish_vegetarian: emptyDish("vegetarian"),
  dinner_dessert: "",
});

export default function AdminConferenceMenu() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [menu, setMenu] = useState<ConferenceMenu>(emptyMenu(today));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("Saisonale, klassisch-moderne Hotelküche, regional inspiriert.");
  const [aiFrom, setAiFrom] = useState(today);
  const [aiTo, setAiTo] = useState(format(new Date(Date.now() + 6 * 86400000), "yyyy-MM-dd"));
  const [aiBusy, setAiBusy] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [imgBusy, setImgBusy] = useState<string | null>(null); // image_type or "__all__"


  const loadImages = async (menuId?: string) => {
    if (!menuId) { setImages({}); return; }
    try { setImages(await fetchMenuImages(menuId)); } catch (e) { console.error(e); }
  };

  const load = async (d: string) => {
    setLoading(true);
    try {
      const existing = await fetchMenuByDate(d);
      const m = existing ?? emptyMenu(d);
      setMenu(m);
      await loadImages(m.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(date); }, [date]);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveMenu({ ...menu, menu_date: date });
      setMenu(saved);
      await loadImages(saved.id);
      toast.success("Tagesmenü gespeichert");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const runAI = async () => {
    setAiBusy(true);
    try {
      const res = await generateMenusWithAI({ dateFrom: aiFrom, dateTo: aiTo, prompt: aiPrompt });
      toast.success(`${res?.menusCreated ?? 0} Menüs erstellt`);
      await load(date);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAiBusy(false);
    }
  };

  const generateAllImages = async () => {
    if (!menu.id) { toast.error("Bitte zuerst das Menü speichern."); return; }
    setImgBusy("__all__");
    try {
      await regenerateDailyAssets(menu.id);
      toast.success("Bilder werden im Hintergrund erstellt – in ca. 30–60 s neu laden.");
      setTimeout(() => { void loadImages(menu.id); }, 35000);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImgBusy(null);
    }
  };

  const generateOneImage = async (imageType: string) => {
    if (!menu.id) { toast.error("Bitte zuerst das Menü speichern."); return; }
    setImgBusy(imageType);
    try {
      await regenerateDishImage(menu.id, imageType);
      toast.success("Bild wird erstellt – kurz warten…");
      setTimeout(() => { void loadImages(menu.id); }, 20000);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImgBusy(null);
    }
  };


  const setDish = (key: keyof ConferenceMenu, patch: Partial<MainDish>) => {
    setMenu((m) => ({ ...m, [key]: { ...(m[key] as MainDish), ...patch } }));
  };

  return (
    <HeidehofAdminLayout title="Tagesmenü zusammenstellen">
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold">Tagungsküche</p>
            <h2 className="text-xl font-bold text-foreground mt-0.5 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-[hsl(var(--apple))]" /> Tagesmenü zusammenstellen
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Vorspeise · 3 Hauptgänge (Fisch / Fleisch / Vegetarisch) · Dessert — Mittag & Abend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 w-[180px]"
              />
            </div>
            <Button
              onClick={generateAllImages}
              disabled={!menu.id || imgBusy !== null}
              variant="outline"
              title={!menu.id ? "Erst speichern" : "Alle fehlenden/Bilder generieren"}
            >
              {imgBusy === "__all__" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
              Alle Bilder generieren
            </Button>
            <Button onClick={save} disabled={saving || loading} className="bg-gold text-background hover:bg-gold/90">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          </div>
        </div>


        <p className="text-xs text-muted-foreground">
          {format(new Date(date + "T12:00:00"), "EEEE, d. MMMM yyyy", { locale: de })}
        </p>

        {/* AI Generator */}
        <Card className="p-4 border-[hsl(var(--apple)/0.25)] bg-[hsl(var(--apple)/0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[hsl(var(--apple))]" />
            <h3 className="font-semibold text-sm text-foreground">KI-Generator (mehrere Tage auf einmal)</h3>
          </div>
          <div className="grid md:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Von</label>
              <Input type="date" value={aiFrom} onChange={(e) => setAiFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Bis</label>
              <Input type="date" value={aiTo} onChange={(e) => setAiTo(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Stil / Wünsche</label>
              <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="z. B. mediterran, vegetarisch betont, regional…" />
            </div>
            <Button onClick={runAI} disabled={aiBusy} variant="outline">
              {aiBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generieren
            </Button>
          </div>
        </Card>

        {/* Menu editor */}
        {loading ? (
          <Card className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></Card>
        ) : (
          <Tabs defaultValue="lunch" className="w-full">
            <TabsList className="bg-muted/50 border border-border p-1 rounded-xl h-auto">
              <TabsTrigger value="lunch" className="data-[state=active]:bg-card data-[state=active]:text-foreground rounded-lg px-4 py-2 text-sm">
                Mittag
              </TabsTrigger>
              <TabsTrigger value="dinner" className="data-[state=active]:bg-card data-[state=active]:text-foreground rounded-lg px-4 py-2 text-sm">
                Abend
              </TabsTrigger>
            </TabsList>

            {(["lunch", "dinner"] as const).map((meal) => {
              const dishImg = (type: string) => {
                const url = images[type];
                const busy = imgBusy === type;
                return (
                  <div className="flex items-center gap-3 pt-2 border-t border-border/40">
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
                      {url ? (
                        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <ImageOff className="w-5 h-5 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-muted-foreground">
                        {url ? "Bild vorhanden" : "Noch kein Bild"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        disabled={!menu.id || imgBusy !== null}
                        onClick={() => generateOneImage(type)}
                        title={!menu.id ? "Erst speichern" : undefined}
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                        {url ? "Bild neu generieren" : "Bild generieren"}
                      </Button>
                    </div>
                  </div>
                );
              };
              return (
              <TabsContent key={meal} value={meal} className="mt-4 space-y-4">
                <Card className="p-5 space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Vorspeise</h4>
                  <Textarea
                    rows={2}
                    placeholder="z. B. Bunter Salat mit Hausdressing"
                    value={meal === "lunch" ? menu.lunch_appetizer : menu.dinner_appetizer}
                    onChange={(e) => setMenu((m) => ({ ...m, [`${meal}_appetizer`]: e.target.value }))}
                  />
                  {dishImg(`${meal}_appetizer`)}
                </Card>

                {(["fish", "meat", "vegetarian"] as const).map((kind) => {
                  const key = `${meal}_main_dish_${kind}` as keyof ConferenceMenu;
                  const dish = menu[key] as MainDish;
                  const Icon = kind === "fish" ? Fish : kind === "meat" ? Beef : Leaf;
                  const label = kind === "fish" ? "Hauptgang · Fisch" : kind === "meat" ? "Hauptgang · Fleisch" : "Hauptgang · Vegetarisch";
                  const imgType = `${meal}_${kind}`;
                  return (
                    <Card key={kind} className="p-5 space-y-3">
                      <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </h4>
                      <Input
                        placeholder="Name des Gerichts"
                        value={dish.name}
                        onChange={(e) => setDish(key, { name: e.target.value })}
                      />
                      <Textarea
                        rows={2}
                        placeholder="Beschreibung / Beilagen"
                        value={dish.description}
                        onChange={(e) => setDish(key, { description: e.target.value })}
                      />
                      {dishImg(imgType)}
                    </Card>
                  );
                })}

                <Card className="p-5 space-y-3">
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Dessert</h4>
                  <Textarea
                    rows={2}
                    placeholder="z. B. Hausgemachtes Tiramisu"
                    value={meal === "lunch" ? menu.lunch_dessert : menu.dinner_dessert}
                    onChange={(e) => setMenu((m) => ({ ...m, [`${meal}_dessert`]: e.target.value }))}
                  />
                  {dishImg(`${meal}_dessert`)}
                </Card>
              </TabsContent>
              );
            })}

          </Tabs>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={save} disabled={saving || loading} className="bg-gold text-background hover:bg-gold/90">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Tagesmenü speichern
          </Button>
        </div>
      </div>
    </HeidehofAdminLayout>
  );
}
