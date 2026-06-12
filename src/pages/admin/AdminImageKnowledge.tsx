import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Image as ImageIcon, Loader2, ListFilter, Search } from "lucide-react";
import { toast } from "sonner";
import { confirmAction } from "@/components/admin/ConfirmDialog";
import { type PromptLayout, type HotelReferenceImage } from "@/services/images/reference-library";

const CATEGORIES = [
  { value: "menu", label: "Speisekarte / Gastronomie" },
  { value: "wellness", label: "Wellness & Spa" },
  { value: "rooms", label: "Zimmer & Räume" },
  { value: "marketing", label: "Marketing / Sonstiges" },
];

export default function AdminImageKnowledge() {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState<PromptLayout[]>([]);
  const [refImages, setRefImages] = useState<HotelReferenceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: layoutData, error: layoutErr } = await supabase
        .from("prompt_layouts" as never)
        .select("*")
        .order("sort_order", { ascending: true });
      if (layoutErr) throw layoutErr;
      setLayouts((layoutData ?? []) as unknown as PromptLayout[]);

      const { data: refData, error: refErr } = await supabase
        .from("hotel_reference_images" as never)
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (refErr) throw refErr;
      setRefImages((refData ?? []) as unknown as HotelReferenceImage[]);
    } catch (e) {
      toast.error("Laden fehlgeschlagen: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const handleToggleActive = async (layout: PromptLayout, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("prompt_layouts" as never)
        .update({ is_active: isActive } as never)
        .eq("id", layout.id);
      if (error) throw error;
      setLayouts(prev => prev.map(l => l.id === layout.id ? { ...l, is_active: isActive } : l));
    } catch (e) {
      toast.error("Statusaktualisierung fehlgeschlagen: " + (e as Error).message);
    }
  };

  const handleDelete = async (layout: PromptLayout) => {
    if (layout.is_builtin) { toast.error("System-Presets können nicht gelöscht werden."); return; }
    const confirm = await confirmAction({
      description: `Preset "${layout.label}" wirklich löschen?`,
      destructive: true,
      confirmLabel: "Löschen",
    });
    if (!confirm) return;
    try {
      const { error } = await supabase.from("prompt_layouts" as never).delete().eq("id", layout.id);
      if (error) throw error;
      setLayouts(prev => prev.filter(l => l.id !== layout.id));
      toast.success("Preset gelöscht.");
    } catch (e) {
      toast.error("Löschen fehlgeschlagen: " + (e as Error).message);
    }
  };

  const filteredLayouts = useMemo(() => layouts.filter(l => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = l.label.toLowerCase().includes(s) || l.slug.toLowerCase().includes(s) || (l.prompt_text || "").toLowerCase().includes(s);
    const matchesCategory = filterCategory === "all" || l.category === filterCategory;
    return matchesSearch && matchesCategory;
  }), [layouts, searchTerm, filterCategory]);

  return (
    <HeidehofAdminLayout title="Standard Bild-Prompts & Presets">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-sm text-zinc-400 max-w-2xl">
            KI-Bild-Presets. Jede Referenz bekommt eine Rolle (Hintergrund, Teller, Besteck …),
            damit die KI weiß, wofür sie das Bild nutzen soll.
          </p>
          <Button
            onClick={() => navigate("/admin/image-prompts/neu")}
            className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold border-0 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-1 stroke-[2.5]" />
            Neues Preset
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suchen nach Name, Code-Slug oder Prompt..."
              className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100"
            />
          </div>
          <div className="w-full sm:w-[220px]">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <ListFilter className="h-4 w-4 mr-2 text-zinc-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-8 w-8 mb-3 animate-spin text-amber-500" />
            Lade Prompt-Presets ...
          </div>
        ) : filteredLayouts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
            <ImageIcon className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">Keine Presets gefunden</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLayouts.map(layout => {
              const selectedRefs = refImages.filter(img => layout.reference_image_ids?.includes(img.id));
              const categoryLabel = CATEGORIES.find(c => c.value === layout.category)?.label || layout.category;
              return (
                <Card
                  key={layout.id}
                  className={`border-zinc-800 bg-zinc-900/30 backdrop-blur-md hover:border-amber-500/30 relative overflow-hidden flex flex-col cursor-pointer ${!layout.is_active ? "opacity-60" : ""}`}
                  onClick={() => navigate(`/admin/image-prompts/${layout.id}`)}
                >
                  <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{layout.emoji || "✨"}</span>
                          <div>
                            <h3 className="font-semibold text-zinc-200">{layout.label}</h3>
                            <code className="text-xs text-zinc-500 font-mono">{layout.slug}</code>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {layout.is_builtin && <Badge className="bg-zinc-800 text-zinc-400 border-0 text-xs">System</Badge>}
                          <Switch
                            checked={layout.is_active}
                            onCheckedChange={(checked) => handleToggleActive(layout, checked)}
                            className="data-[state=checked]:bg-amber-600"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2 italic">
                        {layout.description || "Keine Beschreibung."}
                      </p>
                      <div className="mt-3 p-3 rounded-lg bg-zinc-950/80 border border-zinc-900/60">
                        <p className="text-xs text-zinc-300 font-mono leading-relaxed line-clamp-3">
                          {layout.prompt_text || "Kein Prompt hinterlegt."}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 mt-auto border-t border-zinc-800/60 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                          Referenzen ({selectedRefs.length}/6)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                        {selectedRefs.length === 0 ? (
                          <span className="text-xs text-zinc-600 italic">Keine Referenzen</span>
                        ) : (
                          selectedRefs.map((ref, i) => (
                            <div key={ref.id} className="relative w-9 h-9 rounded-md overflow-hidden border border-zinc-800" title={ref.label}>
                              <img src={ref.image_url} alt={ref.label} className="w-full h-full object-cover" />
                              <div className="absolute top-0 left-0 h-3.5 w-3.5 bg-amber-500 text-zinc-950 text-[9px] font-bold flex items-center justify-center">
                                {i + 1}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-zinc-500 font-mono">{categoryLabel}</span>
                        <div className="flex gap-2">
                          {!layout.is_builtin && (
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(layout)} className="h-8 px-2 text-zinc-500 hover:text-red-400 border border-zinc-800">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/image-prompts/${layout.id}`)} className="h-8 px-3 text-zinc-400 hover:text-amber-400 border border-zinc-800 gap-1">
                            <Pencil className="h-3.5 w-3.5" />
                            Bearbeiten
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </HeidehofAdminLayout>
  );
}
