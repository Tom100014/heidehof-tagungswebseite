/**
 * ClaraWebCall — Browser-native Voice-Call mit dem Cartesia Agent.
 *
 * - Holt kurzlebigen Access-Token via `cartesia-agent-token` Edge Function
 * - Öffnet WebSocket zu wss://api.cartesia.ai/agents/stream/{agentId}
 * - Streamt Mikrofon-Audio als PCM 16kHz, spielt Agent-Audio (PCM 16kHz) zurück
 * - Übergibt clara_context als Metadata an den Agent
 *
 * Funktioniert auf Desktop / Tablet / Mobile gleichermaßen, ohne Telefonnetz.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2, PhoneOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { readClaraInquiryContext } from "@/lib/clara/inquiry-context";

type CallState = "idle" | "connecting" | "live" | "ending" | "error";

interface ClaraWebCallProps {
  agentId?: string;
  className?: string;
  label?: string;
  variant?: "pill" | "block";
  autoStart?: boolean;
  onEnded?: () => void;
}


const DEFAULT_AGENT_ID = "agent_gjYusgM21heczyikufbJ4P";
const SAMPLE_RATE = 16000;
const CARTESIA_VERSION = "2025-04-16";
const CLARA_CLOSE_EVENT = "clara:close-panel";
const CLARA_WEBCALL_STARTING_EVENT = "clara:webcall-starting";

// 16-bit PCM helpers
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function int16ToBase64(int16: Int16Array): string {
  const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

function base64ToInt16(b64: string): Int16Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
}

export const ClaraWebCall = ({
  agentId = DEFAULT_AGENT_ID,
  className,
  label = "Mit Clara sprechen",
  variant = "pill",
  autoStart = false,
  onEnded,
}: ClaraWebCallProps) => {
  const [state, setState] = useState<CallState>("idle");
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef<CallState>("idle");
  const instanceIdRef = useRef(`webcall_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  const wsRef = useRef<WebSocket | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micNodeRef = useRef<ScriptProcessorNode | null>(null);
  const playCtxRef = useRef<AudioContext | null>(null);
  const playGainRef = useRef<GainNode | null>(null);
  const playTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const streamIdRef = useRef<string>("");

  const stopAllSources = useCallback(() => {
    for (const s of activeSourcesRef.current) {
      try { s.stop(); } catch {}
      try { s.disconnect(); } catch {}
    }
    activeSourcesRef.current = [];
  }, []);

  const setCallState = useCallback((next: CallState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const cleanup = useCallback(() => {
    try { wsRef.current?.close(); } catch {}
    wsRef.current = null;
    try { micNodeRef.current?.disconnect(); } catch {}
    micNodeRef.current = null;
    try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    micStreamRef.current = null;
    try { micCtxRef.current?.close(); } catch {}
    micCtxRef.current = null;
    stopAllSources();
    try { playGainRef.current?.disconnect(); } catch {}
    playGainRef.current = null;
    try { playCtxRef.current?.close(); } catch {}
    playCtxRef.current = null;
    playTimeRef.current = 0;
  }, [stopAllSources]);


  const endCall = useCallback(() => {
    setCallState("ending");
    try {
      wsRef.current?.send(JSON.stringify({ event: "stop", stream_id: streamIdRef.current }));
    } catch {}
    cleanup();
    setCallState("idle");
    onEnded?.();
  }, [cleanup, onEnded, setCallState]);


  const playPcmChunk = useCallback((int16: Int16Array) => {
    const ctx = playCtxRef.current;
    const gain = playGainRef.current;
    if (!ctx || !gain) return;
    const buffer = ctx.createBuffer(1, int16.length, SAMPLE_RATE);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < int16.length; i++) ch[i] = int16[i] / 0x8000;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    const startAt = Math.max(ctx.currentTime, playTimeRef.current);
    src.start(startAt);
    playTimeRef.current = startAt + buffer.duration;
    activeSourcesRef.current.push(src);
    src.onended = () => {
      const idx = activeSourcesRef.current.indexOf(src);
      if (idx >= 0) activeSourcesRef.current.splice(idx, 1);
      try { src.disconnect(); } catch {}
    };
  }, []);


  const startCall = useCallback(async () => {
    const current = stateRef.current;
    if (current !== "idle" && current !== "error") return;
    setError(null);
    setCallState("connecting");
    window.dispatchEvent(new CustomEvent(CLARA_WEBCALL_STARTING_EVENT, { detail: { instanceId: instanceIdRef.current } }));
    window.dispatchEvent(new Event(CLARA_CLOSE_EVENT));
    try {
      // 1) Token holen
      const { data, error: fnErr } = await supabase.functions.invoke("cartesia-agent-token", {
        body: { agent_id: agentId },
      });
      if (fnErr || !data?.token) {
        throw new Error(data?.error ?? fnErr?.message ?? "Token konnte nicht geladen werden");
      }
      const accessToken = data.token as string;

      // 2) Mikrofon-Zugriff – sampleRate-Constraint weglassen (würde AEC kaputtmachen),
      //    Resampling läuft via AudioContext({ sampleRate: 16000 }).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      micStreamRef.current = stream;


      // 3) WebSocket öffnen (access_token als Query-Param)
      const url = new URL(`wss://api.cartesia.ai/agents/stream/${encodeURIComponent(agentId)}`);
      url.searchParams.set("access_token", accessToken);
      url.searchParams.set("cartesia_version", CARTESIA_VERSION);

      const ws = new WebSocket(url.toString());
      wsRef.current = ws;

      const claraCtx = readClaraInquiryContext() ?? {};
      const streamId = `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      streamIdRef.current = streamId;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          event: "start",
          stream_id: streamId,
          config: {
            input_format: `pcm_${SAMPLE_RATE}`,
          },
          metadata: { source: "browser_webcall", clara_context: claraCtx },
        }));
      };

      ws.onmessage = async (ev) => {
        try {
          const msg = typeof ev.data === "string" ? JSON.parse(ev.data) : null;
          if (!msg) return;
          if (msg.event === "ack") {
            if (msg.stream_id) streamIdRef.current = msg.stream_id;

            // Playback zuerst aufsetzen (ohne erzwungene sampleRate – Hardware-Rate,
            // Web Audio resamplet 16kHz-Buffer sauber). Gain leicht abgesenkt, damit
            // der Lautsprecher-Pegel die Mic-AEC nicht überfährt.
            const playCtx = new AudioContext();
            playCtxRef.current = playCtx;
            const gain = playCtx.createGain();
            gain.gain.value = 0.9;
            gain.connect(playCtx.destination);
            playGainRef.current = gain;
            playTimeRef.current = playCtx.currentTime;

            // Danach Mic-Pipeline öffnen.
            const micCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
            micCtxRef.current = micCtx;
            const source = micCtx.createMediaStreamSource(stream);
            const processor = micCtx.createScriptProcessor(2048, 1, 1);
            micNodeRef.current = processor;
            processor.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN) return;
              const pcm = floatTo16BitPCM(e.inputBuffer.getChannelData(0));
              ws.send(JSON.stringify({
                event: "media_input",
                stream_id: streamIdRef.current,
                media: { payload: int16ToBase64(pcm) },
              }));
            };
            source.connect(processor);
            processor.connect(micCtx.destination);

            setCallState("live");
          } else if (msg.event === "media_output") {
            const b64 = msg.media?.payload;
            if (b64) playPcmChunk(base64ToInt16(b64));
          } else if (msg.event === "clear") {
            // Barge-In: laufende Playback-Buffer sofort stoppen.
            stopAllSources();
            playTimeRef.current = playCtxRef.current?.currentTime ?? 0;
          } else if (msg.event === "stop") {
            endCall();
          } else if (msg.event === "error") {
            setError(msg.error ?? msg.message ?? "Cartesia-Fehler");
            setCallState("error");
            cleanup();

          } else if (msg.event === "tool_call") {
            const toolName: string = msg.tool?.name ?? msg.name ?? msg.function?.name ?? "unknown";
            let toolArgs: any = msg.tool?.arguments ?? msg.arguments ?? msg.function?.arguments ?? {};
            if (typeof toolArgs === "string") {
              try { toolArgs = JSON.parse(toolArgs); } catch { toolArgs = {}; }
            }

            // UI-Tools direkt im Browser ausführen (Scroll / Navigation / Anzeigen)
            const UI_TOOLS = new Set([
              "show_section","navigate_to_section","navigate_to","open_page",
              "show_menu","show_room","scroll_to","show_heidehof_page",
              "focus_form_field","show_media","show_gallery",
            ]);
            if (UI_TOOLS.has(toolName)) {
              try {
                window.dispatchEvent(new CustomEvent("clara:webcall-tool", {
                  detail: { name: toolName, args: toolArgs },
                }));
              } catch (e) {
                console.warn("[ClaraWebCall] ui tool dispatch failed", e);
              }
            }

            // Datentools an Backend weiterleiten (Bestellung, Anfrage, etc.)
            const DATA_TOOLS = new Set([
              "send_inquiry","save_lead","save_note",
              "make_table_reservation","create_table_reservation","reserve_table",
              "request_wellness_appointment","book_wellness","request_spa_appointment",
              "order_room_service","room_service",
              "place_order","take_restaurant_order","restaurant_order","take_room_order",
              "log_complaint","submit_complaint","complaint",
              "create_conference_order","conference_order",
              "get_call_context",
            ]);
            if (DATA_TOOLS.has(toolName) || (!UI_TOOLS.has(toolName) && toolName !== "unknown")) {
              try {
                await supabase.functions.invoke("clara-browser-handler", {
                  body: {
                    tool_name: toolName,
                    parameters: toolArgs,
                    session_id: streamIdRef.current,
                    source: "browser_webcall",
                    raw_event: msg,
                  },
                });
              } catch (toolErr) {
                console.warn("[ClaraWebCall] tool_call forward error", toolErr);
              }
            }
          }
        } catch (err) {
          console.warn("[ClaraWebCall] message parse error", err);
        }
      };

      ws.onerror = (e) => {
        console.error("[ClaraWebCall] ws error", e);
        setError("Verbindung zum Voice-Agent fehlgeschlagen");
        setCallState("error");
        cleanup();
      };

      ws.onclose = (ev) => {
        console.warn("[ClaraWebCall] ws close", ev.code, ev.reason);
        cleanup();
        const current = stateRef.current;
        if (current === "live" || current === "ending") {
          setCallState("idle");
        } else if (current === "connecting") {
          // WS closed before we received `ack` from Cartesia → Verbindung wurde
          // abgelehnt. Code 1005 (no status) bedeutet meist: Agent-Konfiguration
          // erlaubt keinen Browser-Stream (z. B. Telefon-only Routing) oder
          // ungültiges Token.
          setError(
            ev.reason?.trim()
              ? `Cartesia hat die Verbindung abgelehnt (${ev.code}): ${ev.reason}`
              : `Cartesia-Agent hat den Stream nicht akzeptiert (Code ${ev.code || "1005"}). Prüfen Sie Agent-Konfiguration (Template/Voice-Stream) bzw. CARTESIA_ADMIN_API_KEY.`,
          );
          setCallState("error");
        } else if (ev.code !== 1000 && ev.code !== 1005) {
          setError(
            ev.reason?.trim()
              ? `Verbindung getrennt (${ev.code}): ${ev.reason}`
              : `Verbindung zum Voice-Agent getrennt (Code ${ev.code}). Bitte erneut versuchen.`,
          );
          setCallState("error");
        } else {
          setCallState("idle");
        }
      };
    } catch (err) {
      console.error("[ClaraWebCall] startCall", err);
      setError(err instanceof Error ? err.message : String(err));
      setCallState("error");
      cleanup();
    }
  }, [agentId, cleanup, endCall, playPcmChunk, setCallState, stopAllSources]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const onOtherWebCallStarting = (event: Event) => {
      const otherId = (event as CustomEvent<{ instanceId?: string }>).detail?.instanceId;
      if (otherId === instanceIdRef.current) return;
      if (stateRef.current === "idle") return;
      cleanup();
      setCallState("idle");
    };
    window.addEventListener(CLARA_WEBCALL_STARTING_EVENT, onOtherWebCallStarting as EventListener);
    return () => window.removeEventListener(CLARA_WEBCALL_STARTING_EVENT, onOtherWebCallStarting as EventListener);
  }, [cleanup, setCallState]);

  useEffect(() => () => cleanup(), [cleanup]);

  // Auto-start on mount when requested (e.g. inside a modal).
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      void startCall();
    }
  }, [autoStart, startCall]);


  const isLive = state === "live";
  const isBusy = state === "connecting" || state === "ending";

  return (
    <div className={cn("inline-flex flex-col items-start gap-1.5", className)}>
      <button
        type="button"
        onClick={isLive ? endCall : startCall}
        disabled={isBusy}
        aria-label={isLive ? "Gespräch mit Clara beenden" : "Browser-Gespräch mit Clara starten"}
        className={cn(
          "group relative inline-flex items-center gap-2.5 overflow-hidden transition-all duration-500",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          variant === "pill" && [
            "px-5 py-2.5 rounded-full text-[13px] font-medium tracking-[0.08em]",
            "border backdrop-blur-xl",
            isLive
              ? "bg-gradient-to-r from-red-950/80 via-red-900/70 to-red-950/80 border-red-300/50 text-red-50 shadow-[0_8px_32px_-8px_rgba(239,68,68,0.55)]"
              : state === "error"
              ? "bg-black/75 border-amber-400/50 text-amber-100"
              : "bg-gradient-to-r from-black/70 via-zinc-900/70 to-black/70 border-amber-200/35 text-amber-50 hover:border-amber-200/70 hover:text-white shadow-[0_8px_32px_-8px_rgba(201,168,76,0.45)] hover:shadow-[0_12px_40px_-8px_rgba(201,168,76,0.7)]",
          ],
          variant === "block" && [
            "w-full justify-center px-6 py-3 rounded-xl text-base font-semibold",
            isLive ? "bg-red-600 hover:bg-red-500 text-white" : "bg-amber-600 hover:bg-amber-500 text-white",
            "shadow-lg",
          ],
          isBusy && "opacity-80 cursor-wait",
        )}
      >
        {/* Idle: sanfter Gold-Breathing-Ring */}
        {variant === "pill" && !isLive && !isBusy && state !== "error" && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-amber-200/0 animate-[clara-breathe_3.2s_ease-in-out_infinite]"
          />
        )}
        {/* Live: pulsierender roter Halo */}
        {variant === "pill" && isLive && (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-full bg-red-500/20 blur-md animate-pulse"
          />
        )}

        {isBusy && <Loader2 className="relative w-4 h-4 animate-spin" />}
        {!isBusy && isLive && <PhoneOff className="relative w-4 h-4" />}
        {!isBusy && !isLive && state === "error" && <RefreshCw className="relative w-4 h-4 text-amber-300" />}
        {!isBusy && !isLive && state !== "error" && <Mic className="relative w-4 h-4 text-amber-300" />}
        <span className="relative">
          {state === "connecting" && "Verbinde mit Clara…"}
          {state === "ending" && "Beende Gespräch…"}
          {state === "live" && "Gespräch beenden"}
          {state === "idle" && label}
          {state === "error" && "Erneut versuchen"}
        </span>

        {/* Live-Waveform statt einfachem Dot */}
        {isLive && (
          <span aria-hidden className="relative ml-1 inline-flex items-end gap-[2px] h-3.5">
            <span className="w-[2px] bg-red-300/90 rounded-full animate-[clara-wave_0.9s_ease-in-out_infinite] [animation-delay:-0.3s]" style={{ height: "40%" }} />
            <span className="w-[2px] bg-red-300/90 rounded-full animate-[clara-wave_0.9s_ease-in-out_infinite] [animation-delay:-0.15s]" style={{ height: "70%" }} />
            <span className="w-[2px] bg-red-300/90 rounded-full animate-[clara-wave_0.9s_ease-in-out_infinite]" style={{ height: "100%" }} />
            <span className="w-[2px] bg-red-300/90 rounded-full animate-[clara-wave_0.9s_ease-in-out_infinite] [animation-delay:-0.15s]" style={{ height: "70%" }} />
            <span className="w-[2px] bg-red-300/90 rounded-full animate-[clara-wave_0.9s_ease-in-out_infinite] [animation-delay:-0.3s]" style={{ height: "40%" }} />
          </span>
        )}
      </button>
      {error && (
        <span className="text-xs text-red-200/95 flex items-center gap-1.5 max-w-[280px]">
          <MicOff className="w-3 h-3 shrink-0" /> {error}
        </span>
      )}
    </div>
  );
};

export default ClaraWebCall;
