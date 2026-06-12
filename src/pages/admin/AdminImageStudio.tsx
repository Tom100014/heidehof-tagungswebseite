import { useEffect, useMemo, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Wand2, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadTemplates, type ImageStyleTemplate } from "@/services/images/templates-service";

export default function AdminImageStudio() {
  const [templates, setTemplates] = useState<ImageStyleTemplate[]>([]);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dishes, setDishes] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  const refresh = async () => {
    setLoadingTpl(true);
    try {
      const tpls = await loadTemplates();
      setTemplates(tpls);
      if (!selectedId && tpls.length) setSelectedId(tpls[0].id);
    } catch (e) {
      toast.error("Vorlagen konnten nicht geladen werden");
      console.error(e);
    } finally {
      setLoadingTpl(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleGenerate = async () => {
    if (!selected) {
      toast.error("Bitte zuerst eine Vorlage auswählen");
      return;
    }
    setGenerating(true);
    setResultUrl(null);
    try {
      const dishList = dishes
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [t, ...rest] = line.split("–");
          return { title: t.trim(), description: rest.join("–").trim() || null };
        });

      const layoutPrompt = [
        selected.layout_instructions,
        selected.description,
        title ? `Titel/Anlass: ${title}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const { data, error } = await supabase.functions.invoke("generate-menu-card", {
        body: {
          service_date: new Date().toISOString().slice(0, 10),
          meal_type: selected.label,
          dishes: dishList,
          notes: title || null,
          layout_image_url: selected.preview_url || null,
          layout_prompt: layoutPrompt,
          custom_prompt: customPrompt.trim() || undefined,
        },
      });
      if (error) throw error;
      const url: string | undefined = data?.image_url || data?.imageUrl || data?.url;
      if (!url) throw new Error("Keine Bild-URL erhalten");
      setResultUrl(url);
      toast.success("Bild erfolgreich erstellt");
    } catch (e) {
      console.error(e);
      toast.error(`Generierung fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      setGenerating(false);
    }
  };

  const cardTemplates = templates.filter((t) => t.category === "card-type");
  const occasionTemplates = templates.filter((t) => t.category === "occasion");

  return (
    <HeidehofAdminLayout title="Bild-Studio">
      <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
        {/* Sidebar: templates */}
        <Card className="border-gold/20 bg-card/40 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Vorlagen</h2>
            <Button size="sm" variant="ghost" onClick={refresh} disabled={loadingTpl}>
              <RefreshCw className={`h-4 w-4 ${loadingTpl ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {loadingTpl && (
            <div className="text-xs text-muted-foreground">Wird geladen…</div>
          )}

          {!loadingTpl && cardTemplates.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Kartentypen
              </div>
              <div className="grid grid-cols-2 gap-2">
                {cardTemplates.map((t) => (
                  <TemplateButton
                    key={t.id}
                    template={t}
                    active={t.id === selectedId}
                    onClick={() => setSelectedId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!loadingTpl && occasionTemplates.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Anlässe
              </div>
              <div className="grid grid-cols-2 gap-2">
                {occasionTemplates.map((t) => (
                  <TemplateButton
                    key={t.id}
                    template={t}
                    active={t.id === selectedId}
                    onClick={() => setSelectedId(t.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {!loadingTpl && templates.length === 0 && (
            <div className="text-xs text-muted-foreground">
              Keine Vorlagen vorhanden.
            </div>
          )}
        </Card>

        {/* Main */}
        <div className="space-y-4">
          <Card className="border-gold/20 bg-card/40 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  {selected?.label ?? "Vorlage wählen"}
                </h2>
                {selected?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selected.description}
                  </p>
                )}
              </div>
              {selected && (
                <Badge variant="outline" className="shrink-0">
                  {selected.category}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titel / Anlass (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. Muttertag – 12. Mai"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dishes">Inhalte (eine Zeile pro Eintrag)</Label>
              <Textarea
                id="dishes"
                value={dishes}
                onChange={(e) => setDishes(e.target.value)}
                placeholder={"Spargelcremesuppe – mit Bärlauch-Croûtons\nRinderfilet – Rotweinjus, Kartoffelgratin"}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Format: <code>Titel – Beschreibung</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Custom Prompt (optional, überschreibt alles)</Label>
              <Textarea
                id="prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                placeholder="Lass leer für die Vorlagen-Logik"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={handleGenerate} disabled={generating || !selected}>
                {generating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Bild erstellen
              </Button>
            </div>
          </Card>

          {resultUrl && (
            <Card className="border-gold/20 bg-card/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Ergebnis</h3>
                <a href={resultUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" /> Öffnen
                  </Button>
                </a>
              </div>
              <img
                src={resultUrl}
                alt="Generiertes Bild"
                className="w-full rounded-md border border-border"
              />
            </Card>
          )}
        </div>
      </div>
    </HeidehofAdminLayout>
  );
}

function TemplateButton({
  template,
  active,
  onClick,
}: {
  template: ImageStyleTemplate;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-start gap-1 rounded-md border p-2 text-left transition ${
        active
          ? "border-primary bg-primary/10"
          : "border-border bg-background/40 hover:border-primary/50"
      }`}
    >
      <div className="flex w-full items-center gap-2">
        <span className="text-base leading-none">{template.emoji ?? "✨"}</span>
        <span className="text-xs font-medium truncate">{template.label}</span>
      </div>
      {template.preview_url && (
        <img
          src={template.preview_url}
          alt={template.label}
          className="h-16 w-full rounded object-cover"
          loading="lazy"
        />
      )}
    </button>
  );
}
