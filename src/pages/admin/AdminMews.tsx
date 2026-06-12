import { useEffect, useMemo, useState } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Activity, AlertCircle, CheckCircle2, Cog, Database, KeyRound,
  Link2, PlugZap, RefreshCw, Save, ShieldCheck, Trash2, Webhook,
} from "lucide-react";

interface MewsSettings {
  id: string;
  environment: "demo" | "live";
  platform_address: string;
  client_name: string;
  is_enabled: boolean;
  auto_send_inquiries: boolean;
  auto_send_conference_orders: boolean;
  auto_send_restaurant_orders: boolean;
  default_outlet_id: string | null;
  default_account_id: string | null;
  last_test_at: string | null;
  last_test_status: string | null;
  last_test_error: string | null;
  hotel_name: string | null;
}

interface Mapping {
  id: string;
  kind: string;
  local_id: string;
  local_label: string | null;
  mews_id: string;
  mews_label: string | null;
  notes: string | null;
  is_active: boolean;
}

interface FieldPerm {
  id: string;
  field_key: string;
  label: string;
  category: string;
  allowed: boolean;
  description: string | null;
}

interface SyncLog {
  id: string;
  direction: string;
  action: string;
  status: string;
  http_status: number | null;
  error: string | null;
  created_at: string;
  request: unknown;
  response: unknown;
}

const PROJECT_ID = (import.meta as unknown as { env: Record<string, string> }).env.VITE_SUPABASE_PROJECT_ID;
const WEBHOOK_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/mews-webhook`;

const MAPPING_KINDS = [
  { key: "outlet",  label: "Outlets (Restaurant / Bar / Tagung)" },
  { key: "product", label: "Produkte (Speisen / Getränke / Pauschalen)" },
  { key: "room",    label: "Tagungsräume" },
  { key: "rate",    label: "Raten / Tarife" },
  { key: "service", label: "Services" },
];

export default function AdminMews() {
  const [settings, setSettings] = useState<MewsSettings | null>(null);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [perms, setPerms] = useState<FieldPerm[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, m, p, l] = await Promise.all([
      supabase.from("mews_settings").select("*").maybeSingle(),
      supabase.from("mews_mappings").select("*").order("kind").order("local_label"),
      supabase.from("mews_field_permissions").select("*").order("sort_order"),
      supabase.from("mews_sync_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (s.data) setSettings(s.data as MewsSettings);
    setMappings((m.data ?? []) as Mapping[]);
    setPerms((p.data ?? []) as FieldPerm[]);
    setLogs((l.data ?? []) as SyncLog[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("mews_settings").update({
      environment: settings.environment,
      platform_address: settings.platform_address,
      client_name: settings.client_name,
      is_enabled: settings.is_enabled,
      auto_send_inquiries: settings.auto_send_inquiries,
      auto_send_conference_orders: settings.auto_send_conference_orders,
      auto_send_restaurant_orders: settings.auto_send_restaurant_orders,
      default_outlet_id: settings.default_outlet_id,
      default_account_id: settings.default_account_id,
    }).eq("id", settings.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Mews-Einstellungen gespeichert");
  };

  const runTest = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("mews-sync", { body: { action: "test" } });
    setTesting(false);
    if (error) toast.error(error.message);
    else if ((data as { ok?: boolean })?.ok) toast.success(`Verbunden mit ${(data as { hotel?: string }).hotel ?? "Mews"}`);
    else toast.error("Verbindung fehlgeschlagen – Details im Sync-Log");
    load();
  };

  const togglePerm = async (id: string, allowed: boolean) => {
    setPerms((p) => p.map((x) => (x.id === id ? { ...x, allowed } : x)));
    const { error } = await supabase.from("mews_field_permissions").update({ allowed }).eq("id", id);
    if (error) toast.error(error.message);
  };

  const addMapping = async (kind: string) => {
    const { data, error } = await supabase.from("mews_mappings").insert({
      kind, local_id: "neu", local_label: "Neuer Eintrag", mews_id: "",
    }).select().single();
    if (error) return toast.error(error.message);
    setMappings((m) => [...m, data as Mapping]);
  };

  const updateMapping = async (id: string, patch: Partial<Mapping>) => {
    setMappings((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await supabase.from("mews_mappings").update(patch).eq("id", id);
  };

  const deleteMapping = async (id: string) => {
    setMappings((m) => m.filter((x) => x.id !== id));
    await supabase.from("mews_mappings").delete().eq("id", id);
  };

  const clearLogs = async () => {
    if (!confirm("Alle Sync-Log-Einträge löschen?")) return;
    await supabase.from("mews_sync_log").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    load();
  };

  const groupedMappings = useMemo(() => {
    const g: Record<string, Mapping[]> = {};
    mappings.forEach((m) => { (g[m.kind] ||= []).push(m); });
    return g;
  }, [mappings]);

  const groupedPerms = useMemo(() => {
    const g: Record<string, FieldPerm[]> = {};
    perms.forEach((p) => { (g[p.category] ||= []).push(p); });
    return g;
  }, [perms]);

  if (loading || !settings) {
    return (
      <HeidehofAdminLayout title="Mews Connector">
        <Card className="p-6 text-sm text-muted-foreground">Lade Mews-Konfiguration …</Card>
      </HeidehofAdminLayout>
    );
  }

  const statusBadge = settings.last_test_status === "ok"
    ? <Badge className="bg-emerald-100 text-emerald-900"><CheckCircle2 className="w-3 h-3 mr-1" />Verbunden{settings.hotel_name ? ` · ${settings.hotel_name}` : ""}</Badge>
    : settings.last_test_status === "error"
    ? <Badge className="bg-red-100 text-red-900"><AlertCircle className="w-3 h-3 mr-1" />Fehler</Badge>
    : <Badge variant="outline">Noch nicht getestet</Badge>;

  return (
    <HeidehofAdminLayout title="Mews Connector">
      <div className="space-y-5 max-w-[1200px]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">PMS-Integration</p>
            <h2 className="font-serif text-2xl text-foreground mt-1 flex items-center gap-2">
              <PlugZap className="w-6 h-6" /> Mews Hotelsoftware
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Anfragen, Tagungsmenüs und F&B-Bestellungen automatisch an Mews übergeben. Alle Felder DSGVO-konform steuerbar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge}
            <Button onClick={runTest} disabled={testing} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-1 ${testing ? "animate-spin" : ""}`} />
              Verbindung testen
            </Button>
          </div>
        </div>

        <Tabs defaultValue="connection">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="connection"><Cog className="w-4 h-4 mr-1.5" />Verbindung</TabsTrigger>
            <TabsTrigger value="mapping"><Link2 className="w-4 h-4 mr-1.5" />Mapping</TabsTrigger>
            <TabsTrigger value="permissions"><ShieldCheck className="w-4 h-4 mr-1.5" />Daten-Freigaben</TabsTrigger>
            <TabsTrigger value="logs"><Activity className="w-4 h-4 mr-1.5" />Sync-Log</TabsTrigger>
            <TabsTrigger value="webhook"><Webhook className="w-4 h-4 mr-1.5" />Webhook</TabsTrigger>
          </TabsList>

          {/* CONNECTION */}
          <TabsContent value="connection" className="space-y-4 mt-4">
            <Card className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Umgebung</Label>
                  <Select value={settings.environment} onValueChange={(v) => setSettings({
                    ...settings, environment: v as "demo" | "live",
                    platform_address: v === "live" ? "https://api.mews.com" : "https://api.mews-demo.com",
                  })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo / Sandbox</SelectItem>
                      <SelectItem value="live">Live (Produktion)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Platform-Adresse</Label>
                  <Input value={settings.platform_address} onChange={(e) => setSettings({ ...settings, platform_address: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Client-Name (Integration)</Label>
                  <Input value={settings.client_name} onChange={(e) => setSettings({ ...settings, client_name: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Wird in jeder Anfrage an Mews mitgesendet, z. B. „Heidehof Website 1.0.0".</p>
                </div>
                <div>
                  <Label>Standard-Outlet-ID</Label>
                  <Input value={settings.default_outlet_id ?? ""} onChange={(e) => setSettings({ ...settings, default_outlet_id: e.target.value || null })} placeholder="Mews Outlet GUID" />
                </div>
                <div>
                  <Label>Standard-Konto-ID</Label>
                  <Input value={settings.default_account_id ?? ""} onChange={(e) => setSettings({ ...settings, default_account_id: e.target.value || null })} placeholder="Mews Account GUID" />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Mews-Integration aktiv</div>
                    <p className="text-xs text-muted-foreground">Master-Schalter – ohne Aktivierung gehen keine Daten raus.</p>
                  </div>
                  <Switch checked={settings.is_enabled} onCheckedChange={(v) => setSettings({ ...settings, is_enabled: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Tagungsanfragen automatisch senden</div>
                    <p className="text-xs text-muted-foreground">Neue Tagungsanfragen werden direkt als Service-Order in Mews angelegt.</p>
                  </div>
                  <Switch checked={settings.auto_send_inquiries} onCheckedChange={(v) => setSettings({ ...settings, auto_send_inquiries: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Tagungsmenü-Bestellungen automatisch senden</div>
                    <p className="text-xs text-muted-foreground">F&B-Posten landen auf dem Gruppenkonto in Mews.</p>
                  </div>
                  <Switch checked={settings.auto_send_conference_orders} onCheckedChange={(v) => setSettings({ ...settings, auto_send_conference_orders: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">Restaurant- & Bar-Bestellungen automatisch senden</div>
                    <p className="text-xs text-muted-foreground">Roomservice, Maxwell & Bar Mäx werden auf das Zimmerkonto gebucht.</p>
                  </div>
                  <Switch checked={settings.auto_send_restaurant_orders} onCheckedChange={(v) => setSettings({ ...settings, auto_send_restaurant_orders: v })} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tokens sind sicher als Secrets gespeichert:</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">MEWS_CLIENT_TOKEN</code>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">MEWS_ACCESS_TOKEN</code>
              </div>

              {settings.last_test_error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-900">
                  <strong>Letzter Fehler:</strong> {settings.last_test_error}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-1" /> {saving ? "Speichert …" : "Einstellungen speichern"}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* MAPPING */}
          <TabsContent value="mapping" className="space-y-4 mt-4">
            {MAPPING_KINDS.map(({ key, label }) => (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base">{label}</h3>
                  <Button size="sm" variant="outline" onClick={() => addMapping(key)}>+ Eintrag</Button>
                </div>
                <div className="space-y-2">
                  {(groupedMappings[key] ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground">Noch keine Zuordnung. Klick „+ Eintrag".</p>
                  )}
                  {(groupedMappings[key] ?? []).map((m) => (
                    <div key={m.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                      <Input value={m.local_label ?? ""} placeholder="Bei uns (Anzeigename)"
                        onChange={(e) => updateMapping(m.id, { local_label: e.target.value })} />
                      <Input value={m.local_id} placeholder="Bei uns (Schlüssel)"
                        onChange={(e) => updateMapping(m.id, { local_id: e.target.value })} />
                      <Input value={m.mews_id} placeholder="Mews-ID (GUID)"
                        onChange={(e) => updateMapping(m.id, { mews_id: e.target.value })} />
                      <Button size="icon" variant="ghost" onClick={() => deleteMapping(m.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            <Card className="p-4 bg-muted/40">
              <p className="text-xs text-muted-foreground">
                <strong>Tipp:</strong> Im Tab „Verbindung" testen, dann hier per „+ Eintrag" die Mews-GUIDs eintragen.
                Outlets, Produkte & Räume können über die Mews-Operations-App per Rechtsklick auf das jeweilige Objekt kopiert werden.
              </p>
            </Card>
          </TabsContent>

          {/* PERMISSIONS */}
          <TabsContent value="permissions" className="space-y-4 mt-4">
            <Card className="p-4 bg-amber-50 border-amber-200">
              <p className="text-xs text-amber-900">
                <ShieldCheck className="w-4 h-4 inline mr-1" />
                <strong>DSGVO-Kontrolle:</strong> Schalten Sie jedes Feld einzeln aus, das <em>nicht</em> an Mews übertragen werden darf.
                Deaktivierte Felder werden serverseitig vor jeder Übertragung entfernt.
              </p>
            </Card>
            {Object.entries(groupedPerms).map(([cat, items]) => (
              <Card key={cat} className="p-4">
                <h3 className="font-serif text-base mb-3 capitalize">{cat === "guest" ? "Gastdaten" : cat === "order" ? "Bestelldaten" : "Tagungsdaten"}</h3>
                <div className="divide-y divide-border">
                  {items.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-sm">{p.label}</div>
                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                        <code className="text-[10px] text-muted-foreground font-mono">{p.field_key}</code>
                      </div>
                      <Switch checked={p.allowed} onCheckedChange={(v) => togglePerm(p.id, v)} />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* LOGS */}
          <TabsContent value="logs" className="space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Letzte 100 Übertragungen</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Aktualisieren</Button>
                <Button size="sm" variant="outline" onClick={clearLogs}><Trash2 className="w-4 h-4 mr-1" />Leeren</Button>
              </div>
            </div>
            <Card className="divide-y divide-border">
              {logs.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Noch keine Übertragungen.</div>}
              {logs.map((log) => (
                <details key={log.id} className="p-3 text-sm">
                  <summary className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <Badge variant={log.status === "ok" ? "default" : "destructive"} className="text-[10px]">
                      {log.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{log.direction}</Badge>
                    <span className="font-mono text-xs">{log.action}</span>
                    {log.http_status && <span className="text-xs text-muted-foreground">HTTP {log.http_status}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(log.created_at).toLocaleString("de-DE")}</span>
                  </summary>
                  {log.error && <div className="mt-2 text-xs text-destructive">{log.error}</div>}
                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">Request</div>
                      <pre className="text-[11px] bg-muted p-2 rounded max-h-48 overflow-auto">{JSON.stringify(log.request, null, 2)}</pre>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">Response</div>
                      <pre className="text-[11px] bg-muted p-2 rounded max-h-48 overflow-auto">{JSON.stringify(log.response, null, 2)}</pre>
                    </div>
                  </div>
                </details>
              ))}
            </Card>
          </TabsContent>

          {/* WEBHOOK */}
          <TabsContent value="webhook" className="space-y-4 mt-4">
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                <h3 className="font-serif text-lg">Inbound-Webhook für Mews</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Tragen Sie folgende URL im Mews Marketplace bei „Webhook Endpoints" ein. Mews sendet damit Reservierungs- und Status-Updates direkt an unser System.
              </p>
              <div>
                <Label>Webhook-URL</Label>
                <div className="flex gap-2">
                  <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs" />
                  <Button onClick={() => { navigator.clipboard.writeText(WEBHOOK_URL); toast.success("Kopiert"); }}>Kopieren</Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="w-4 h-4" />
                Eingehende Events landen automatisch im Sync-Log (Richtung „inbound").
              </div>
              <div className="rounded-md bg-muted p-3 text-xs">
                <strong>Optional:</strong> Signatur-Secret in den Lovable-Secrets als <code className="font-mono">MEWS_WEBHOOK_SECRET</code> hinterlegen.
                Mews sendet es dann im Header <code className="font-mono">X-Mews-Signature</code> oder per Query <code className="font-mono">?secret=…</code>.
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </HeidehofAdminLayout>
  );
}
