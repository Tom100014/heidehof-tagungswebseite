import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff, X } from "lucide-react";
import { contextForPath, type ElevenLabsAgentContext } from "@/lib/maximilian/agent-routing";
import { useActiveAssistant, OPEN_MAXIMILIAN_EVENT } from "@/hooks/use-active-assistant";

const HIDE_PREFIXES = ["/admin", "/konferenz", "/menue-bestellung"];

// Per-Route Kontext-Prompt für Maximilian
const ROUTE_CONTEXT: Record<string, string> = {
  "/": "Gast auf Startseite. Herzlich begrüßen, nach Anliegen fragen: Übernachtung, Wellness, Tagung oder Restaurant.",
  "/tagungsraeume": "Gast schaut Tagungsräume an. 8 Räume bis 150 Personen, hybride Technik erwähnen. Nach Datum + Personenzahl fragen.",
  "/tagungspauschalen": "Gast interessiert sich für Pauschalen. Basis ab 49€, Premium ab 69€, Exklusiv ab 89€ p.P. Nach Datum fragen.",
  "/wellness": "Gast auf Wellness-Seite. Heidehof-Oase: 400m² Spa, Pool, Sauna, Dampfbad. Tagesbesuch oder Übernachtung?",
  "/spa": "Gast schaut Spa-Behandlungen. Massagen ab 65€, Hot-Stone 95€, Gesichtsbehandlungen. Wunschtermin erfragen.",
  "/restaurant": "Gast beim Restaurant Maxwell / Bar Mäx. Di-Sa 18-22 Uhr, Sonntags-Brunch 11-14 Uhr, Mo Ruhetag. Tischreservierung anbieten.",
  "/veranstaltungen": "Gast schaut Events. Private Veranstaltung, Firmenfeier oder öffentliches Event?",
  "/zimmer": "Gast schaut Zimmer. Standard ab 89€, Komfort ab 119€, Superior ab 149€. Anreisedatum erfragen.",
  "/kontakt": "Gast auf Kontaktseite. Direkt fragen womit geholfen werden kann.",
};

const ROUTE_CATEGORY: Record<string, string> = {
  "/": "allgemein",
  "/tagungsraeume": "tagung",
  "/tagungspauschalen": "tagung",
  "/ausstattung-technik": "tagung",
  "/wellness": "wellness",
  "/spa": "spa",
  "/restaurant": "restaurant",
  "/speisekarte": "restaurant",
  "/getraenkekarte": "restaurant",
  "/veranstaltungen": "event",
  "/zimmer": "zimmer",
  "/kontakt": "kontakt",
};

type TranscriptEntry = { role: "user" | "agent"; text: string; at: number };

export function MaximilianWidget() {
  const location = useLocation();
  const { assistant: activeAssistant } = useActiveAssistant();
  const [agentId, setAgentId] = useState<string | null>(null);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const sessionStartRef = useRef<number | null>(null);

  const currentContext: ElevenLabsAgentContext = useMemo(
    () => contextForPath(location.pathname),
    [location.pathname],
  );

  // Active agent + global toggle are resolved server-side; the
  // elevenlabs_agents table is admin-only readable to avoid leaking agent IDs.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-active-elevenlabs-agent?context=${encodeURIComponent(currentContext)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
        });
        const json = (await res.json()) as { enabled?: boolean; agentId?: string | null };
        if (cancelled) return;
        setGlobalEnabled(Boolean(json.enabled));
        setAgentId(json.agentId ?? null);
      } catch {
        if (!cancelled) {
          setGlobalEnabled(false);
          setAgentId(null);
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [currentContext]);


  // Auto-Speichern nach Gesprächsende (Punkt 5)
  const persistInquiry = useCallback(async () => {
    try {
      const entries = transcriptRef.current;
      const startedAt = sessionStartRef.current;
      transcriptRef.current = [];
      sessionStartRef.current = null;

      const duration = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
      const summary = entries
        .slice(-6)
        .map((e) => `${e.role === "user" ? "Gast" : "Maximilian"}: ${e.text}`)
        .join("\n");
      const message = summary || `Gespräch geführt (${duration}s)`;

      await supabase.from("inquiries").insert({
        message,
        page_context: location.pathname,
        category: ROUTE_CATEGORY[location.pathname] ?? "allgemein",
        conversation_summary: summary || null,
        agent_used: "Maximilian",
        status: "neu",
        ticket_required: false,
      });
    } catch {
      // still ignore (Punkt 5)
    }
  }, [location.pathname]);

  const conversation = useConversation({
    onConnect: () => {
      sessionStartRef.current = Date.now();
      transcriptRef.current = [];
    },
    onDisconnect: () => {
      void persistInquiry();
    },
    onMessage: (msg: { source?: string; message?: string }) => {
      const text = msg?.message?.trim();
      if (!text) return;
      const role: "user" | "agent" = msg.source === "user" ? "user" : "agent";
      transcriptRef.current.push({ role, text, at: Date.now() });
    },
    onError: (e: unknown) => {
      console.error("[Maximilian] error", e);
      setMicError("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    },
  });

  const status = conversation.status;
  const isConnected = status === "connected";
  const isSpeaking = conversation.isSpeaking;

  const contextPrompt = useMemo(() => {
    return ROUTE_CONTEXT[location.pathname] ?? ROUTE_CONTEXT["/"];
  }, [location.pathname]);

  const start = useCallback(async () => {
    if (!agentId) return;
    setMicError(null);
    setConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId,
        connectionType: "webrtc",
        overrides: {
          agent: {
            prompt: { prompt: contextPrompt },
          },
        },
      } as Parameters<typeof conversation.startSession>[0]);
    } catch (e) {
      console.error("[Maximilian] start failed", e);
      setMicError("Mikrofonzugriff verweigert oder Verbindung fehlgeschlagen.");
    } finally {
      setConnecting(false);
    }
  }, [agentId, contextPrompt, conversation]);

  const stop = useCallback(async () => {
    try { await conversation.endSession(); } catch { /* noop */ }
  }, [conversation]);

  // Externes Öffnen (z.B. von AskClaraButton wenn ElevenLabs aktiv ist)
  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      if (!isConnected && !connecting && agentId) void start();
    };
    window.addEventListener(OPEN_MAXIMILIAN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MAXIMILIAN_EVENT, onOpen);
  }, [agentId, connecting, isConnected, start]);

  // Hide-Logik: nur sichtbar wenn ElevenLabs als aktiver Assistent gewählt ist
  const hide = HIDE_PREFIXES.some((p) => location.pathname.startsWith(p));
  if (hide || activeAssistant !== "elevenlabs" || !globalEnabled || !agentId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3" data-maximilian-widget>
      {open && (
        <div className="w-[320px] rounded-2xl border border-amber-500/30 bg-neutral-950/95 backdrop-blur-xl shadow-2xl shadow-amber-500/10 p-5 text-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`relative h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center ${isSpeaking ? "animate-pulse" : ""}`}>
                <span className="text-sm font-serif text-neutral-900">M</span>
                {isConnected && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
                )}
              </div>
              <div>
                <div className="text-sm font-serif tracking-wide">Maximilian</div>
                <div className="text-[10px] uppercase tracking-wider text-amber-400/80">
                  {connecting ? "verbinde…" : isConnected ? (isSpeaking ? "spricht" : "hört zu") : "bereit"}
                </div>
              </div>
            </div>
            <button
              onClick={() => { void stop(); setOpen(false); }}
              className="text-neutral-400 hover:text-neutral-100 transition"
              aria-label="Schließen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs leading-relaxed text-neutral-300 mb-4">
            Ihr persönlicher Concierge im Hotel Der Heidehof. Sprechen Sie mich gerne an.
          </p>

          {micError && (
            <div className="text-xs text-red-400 mb-3">{micError}</div>
          )}

          {!isConnected ? (
            <button
              onClick={() => { void start(); }}
              disabled={connecting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-neutral-900 font-medium text-sm py-2.5 transition hover:brightness-110 disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
              {connecting ? "Verbinde…" : "Gespräch starten"}
            </button>
          ) : (
            <button
              onClick={() => { void stop(); }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/40 text-amber-300 font-medium text-sm py-2.5 transition hover:bg-amber-500/10"
            >
              <MicOff className="h-4 w-4" />
              Gespräch beenden
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Maximilian öffnen"
        className={`group relative h-14 w-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-2xl shadow-amber-500/30 flex items-center justify-center transition hover:scale-105 ${isConnected ? "ring-2 ring-emerald-500" : ""}`}
      >
        <span className={`absolute inset-0 rounded-full bg-amber-400/40 ${isSpeaking ? "animate-ping" : ""}`} />
        <span className="relative font-serif text-lg text-neutral-900">M</span>
      </button>
    </div>
  );
}

export default MaximilianWidget;
