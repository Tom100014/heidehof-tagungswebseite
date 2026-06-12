import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ELEVENLABS_CONTEXT_LABELS } from "@/lib/maximilian/agent-routing";

type AgentRow = {
  id: string;
  context: string;
  agent_name: string;
  agent_id: string;
  is_active: boolean;
  sort_order: number;
};

export function ElevenLabsAgentsCard() {
  const [loading, setLoading] = useState(true);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [agents, setAgents] = useState<AgentRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: settingRow }, { data: agentRows }] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "elevenlabs_enabled").maybeSingle(),
      supabase.from("elevenlabs_agents").select("*").order("sort_order", { ascending: true }),
    ]);
    setGlobalEnabled(settingRow?.value === true);
    setAgents((agentRows as AgentRow[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleGlobal = async (next: boolean) => {
    setGlobalEnabled(next);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "elevenlabs_enabled", value: next }, { onConflict: "key" });
    if (error) {
      setGlobalEnabled(!next);
      toast.error("Konnte ElevenLabs nicht umschalten");
      return;
    }
    toast.success(next ? "ElevenLabs Voice aktiviert" : "ElevenLabs Voice deaktiviert");
  };

  const toggleAgent = async (id: string, next: boolean) => {
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: next } : a)));
    const { error } = await supabase
      .from("elevenlabs_agents")
      .update({ is_active: next })
      .eq("id", id);
    if (error) {
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !next } : a)));
      toast.error("Konnte Agent nicht umschalten");
    }
  };

  const updateAgentId = async (id: string, agent_id: string) => {
    const trimmed = agent_id.trim();
    const { error } = await supabase
      .from("elevenlabs_agents")
      .update({ agent_id: trimmed })
      .eq("id", id);
    if (error) {
      toast.error("Konnte Agent-ID nicht speichern");
      return;
    }
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, agent_id: trimmed } : a)));
    toast.success("Agent-ID gespeichert");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="size-4" /> ElevenLabs Conversational AI – Agenten
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Seitenspezifische Maximilian-Voice-Agenten. Das Widget wählt basierend auf der URL automatisch den passenden Agenten und fällt auf „Homepage / Allgemein" zurück, wenn kein kontextspezifischer Agent aktiv ist.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <div className="font-semibold text-foreground">ElevenLabs Voice aktiv</div>
            <p className="text-xs text-muted-foreground mt-1">
              Master-Schalter. Wenn AUS, erscheint kein ElevenLabs-Widget auf der Website – unabhängig von den einzelnen Agenten.
            </p>
          </div>
          <Switch checked={globalEnabled} onCheckedChange={toggleGlobal} disabled={loading} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Kontext</th>
                <th className="px-3 py-2 text-left">Agent-Name</th>
                <th className="px-3 py-2 text-left">Agent-ID</th>
                <th className="px-3 py-2 text-center w-24">Aktiv</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  <Loader2 className="size-4 animate-spin inline mr-2" /> Lade Agenten…
                </td></tr>
              )}
              {!loading && agents.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Keine Agenten konfiguriert.
                </td></tr>
              )}
              {agents.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-3 py-3 align-top">
                    <Badge variant="outline" className="font-medium">
                      {ELEVENLABS_CONTEXT_LABELS[a.context as keyof typeof ELEVENLABS_CONTEXT_LABELS] ?? a.context}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 align-top font-medium text-foreground">{a.agent_name}</td>
                  <td className="px-3 py-3 align-top">
                    <Label htmlFor={`agent-${a.id}`} className="sr-only">Agent-ID</Label>
                    <Input
                      id={`agent-${a.id}`}
                      defaultValue={a.agent_id}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value.trim() !== a.agent_id) {
                          void updateAgentId(a.id, e.target.value);
                        }
                      }}
                      className="font-mono text-xs h-8"
                    />
                  </td>
                  <td className="px-3 py-3 align-top text-center">
                    <Switch checked={a.is_active} onCheckedChange={(v) => void toggleAgent(a.id, v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Routing: <code>/tagung*</code> → Tagung &nbsp;·&nbsp; <code>/spa</code> / <code>/wellness</code> → Wellness &nbsp;·&nbsp;
          <code>/zimmer</code> / <code>/hotel</code> → Zimmer &nbsp;·&nbsp; <code>/speisekarte</code> / <code>/getraenkekarte</code> / <code>/restaurant</code> → Service &nbsp;·&nbsp;
          alle anderen Seiten → Premium-Rezeptionist.
        </p>
      </CardContent>
    </Card>
  );
}

export default ElevenLabsAgentsCard;
