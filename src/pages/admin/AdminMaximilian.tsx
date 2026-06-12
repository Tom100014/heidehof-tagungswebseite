import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Phone, Clock, ArrowRight, Sparkles, Power, Inbox } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

type Conv = {
  id: string;
  conversation_id: string | null;
  agent_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  transcript: Array<{ role?: string; message?: string; text?: string }>;
  audio_url: string | null;
  clara_context: any;
  summary: string | null;
  extracted_fields: any;
  triggered_action_type: string | null;
  triggered_action_id: string | null;
};

type Inquiry = {
  id: string;
  created_at: string;
  guest_name: string | null;
  guest_contact: string | null;
  category: string | null;
  message: string;
  page_context: string | null;
  conversation_summary: string | null;
  ticket_required: boolean;
  status: string;
  agent_used: string;
};

const ACTION_LABEL: Record<string, string> = {
  tagungsanfrage: "Tagungsanfrage",
  tischreservierung: "Tischreservierung",
  spa_termin: "Spa-Termin",
  beschwerde: "Beschwerde",
  info_only: "Information",
};

const ACTION_COLOR: Record<string, string> = {
  tagungsanfrage: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  tischreservierung: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  spa_termin: "bg-pink-500/15 text-pink-700 border-pink-500/30",
  beschwerde: "bg-red-500/15 text-red-700 border-red-500/30",
  info_only: "bg-muted text-muted-foreground",
};

const CATEGORY_COLOR: Record<string, string> = {
  zimmer: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  tagung: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  wellness: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  spa: "bg-pink-500/15 text-pink-700 border-pink-500/30",
  restaurant: "bg-purple-500/15 text-purple-700 border-purple-500/30",
  event: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30",
  beschwerde: "bg-red-500/15 text-red-700 border-red-500/30",
  kontakt: "bg-slate-500/15 text-slate-700 border-slate-500/30",
  allgemein: "bg-muted text-muted-foreground",
};

const STATUS_FLOW: Record<string, string> = {
  neu: "in_bearbeitung",
  in_bearbeitung: "erledigt",
  erledigt: "neu",
};

export default function AdminMaximilian() {
  // Settings
  const [enabled, setEnabled] = useState(true);
  const [agentId, setAgentId] = useState("");
  const [savingAgent, setSavingAgent] = useState(false);

  // Conversations
  const [items, setItems] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<Conv | null>(null);
  const [loading, setLoading] = useState(true);

  // Inquiries
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inqFilter, setInqFilter] = useState<"alle" | "neu" | "in_bearbeitung" | "erledigt" | "tickets">("alle");

  // Settings laden
  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", ["maximilian_agent_id", "maximilian_enabled"]);
      if (!data) return;
      const map = Object.fromEntries(data.map((r: { key: string; value: unknown }) => [r.key, r.value]));
      if (typeof map.maximilian_agent_id === "string") setAgentId(map.maximilian_agent_id);
      setEnabled(map.maximilian_enabled !== false);
    })();
  }, []);

  const toggleEnabled = async (next: boolean) => {
    setEnabled(next);
    await supabase.from("app_settings").upsert(
      { key: "maximilian_enabled", value: next as unknown as any },
      { onConflict: "key" },
    );
  };

  const saveAgentId = async () => {
    setSavingAgent(true);
    await supabase.from("app_settings").upsert(
      { key: "maximilian_agent_id", value: agentId as unknown as any },
      { onConflict: "key" },
    );
    setSavingAgent(false);
  };

  // Conversations laden + live
  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("elevenlabs_conversations")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200);
      if (!error && data) setItems(data as Conv[]);
      setLoading(false);
    })();

    const ch = supabase
      .channel("maximilian_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "elevenlabs_conversations" },
        () => {
          void supabase
            .from("elevenlabs_conversations")
            .select("*")
            .order("started_at", { ascending: false })
            .limit(200)
            .then(({ data }) => data && setItems(data as Conv[]));
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(ch); };
  }, []);

  // Inquiries laden + live
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) setInquiries(data as Inquiry[]);
    };
    void load();
    const ch = supabase
      .channel("inquiries_live")
      .on("postgres_changes", { event: "*", schema: "public", table: "inquiries" }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, []);

  const cycleStatus = async (i: Inquiry) => {
    const next = STATUS_FLOW[i.status] ?? "neu";
    await supabase.from("inquiries").update({ status: next }).eq("id", i.id);
  };

  const filtered = inquiries.filter((i) => {
    if (inqFilter === "alle") return true;
    if (inqFilter === "tickets") return i.ticket_required;
    return i.status === inqFilter;
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const stats = {
    total: inquiries.length,
    neu: inquiries.filter((i) => i.status === "neu").length,
    tickets: inquiries.filter((i) => i.ticket_required && i.status !== "erledigt").length,
    today: inquiries.filter((i) => i.status === "erledigt" && new Date(i.created_at) >= today).length,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-serif">Maximilian</h1>
          <p className="text-sm text-muted-foreground">Voice-Agent (ElevenLabs) · Gespräche · Anfragen</p>
        </div>
      </div>

      {/* System-Steuerung */}
      <Card className="mb-6 border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Power className="h-4 w-4 text-amber-500" /> ElevenLabs-System
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6 items-center">
          <div className="flex items-center gap-3">
            <Switch checked={enabled} onCheckedChange={toggleEnabled} />
            <div>
              <div className="text-sm font-medium">{enabled ? "Aktiv" : "Inaktiv"}</div>
              <div className="text-xs text-muted-foreground">
                Maximilian-Widget {enabled ? "wird auf der gesamten Webseite angezeigt" : "ist ausgeblendet"}.
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">ElevenLabs Agent-ID</label>
              <Input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="agent_…" className="font-mono text-sm" />
            </div>
            <Button onClick={saveAgentId} disabled={savingAgent} className="bg-amber-600 hover:bg-amber-700">
              {savingAgent ? "Speichere…" : "Speichern"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Gesamt</div><div className="text-2xl font-serif">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Neu</div><div className="text-2xl font-serif text-amber-600">{stats.neu}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tickets offen</div><div className="text-2xl font-serif text-red-600">{stats.tickets}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Heute erledigt</div><div className="text-2xl font-serif text-emerald-600">{stats.today}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="inquiries" className="w-full">
        <TabsList>
          <TabsTrigger value="inquiries"><Inbox className="h-4 w-4 mr-1" />Anfragen ({inquiries.length})</TabsTrigger>
          <TabsTrigger value="conversations"><Phone className="h-4 w-4 mr-1" />Gespräche ({items.length})</TabsTrigger>
        </TabsList>

        {/* INQUIRIES */}
        <TabsContent value="inquiries" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">Anfragen aus Maximilian-Gesprächen</CardTitle>
              <div className="flex gap-1 flex-wrap">
                {(["alle", "neu", "in_bearbeitung", "erledigt", "tickets"] as const).map((f) => (
                  <Button key={f} size="sm" variant={inqFilter === f ? "default" : "outline"} onClick={() => setInqFilter(f)}>
                    {f === "alle" ? "Alle" : f === "neu" ? "Neu" : f === "in_bearbeitung" ? "In Bearbeitung" : f === "erledigt" ? "Erledigt" : "Nur Tickets"}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh]">
                {filtered.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground">Keine Anfragen.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background border-b text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left p-3">Zeit</th>
                        <th className="text-left p-3">Gast</th>
                        <th className="text-left p-3">Kontakt</th>
                        <th className="text-left p-3">Kategorie</th>
                        <th className="text-left p-3">Seite</th>
                        <th className="text-left p-3">Nachricht</th>
                        <th className="text-left p-3">Ticket</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((i) => (
                        <tr key={i.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(i.created_at), "dd.MM. HH:mm", { locale: de })}
                          </td>
                          <td className="p-3">{i.guest_name ?? "—"}</td>
                          <td className="p-3 text-xs">{i.guest_contact ?? "—"}</td>
                          <td className="p-3">
                            <Badge variant="outline" className={CATEGORY_COLOR[i.category ?? "allgemein"] ?? CATEGORY_COLOR.allgemein}>
                              {i.category ?? "allgemein"}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs font-mono">{i.page_context ?? "—"}</td>
                          <td className="p-3 max-w-[280px]"><div className="line-clamp-2 text-xs">{i.message}</div></td>
                          <td className="p-3">{i.ticket_required ? <Badge variant="destructive">Ticket</Badge> : "—"}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" onClick={() => void cycleStatus(i)}>
                              {i.status}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONVERSATIONS */}
        <TabsContent value="conversations" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Gespräche ({items.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[60vh]">
                  {loading ? (
                    <div className="p-6 text-sm text-muted-foreground">Lade…</div>
                  ) : items.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">
                      Noch keine Gespräche. Webhook in ElevenLabs:{" "}
                      <code className="text-xs">/functions/v1/elevenlabs-webhook</code>
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {items.map((c) => (
                        <li key={c.id}>
                          <button
                            onClick={() => setSelected(c)}
                            className={`w-full text-left p-4 hover:bg-muted/50 transition ${selected?.id === c.id ? "bg-muted" : ""}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className={ACTION_COLOR[c.triggered_action_type || "info_only"]}>
                                {ACTION_LABEL[c.triggered_action_type || "info_only"]}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {c.duration_seconds ? `${c.duration_seconds}s` : "—"}
                              </span>
                            </div>
                            <div className="text-sm font-medium line-clamp-2">{c.summary || "Ohne Zusammenfassung"}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(new Date(c.started_at), "dd. MMM yyyy · HH:mm", { locale: de })}
                              {c.clara_context?.route ? ` · ${c.clara_context.route}` : ""}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              {!selected ? (
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  Wählen Sie ein Gespräch links aus.
                </CardContent>
              ) : (
                <>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl font-serif">
                          {ACTION_LABEL[selected.triggered_action_type || "info_only"]}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(selected.started_at), "EEEE, dd. MMMM yyyy · HH:mm", { locale: de })}
                          {" · "}{selected.duration_seconds ?? 0}s
                          {" · ID "}{selected.conversation_id?.slice(0, 12) ?? selected.id.slice(0, 8)}
                        </p>
                      </div>
                      {selected.triggered_action_id && (
                        <Badge variant="secondary" className="gap-1">
                          Vorgang #{selected.triggered_action_id.slice(0, 8)}
                          <ArrowRight className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selected.summary && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Zusammenfassung</h3>
                        <p className="text-sm leading-relaxed">{selected.summary}</p>
                      </div>
                    )}
                    {selected.audio_url && (
                      <div>
                        <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Audio</h3>
                        <audio controls src={selected.audio_url} className="w-full" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Verlauf</h3>
                      <ScrollArea className="h-[300px] border rounded">
                        <div className="p-3 space-y-2">
                          {selected.transcript.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Kein Transkript verfügbar.</p>
                          ) : (
                            selected.transcript.map((t, i) => (
                              <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] p-2 rounded text-sm ${t.role === "user" ? "bg-primary/10" : "bg-amber-500/10 border border-amber-500/20"}`}>
                                  <div className="text-[10px] uppercase opacity-60 mb-1">{t.role === "user" ? "Gast" : "Maximilian"}</div>
                                  {t.message ?? t.text ?? ""}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
