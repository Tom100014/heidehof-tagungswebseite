import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Activity, Phone, MessageSquare, ArrowRightLeft } from "lucide-react";
import { ELEVENLABS_CONTEXT_LABELS, type ElevenLabsAgentContext } from "@/lib/maximilian/agent-routing";

type AgentRow = {
  context: string;
  agent_name: string;
  agent_id: string;
  is_active: boolean;
};

type ConversationRow = {
  id: string;
  agent_id: string;
  status: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  summary: string | null;
};

const VOICE_NAME = "Maximilian (ElevenLabs Default Voice)";

export function ElevenLabsLiveStatusCard({ globalEnabled }: { globalEnabled: boolean }) {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [{ data: a }, { data: c }] = await Promise.all([
        supabase.from("elevenlabs_agents").select("context,agent_name,agent_id,is_active").order("sort_order"),
        supabase
          .from("elevenlabs_conversations")
          .select("id,agent_id,status,started_at,duration_seconds,summary")
          .order("started_at", { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;
      setAgents((a as AgentRow[] | null) ?? []);
      setConversations((c as ConversationRow[] | null) ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const activeAgents = agents.filter((a) => a.is_active);
  const homepageAgent = agents.find((a) => a.context === "homepage");

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="size-4 text-amber-500" /> ElevenLabs Voice – Live-Status
          <Badge variant={globalEnabled ? "default" : "outline"} className="ml-2">
            {globalEnabled ? "Aktiv" : "Master AUS"}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Aktuelle Konfiguration und Konversationen des Maximilian-Voice-Agenten.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="text-sm text-muted-foreground">Lade …</div>
        ) : (
          <>
            {/* Voice & Default Agent */}
            <div className="grid md:grid-cols-3 gap-3">
              <InfoBox icon={<Activity className="size-4" />} label="Voice-System">
                <div className="text-sm font-medium">{VOICE_NAME}</div>
                <div className="text-[10px] text-muted-foreground mt-1">via ElevenLabs Conversational AI</div>
              </InfoBox>
              <InfoBox icon={<Mic className="size-4" />} label="Default Agent-ID">
                <div className="text-xs font-mono break-all">{homepageAgent?.agent_id ?? "—"}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{homepageAgent?.agent_name ?? "—"}</div>
              </InfoBox>
              <InfoBox icon={<Phone className="size-4" />} label="Aktive Agenten">
                <div className="text-2xl font-semibold">{activeAgents.length} / {agents.length}</div>
                <div className="text-[10px] text-muted-foreground mt-1">aktuell freigeschaltet</div>
              </InfoBox>
            </div>

            {/* Weiterleitungen */}
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <ArrowRightLeft className="size-4" /> Weiterleitung an Fach-Agenten
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Anhand der URL leitet das Widget Gäste automatisch an den passenden Spezial-Agenten weiter.
                Wenn ein Spezial-Agent inaktiv ist, fällt das System auf den Premium-Rezeptionisten zurück.
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {agents.map((a) => (
                  <div
                    key={a.context}
                    className={`flex items-start justify-between gap-2 rounded-md border p-2 text-xs ${
                      a.is_active ? "border-emerald-500/30 bg-emerald-500/5" : "border-border bg-card"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium">
                        {ELEVENLABS_CONTEXT_LABELS[a.context as ElevenLabsAgentContext] ?? a.context}
                      </div>
                      <div className="text-muted-foreground truncate">{a.agent_name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground/80 truncate">{a.agent_id}</div>
                    </div>
                    <Badge variant={a.is_active ? "default" : "outline"} className="shrink-0 text-[10px]">
                      {a.is_active ? "AKTIV" : "INAKTIV"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Konversationen */}
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <MessageSquare className="size-4" /> Letzte Konversationen ({conversations.length})
              </div>
              {conversations.length === 0 ? (
                <div className="text-xs text-muted-foreground">Noch keine Konversationen erfasst.</div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {conversations.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-2 rounded-md border bg-card/40 p-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.summary || c.status || "Konversation"}</div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">{c.agent_id}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-muted-foreground">
                          {c.started_at ? new Date(c.started_at).toLocaleString("de-DE") : "—"}
                        </div>
                        {typeof c.duration_seconds === "number" && (
                          <div className="text-[10px] text-muted-foreground">{c.duration_seconds}s</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InfoBox({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {icon} {label}
      </div>
      {children}
    </div>
  );
}

export default ElevenLabsLiveStatusCard;
