import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { readClaraInquiryContext, type ClaraInquiryContext } from "@/lib/clara/inquiry-context";
import { ClaraCartesiaVoice } from "./ClaraCartesiaVoice";

type Status = "connecting" | "listening" | "fallback" | "error";

interface Props {
  persona?: "clara" | "max";
  headless?: boolean;
  autoStart?: boolean;
  context?: ClaraInquiryContext | null;
  onClose?: () => void;
}

const IDLE_TIMEOUT_MS = 35_000;

const contextLine = (ctx: ClaraInquiryContext | null): string => {
  if (!ctx) return "Kein spezieller Seitenkontext.";
  const parts = [
    ctx.topic ? `Thema: ${ctx.topic}` : null,
    ctx.section ? `Sektion: ${ctx.section}` : null,
    ctx.category ? `Kategorie: ${ctx.category}` : null,
    ctx.trigger ? `Auslöser: ${ctx.trigger}` : null,
    ctx.localTime ? `Uhrzeit: ${ctx.localTime}` : null,
    ctx.weather ? `Wetter: ${ctx.weather}` : null,
  ].filter(Boolean);
  return parts.join(" · ") || "Kein spezieller Seitenkontext.";
};

export function ClaraOpenAIRealtimeVoice({ persona = "clara", headless = false, autoStart = false, context: ctxProp = null, onClose }: Props) {
  const [status, setStatus] = useState<Status>("connecting");
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idleRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const contextRef = useRef<ClaraInquiryContext | null>(ctxProp ?? readClaraInquiryContext());

  const stop = useCallback(() => {
    if (idleRef.current !== null) {
      window.clearTimeout(idleRef.current);
      idleRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    dcRef.current?.close();
    dcRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
    onClose?.();
  }, [onClose]);

  const resetIdle = useCallback(() => {
    if (idleRef.current !== null) window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => {
      stop();
    }, IDLE_TIMEOUT_MS);
  }, [stop]);

  const sendInitialContext = useCallback(() => {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    const ctx = contextRef.current ?? readClaraInquiryContext();
    const text = [
      `Du bist ${persona === "max" ? "Max" : "Clara"} im Hotel Der Heidehof.`,
      `Aktueller Webseitenkontext: ${contextLine(ctx)}.`,
      "Begrüße kurz passend zum Kontext und führe das Gespräch zielführend weiter.",
      "Wenn es um Speisen oder Getränke geht, frage Positionen, Sonderwünsche, Ort, Gastart und Bestätigung ab.",
      "Wenn es um Tagung geht, frage Firma, Datum, Personen, Raum, Verpflegung, Technik und Kontakt ab.",
    ].join(" ");

    dc.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    }));
    dc.send(JSON.stringify({ type: "response.create" }));
    resetIdle();
  }, [persona, resetIdle]);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStatus("connecting");
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Mikrofon wird in diesem Browser nicht unterstützt.");
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const audio = document.createElement("audio");
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = (event) => {
        audio.srcObject = event.streams[0];
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      pc.addTrack(stream.getAudioTracks()[0], stream);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        setStatus("listening");
        sendInitialContext();
      };
      dc.onmessage = () => resetIdle();
      dc.onerror = () => {
        setError("Realtime-Datenkanal meldet einen Fehler.");
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-realtime-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: offer.sdp,
      });

      const answerText = await response.text();
      if (!response.ok) throw new Error(answerText || `Realtime konnte nicht gestartet werden (${response.status}).`);

      await pc.setRemoteDescription({ type: "answer", sdp: answerText });
      resetIdle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "OpenAI Realtime konnte nicht gestartet werden.";
      console.warn("OpenAI realtime failed, falling back:", message);
      setError(message);
      setStatus("fallback");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
    }
  }, [resetIdle, sendInitialContext]);

  useEffect(() => {
    contextRef.current = ctxProp ?? readClaraInquiryContext();
  }, [ctxProp]);

  useEffect(() => {
    if (autoStart) void start();
    return () => {
      if (idleRef.current !== null) window.clearTimeout(idleRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      dcRef.current?.close();
      pcRef.current?.close();
    };
  }, [autoStart, start]);

  if (status === "fallback") {
    return (
      <ClaraCartesiaVoice
        persona={persona}
        headless={headless}
        autoStart
        context={ctxProp}
        onClose={onClose}
      />
    );
  }

  if (headless) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[999] rounded-2xl border border-white/15 bg-black/90 p-4 text-white shadow-2xl">
      <div className="text-xs uppercase tracking-[0.24em] text-white/55">Clara Realtime</div>
      <div className="mt-1 text-sm">{status === "listening" ? "Hört zu" : "Verbindet ..."}</div>
      {error && <div className="mt-2 text-xs text-rose-200">{error}</div>}
      <button type="button" onClick={stop} className="mt-3 rounded-full border border-white/20 px-3 py-1 text-xs">
        Beenden
      </button>
    </div>
  );
}

export default ClaraOpenAIRealtimeVoice;
