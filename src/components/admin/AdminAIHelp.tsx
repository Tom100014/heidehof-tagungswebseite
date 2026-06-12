/**
 * AdminAIHelp — Globaler KI-Hilfe Floating-Button mit Chat-Drawer
 *
 * Erscheint unten rechts auf jeder Admin-Seite. Kennt aktuelle Route + Titel,
 * fragt die Edge Function `admin-help` (Kontext + Betriebshandbuch).
 */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, X, Send, Loader2, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  pageTitle?: string;
}

const STORAGE_KEY = "admin-ai-help:open";

export default function AdminAIHelp({ pageTitle }: Props) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset Konversation bei Routenwechsel (frischer Kontext)
  useEffect(() => {
    setMessages([]);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-help", {
        body: { messages: next, route: pathname, pageTitle },
      });
      if (error) throw error;
      const reply = (data as { reply?: string })?.reply || "Keine Antwort erhalten.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Entschuldigung, der KI-Helfer ist gerade nicht erreichbar. Bitte später erneut versuchen.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const SUGGESTIONS: Record<string, string[]> = {
    default: [
      "Was kann ich auf dieser Seite tun?",
      "Wie hängt das mit anderen Bereichen zusammen?",
      "Wo finde ich die Einstellungen dazu?",
    ],
    "/admin/inbox": [
      "Wie beantworte ich eine Anfrage?",
      "Was bedeutet der Status 'neu'?",
    ],
    "/admin/conference-orders": [
      "Wie ändere ich eine Bestellung?",
      "Wie sehe ich nur heute?",
    ],
    "/admin/clara-cockpit": [
      "Welches Modell ist günstiger?",
      "Wie ändere ich Claras Stimme?",
    ],
  };
  const suggestions = SUGGESTIONS[pathname] || SUGGESTIONS.default;

  return (
    <>
      {/* Floating Trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="KI-Hilfe öffnen"
          className={cn(
            "fixed bottom-5 right-5 z-[60] group",
            "w-14 h-14 rounded-full shadow-2xl",
            "bg-apple-gradient text-white",
            "flex items-center justify-center",
            "hover:scale-105 active:scale-95 transition-transform",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))] focus-visible:ring-offset-2",
          )}
        >
          <Sparkles className="w-6 h-6" />
          <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-popover border border-border text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
            KI-Hilfe
          </span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-[59] bg-black/30 backdrop-blur-[1px] md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="KI-Hilfe"
            className={cn(
              "fixed z-[60] bg-card border border-border shadow-2xl flex flex-col",
              "inset-x-3 bottom-3 top-16 rounded-2xl",
              "md:inset-auto md:bottom-5 md:right-5 md:top-auto md:w-[420px] md:h-[600px] md:rounded-2xl",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-apple-gradient flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">KI-Hilfe</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                    {pageTitle || pathname}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Schließen"
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Frag mich alles zu dieser Seite. Ich kenne den Aufbau, das
                      Betriebshandbuch und Claras Wissensbasis.
                    </p>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold">
                      Vorschläge
                    </p>
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setInput(s);
                          inputRef.current?.focus();
                        }}
                        className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-[hsl(var(--apple))] text-white"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Denke nach…
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Frage stellen…"
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-[hsl(var(--apple))] max-h-32"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  aria-label="Senden"
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
                    input.trim() && !loading
                      ? "bg-[hsl(var(--apple))] text-white hover:bg-[hsl(var(--apple-deep))]"
                      : "bg-muted text-muted-foreground cursor-not-allowed",
                  )}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 text-center">
                Enter = Senden · Shift+Enter = Neue Zeile
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
