// Cartesia-Live-Voice mit kontinuierlicher Konversation, Barge-in und Pipeline-Overlap.
// Einmal antippen → Clara hört permanent zu, erkennt Sprechpausen automatisch (VAD).
// Während Clara spricht, kann der Nutzer dazwischenreden (TTS wird sofort gestoppt).
// Tool-Calls aus clara-chat lösen echte In-App-Navigation + Scroll-Spotlights aus.
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Mic, Square, Loader2, Volume2, VolumeX, X, RotateCcw, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { writeClaraInquiryContext, readClaraInquiryContext, type ClaraInquiryContext } from "@/lib/clara/inquiry-context";

type Status = "idle" | "listening" | "recording" | "thinking" | "speaking";

const toolLabels: Record<string, string> = {
  create_conference_order: "Tagungs-Küche informiert",
  take_room_order: "Zimmerservice-Bestellung erfasst (inkl. 5 € Aufpreis)",
  take_restaurant_order: "Bestellung erfasst",
  make_table_reservation: "Tisch reserviert",
  save_lead: "Daten gespeichert",
  send_inquiry: "Seminar-Anfrage gesendet",
  navigate_to_section: "Sektion geladen",
  show_heidehof_page: "Seite geladen",
  request_wellness_appointment: "Wellness-Anfrage erfasst",
  submit_complaint: "Service-Anliegen erfasst",
};

const TRANSACTIONAL_TOOLS = new Set([
  "send_inquiry",
  "submit_inquiry",
  "take_room_order",
  "take_restaurant_order",
  "make_table_reservation",
  "take_shop_order",
  "create_conference_order",
  "request_wellness_appointment",
  "submit_complaint",
]);

interface ToolCall {
  name: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

interface ChatResponse {
  ok: boolean;
  reply?: string;
  toolCalls?: ToolCall[];
  terminate?: boolean;
  error?: string;
}

const IDLE_TIMEOUT_MS = 25_000;
const AI_CREDIT_ERROR_MESSAGE = "Clara und Max sind kurz nicht verfügbar, weil das AI-Guthaben aufgebraucht ist. Bitte laden Sie Guthaben nach und versuchen Sie es anschließend erneut.";

const getChatErrorMessage = (error: unknown, response?: ChatResponse | null, assistantName = "Clara"): string => {
  const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const apiMessage = response?.error ?? "";
  const combinedMessage = `${errorMessage} ${apiMessage}`.toLowerCase();

  if (/402|ai-guthaben|credit|credits|quota|payment/.test(combinedMessage)) {
    return AI_CREDIT_ERROR_MESSAGE;
  }

  return apiMessage || errorMessage || `Keine Antwort von ${assistantName}.`;
};

const isAiCreditErrorMessage = (message: string): boolean => message === AI_CREDIT_ERROR_MESSAGE;

const isMobileDevice = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
// VAD-Parameter — auf ElevenLabs-Niveau getunt für flüssiges Gespräch
const SILENCE_THRESHOLD = isMobileDevice ? 0.020 : 0.015;
const SILENCE_DURATION_MS = 380;   // schnellere Reaktion am Satzende für flüssige Conversation
const MIN_SPEECH_MS = 200;
const MAX_RECORDING_MS = 30_000;
// Barge-in
const BARGE_IN_THRESHOLD = isMobileDevice ? 0.25 : 0.06;
const BARGE_IN_MS = 160;

const slugifyRoom = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const dispatchInternalNav = (detail: { route?: string; section?: string; anchor?: string }) => {
  window.dispatchEvent(new CustomEvent("clara:navigate-internal", { detail }));
};

const dispatchToolCall = (tc: ToolCall) => {
  const args = (tc.args ?? {}) as Record<string, unknown>;
  const result = tc.result as { data?: Record<string, unknown> } | undefined;
  const data = result?.data ?? {};

  if (tc.name === "show_heidehof_page" && typeof args.url === "string") {
    window.dispatchEvent(new CustomEvent("clara:open-page", {
      detail: {
        url: args.url,
        title: typeof args.titel === "string" ? args.titel : "Heidehof",
        fullscreen: args.fullscreen === true,
      },
    }));
    return;
  }

  if (tc.name === "handoff_to_inquiry") {
    const result = tc.result as { data?: { topic?: string; room?: string; details?: string[] } } | undefined;
    const data = result?.data ?? {};
    writeClaraInquiryContext({
      topic: data.topic ?? (typeof args.topic === "string" ? args.topic : undefined),
      room: data.room ?? (typeof args.room === "string" ? args.room : undefined),
      details: data.details ?? (Array.isArray(args.details) ? (args.details as string[]) : undefined),
      source: window.location.pathname,
    });
    if (window.location.pathname !== "/tagungsraeume") {
      window.setTimeout(() => { window.location.href = "/tagungsraeume"; }, 1200);
    }
    return;
  }

  if (tc.name === "handoff_to_max") {
    if (window.location.pathname !== "/") {
      window.setTimeout(() => { window.location.href = "/"; }, 1200);
    }
    return;
  }

  if (tc.name === "navigate_to_section" || tc.name === "show_section" || tc.name === "navigate_to" || tc.name === "open_page") {
    const section = typeof args.section === "string" ? args.section
      : typeof args.page === "string" ? args.page
      : typeof args.target === "string" ? args.target
      : undefined;
    const route = typeof args.route === "string" ? args.route : undefined;
    const anchor = typeof args.anchor === "string" ? args.anchor : undefined;
    if (section || route || anchor) dispatchInternalNav({ route, section, anchor });
    return;
  }

  if (tc.name === "show_menu") {
    const menuType = String(args.menu_type ?? args.meal ?? args.category ?? "").toLowerCase();
    dispatchInternalNav({ route: /drink|getr|bar|wein|bier|cocktail/.test(menuType) ? "/getraenkekarte" : "/speisekarte" });
    return;
  }

  if (tc.name === "focus_form_field") {
    const target = typeof args.target === "string" ? args.target : typeof args.field === "string" ? args.field : undefined;
    const route = typeof args.route === "string" ? args.route : undefined;
    if (target) window.dispatchEvent(new CustomEvent("clara:focus-field", { detail: { target, route } }));
    return;
  }

  if (tc.name === "scroll_to" && typeof args.anchor === "string") {
    dispatchInternalNav({ anchor: args.anchor });
    return;
  }

  if (tc.name === "show_room" && typeof args.room_name === "string") {
    const slug = slugifyRoom(args.room_name);
    dispatchInternalNav({ route: "/tagungsraeume", anchor: `raum-${slug}` });
    // clara:show-media disabled — Clara must not show images
    return;
  }

  if (tc.name === "show_media") {
    // clara:show-media disabled — Clara must not show images
    return;
  }

  if (tc.name === "show_gallery") {
    // clara:show-media disabled — Clara must not show images
    return;
  }
};

interface Props {
  persona?: 'max' | 'clara';
  /** When true, the button is rendered inline (for use inside a drawer/panel). */
  embedded?: boolean;
  /** Runs the same voice pipeline without rendering any widget or panel. */
  headless?: boolean;
  /** Starts the microphone session immediately when mounted. */
  autoStart?: boolean;
  /** Optional context for the very first turn — Clara opens with product-aware response. */
  context?: ClaraInquiryContext | null;
  /** Called when Clara terminates the conversation (or idle timeout fires). */
  onClose?: () => void;
}

export const ClaraCartesiaVoice = ({ persona = 'max', embedded = false, headless = false, autoStart = false, context: ctxProp = null, onClose }: Props) => {
  const assistantName = persona === "clara" ? "Clara" : "Max";
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [level, setLevel] = useState(0); // 0..1 für UI-Wellenform
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string; toolBadge?: string }>>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sessionIdRef = useRef<string>(`voice-cartesia-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const isFirstTurnRef = useRef(true);
  const idleTimerRef = useRef<number | null>(null);
  const sessionActiveRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const turnRafRef = useRef<number | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const submittedRef = useRef(false);
  const mimeRef = useRef<string>("audio/webm");
  const bargeInRef = useRef(false);
  const terminateRef = useRef(false);
  const contextRef = useRef<ClaraInquiryContext | null>(ctxProp ?? readClaraInquiryContext());
  const autoStartedRef = useRef(false);

  // refresh context when prop changes
  useEffect(() => {
    contextRef.current = ctxProp ?? readClaraInquiryContext();
  }, [ctxProp]);

  useEffect(() => {
    const onContext = (e: Event) => {
      contextRef.current = (e as CustomEvent<ClaraInquiryContext>).detail ?? readClaraInquiryContext();
    };
    window.addEventListener("clara:context-updated", onContext as EventListener);
    return () => window.removeEventListener("clara:context-updated", onContext as EventListener);
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      if (sessionActiveRef.current) terminateRef.current = true;
    }, IDLE_TIMEOUT_MS);
  }, []);

  const flushSummary = useCallback(async () => {
    if (submittedRef.current) return;
    const turns = historyRef.current
      .map((m) => ({ role: m.role === "assistant" ? ("agent" as const) : ("user" as const), text: m.content }))
      .filter((t) => t.text.trim().length > 0);
    if (turns.length < 2) return;
    submittedRef.current = true;
    try {
      await supabase.functions.invoke("clara-voice-summary", { body: { transcript: turns } });
    } catch (err) {
      console.warn("voice-summary failed:", err);
    }
  }, []);

  const teardown = useCallback(() => {
    sessionActiveRef.current = false;
    if (turnRafRef.current !== null) {
      cancelAnimationFrame(turnRafRef.current);
      turnRafRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop(); } catch { /* noop */ }
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      void audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch { /* noop */ }
      ttsAudioRef.current = null;
    }
    isSpeakingRef.current = false;
    setLevel(0);
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      teardown();
      void flushSummary();
    };
  }, [teardown, flushSummary]);

  // Voice-Lock: wenn ein Browser-WebCall startet, sofort lokale Session beenden.
  useEffect(() => {
    const onWebCallStarting = () => {
      if (sessionActiveRef.current || isSpeakingRef.current) {
        bargeInRef.current = true;
        ttsCancelRef.current = true;
        try { ttsAudioRef.current?.pause(); } catch {}
        teardown();
        setStatus("idle");
        onClose?.();
      }
    };
    window.addEventListener("clara:webcall-starting", onWebCallStarting as EventListener);
    return () => window.removeEventListener("clara:webcall-starting", onWebCallStarting as EventListener);
  }, [teardown, onClose]);

  // FIFO Audio-Pipeline: Antwort in Sätze splitten, TTS parallel anfordern,
  // sequenziell abspielen → erste Audio nach ~250-400ms statt nach kompletter TTS.
  const ttsQueueRef = useRef<Array<{ promise: Promise<string | null>; text: string }>>([]);
  const ttsCancelRef = useRef(false);

  const splitSentences = (text: string): string[] => {
    // Schützt häufige Abkürzungen vor falschen Trennungen.
    const protectedText = text
      .replace(/\b(z\.B|d\.h|u\.a|bzw|ca|ggf|inkl|exkl|Nr|St|Hr|Fr)\./g, "$1§");
    const parts = protectedText
      .split(/(?<=[.!?…])\s+(?=[A-ZÄÖÜ"„])/g)
      .map((s) => s.replace(/§/g, ".").trim())
      .filter(Boolean);
    // Sehr kurze Stücke (<3 Wörter) mit dem nächsten zusammenhalten.
    const merged: string[] = [];
    for (const p of parts) {
      if (merged.length && p.split(/\s+/).length < 3) merged[merged.length - 1] += " " + p;
      else merged.push(p);
    }
    return merged.length ? merged : [text];
  };

  const fetchTtsBlobUrl = useCallback(async (text: string): Promise<string | null> => {
    if (isMuted) return null;
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clara-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, persona }),
      });
      if (!r.ok) return null;
      const blob = await r.blob();
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, [persona, isMuted]);

  const playTts = useCallback(async (text: string) => {
    if (isMuted) {
      isSpeakingRef.current = false;
      return;
    }
    isSpeakingRef.current = true;
    setStatus("speaking");
    ttsCancelRef.current = false;
    const sentences = splitSentences(text);

    // TTS-Anfragen mit max. 2 in flight starten (Pipeline-Overlap)
    const queue: Array<Promise<string | null>> = [];
    const MAX_IN_FLIGHT = 2;
    let nextIdx = 0;
    const startNext = () => {
      if (nextIdx >= sentences.length) return;
      const s = sentences[nextIdx++];
      queue.push(fetchTtsBlobUrl(s));
    };
    for (let i = 0; i < Math.min(MAX_IN_FLIGHT, sentences.length); i++) startNext();

    try {
      for (let i = 0; i < sentences.length; i++) {
        if (ttsCancelRef.current || bargeInRef.current) break;
        const url = await queue[i];
        startNext();
        if (!url) continue;
        if (ttsCancelRef.current || bargeInRef.current) { URL.revokeObjectURL(url); break; }
        const audio = new Audio(url);
        audio.preload = "auto";
        ttsAudioRef.current = audio;
        await new Promise<void>((resolve) => {
          const cleanup = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onended = cleanup;
          audio.onerror = cleanup;
          audio.onpause = () => { if (bargeInRef.current || ttsCancelRef.current) cleanup(); };
          audio.play().catch(cleanup);
        });
      }
    } catch (e) {
      console.warn("TTS pipeline failed:", e);
    } finally {
      // Verbleibende vorab-geladene URLs aufräumen
      for (let i = 0; i < queue.length; i++) {
        try { const u = await queue[i]; if (u) URL.revokeObjectURL(u); } catch { /* noop */ }
      }
      ttsQueueRef.current = [];
      isSpeakingRef.current = false;
    }
  }, [fetchTtsBlobUrl]);

  const handleTranscriptToReply = useCallback(async (transcript: string) => {
    setStatus("thinking");
    setError(null);
    historyRef.current.push({ role: "user", content: transcript });
    setMessages((prev) => [...prev, { role: "user", content: transcript }]);
    try {
      resetIdleTimer();
      const { data, error: invokeErr } = await supabase.functions.invoke<ChatResponse>("clara-chat", {
        body: {
          messages: historyRef.current,
          sessionId: sessionIdRef.current,
          isVoice: true,
          persona,
          isFirstTurn: isFirstTurnRef.current,
          context: contextRef.current ?? undefined,
        },
      });
      isFirstTurnRef.current = false;
      if (invokeErr || !data?.ok || !data.reply) {
        throw new Error(getChatErrorMessage(invokeErr, data, assistantName));
      }

      const tcs = data.toolCalls ?? [];
      tcs.forEach(dispatchToolCall);
      const badge = tcs
        .map((t) => toolLabels[t.name])
        .filter(Boolean)
        .join(", ");

      let finalReply = data.reply || "";
      const hasSuccessfulTransactionalTool = tcs.some((t) =>
        TRANSACTIONAL_TOOLS.has(t.name) && (t.result as { ok?: boolean } | undefined)?.ok === true
      );
      const isGeneric = /wobei darf ich sie (noch )?unterstützen|was darf ich sie (noch )?unterstützen|bei was kann ich sie (noch )?unterstützen/i.test(finalReply);

      if (hasSuccessfulTransactionalTool) {
        if (isGeneric || finalReply.length < 10) {
          for (const t of tcs) {
            const args = (t.args ?? {}) as Record<string, unknown>;
            if (typeof args.prepared_reply === "string" && args.prepared_reply.trim().length > 0) {
              finalReply = args.prepared_reply.trim();
              break;
            }
            if (typeof args.confirmed_summary === "string" && args.confirmed_summary.trim().length > 0) {
              finalReply = `Verstanden. Ich habe Folgendes erfasst: ${args.confirmed_summary.trim()}. Vielen Dank!`;
              break;
            }
          }
        }
      }

      historyRef.current.push({ role: "assistant", content: finalReply });
      setLastReply(finalReply);
      setMessages((prev) => [...prev, { role: "assistant", content: finalReply, toolBadge: badge || undefined }]);
      
      if (tcs.some((t) => TRANSACTIONAL_TOOLS.has(t.name) && (t.result as { ok?: boolean } | undefined)?.ok)) {
        submittedRef.current = true;
      }
      // TTS NICHT awaiten → Listen-Loop kann parallel laufen (Barge-in)
      void playTts(finalReply).then(() => {
        if (data.terminate || hasSuccessfulTransactionalTool) {
          terminateRef.current = true;
          // Automatisches Schließen auf Client-Seite nach 2.5 Sekunden, damit der Benutzer die Bestätigung noch lesen/hören kann
          window.setTimeout(() => {
            teardown();
            onClose?.();
          }, 2500);
        }
      });
    } catch (e) {
      const message = getChatErrorMessage(e, null, assistantName);
      console.warn("chat turn failed:", message);
      setError(message);
      if (isAiCreditErrorMessage(message)) {
        sessionActiveRef.current = false;
        setStatus("idle");
      }
    }
  }, [playTts, persona, assistantName]);

  const transcribeBlob = useCallback(async (blob: Blob): Promise<string | null> => {
    try {
      const form = new FormData();
      const ext = mimeRef.current.includes("mp4") ? "mp4" : "webm";
      form.append("file", blob, `speech.${ext}`);
      form.append("language", "de");
      const sttRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cartesia-stt`, {
        method: "POST",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: form,
      });
      const sttData = await sttRes.json();
      if (!sttData?.ok || !sttData.text) {
        setError(typeof sttData?.error === "string" ? sttData.error : "Sprache konnte nicht erkannt werden.");
        return null;
      }
      setError(null);
      return sttData.text as string;
    } catch (e) {
      console.warn("STT failed:", e);
      return null;
    }
  }, []);

  // Eine Aufnahme + VAD inkl. Barge-in-Detection.
  // Returnt Blob wenn der Nutzer gesprochen hat, sonst null.
  const recordOneTurn = useCallback(async (): Promise<Blob | null> => {
    const stream = streamRef.current;
    const analyser = analyserRef.current;
    if (!stream || !analyser) return null;

    const recorder = new MediaRecorder(stream, { mimeType: mimeRef.current });
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
    recorder.start();
    if (!isSpeakingRef.current) setStatus("listening");

    const buf = new Uint8Array(analyser.fftSize);
    const startTs = performance.now();
    let speechStartedAt: number | null = null;
    let lastVoiceTs = startTs;
    bargeInRef.current = false;

    await new Promise<void>((resolve) => {
      const tick = () => {
        if (!sessionActiveRef.current || recorder.state === "inactive") {
          resolve();
          return;
        }
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms * 8));
        const now = performance.now();

        // Effektiver Threshold: höher wenn Clara gerade spricht (Echo-Schutz),
        // niedriger wenn nur zugehört wird.
        const threshold = isSpeakingRef.current ? BARGE_IN_THRESHOLD : SILENCE_THRESHOLD;

        if (rms > threshold) {
          if (speechStartedAt === null) {
            speechStartedAt = now;
            if (!isSpeakingRef.current) setStatus("recording");
          }
          lastVoiceTs = now;

          // Barge-in: TTS sofort stoppen, sobald wir sicher sind dass User redet
          if (isSpeakingRef.current && now - speechStartedAt > BARGE_IN_MS) {
            bargeInRef.current = true;
            ttsCancelRef.current = true;
            try { ttsAudioRef.current?.pause(); } catch { /* noop */ }
            // Server-Abort, falls clara-chat noch generiert
            try {
              void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clara-chat?abort=${encodeURIComponent(sessionIdRef.current)}`, {
                method: "GET",
                headers: {
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
              });
            } catch { /* noop */ }
            isSpeakingRef.current = false;
            setStatus("recording");
          }
        }

        const elapsed = now - startTs;
        const silenceFor = now - lastVoiceTs;
        const speechMs = speechStartedAt !== null ? now - speechStartedAt : 0;

        const shouldStop =
          elapsed > MAX_RECORDING_MS ||
          (speechStartedAt !== null && speechMs > MIN_SPEECH_MS && silenceFor > SILENCE_DURATION_MS && !isSpeakingRef.current);

        if (shouldStop) { resolve(); return; }
        turnRafRef.current = requestAnimationFrame(tick);
      };
      turnRafRef.current = requestAnimationFrame(tick);
    });

    if (recorder.state !== "inactive") {
      try { recorder.stop(); } catch { /* noop */ }
    }
    await stopped;
    if (turnRafRef.current !== null) {
      cancelAnimationFrame(turnRafRef.current);
      turnRafRef.current = null;
    }

    if (speechStartedAt === null) return null;
    const blob = new Blob(chunksRef.current, { type: mimeRef.current });
    if (blob.size < 1200) return null;
    return blob;
  }, []);

  const conversationLoop = useCallback(async () => {
    while (sessionActiveRef.current) {
      if (terminateRef.current && !isSpeakingRef.current) {
        terminateRef.current = false;
        teardown();
        void flushSummary();
        onClose?.();
        break;
      }
      try {
        const blob = await recordOneTurn();
        if (!sessionActiveRef.current) break;
        if (blob) {
          const transcript = await transcribeBlob(blob);
          if (!sessionActiveRef.current) break;
          if (transcript) {
            resetIdleTimer();
            await handleTranscriptToReply(transcript);
          }
        }
        await new Promise((r) => setTimeout(r, 80));
      } catch (e) {
        console.error("conversation loop error:", e);
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    setStatus("idle");
  }, [recordOneTurn, transcribeBlob, handleTranscriptToReply, teardown, flushSummary, onClose, resetIdleTimer]);

  const buildOpeningLine = useCallback((): string => {
    const ctx = contextRef.current;
    const greeting =
      ctx?.timeOfDay === "morgens" ? "Guten Morgen" :
      ctx?.timeOfDay === "mittags" ? "Guten Tag" :
      ctx?.timeOfDay === "nachmittags" ? "Guten Nachmittag" :
      ctx?.timeOfDay === "abends" ? "Guten Abend" : "Guten Tag";

    const isFirst = ctx?.trigger === "first-visit";
    const intro = isFirst
      ? `${greeting}, mein Name ist Clara, Ihre Concierge im Heidehof.`
      : `${greeting}.`;

    if (ctx?.topic) {
      return `${intro} Ich sehe, ${ctx.topic} hat Ihr Interesse geweckt — darf ich Ihnen dazu etwas empfehlen oder direkt reservieren?`;
    }
    if (ctx?.room) {
      return `${intro} Sie betrachten gerade den ${ctx.room} — planen Sie eine Tagung oder eine Feier, und für wie viele Gäste?`;
    }
    if (ctx?.section) {
      return `${intro} Wie darf ich Sie zum Bereich ${ctx.section} begleiten?`;
    }
    if (ctx?.category === "wellness") {
      return `${intro} Darf ich Ihnen eine Behandlung empfehlen oder gleich einen Termin im Spa für Sie vormerken?`;
    }
    if (ctx?.category === "food") {
      return `${intro} Möchten Sie eine Empfehlung aus unserer Küche, oder soll ich Ihnen einen Tisch im Restaurant reservieren?`;
    }
    if (ctx?.category === "drink") {
      return `${intro} Darf ich Ihnen etwas aus unserer Bar empfehlen oder direkt an Ihren Platz bringen lassen?`;
    }
    return `${intro} Wie darf ich Ihnen behilflich sein — Reservierung, Bestellung, Spa-Termin oder ein Tagungsangebot?`;
  }, []);

  const startSession = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Mikrofon wird in diesem Browser nicht unterstützt.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      mimeRef.current = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      sessionActiveRef.current = true;
      resetIdleTimer();
      if (isFirstTurnRef.current && historyRef.current.length === 0) {
        const opener = buildOpeningLine();
        historyRef.current.push({ role: "assistant", content: opener });
        setLastReply(opener);
        setMessages([{ role: "assistant", content: opener }]);
        void playTts(opener);
      }
      void conversationLoop();
    } catch (e) {
      console.error("mic permission failed:", e);
      setError("Mikrofon-Zugriff verweigert.");
      teardown();
      setStatus("idle");
    }
  }, [buildOpeningLine, conversationLoop, playTts, resetIdleTimer, teardown]);

  const stopSession = useCallback(() => {
    teardown();
    setStatus("idle");
    void flushSummary();
  }, [teardown, flushSummary]);

  const onClick = () => {
    if (sessionActiveRef.current) stopSession();
    else void startSession();
  };

  const clearConversation = () => {
    if (ttsAudioRef.current) {
      try { ttsAudioRef.current.pause(); } catch {}
    }
    isSpeakingRef.current = false;
    historyRef.current = [];
    isFirstTurnRef.current = true;
    setLastReply(null);
    setMessages([]);
    setError(null);
    
    if (!sessionActiveRef.current) {
      void startSession();
    } else {
      const opener = buildOpeningLine();
      historyRef.current.push({ role: "assistant", content: opener });
      setLastReply(opener);
      setMessages([{ role: "assistant", content: opener }]);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (ttsAudioRef.current) {
      ttsAudioRef.current.muted = nextMuted;
    }
    if (nextMuted && isSpeakingRef.current) {
      bargeInRef.current = true;
      ttsCancelRef.current = true;
      try { ttsAudioRef.current?.pause(); } catch {}
      isSpeakingRef.current = false;
    }
  };

  const handleSendTextMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const text = textInput.trim();
    if (!text) return;
    
    setTextInput("");
    
    if (isSpeakingRef.current) {
      bargeInRef.current = true;
      ttsCancelRef.current = true;
      try { ttsAudioRef.current?.pause(); } catch {}
      isSpeakingRef.current = false;
    }
    
    await handleTranscriptToReply(text);
  };

  useEffect(() => {
    if (!autoStart || autoStartedRef.current || sessionActiveRef.current) return;
    autoStartedRef.current = true;
    void startSession();
  }, [autoStart, startSession]);

  const isActive = status !== "idle";

  const label =
    status === "listening" ? `${assistantName} hört zu` :
    status === "recording" ? "Du sprichst…" :
    status === "thinking" ? `${assistantName} denkt nach…` :
    status === "speaking" ? `${assistantName} spricht (einfach reinreden)` :
    `Mit ${assistantName} sprechen`;

  const Icon =
    status === "thinking" ? Loader2 :
    isActive ? Square :
    Mic;

  // Statisches Layout: gleicher Button, nur feine Linien-Akzente in rot/grün je nach Status
  const ringClass =
    status === "recording" ? "border-rose-400/60 shadow-[0_0_24px_-4px_rgba(244,63,94,0.45)]" :
    status === "listening" ? "border-rose-300/40 shadow-[0_0_18px_-6px_rgba(244,63,94,0.30)]" :
    status === "speaking" ? "border-zinc-400/60 shadow-[0_0_24px_-4px_rgba(16,185,129,0.45)]" :
    "border-white/15 shadow-xl";

  const wrapperClass = embedded
    ? "flex flex-col items-center justify-center gap-5 print:hidden"
    : "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 print:hidden";

  if (headless) return null;

  if (embedded) {
    return (
      <div className={wrapperClass}>
        {error && (
          <div className="max-w-sm rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive shadow-lg">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          title={label}
          aria-live="polite"
          className={`relative flex h-36 w-36 items-center justify-center rounded-full border bg-background/70 backdrop-blur-xl transition-all duration-500 hover:bg-background/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(38_55%_72%)] ${ringClass}`}
        >
          <span
            aria-hidden
            className="absolute inset-3 rounded-full border border-white/10"
            style={{ transform: `scale(${1 + level * 0.08})` }}
          />
          <span
            aria-hidden
            className={`absolute inset-8 rounded-full ${status === "speaking" ? "bg-emerald-400/20" : status === "recording" ? "bg-rose-400/20" : "bg-white/10"} blur-xl`}
          />
          <Icon className={`relative h-10 w-10 text-foreground/90 ${status === "thinking" ? "animate-spin" : ""}`} />
        </button>

        <div className="max-w-sm text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[hsl(38_55%_75%)]">
            {label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/60">Sprechen Sie einfach.</p>
        </div>

        {lastReply && (
          <div className="max-w-[34rem] rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center shadow-inner">
            <p className="text-sm leading-relaxed text-foreground/88">{lastReply}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 left-0 md:left-auto w-full md:w-[440px] h-[40vh] max-h-[40vh] md:h-[650px] md:max-h-none md:bottom-6 md:right-6 z-[999] flex flex-col border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl overflow-hidden rounded-t-3xl md:rounded-3xl animate-in slide-in-from-bottom duration-300 ease-out print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {/* Status Dot */}
          {status === "listening" || status === "recording" ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(38_55%_72%)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(38_55%_72%)]"></span>
            </span>
          ) : status === "speaking" ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          ) : status === "thinking" ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-500"></span>
          )}
          
          <div className="flex flex-col">
            <span className="font-semibold text-white tracking-wider uppercase text-xs gold-shimmer-text-pro">
              {assistantName}
            </span>
            <span className="text-[9px] text-zinc-400 uppercase tracking-widest mt-0.5">
              {status === "listening" && "hört zu"}
              {status === "recording" && "nimmt auf..."}
              {status === "thinking" && "überlegt..."}
              {status === "speaking" && "spricht"}
              {status === "idle" && "bereit"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearConversation}
            title="Verlauf löschen"
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[hsl(38_55%_72%)]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={toggleMute}
            title={isMuted ? "Ton einschalten" : "Ton stummschalten"}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[hsl(38_55%_72%)]"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <button
            type="button"
            onClick={() => {
              teardown();
              onClose?.();
            }}
            title="Schließen"
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[hsl(38_55%_72%)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main chat history list */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 no-scrollbar scroll-smooth">
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive flex items-start gap-2 shadow-inner">
            <span className="font-semibold text-rose-500 uppercase tracking-wider text-[10px] mt-0.5">Fehler:</span>
            <p className="flex-1 leading-normal">{error}</p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}>
              <div className="flex flex-col gap-1.5 max-w-[85%]">
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${
                  isUser 
                    ? "rounded-tr-none bg-white/10 text-white border-white/5" 
                    : "rounded-tl-none bg-[hsl(30_10%_18%/0.65)] text-[hsl(36_35%_95%)] border-[hsl(38_30%_55%/0.18)]"
                }`}>
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
                
                {msg.toolBadge && (
                  <div className="self-start flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(38_35%_72%/0.1)] border border-[hsl(38_35%_72%/0.15)] text-[10px] text-[hsl(38_55%_72%)] uppercase tracking-wider font-semibold">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse text-[hsl(38_55%_72%)]" />
                    <span>{msg.toolBadge}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Pulsing visualizer status block */}
      <div className="px-6 py-2.5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between select-none">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-medium">
          {status === "listening" && "Bereit zum Sprechen"}
          {status === "recording" && "Aufnahme läuft..."}
          {status === "thinking" && "Überlege..."}
          {status === "speaking" && "Spricht..."}
          {status === "idle" && "Verbindung getrennt"}
        </span>
        
        <div className="flex items-center gap-1 h-6">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-[hsl(38_55%_72%)] transition-all duration-150"
              style={{
                height: `${Math.max(4, level * (18 + i * 3) * (status === "speaking" || status === "recording" ? 1.5 : 0.15))}px`,
                opacity: status === "thinking" ? 0.3 : status === "idle" ? 0.15 : 0.85,
                animation: status === "thinking" ? "voice-bar 0.6s ease-in-out infinite alternate" : "none",
                animationDelay: `${i * 0.08}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Input bar at bottom */}
      <div className="px-4 py-4 border-t border-white/10 bg-black/95 flex items-center gap-3">
        <button
          type="button"
          onClick={onClick}
          title={status !== "idle" ? "Zuhören stoppen" : "Sprechen starten"}
          className={`p-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[hsl(38_55%_72%)] ${
            status !== "idle"
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
          }`}
        >
          {status !== "idle" ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
        </button>

        <form onSubmit={handleSendTextMessage} className="flex-1 flex items-center gap-2 bg-white/5 hover:bg-white/[0.08] focus-within:bg-white/[0.08] rounded-full px-4 py-1.5 border border-white/10 focus-within:border-white/20 transition-all">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Nachricht schreiben..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none py-1.5"
          />
          <button
            type="submit"
            disabled={!textInput.trim()}
            className="p-2 rounded-full text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors focus:outline-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClaraCartesiaVoice;
