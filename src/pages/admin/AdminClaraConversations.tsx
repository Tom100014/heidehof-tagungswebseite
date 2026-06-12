import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, RefreshCw, Sparkles, User } from "lucide-react";
import { toast } from "sonner";

interface TranscriptMessage {
  role: string;
  content: string;
  ts?: number;
}

interface ClaraConversation {
  id: string;
  session_id: string;
  created_at: string;
  updated_at: string;
  inquiry_sent: boolean;
  extracted: Record<string, unknown>;
  transcript: TranscriptMessage[];
}

const safeTranscript = (raw: unknown): TranscriptMessage[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is TranscriptMessage => Boolean(entry) && typeof entry === "object" && "role" in entry && "content" in entry)
    .map((entry) => ({
      role: String((entry as TranscriptMessage).role ?? "user"),
      content: String((entry as TranscriptMessage).content ?? ""),
      ts: typeof (entry as TranscriptMessage).ts === "number" ? (entry as TranscriptMessage).ts : undefined,
    }));
};

const previewOf = (transcript: TranscriptMessage[]): string => {
  const first = transcript.find((m) => m.content.trim().length > 0);
  return first ? first.content.slice(0, 180) : "(noch keine Nachrichten)";
};

export default function AdminClaraConversations() {
  const [items, setItems] = useState<ClaraConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clara_conversations")
        .select("id, session_id, created_at, updated_at, inquiry_sent, extracted, transcript")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const rows = (data ?? []).map((row) => ({
        id: row.id,
        session_id: row.session_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        inquiry_sent: row.inquiry_sent,
        extracted: (row.extracted as Record<string, unknown>) ?? {},
        transcript: safeTranscript(row.transcript),
      }));
      setItems(rows);
      if (rows.length > 0 && !selectedId) setSelectedId(rows[0].id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Konnte Clara-Gespräche nicht laden");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("clara_conversations_inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clara_conversations" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      it.session_id.toLowerCase().includes(q) ||
      JSON.stringify(it.extracted).toLowerCase().includes(q) ||
      it.transcript.some((m) => m.content.toLowerCase().includes(q)),
    );
  }, [items, query]);

  const selected = filtered.find((it) => it.id === selectedId) ?? filtered[0];

  return (
    <div className="p-4 lg:p-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-serif text-foreground">Clara-Gespräche</h1>
            <p className="text-sm text-muted-foreground">
              Live-Mitschnitt aller Konversationen, die Gäste mit Clara führen. Aktualisiert sich in Echtzeit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="In Transkripten suchen…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="icon" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
          <Card className="p-0 overflow-hidden bg-card/40 border-border/60">
            <div className="p-3 border-b border-border/60 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {filtered.length} Gespräche
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-border/40">
              {filtered.length === 0 && !loading && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Noch keine Konversationen erfasst.
                </div>
              )}
              {filtered.map((it) => {
                const isActive = selected?.id === it.id;
                return (
                  <button
                    type="button"
                    key={it.id}
                    onClick={() => setSelectedId(it.id)}
                    className={`w-full text-left p-3 transition-colors ${
                      isActive ? "bg-gold/10 border-l-2 border-gold" : "hover:bg-muted/30 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">{it.session_id.slice(0, 12)}…</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(it.updated_at), { addSuffix: true, locale: de })}
                      </span>
                    </div>
                    <div className="text-sm text-foreground/90 line-clamp-2">{previewOf(it.transcript)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {it.transcript.length}
                      </Badge>
                      {it.inquiry_sent && (
                        <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Anfrage gesendet
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden bg-card/40 border-border/60">
            {!selected ? (
              <div className="p-16 text-center text-muted-foreground">
                Wähle ein Gespräch links aus.
              </div>
            ) : (
              <div className="flex flex-col h-[70vh]">
                <div className="p-4 border-b border-border/60 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground font-mono">{selected.session_id}</div>
                    <div className="text-sm text-foreground/80 mt-1">
                      Begonnen {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true, locale: de })}
                      {" · "}
                      {selected.transcript.length} Nachrichten
                    </div>
                  </div>
                </div>
                {Object.keys(selected.extracted).length > 0 && (
                  <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                      Erkannte Angaben
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {Object.entries(selected.extracted).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                          <span className="text-muted-foreground">{k}</span>
                          <span className="text-foreground/90 truncate">{String(v ?? "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selected.transcript.map((m, idx) => {
                    const isClara = m.role === "assistant" || m.role === "clara";
                    return (
                      <div key={idx} className={`flex gap-2 ${isClara ? "" : "flex-row-reverse"}`}>
                        <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                          isClara ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
                        }`}>
                          {isClara ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          isClara ? "bg-muted/30 text-foreground" : "bg-primary/15 text-foreground"
                        }`}>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                            {isClara ? "Clara" : "Gast"}
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
  );
}
