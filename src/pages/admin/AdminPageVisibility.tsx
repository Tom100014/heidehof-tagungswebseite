import { useEffect, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Clock, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface PageRow {
  slug: string;
  label: string;
  category: string;
  is_visible: boolean;
  coming_soon: boolean;
  sort_order: number;
}

export default function AdminPageVisibility() {
  const [rows, setRows] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_visibility")
      .select("*")
      .order("sort_order");
    if (error) toast.error(error.message);
    setRows((data as PageRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (slug: string, patch: Partial<PageRow>) => {
    const { error } = await supabase.from("page_visibility").update(patch).eq("slug", slug);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.slug === slug ? { ...x, ...patch } : x)));
  };

  const move = async (slug: string, dir: -1 | 1) => {
    const idx = rows.findIndex((r) => r.slug === slug);
    const target = rows[idx + dir];
    if (!target) return;
    await update(slug, { sort_order: target.sort_order });
    await update(target.slug, { sort_order: rows[idx].sort_order });
    load();
  };

  const addRow = async () => {
    if (!newSlug.trim() || !newLabel.trim()) return;
    const { error } = await supabase.from("page_visibility").insert({
      slug: newSlug.trim(),
      label: newLabel.trim(),
      category: "page",
      sort_order: (rows[rows.length - 1]?.sort_order ?? 0) + 10,
    });
    if (error) return toast.error(error.message);
    setNewSlug("");
    setNewLabel("");
    load();
  };

  const removeRow = async (slug: string) => {
    if (!confirm(`Eintrag "${slug}" wirklich entfernen?`)) return;
    const { error } = await supabase.from("page_visibility").delete().eq("slug", slug);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <HeidehofAdminLayout title="Seiten-Sichtbarkeit">
      <div className="space-y-5 max-w-[1100px]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Landing &amp; Navigation</p>
          <h2 className="font-serif text-2xl text-foreground mt-1">Welche Seiten sind sichtbar?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schalte einzelne Unterseiten oder Landing-Sektionen ein/aus. „Coming soon" zeigt einen Hinweis statt der Seite.
          </p>
        </div>

        <Card className="bg-white border-border p-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Lade …</div>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((r, i) => (
                <div key={r.slug} className="flex items-center gap-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => move(r.slug, -1)}
                      disabled={i === 0}
                      className="p-0.5 disabled:opacity-30"
                      aria-label="Hoch"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => move(r.slug, 1)}
                      disabled={i === rows.length - 1}
                      className="p-0.5 disabled:opacity-30"
                      aria-label="Runter"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{r.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {r.category}
                      </Badge>
                      {r.coming_soon && (
                        <Badge className="bg-amber-100 text-amber-900 text-xs">Coming soon</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">/{r.slug}</div>
                  </div>
                  <label className="flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <Switch
                      checked={r.coming_soon}
                      onCheckedChange={(v) => update(r.slug, { coming_soon: v })}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    {r.is_visible ? (
                      <Eye className="w-3.5 h-3.5 text-zinc-600" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <Switch
                      checked={r.is_visible}
                      onCheckedChange={(v) => update(r.slug, { is_visible: v })}
                    />
                  </label>
                  <Button variant="ghost" size="icon" onClick={() => removeRow(r.slug)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="bg-white border-border p-4">
          <h3 className="font-serif text-base text-foreground mb-3">Neuen Eintrag hinzufügen</h3>
          <div className="flex gap-2">
            <Input
              placeholder="slug (z.B. neue-seite)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
            />
            <Input
              placeholder="Anzeigename"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Button onClick={addRow}>
              <Plus className="w-4 h-4 mr-1" /> Hinzufügen
            </Button>
          </div>
        </Card>
      </div>
    </HeidehofAdminLayout>
  );
}
