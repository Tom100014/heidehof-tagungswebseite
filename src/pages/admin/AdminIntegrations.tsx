import { useEffect, useMemo, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, ExternalLink, Globe, Key, MinusCircle, Plug, Save } from "lucide-react";

interface Integration {
  id: string;
  key: string;
  label: string;
  category: string;
  description: string | null;
  is_enabled: boolean;
  status: string;
  required_secrets: string[];
  config: Record<string, unknown>;
  last_check_at: string | null;
  last_error: string | null;
  sort_order: number;
}

interface EditingIntegration {
  id: string;
  label: string;
  description: string;
  status: string;
  configText: string;
}

const PUBLIC_URL = "https://hotel-dream-guide.lovable.app";

const CATEGORY_LABELS: Record<string, string> = {
  ai: "KI",
  voice: "Sprache",
  email: "E-Mail",
  messaging: "Messaging",
  crm: "CRM",
  leads: "Lead-Quellen",
  analytics: "Analytics",
  storage: "Cloud-Speicher",
};

function StatusBadge({ status, enabled }: { status: string; enabled: boolean }) {
  if (!enabled)
    return (
      <Badge variant="outline" className="text-xs">
        <MinusCircle className="w-3 h-3 mr-1" /> Aus
      </Badge>
    );
  if (status === "connected")
    return (
      <Badge className="bg-zinc-100 text-zinc-900 text-xs">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Verbunden
      </Badge>
    );
  if (status === "error")
    return (
      <Badge className="bg-red-100 text-red-900 text-xs">
        <AlertCircle className="w-3 h-3 mr-1" /> Fehler
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-xs">
      Nicht konfiguriert
    </Badge>
  );
}

export default function AdminIntegrations() {
  const [rows, setRows] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingIntegration | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("integration_settings")
      .select("*")
      .order("sort_order");
    if (error) toast.error(error.message);
    setRows((data as Integration[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: string, is_enabled: boolean) => {
    const { error } = await supabase
      .from("integration_settings")
      .update({ is_enabled })
      .eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, is_enabled } : x)));
    toast.success(is_enabled ? "Aktiviert" : "Deaktiviert");
  };

  const openConfig = (integration: Integration) => {
    setEditing({
      id: integration.id,
      label: integration.label,
      description: integration.description ?? "",
      status: integration.status,
      configText: JSON.stringify(integration.config ?? {}, null, 2),
    });
  };

  const saveConfig = async () => {
    if (!editing) return;
    let config: Record<string, unknown>;
    try {
      const parsed = JSON.parse(editing.configText || "{}");
      config = typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      toast.error("Konfiguration muss gültiges JSON sein");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("integration_settings")
      .update({
        label: editing.label,
        description: editing.description,
        status: editing.status,
        config: config as never,
        last_error: editing.status === "error" ? "Bitte API-Konfiguration prüfen." : null,
        last_check_at: new Date().toISOString(),
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("API-System gespeichert");
    setEditing(null);
    load();
  };

  const grouped = useMemo(() => {
    const m: Record<string, Integration[]> = {};
    rows.forEach((r) => {
      (m[r.category] ||= []).push(r);
    });
    return m;
  }, [rows]);

  const connected = rows.filter((row) => row.is_enabled && row.status === "connected");

  return (
    <HeidehofAdminLayout title="Integrationen & API-Hub">
      <div className="space-y-5 max-w-[1200px]">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Erweiterungen</p>
          <h2 className="font-serif text-2xl text-foreground mt-1">Alle Dienste & APIs</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Schalte Anbieter ein/aus. Benötigte Schlüssel werden sicher als Secrets gespeichert (nie im Code).
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Card className="bg-card border-border p-4">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Verbunden</div>
            <div className="mt-1 text-2xl font-serif text-foreground">{connected.length}</div>
            <p className="text-xs text-muted-foreground">aktive API-Systeme</p>
          </Card>
          <Card className="bg-card border-border p-4 sm:col-span-2">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Webseite</div>
            <a href={PUBLIC_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline">
              <Globe className="w-4 h-4" /> {PUBLIC_URL} <ExternalLink className="w-3 h-3" />
            </a>
          </Card>
        </div>

        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Lade …</Card>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <Card key={cat} className="bg-card border-border p-4">
              <h3 className="font-serif text-lg text-foreground mb-3">
                {CATEGORY_LABELS[cat] ?? cat}
              </h3>
              <div className="divide-y divide-border">
                {items.map((it) => (
                  <div key={it.id} className="flex items-start gap-3 py-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Plug className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{it.label}</span>
                        <StatusBadge status={it.status} enabled={it.is_enabled} />
                      </div>
                      {it.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{it.description}</p>
                      )}
                      {it.required_secrets.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <Key className="w-3 h-3 text-muted-foreground" />
                          {it.required_secrets.map((s) => (
                            <code
                              key={s}
                              className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono"
                            >
                              {s}
                            </code>
                          ))}
                        </div>
                      )}
                      {it.last_error && (
                        <p className="text-xs text-destructive mt-1">{it.last_error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConfig(it)}
                      >
                        Konfigurieren
                      </Button>
                      <Switch
                        checked={it.is_enabled}
                        onCheckedChange={(v) => toggle(it.id, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API-System konfigurieren</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(status) => setEditing({ ...editing, status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="connected">Verbunden</SelectItem>
                      <SelectItem value="not_configured">Nicht konfiguriert</SelectItem>
                      <SelectItem value="error">Fehler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Konfiguration (JSON)</Label>
                <Textarea rows={8} value={editing.configText} onChange={(e) => setEditing({ ...editing, configText: e.target.value })} className="font-mono text-xs" />
                <p className="mt-1 text-xs text-muted-foreground">API-Schlüssel bleiben sicher als Secrets gespeichert; hier werden nur Einstellungen wie IDs, Domains, Modi oder Limits gepflegt.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Abbrechen</Button>
            <Button onClick={saveConfig} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> {saving ? "Speichert …" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HeidehofAdminLayout>
  );
}
