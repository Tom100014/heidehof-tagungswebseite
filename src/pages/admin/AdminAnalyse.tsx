import { useState, useEffect } from "react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Send, Database, BarChart3, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Source = {
  id: string;
  source_table: string;
  category: string | null;
  original_created_at: string | null;
  summary: string;
  similarity: number;
};

type ArchiveRow = {
  id: string;
  source_table: string;
  category: string | null;
  summary: string;
  payload: Record<string, unknown>;
  archived_at: string;
  original_created_at: string | null;
};

const SAMPLE_QUESTIONS = [
  "Wie viele Tagungsanfragen kamen im letzten Monat?",
  "Welche Beschwerden tauchen am häufigsten auf?",
  "Was bestellen Gäste am häufigsten in der Bar Mäx?",
  "Welche Zimmer-Probleme wurden gemeldet?",
];

const SOURCE_LABELS: Record<string, string> = {
  tagungs_inquiries: "Tagungen",
  conference_orders: "Tagungs-Menüs",
  restaurant_orders: "Restaurant",
  room_orders: "Zimmer-Service",
  complaints: "Beschwerden",
  clara_conversations: "Clara-Gespräche",
};

const AdminAnalyse = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<Source[]>([]);
  const [thinking, setThinking] = useState(false);

  const [stats, setStats] = useState<Record<string, number>>({});
  const [archive, setArchive] = useState<ArchiveRow[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadStats = async () => {
    const { data, error } = await supabase
      .from("requests_archive")
      .select("source_table, category");
    if (error) { console.error(error); return; }
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r: { source_table: string }) => {
      counts[r.source_table] = (counts[r.source_table] ?? 0) + 1;
    });
    setStats(counts);
  };

  const loadArchive = async () => {
    setArchiveLoading(true);
    let q = supabase
      .from("requests_archive")
      .select("id, source_table, category, summary, payload, archived_at, original_created_at")
      .order("archived_at", { ascending: false })
      .limit(100);
    if (filterSource) q = q.eq("source_table", filterSource);
    const { data, error } = await q;
    if (error) { toast.error(error.message); setArchiveLoading(false); return; }
    setArchive((data ?? []) as ArchiveRow[]);
    setArchiveLoading(false);
  };

  useEffect(() => { loadStats(); loadArchive(); }, [filterSource]);

  const ask = async () => {
    if (!question.trim() || thinking) return;
    setThinking(true);
    setAnswer("");
    setSources([]);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-requests", {
        body: { question, filter_source: filterSource || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnswer(data.answer ?? "");
      setSources(data.sources ?? []);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Fehler bei der Analyse");
    } finally {
      setThinking(false);
    }
  };

  const deleteArchive = async (id: string) => {
    const { error } = await supabase.from("requests_archive").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setArchive(prev => prev.filter(a => a.id !== id));
    toast.success("Aus Archiv gelöscht");
    setConfirmDelete(null);
    loadStats();
  };

  const filteredArchive = archive.filter(a =>
    !archiveSearch.trim() || a.summary.toLowerCase().includes(archiveSearch.toLowerCase())
  );

  return (
    <HeidehofAdminLayout title="Analyse – Heidehof">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Anfragen-Analyse & KI
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Stelle Fragen zu allen archivierten Gäste-Anfragen, Bestellungen und Beschwerden.
            Die KI durchsucht das Archiv semantisch (RAG) und antwortet mit Quellenangaben.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(SOURCE_LABELS).map(([key, label]) => (
            <div key={key} className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="text-2xl font-serif text-foreground mt-1">{stats[key] ?? 0}</p>
              <p className="text-xs text-muted-foreground/60">archiviert</p>
            </div>
          ))}
        </div>

        {/* RAG Chat */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-serif text-lg text-foreground">KI-Analyse</h3>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="Stelle eine Frage zu den archivierten Anfragen…"
              className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={thinking}
            />
            <button
              onClick={ask}
              disabled={thinking || !question.trim()}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Fragen
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {SAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {(answer || thinking) && (
            <div className="mt-4 p-4 bg-muted/40 rounded-lg border border-border">
              {thinking && !answer ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> KI durchsucht das Archiv…
                </div>
              ) : (
                <div className="text-sm text-foreground whitespace-pre-wrap">{answer}</div>
              )}

              {sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Quellen</p>
                  <ul className="space-y-1.5">
                    {sources.map((s, i) => (
                      <li key={s.id} className="text-xs text-muted-foreground flex gap-2">
                        <span className="font-mono text-muted-foreground/60">[{i + 1}]</span>
                        <span>
                          <span className="font-medium text-foreground">{SOURCE_LABELS[s.source_table] ?? s.source_table}</span>
                          {s.category && <span className="text-muted-foreground"> · {s.category}</span>}
                          {s.original_created_at && <span className="text-muted-foreground/60"> · {format(new Date(s.original_created_at), "dd.MM.yyyy", { locale: de })}</span>}
                          <span className="text-muted-foreground/60"> · Ähnlichkeit {(s.similarity * 100).toFixed(0)}%</span>
                          <p className="mt-0.5 text-muted-foreground">{s.summary}</p>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Archive Browser */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-serif text-lg text-foreground">Archiv-Browser</h3>
              <span className="text-xs text-muted-foreground">({filteredArchive.length})</span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Volltextsuche…"
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-border bg-muted/40 text-foreground"
              >
                <option value="">Alle Bereiche</option>
                {Object.entries(SOURCE_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {archiveLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Lade Archiv…
            </div>
          ) : filteredArchive.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Database className="w-8 h-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Noch keine archivierten Einträge</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs min-w-[600px]">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground sticky top-0 bg-card border-b border-border">
                  <tr>
                    <th className="px-3 py-2.5">Bereich</th>
                    <th className="px-3 py-2.5">Kategorie</th>
                    <th className="px-3 py-2.5">Original</th>
                    <th className="px-3 py-2.5">Inhalt</th>
                    <th className="px-3 py-2.5">Archiviert</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredArchive.map(a => (
                    <tr key={a.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">
                        {SOURCE_LABELS[a.source_table] ?? a.source_table}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{a.category ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {a.original_created_at ? format(new Date(a.original_created_at), "dd.MM.yy", { locale: de }) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-foreground/80 max-w-[400px] truncate" title={a.summary}>
                        {a.summary}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(a.archived_at), { locale: de, addSuffix: true })}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => setConfirmDelete(a.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                          title="Aus Archiv löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Aus Archiv löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Endgültig aus der Analyse-Datenbank entfernen – nicht wiederherstellbar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteArchive(confirmDelete)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </HeidehofAdminLayout>
  );
};

export default AdminAnalyse;
