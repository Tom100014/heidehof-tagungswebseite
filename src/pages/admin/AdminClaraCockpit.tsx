import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Activity, RefreshCw, Save, Wand2, Euro, Inbox, Radio, ShieldCheck, Phone, DownloadCloud, FileText, Copy, ChefHat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  CLARA_VOICE_SYSTEMS,
  DEFAULT_CLARA_VOICE_SYSTEM,
  isClaraVoiceSystemId,
  type ClaraVoiceSystemId,
} from "@/lib/clara/voice-systems";
import { CartesiaCallLogCard } from "./CartesiaCallLogCard";
import { ElevenLabsAgentsCard } from "@/components/admin/ElevenLabsAgentsCard";
import { ElevenLabsLiveStatusCard } from "@/components/admin/ElevenLabsLiveStatusCard";
import {
  ACTIVE_ASSISTANT_LABELS,
  DEFAULT_ACTIVE_ASSISTANT,
  isActiveAssistant,
  type ActiveAssistant,
} from "@/hooks/use-active-assistant";

type SettingsMap = Record<string, unknown>;

const SETTING_KEYS = [
  "clara_voice_system",
  "clara_chat_model",
  "clara_tts_provider",
  "clara_voice_id",
  "clara_tts_model",
  "clara_cartesia_voice_id",
  "clara_cartesia_model",
  "clara_stt_provider",
  "clara_realtime_model",
  "clara_realtime_voice",
  "assistant_mode",
  "active_assistant",
  "elevenlabs_enabled",
  "clara_cartesia_agent_id",
  "cartesia_system_prompt",
] as const;

const ASSISTANT_MODES: Array<{
  id: "clara_only" | "phone_only" | "both";
  name: string;
  badge: string;
  summary: string;
  hint: string;
}> = [
  {
    id: "clara_only",
    name: "Nur Clara",
    badge: "Web-Chat",
    summary: "Nur die Clara-Bubble mit Chat & Voice-Widget. Telefonbutton ist auf der Website ausgeblendet.",
    hint: "Geeignet, wenn niemand am Telefon erreichbar ist und alles über Clara laufen soll.",
  },
  {
    id: "phone_only",
    name: "Nur Telefonagent",
    badge: "Live-Call",
    summary: "Clara-Bubble ist ausgeblendet. Alle Section-Buttons starten direkt einen Live-Anruf.",
    hint: "Maximale persönliche Note – jeder Section-CTA wird zum Anrufbutton.",
  },
  {
    id: "both",
    name: "Beides aktiv",
    badge: "Standard",
    summary: "Clara-Bubble + Telefon-Launcher beide sichtbar. Section-Buttons öffnen weiterhin Clara.",
    hint: "Standardempfehlung. Gast wählt selbst zwischen Chat und Anruf.",
  },
];

const CHAT_MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (schnell, Standard)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (stabil)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (stark, langsamer)" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  { value: "openai/gpt-5", label: "GPT-5 (Premium)" },
];

const CARTESIA_MODELS = [
  { value: "sonic-2", label: "Sonic 2 (Standard)" },
  { value: "sonic-2-2025-03-07", label: "Sonic 2 (März 2025)" },
];

const REALTIME_MODELS = [
  { value: "gpt-realtime", label: "GPT Realtime (Speech-to-Speech)" },
];

const REALTIME_VOICES = [
  { value: "marin", label: "Marin (hell, freundlich)" },
  { value: "cedar", label: "Cedar (ruhig, warm)" },
  { value: "verse", label: "Verse (klar, präsent)" },
];

type PhoneAgentCall = {
  cartesia_call_id?: string;
  status?: string | null;
  category?: string;
  priority?: string;
  summary?: string | null;
  started_at?: string | null;
  from_number?: string | null;
  to_number?: string | null;
};

type PhoneAgentState = {
  loading: boolean;
  error: string | null;
  agent: Record<string, unknown> | null;
  phoneNumbers: Array<Record<string, unknown>>;
  calls: PhoneAgentCall[];
  synced: number | null;
};




function readStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "id" in v && typeof (v as { id: unknown }).id === "string") return (v as { id: string }).id;
  if (v && typeof v === "object" && "mode" in v && typeof (v as { mode: unknown }).mode === "string") return (v as { mode: string }).mode;
  if (v && typeof v === "object" && "prompt" in v && typeof (v as { prompt: unknown }).prompt === "string") return (v as { prompt: string }).prompt;
  return fallback;
}

function readVoiceSystem(v: unknown): ClaraVoiceSystemId {
  return isClaraVoiceSystemId(v) ? v : DEFAULT_CLARA_VOICE_SYSTEM;
}

async function readFunctionError(error: unknown, fallback: string) {
  const context = (error as { context?: unknown } | null)?.context;
  if (context && typeof context === "object") {
    const response = context as Response;
    const clone = typeof response.clone === "function" ? response.clone() : response;
    try {
      if (typeof clone.json === "function") {
        const body = await clone.json();
        if (body && typeof body === "object") {
          const record = body as Record<string, unknown>;
          if (typeof record.error === "string") return record.error;
          if (typeof record.message === "string") return record.message;
        }
      }
    } catch {
      try {
        const textResponse = typeof response.clone === "function" ? response.clone() : response;
        if (typeof textResponse.text === "function") {
          const text = await textResponse.text();
          if (text.trim()) return text.slice(0, 500);
        }
      } catch {
        // Fall back below.
      }
    }
  }
  return (error as { message?: string } | null)?.message ?? fallback;
}

export default function AdminClaraCockpit() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [prompts, setPrompts] = useState<Array<{ key: string; label: string; description: string | null; content: string; sort_order: number }>>([]);
  const [usage, setUsage] = useState<Array<{ tool: string; provider: string | null; calls: number; cost: number }>>([]);
  const [usageRange, setUsageRange] = useState<"today" | "7d" | "30d">("today");
  const [phoneAgent, setPhoneAgent] = useState<PhoneAgentState>({
    loading: false,
    error: null,
    agent: null,
    phoneNumbers: [],
    calls: [],
    synced: null,
  });
  const [inbox, setInbox] = useState<{
    restaurant: Array<{ id: string; created_at: string; status: string; guest_type: string; table_or_room: string | null }>;
    room: Array<{ id: string; created_at: string; status: string; room_number: string }>;
    complaints: Array<{ id: string; created_at: string; status: string; category: string; urgency: string }>;
  }>({ restaurant: [], room: [], complaints: [] });
  const [health, setHealth] = useState<{ chat?: string; tts?: string }>({});
  const [cartesiaSyncing, setCartesiaSyncing] = useState(false);
  const [cartesiaSync, setCartesiaSync] = useState<{ at?: string; success?: boolean; tools?: string[]; agent_id?: string } | null>(null);
  const [cartesiaLastResult, setCartesiaLastResult] = useState<{ ok: boolean; tools_configured?: string[]; attempts?: Array<{ label: string; status: number }> } | null>(null);
  const [menuPromptLoading, setMenuPromptLoading] = useState(false);
  const [menuPromptText, setMenuPromptText] = useState<string | null>(null);
  const [menuPromptStats, setMenuPromptStats] = useState<{ food: number; drinks: number; spa: number } | null>(null);

  const regenerateMenuPrompt = async () => {
    setMenuPromptLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-cartesia-prompt", { body: {} });
      if (error) throw new Error(await readFunctionError(error, "Prompt konnte nicht generiert werden."));
      const res = data as { success: boolean; prompt?: string; food_count?: number; drink_count?: number; wellness_count?: number; spa_count?: number; error?: string };
      if (!res.success) throw new Error(res.error ?? "Unbekannter Fehler");
      setMenuPromptText(res.prompt ?? "");
      setSetting("cartesia_system_prompt", res.prompt ?? "");
      setMenuPromptStats({ food: res.food_count ?? 0, drinks: res.drink_count ?? 0, spa: res.wellness_count ?? res.spa_count ?? 0 });
      toast.success("Prompt neu generiert", {
        description: `${res.food_count ?? 0} Speisen · ${res.drink_count ?? 0} Getränke · ${res.wellness_count ?? res.spa_count ?? 0} Spa`,
      });
    } catch (e) {
      toast.error("Prompt-Generierung fehlgeschlagen", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setMenuPromptLoading(false);
    }
  };

  const openMenuPrompt = async () => {
    const storedPrompt = readStr(settings.cartesia_system_prompt);
    if (storedPrompt) {
      setMenuPromptText(storedPrompt);
      return;
    }
    await regenerateMenuPrompt();
  };

  const copyMenuPrompt = async () => {
    if (!menuPromptText) return;
    try {
      await navigator.clipboard.writeText(menuPromptText);
      toast.success("Prompt in Zwischenablage kopiert");
    } catch {
      toast.error("Kopieren fehlgeschlagen");
    }
  };

  const syncCartesiaAgent = async () => {
    setCartesiaSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("cartesia-agent-setup", { body: {} });
      if (error) throw error;
      const res = data as { ok: boolean; tools_configured?: string[]; attempts?: Array<{ label: string; status: number }> };
      setCartesiaLastResult(res);
      if (res.ok) {
        toast.success("Cartesia Agent synchronisiert", { description: `${res.tools_configured?.length ?? 0} Tools aktiv` });
      } else {
        toast.error("Cartesia API hat abgelehnt", { description: "Details siehe Ergebnis-Box unten" });
      }
      // refresh status from app_settings
      const { data: s } = await supabase.from("app_settings").select("value").eq("key", "cartesia_agent_last_sync").maybeSingle();
      if (s?.value) setCartesiaSync(s.value as typeof cartesiaSync);
    } catch (e) {
      toast.error("Sync fehlgeschlagen", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setCartesiaSyncing(false);
    }
  };

  // Load settings + prompts
  const load = async () => {
    setLoading(true);
    const [{ data: sData }, { data: pData }, { data: syncRow }] = await Promise.all([
      supabase.from("app_settings").select("key,value").in("key", SETTING_KEYS as unknown as string[]),
      supabase.from("clara_prompts").select("*").order("sort_order"),
      supabase.from("app_settings").select("value").eq("key", "cartesia_agent_last_sync").maybeSingle(),
    ]);
    const map: SettingsMap = {};
    (sData ?? []).forEach((r: { key: string; value: unknown }) => { map[r.key] = r.value; });
    setSettings(map);
    setPrompts((pData ?? []) as Array<{ key: string; label: string; description: string | null; content: string; sort_order: number }>);
    if (syncRow?.value) setCartesiaSync(syncRow.value as typeof cartesiaSync);
    setLoading(false);
  };

  const loadUsage = async () => {
    const since = new Date();
    if (usageRange === "today") since.setHours(0, 0, 0, 0);
    else if (usageRange === "7d") since.setDate(since.getDate() - 7);
    else since.setDate(since.getDate() - 30);

    const { data } = await supabase
      .from("clara_usage_log")
      .select("tool,provider,cost_estimate_eur,units")
      .gte("created_at", since.toISOString())
      .limit(5000);

    const grouped = new Map<string, { tool: string; provider: string | null; calls: number; cost: number }>();
    (data ?? []).forEach((r: { tool: string; provider: string | null; cost_estimate_eur: number | string; units: number | string }) => {
      const k = `${r.tool}|${r.provider ?? ""}`;
      const cur = grouped.get(k) ?? { tool: r.tool, provider: r.provider, calls: 0, cost: 0 };
      cur.calls += 1;
      cur.cost += Number(r.cost_estimate_eur ?? 0);
      grouped.set(k, cur);
    });
    setUsage(Array.from(grouped.values()).sort((a, b) => b.cost - a.cost));
  };

  const loadInbox = async () => {
    const [r, ro, c] = await Promise.all([
      supabase.from("restaurant_orders").select("id,created_at,status,guest_type,table_or_room").order("created_at", { ascending: false }).limit(10),
      supabase.from("room_orders").select("id,created_at,status,room_number").order("created_at", { ascending: false }).limit(10),
      supabase.from("complaints").select("id,created_at,status,category,urgency").order("created_at", { ascending: false }).limit(10),
    ]);
    setInbox({
      restaurant: (r.data ?? []) as typeof inbox.restaurant,
      room: (ro.data ?? []) as typeof inbox.room,
      complaints: (c.data ?? []) as typeof inbox.complaints,
    });
  };

  useEffect(() => { void load(); void loadInbox(); }, []);
  useEffect(() => { void loadUsage(); }, [usageRange]);

  const phoneAgentId = readStr(settings.clara_cartesia_agent_id, "agent_gjYusgM21heczyikufbJ4P");

  const loadPhoneAgent = async () => {
    if (!phoneAgentId) return;
    setPhoneAgent((current) => ({ ...current, loading: true, error: null, synced: null }));
    const { data, error } = await supabase.functions.invoke<{
      ok?: boolean;
      error?: string;
      agent?: Record<string, unknown>;
      phoneNumbers?: Array<Record<string, unknown>>;
      calls?: PhoneAgentCall[];
    }>("cartesia-phone-agent", {
      body: { action: "status", agentId: phoneAgentId },
    });
    if (error || data?.ok === false) {
      const message = data?.error ?? await readFunctionError(error, "Telefonagent konnte nicht geladen werden.");
      setPhoneAgent((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
      return;
    }
    setPhoneAgent({
      loading: false,
      error: null,
      agent: data?.agent ?? null,
      phoneNumbers: data?.phoneNumbers ?? [],
      calls: data?.calls ?? [],
      synced: null,
    });
  };

  const syncPhoneCalls = async () => {
    if (!phoneAgentId) return;
    setPhoneAgent((current) => ({ ...current, loading: true, error: null, synced: null }));
    const { data, error } = await supabase.functions.invoke<{
      ok?: boolean;
      error?: string;
      synced?: number;
      calls?: PhoneAgentCall[];
    }>("cartesia-phone-agent", {
      body: { action: "sync_calls", agentId: phoneAgentId, limit: 50 },
    });
    if (error || data?.ok === false) {
      const message = data?.error ?? await readFunctionError(error, "Telefonate konnten nicht synchronisiert werden.");
      setPhoneAgent((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
      return;
    }
    toast.success("Telefonate synchronisiert", { description: `${data?.synced ?? 0} Call(s) übernommen.` });
    setPhoneAgent((current) => ({
      ...current,
      loading: false,
      error: null,
      calls: data?.calls ?? current.calls,
      synced: data?.synced ?? 0,
    }));
  };

  // Realtime: Inbox-Updates
  useEffect(() => {
    const ch = supabase.channel("clara_cockpit_inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_orders" }, () => loadInbox())
      .on("postgres_changes", { event: "*", schema: "public", table: "room_orders" }, () => loadInbox())
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => loadInbox())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Health-Pings
  const pingFn = async (name: "clara-chat" | "clara-tts") => {
    setHealth((h) => ({ ...h, [name === "clara-chat" ? "chat" : "tts"]: "..." }));
    try {
      const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${name}?bust=1`;
      const r = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
      const ok = r.ok ? "OK" : `Fehler ${r.status}`;
      setHealth((h) => ({ ...h, [name === "clara-chat" ? "chat" : "tts"]: ok }));
    } catch {
      setHealth((h) => ({ ...h, [name === "clara-chat" ? "chat" : "tts"]: "Fehler" }));
    }
  };

  // Setter
  const setSetting = (key: string, value: unknown) => setSettings((s) => ({ ...s, [key]: value }));

  // Instant-Save für Toggle-Einstellungen (z.B. assistant_mode)
  const setSettingInstant = async (key: string, value: unknown) => {
    setSetting(key, value);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() } as never);
    if (error) toast.error("Speichern fehlgeschlagen", { description: error.message });
    else toast.success("Gespeichert");
  };

  const saveSettings = async () => {
    setSaving(true);
    const rows = SETTING_KEYS.map((k) => {
      let val = settings[k];
      if (k === "clara_tts_provider") val = "cartesia";
      return {
        key: k,
        value: val ?? null,
        updated_at: new Date().toISOString(),
      };
    });
    const { error } = await supabase.from("app_settings").upsert(rows as never);
    if (error) {
      toast.error("Speichern fehlgeschlagen", { description: error.message });
    } else {
      toast.success("Einstellungen gespeichert");
      // Cache-Bust an Edge-Functions
      void pingFn("clara-chat");
      void pingFn("clara-tts");
    }
    setSaving(false);
  };

  const savePrompt = async (key: string, content: string) => {
    const { error } = await supabase
      .from("clara_prompts")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) toast.error("Prompt speichern fehlgeschlagen", { description: error.message });
    else {
      toast.success("Prompt gespeichert");
      void pingFn("clara-chat");
    }
  };

  const totalCost = useMemo(() => usage.reduce((a, b) => a + b.cost, 0), [usage]);
  const activeVoiceSystem = readVoiceSystem(settings.clara_voice_system);
  const activeVoiceSystemInfo = CLARA_VOICE_SYSTEMS[activeVoiceSystem];
  const activeAssistant: ActiveAssistant = isActiveAssistant(settings.active_assistant)
    ? settings.active_assistant
    : DEFAULT_ACTIVE_ASSISTANT;
  const elevenlabsEnabled = settings.elevenlabs_enabled === true;
  const isClaraActive = activeAssistant === "clara";
  const isElevenLabsActive = activeAssistant === "elevenlabs";

  if (loading) {
    return <div className="p-6 text-muted-foreground">Lade …</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1400px] mx-auto">

        {/* 0. Aktiver Sprachassistent — globaler Schalter */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> Aktiver Sprachassistent</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Nur ein Assistent ist gleichzeitig auf der Website sichtbar. Bei <strong>ElevenLabs</strong> wird automatisch
              auch die Clara-Bubble samt proaktivem Popup ausgeblendet.
            </p>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3">
            {(Object.entries(ACTIVE_ASSISTANT_LABELS) as Array<[ActiveAssistant, typeof ACTIVE_ASSISTANT_LABELS[ActiveAssistant]]>).map(([id, meta]) => {
              const active = activeAssistant === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    void setSettingInstant("active_assistant", id);
                    if (id === "elevenlabs" && !elevenlabsEnabled) {
                      void setSettingInstant("elevenlabs_enabled", true);
                    }
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-muted/30"}`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{meta.name}</h3>
                    <Badge variant={active ? "default" : "outline"}>{active ? "Aktiv" : meta.badge}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{meta.summary}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>


        {/* A. Live-Status — zeigt nur das aktive System */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" /> Live-Status
              <Badge variant="outline" className="ml-2">{ACTIVE_ASSISTANT_LABELS[activeAssistant].name}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { void pingFn("clara-chat"); void pingFn("clara-tts"); }}>
                <RefreshCw className="size-4 mr-1" /> Health-Check
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {isClaraActive && (
              <>
                <StatusCard label="Chat-Modell" value={readStr(settings.clara_chat_model, "gemini-3-flash-preview")} health={health.chat} />
                <StatusCard label="Aktives Voice-System" value={activeVoiceSystemInfo.shortName} />
                <StatusCard label="Pipeline TTS" value={readStr(settings.clara_cartesia_model, "sonic-2")} health={health.tts} />
                <StatusCard label="Realtime-Modell" value={readStr(settings.clara_realtime_model, "gpt-realtime")} />
                <StatusCard label="Voice-ID" value={readStr(settings.clara_cartesia_voice_id) || "Default"} mono />
              </>
            )}
            {isElevenLabsActive && (
              <>
                <StatusCard label="Voice-Provider" value="ElevenLabs" />
                <StatusCard label="Voice-Name" value="Maximilian" />
                <StatusCard label="Master-Toggle" value={elevenlabsEnabled ? "AN" : "AUS"} health={elevenlabsEnabled ? "OK" : undefined} />
                <StatusCard label="Modus" value="Conversational AI (WebRTC)" />
                <StatusCard label="Routing" value="URL → Fach-Agent" />
              </>
            )}
            {activeAssistant === "none" && (
              <div className="col-span-full text-sm text-muted-foreground">
                Beide Assistenten sind deaktiviert. Auf der Website erscheint kein Chat-/Voice-Widget.
              </div>
            )}
          </CardContent>
        </Card>


        {/* A2. Cartesia Telefonagent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Phone className="size-4" /> Cartesia Telefonagent</CardTitle>
            <Button size="sm" onClick={syncCartesiaAgent} disabled={cartesiaSyncing}>
              <RefreshCw className={`size-4 mr-1 ${cartesiaSyncing ? "animate-spin" : ""}`} />
              {cartesiaSyncing ? "Synchronisiere…" : "Agent synchronisieren"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <StatusCard label="Agent-ID" value={cartesiaSync?.agent_id ?? "agent_gjYusgM21heczyikufbJ4P"} mono />
              <StatusCard
                label="Letzter Sync"
                value={cartesiaSync?.at ? new Date(cartesiaSync.at).toLocaleString("de-DE") : "Noch nie"}
                health={cartesiaSync?.success === true ? "OK" : cartesiaSync?.success === false ? "Fehler" : undefined}
              />
              <StatusCard label="Tools" value={`${cartesiaSync?.tools?.length ?? 6} konfiguriert`} />
            </div>
            <div className="text-xs text-muted-foreground">
              Webhook: <span className="font-mono">https://qkwgqdyamomvaihbofbw.supabase.co/functions/v1/cartesia-phone-handler</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["send_inquiry","create_conference_order","make_table_reservation","request_wellness_appointment","submit_complaint","take_restaurant_order"].map((t) => (
                <Badge key={t} variant="outline" className="font-mono text-xs">{t}</Badge>
              ))}
            </div>
            {cartesiaLastResult && (
              <div className="rounded-md border p-3 bg-muted/30 text-xs space-y-1">
                <div className="font-medium">Letztes Ergebnis: {cartesiaLastResult.ok ? "✓ Erfolg" : "✗ Fehler"}</div>
                {cartesiaLastResult.attempts?.map((a, i) => (
                  <div key={i} className="font-mono">
                    {a.label} → <span className={a.status < 300 ? "text-green-600" : "text-destructive"}>{a.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* A2b. Speise-/Getränke-/Spa-Wissen für Telefonagent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ChefHat className="size-4" /> Telefonagent-Wissen (Speisen, Getränke, Spa)</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={regenerateMenuPrompt} disabled={menuPromptLoading}>
                <RefreshCw className={`size-4 mr-1 ${menuPromptLoading ? "animate-spin" : ""}`} />
                {menuPromptLoading ? "Generiere…" : "Prompt neu generieren"}
              </Button>
              <Button size="sm" variant="outline" disabled={menuPromptLoading} onClick={() => void openMenuPrompt()}>
                <FileText className="size-4 mr-1" /> Prompt anzeigen & kopieren
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Erzeugt aus der aktuellen Speisekarte, Getränkekarte und den Spa-Behandlungen einen vollständigen System-Prompt. Inhalte werden bei jeder Karten-Änderung automatisch neu generiert. Den Prompt anschließend in das Cartesia Playground des Agenten einfügen.
            </p>
            {menuPromptStats && (
              <div className="grid grid-cols-3 gap-3">
                <StatusCard label="Speisen" value={String(menuPromptStats.food)} />
                <StatusCard label="Getränke" value={String(menuPromptStats.drinks)} />
                <StatusCard label="Spa-Behandlungen" value={String(menuPromptStats.spa)} />
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!menuPromptText} onOpenChange={(o) => !o && setMenuPromptText(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Cartesia System-Prompt</DialogTitle>
              <DialogDescription>
                Kopieren und im Cartesia Playground unter „System Prompt" des Telefon-Agenten einfügen.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto rounded-md border bg-muted/30 p-3">
              <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">{menuPromptText}</pre>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMenuPromptText(null)}>Schließen</Button>
              <Button onClick={copyMenuPrompt}><Copy className="size-4 mr-1" /> In Zwischenablage kopieren</Button>
            </div>
          </DialogContent>
        </Dialog>



        {/* A3. Assistenz-Modus (Clara / Telefon / Beides) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Phone className="size-4" /> Assistenz-Modus</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Steuert, wie Gäste auf der Website mit dem Hotel interagieren. Änderungen werden sofort live übernommen.
            </p>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3">
            {ASSISTANT_MODES.map((m) => {
              const current = typeof settings.assistant_mode === "string" ? settings.assistant_mode : "clara_only";
              const active = current === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => void setSettingInstant("assistant_mode", m.id)}
                  className={`rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-muted/30"}`}
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{m.name}</h3>
                    <Badge variant={active ? "default" : "outline"}>{active ? "Aktiv" : m.badge}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{m.summary}</p>
                  <p className="mt-2 text-xs text-muted-foreground/80"><span className="font-semibold text-foreground/80">Hinweis: </span>{m.hint}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* B. Clara-Container — nur sichtbar wenn Clara aktiv */}
        {isClaraActive && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Radio className="size-4" /> Clara Voice-System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-4">
                  {Object.values(CLARA_VOICE_SYSTEMS).map((system) => {
                    const active = activeVoiceSystem === system.id;
                    return (
                      <button
                        key={system.id}
                        type="button"
                        onClick={() => setSetting("clara_voice_system", system.id)}
                        className={`rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card hover:bg-muted/30"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground">{system.name}</h3>
                              <Badge variant={active ? "default" : "outline"}>{active ? "Aktiv" : system.badge}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{system.summary}</p>
                          </div>
                          {active && <ShieldCheck className="size-5 text-primary shrink-0" />}
                        </div>
                        <div className="mt-4 grid gap-3 text-xs text-muted-foreground">
                          <div>
                            <span className="font-semibold text-foreground">Kosten: </span>
                            {system.costModel}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">Ideal: </span>
                            {system.bestFor}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">Hinweis: </span>
                            {system.risks}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {system.tools.map((tool) => (
                            <Badge key={tool} variant="outline" className="text-[10px]">{tool}</Badge>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Empfehlung: Im echten Hotelbetrieb bleibt die stabile Pipeline aktiv. OpenAI Realtime eignet sich für Premium-Gespräche und Tests; bei Startfehlern fällt Clara automatisch auf die Pipeline zurück.
                </p>
              </CardContent>
            </Card>

            <CartesiaCallLogCard />
          </>
        )}

        {/* B1. ElevenLabs-Container — nur sichtbar wenn ElevenLabs aktiv */}
        {isElevenLabsActive && (
          <>
            <ElevenLabsLiveStatusCard globalEnabled={elevenlabsEnabled} />
            <ElevenLabsAgentsCard />
          </>
        )}



        {/* B2. Telefon-Agent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Phone className="size-4" /> Cartesia Telefon-Agent</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => { void loadPhoneAgent(); }} disabled={phoneAgent.loading || !phoneAgentId}>
                <RefreshCw className="size-4 mr-1" /> Status
              </Button>
              <Button size="sm" onClick={() => { void syncPhoneCalls(); }} disabled={phoneAgent.loading || !phoneAgentId}>
                <DownloadCloud className="size-4 mr-1" /> Calls synchronisieren
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
              <div className="space-y-2">
                <Label>Cartesia Agent-ID</Label>
                <Input
                  value={phoneAgentId}
                  placeholder="agent_..."
                  onChange={(e) => setSetting("clara_cartesia_agent_id", e.target.value)}
                />
              </div>
              <Badge variant={phoneAgent.agent ? "default" : "outline"} className="h-10 px-4 justify-center">
                {phoneAgent.loading ? "Lädt..." : phoneAgent.agent ? "Verbunden" : "Noch nicht geprüft"}
              </Badge>
            </div>

            {phoneAgent.error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {phoneAgent.error}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-3">
              <StatusCard label="Agent" value={readStr(phoneAgent.agent?.name, phoneAgentId || "—")} />
              <StatusCard label="Telefonnummern" value={String(phoneAgent.phoneNumbers.length)} />
              <StatusCard label="Letzter Sync" value={phoneAgent.synced == null ? "—" : `${phoneAgent.synced} Calls`} />
            </div>

            {phoneAgent.phoneNumbers.length > 0 && (
              <div className="rounded-md border bg-card p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Nummern am Agenten</div>
                <div className="flex flex-wrap gap-2">
                  {phoneAgent.phoneNumbers.map((row, index) => (
                    <Badge key={`${readStr(row.phone_number, String(index))}-${index}`} variant="outline">
                      {readStr(row.phone_number, readStr(row.e164, readStr(row.number, "Nummer")))}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {phoneAgent.calls.length > 0 && (
              <div className="rounded-md border bg-card">
                <div className="border-b px-3 py-2 text-xs font-medium text-muted-foreground">Letzte Telefonate</div>
                <div className="divide-y">
                  {phoneAgent.calls.slice(0, 5).map((call) => (
                    <div key={call.cartesia_call_id ?? `${call.started_at}-${call.summary}`} className="grid gap-1 px-3 py-3 text-sm md:grid-cols-[1fr_auto]">
                      <div>
                        <div className="font-medium text-foreground">
                          {call.summary || `${call.from_number ?? "Anrufer"} → ${call.to_number ?? "Heidehof"}`}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {call.started_at ? new Date(call.started_at).toLocaleString("de-DE") : "Zeit offen"} · {call.status ?? "Status offen"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {call.category && <Badge variant="outline">{call.category}</Badge>}
                        {call.priority === "urgent" && <Badge variant="destructive">Dringend</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Zielbetrieb: Der Telefonagent nimmt Hotelanrufe an, synchronisiert Transkript und Zusammenfassung und ordnet den Vorgang für Rezeption, Tagung, Service, Küche oder Direktion vor.
            </p>
          </CardContent>
        </Card>

        {/* C. Modell-Switcher */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wand2 className="size-4" /> Modelle live umstellen</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chat-Modell (LLM)</Label>
              <Select value={readStr(settings.clara_chat_model, "google/gemini-3-flash-preview")} onValueChange={(v) => setSetting("clara_chat_model", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHAT_MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cartesia Modell</Label>
              <Select value={readStr(settings.clara_cartesia_model, "sonic-2")} onValueChange={(v) => setSetting("clara_cartesia_model", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CARTESIA_MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cartesia Voice-ID</Label>
              <Input value={readStr(settings.clara_cartesia_voice_id)} placeholder="b9de4a89-2257-…" onChange={(e) => setSetting("clara_cartesia_voice_id", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>STT-Provider</Label>
              <Select value={readStr(settings.clara_stt_provider, "cartesia")} onValueChange={(v) => setSetting("clara_stt_provider", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cartesia">Cartesia (Standard)</SelectItem>
                  <SelectItem value="openai">OpenAI Whisper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>OpenAI Realtime Modell</Label>
              <Select value={readStr(settings.clara_realtime_model, "gpt-realtime")} onValueChange={(v) => setSetting("clara_realtime_model", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REALTIME_MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>OpenAI Realtime Stimme</Label>
              <Select value={readStr(settings.clara_realtime_voice, "marin")} onValueChange={(v) => setSetting("clara_realtime_voice", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REALTIME_VOICES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button onClick={saveSettings} disabled={saving}>
                <Save className="size-4 mr-1" /> {saving ? "Speichere…" : "Speichern & live aktivieren"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* C. Prompt-Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Prompts pro Bereich</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prompts.length === 0 && <p className="text-sm text-muted-foreground">Keine Prompts vorhanden.</p>}
            {prompts.map((p, idx) => (
              <PromptRow key={p.key} prompt={p} onSave={(content) => { void savePrompt(p.key, content); setPrompts((arr) => arr.map((x, i) => i === idx ? { ...x, content } : x)); }} />
            ))}
          </CardContent>
        </Card>

        {/* D. Tool-Kosten */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Euro className="size-4" /> Tool-Kosten</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={usageRange} onValueChange={(v) => setUsageRange(v as typeof usageRange)}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Heute</SelectItem>
                  <SelectItem value="7d">7 Tage</SelectItem>
                  <SelectItem value="30d">30 Tage</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">Σ {totalCost.toFixed(4)} €</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {usage.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Nutzungsdaten im gewählten Zeitraum.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-2">Tool</th><th>Provider</th><th className="text-right">Aufrufe</th><th className="text-right">Kosten (€)</th></tr>
                  </thead>
                  <tbody>
                    {usage.map((u) => (
                      <tr key={`${u.tool}-${u.provider}`} className="border-b last:border-0">
                        <td className="py-2 font-medium">{u.tool}</td>
                        <td className="text-muted-foreground">{u.provider ?? "—"}</td>
                        <td className="text-right">{u.calls}</td>
                        <td className="text-right tabular-nums">{u.cost.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* E. Concierge-Inbox */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Inbox className="size-4" /> Concierge-Inbox (Live)</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            <InboxColumn title="Restaurant/Bar" items={inbox.restaurant.map((r) => ({ id: r.id, time: r.created_at, status: r.status, sub: `${r.guest_type} · ${r.table_or_room ?? "—"}` }))} />
            <InboxColumn title="Zimmer" items={inbox.room.map((r) => ({ id: r.id, time: r.created_at, status: r.status, sub: `Zimmer ${r.room_number}` }))} />
            <InboxColumn title="Beschwerden" items={inbox.complaints.map((r) => ({ id: r.id, time: r.created_at, status: r.status, sub: `${r.category} · ${r.urgency}` }))} />
          </CardContent>
        </Card>
      </div>
  );
}

function StatusCard({ label, value, health, mono }: { label: string; value: string; health?: string; mono?: boolean }) {
  return (
    <div className="rounded-md border p-3 bg-card">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm mt-1 ${mono ? "font-mono truncate" : "font-medium"}`} title={value}>{value || "—"}</div>
      {health && <Badge variant={health === "OK" ? "default" : "destructive"} className="mt-2 text-xs">{health}</Badge>}
    </div>
  );
}

function PromptRow({ prompt, onSave }: { prompt: { key: string; label: string; description: string | null; content: string }; onSave: (content: string) => void }) {
  const [val, setVal] = useState(prompt.content);
  const [open, setOpen] = useState(false);
  const dirty = val !== prompt.content;
  return (
    <div className="border rounded-md p-3">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="font-medium">{prompt.label}</div>
          {prompt.description && <div className="text-xs text-muted-foreground">{prompt.description}</div>}
        </div>
        <Badge variant="outline" className="font-mono text-xs">{prompt.key}</Badge>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <Textarea value={val} onChange={(e) => setVal(e.target.value)} rows={8} className="font-mono text-xs" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setVal(prompt.content)} disabled={!dirty}>Zurücksetzen</Button>
            <Button size="sm" onClick={() => onSave(val)} disabled={!dirty}><Save className="size-4 mr-1" /> Speichern</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InboxColumn({ title, items }: { title: string; items: Array<{ id: string; time: string; status: string; sub: string }> }) {
  return (
    <div>
      <div className="font-medium mb-2">{title}</div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Keine Einträge.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="border rounded-md p-2 text-xs flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate">{it.sub}</div>
                <div className="text-muted-foreground">{new Date(it.time).toLocaleString("de-DE")}</div>
              </div>
              <Badge variant={it.status === "new" ? "default" : "outline"} className="text-xs">{it.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
