import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Send, Sparkles, Volume2, VolumeX, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { writeClaraInquiryContext } from "@/lib/clara/inquiry-context";
import { HEIDEHOF_SECTIONS } from "@/lib/clara/heidehof-routes";
import { RichMarkdown } from "@/components/chat/RichMarkdown";

interface ChatMedia {
  url: string;
  title?: string;
  caption?: string | null;
  mediaType?: "image" | "video";
  thumbnailUrl?: string | null;
  category?: string;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
  toolBadges?: string[];
  media?: ChatMedia[];
  pageUrl?: string;
  pageTitle?: string;
}

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: { ok?: boolean; data?: unknown; error?: string };
}

interface ChatResponse {
  ok: boolean;
  sessionId: string;
  reply: string;
  toolCalls?: ToolCall[];
  terminate?: boolean;
  error?: string;
}

interface ClaraResolvedMedia {
  title?: string;
  description?: string | null;
  media_type?: "image" | "video";
  url?: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  category?: string;
}

const asRecord = (value: unknown): Record<string, unknown> => (
  typeof value === "object" && value !== null ? value as Record<string, unknown> : {}
);

const readResolvedMedia = (value: unknown): ClaraResolvedMedia | null => {
  const record = asRecord(value);
  const nested = asRecord(record.media);
  const mediaRecord = typeof nested.url === "string" ? nested : record;
  if (typeof mediaRecord.url !== "string") return null;
  const mediaType = mediaRecord.media_type === "video" ? "video" : "image";
  return {
    title: typeof mediaRecord.title === "string" ? mediaRecord.title : undefined,
    description: typeof mediaRecord.description === "string" ? mediaRecord.description : null,
    media_type: mediaType,
    url: mediaRecord.url,
    thumbnail_url: typeof mediaRecord.thumbnail_url === "string" ? mediaRecord.thumbnail_url : null,
    caption: typeof mediaRecord.caption === "string" ? mediaRecord.caption : null,
    category: typeof mediaRecord.category === "string" ? mediaRecord.category : undefined,
  };
};

const AI_CREDIT_ERROR_MESSAGE = "Clara ist kurz nicht verfügbar, weil das AI-Guthaben aufgebraucht ist. Bitte laden Sie Guthaben nach und senden Sie die Nachricht anschließend erneut.";

const getChatErrorMessage = (error: unknown, response?: ChatResponse | null, assistantName = "Clara"): string => {
  const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const apiMessage = response?.error ?? "";
  const combinedMessage = `${errorMessage} ${apiMessage}`.toLowerCase();

  if (combinedMessage.includes("402") || combinedMessage.includes("ai-guthaben") || combinedMessage.includes("credits")) {
    return AI_CREDIT_ERROR_MESSAGE;
  }

  return apiMessage || errorMessage || `Verbindung zu ${assistantName} fehlgeschlagen.`;
};

const slugifyRoom = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Storage keys are resolved dynamically inside the component based on the active persona.

const toolLabel: Record<string, string> = {
  save_lead: "Daten gespeichert",
  save_note: "Notiz erfasst",
  send_inquiry: "Anfrage versendet",
  recommend_room: "Raumempfehlung",
  show_media: "Bild geladen",
  show_gallery: "Galerie geladen",
  show_room: "Raum gezeigt",
  show_section: "Sektion gezeigt",
  show_heidehof_page: "Heidehof-Seite geöffnet",
  navigate_to_section: "Heidehof-Seite geöffnet",
  take_restaurant_order: "Bestellung erfasst",
  take_room_order: "Zimmer-Service erfasst",
  make_table_reservation: "Tischreservierung erfasst",
  request_wellness_appointment: "Wellness-Anfrage erfasst",
  submit_complaint: "Anliegen erfasst",
  take_shop_order: "Shop-Bestellung erfasst",
  focus_form_field: "Formularfeld markiert",
};

interface Props {
  initialContext?: {
    room?: string;
    topic?: string;
    details?: string[];
    source?: string;
    category?: "drink" | "food" | "event" | "tagung" | "room" | "wellness" | "package" | "general";
    area_sqm?: number;
    capacity?: number;
  };

  textOnly?: boolean;
  isMinimized?: boolean;
  persona?: 'clara';
  autoStartVoice?: boolean;
  /** When true: messages area has no own border/bg — blends with a parent card */
  seamless?: boolean;
}

type SpeechRecognitionResultEventLike = {
  resultIndex?: number;
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (event: SpeechRecognitionResultEventLike) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  const browserWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition ?? null;
};

const extractFinalTranscript = (event: SpeechRecognitionResultEventLike): string => {
  const startIndex = typeof event.resultIndex === "number" ? event.resultIndex : 0;
  const parts: string[] = [];
  for (let index = startIndex; index < event.results.length; index += 1) {
    const transcript = event.results[index]?.[0]?.transcript?.trim();
    if (transcript) parts.push(transcript);
  }
  return parts.join(" ").trim();
};

export function ClaraRagChat({ initialContext, textOnly = false, isMinimized = false, persona = 'clara', autoStartVoice = false, seamless = false }: Props) {
  const assistantName = "Clara";
  const avatarSlug = "clara-avatar";
  const voiceFirst = autoStartVoice || persona === "clara";
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Clara ist Voice-first: Gäste bekommen sofort eine geführte Konversation.
  // Wer nicht sprechen möchte, beendet das Mikrofon und schreibt im Textfeld weiter.
  const [muted, setMuted] = useState(!voiceFirst);
  const [lightboxMedia, setLightboxMedia] = useState<ChatMedia | null>(null);

  // Resolve storage keys dynamically based on active persona
  const sessionKeyName = `clara_rag_session_${persona}`;
  const storeKeyName = `clara_rag_history_${persona}`;

  // Wichtig: Session/History NIE löschen, wenn der Gast einen anderen Button drückt.
  // Clara soll das Gespräch fortsetzen wie ein echter Concierge — Kontextwechsel
  // erfolgt über translateContextToQuery() im Effect weiter unten.
  const [sessionId] = useState<string>(() => {
    try {
      const stored = sessionStorage.getItem(`clara_rag_session_${persona}`);
      if (stored) return stored;
    } catch { /* ignore */ }
    const id = crypto.randomUUID();
    try { sessionStorage.setItem(`clara_rag_session_${persona}`, id); } catch { /* ignore */ }
    return id;
  });
  const [inquirySent, setInquirySent] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  // Mobile/iOS fallback: MediaRecorder → cartesia-stt
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordMimeRef = useRef<string>("audio/webm");
  const silenceTimerRef = useRef<number | null>(null);
  const audioAnalyserRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; raf: number | null } | null>(null);
  const sendMessageRef = useRef<(text: string) => void>(() => undefined);
  const startListeningRef = useRef<() => void>(() => undefined);
  const isSendingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const shouldListenRef = useRef(false);
  const inquirySentRef = useRef(false);
  const greetedRef = useRef(false);

  const lastContextRef = useRef<string>("");

  // Restore history
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storeKeyName);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMsg[];
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          return;
        }
      }
    } catch { /* ignore */ }
    setMessages([]);
  }, [storeKeyName]);

  // Translate initialContext to a contextual user-side query so Clara
  // engages immediately with the exact item the guest tapped.
  const translateContextToQuery = useCallback((ctx: NonNullable<Props["initialContext"]>): string => {
    const topic = ctx.topic;
    const room = ctx.room;
    const category = ctx.category;
    const sizeBits = [
      ctx.area_sqm ? `${ctx.area_sqm} m²` : "",
      ctx.capacity ? `bis ${ctx.capacity} Personen` : "",
    ].filter(Boolean).join(", ");

    if (category === "drink" && topic) return `Ich interessiere mich für „${topic}" von der Getränkekarte – können Sie mir kurz dazu helfen?`;
    if (category === "food" && topic) return `Ich interessiere mich für „${topic}" – passt das für meinen Anlass?`;
    if (category === "wellness" && topic) return `Ich interessiere mich für „${topic}" im Spa – welche Termine sind frei?`;
    if (category === "package" && topic) return `Ich interessiere mich für die Pauschale „${topic}"${sizeBits ? ` (${sizeBits})` : ""} – können Sie das für mich konkretisieren?`;
    if (room) return `Ich interessiere mich für den Raum „${room}"${sizeBits ? ` (${sizeBits})` : ""} – ist er an meinem Wunschtermin frei?`;
    if (category === "tagung") return topic ? `Ich interessiere mich für „${topic}" – können wir das gleich durchgehen?` : `Ich plane eine Tagung – können Sie mir helfen?`;
    if (topic) return `Ich interessiere mich für „${topic}" – können Sie mir helfen?`;
    return "";
  }, []);


  // Initialize lastContextRef to prevent duplicate processing on first load
  useEffect(() => {
    if (initialContext) {
      const ctxStr = `${initialContext.category || ''}-${initialContext.topic || ''}-${initialContext.room || ''}-${initialContext.details?.join(',') || ''}`;
      lastContextRef.current = ctxStr;
    }
  }, []);

  // Listen for context updates to trigger user query in active session
  useEffect(() => {
    if (!initialContext) return;
    const ctxStr = `${initialContext.category || ''}-${initialContext.topic || ''}-${initialContext.room || ''}-${initialContext.details?.join(',') || ''}`;
    if (ctxStr === lastContextRef.current) return;
    lastContextRef.current = ctxStr;

    // Only trigger query if we already have history or were greeted in this session
    const sessionGreeted = sessionStorage.getItem(`clara_greeted_${persona}`);
    if (messages.length > 0 || sessionGreeted) {
      const query = translateContextToQuery(initialContext);
      if (query) {
        const timer = setTimeout(() => {
          sendMessageRef.current(query);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [initialContext, messages.length, persona, translateContextToQuery]);

  // Persist history
  useEffect(() => {
    if (messages.length === 0) return;
    try { sessionStorage.setItem(storeKeyName, JSON.stringify(messages.slice(-30))); } catch { /* ignore */ }
  }, [messages, storeKeyName]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => { isSendingRef.current = isSending; }, [isSending]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { inquirySentRef.current = inquirySent; }, [inquirySent]);
  useEffect(() => {
    if (voiceFirst) setMuted(false);
  }, [voiceFirst]);

  useEffect(() => () => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
  }, []);

  const speak = useCallback(async (text: string, forcePlay?: boolean) => {
    if (forcePlay) {
      setMuted(false);
      setIsVoiceMode(true);
      shouldListenRef.current = true;
    }
    if ((muted && !forcePlay) || !text) {
      if (shouldListenRef.current && !inquirySentRef.current) {
        window.setTimeout(() => startListeningRef.current(), 180);
      }
      return;
    }
    try {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Direct fetch — supabase.functions.invoke mishandles streamed audio responses
      const { data: sessionData } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/clara-tts`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${sessionData.session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, persona }),
      });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.startsWith("audio")) {
        const errBody = await res.text().catch(() => "");
        console.warn("TTS not playable:", res.status, errBody);
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (shouldListenRef.current && !inquirySentRef.current) {
          window.setTimeout(() => startListeningRef.current(), 180);
        }
        return;
      }
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          URL.revokeObjectURL(audioUrl);
          if (shouldListenRef.current && !inquirySentRef.current) {
            window.setTimeout(() => startListeningRef.current(), 180);
          }
        };
        await audioRef.current.play().catch((err) => {
          console.warn("Audio play blocked:", err);
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (shouldListenRef.current && !inquirySentRef.current) {
            window.setTimeout(() => startListeningRef.current(), 180);
          }
        });
      }
    } catch (e) {
      console.warn("TTS failed", e);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      if (shouldListenRef.current && !inquirySentRef.current) {
        window.setTimeout(() => startListeningRef.current(), 180);
      }
    }
  }, [muted, persona]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    const userMsg: ChatMsg = { role: "user", content: trimmed, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsSending(true);
    isSendingRef.current = true;
    recognitionRef.current?.stop();

    try {
      const apiMessages = next.map((m) => ({ role: m.role, content: m.content }));
      const userTurnCount = next.filter((message) => message.role === "user").length;
      const { data, error } = await supabase.functions.invoke<ChatResponse>("clara-chat", {
        body: { messages: apiMessages, sessionId, isVoice: isVoiceMode, persona, context: initialContext ?? null, isFirstTurn: userTurnCount === 1 },
      });
      if (error || !data?.ok) {
        throw new Error(getChatErrorMessage(error, data, assistantName));
      }

      const badges = (data.toolCalls ?? [])
        .map((tc) => toolLabel[tc.name])
        .filter((b): b is string => Boolean(b));

      const isFoodCategory = (cat?: string) => {
        if (!cat) return false;
        const c = cat.toLowerCase();
        return c === "food" || c === "speise" || c === "speisekarte" || c === "essen" || c === "menue" || c === "menu";
      };

      const collectedMedia: ChatMedia[] = [];
      let collectedPageUrl: string | undefined;
      let collectedPageTitle: string | undefined;
      // Clara must never show images — media display is permanently disabled.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const pushMedia = (_media: ClaraResolvedMedia | null) => { /* images disabled */ };

      // Trigger overlays + interne Navigation aus Tool-Calls
      for (const tc of data.toolCalls ?? []) {
        const args = (tc.args ?? {}) as Record<string, unknown>;
        const isAnfrage = window.location.pathname === "/tagungsraeume";
        if (tc.name === "show_heidehof_page" && typeof args.url === "string") {
          collectedPageUrl = args.url;
          collectedPageTitle = typeof args.titel === "string" ? args.titel : "Heidehof";
          const isBookingUrl = args.url.includes("onepagebooking.com/parkhotelheidehof") || args.url.includes("onepagebooking.com");
          if (isBookingUrl) {
            window.dispatchEvent(new CustomEvent("clara:open-page", {
              detail: { url: "https://onepagebooking.com/parkhotelheidehof", title: "Zimmer buchen", target: "overlay", fullscreen: true },
            }));
          } else {
            if (isAnfrage) {
              window.dispatchEvent(new CustomEvent("clara:open-page", {
                detail: { url: args.url, title: collectedPageTitle, target: "hero", fullscreen: args.fullscreen === true },
              }));
            } else {
              // Check if internal route
              let isInternal = false;
              let internalPath = args.url;
              try {
                const u = new URL(args.url, window.location.origin);
                if (u.origin === window.location.origin) {
                  isInternal = true;
                  internalPath = u.pathname + u.search + u.hash;
                }
              } catch {
                if (args.url.startsWith("/")) {
                  isInternal = true;
                }
              }
              if (isInternal) {
                const hashIdx = internalPath.indexOf("#");
                const route = hashIdx !== -1 ? internalPath.slice(0, hashIdx) : internalPath;
                const anchor = hashIdx !== -1 ? internalPath.slice(hashIdx + 1) : undefined;
                window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
                  detail: { route: route.startsWith("/") ? route : undefined, section: route, anchor }
                }));
              } else {
                // External -> open in overlay
                window.dispatchEvent(new CustomEvent("clara:open-page", {
                  detail: { url: args.url, title: collectedPageTitle, target: "overlay", fullscreen: args.fullscreen === true },
                }));
              }
            }
          }
        } else if (tc.name === "handoff_to_inquiry") {
          const data = (tc.result?.data ?? {}) as { topic?: string; room?: string; details?: string[] };
          writeClaraInquiryContext({
            topic: data.topic ?? (typeof args.topic === "string" ? args.topic : undefined),
            room: data.room ?? (typeof args.room === "string" ? args.room : undefined),
            details: data.details ?? (Array.isArray(args.details) ? (args.details as string[]) : undefined),
            source: window.location.pathname,
          });
          if (window.location.pathname !== "/tagungsraeume") {
            window.setTimeout(() => { window.location.href = "/tagungsraeume"; }, 800);
          }
        } else if (tc.name === "navigate_to_section" && typeof args.section === "string") {
          if (isAnfrage) {
            window.dispatchEvent(new CustomEvent("clara:open-page", {
              detail: { section: args.section, title: args.section, target: "hero" },
            }));
          } else {
            window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
              detail: { section: args.section }
            }));
          }
        } else if (tc.name === "show_section" && typeof args.section === "string") {
          if (isAnfrage) {
            window.dispatchEvent(new CustomEvent("clara:open-page", {
              detail: { section: args.section, title: args.section, target: "hero" },
            }));
          } else {
            window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
              detail: { section: args.section }
            }));
          }
        } else if (tc.name === "navigateTo" || tc.name === "navigate_internal") {
          const page = typeof args.page === "string" ? args.page : typeof args.route === "string" ? args.route : undefined;
          if (page) window.dispatchEvent(new CustomEvent("clara:navigate-internal", { detail: { route: page.startsWith("/") ? page : undefined, section: page } }));
        } else if (tc.name === "focus_form_field") {
          const target = typeof args.target === "string" ? args.target : typeof args.field === "string" ? args.field : undefined;
          const route = typeof args.route === "string" ? args.route : undefined;
          if (target) window.dispatchEvent(new CustomEvent("clara:focus-field", { detail: { target, route } }));
        } else if (tc.name === "highlightSection" && typeof args.anchor === "string") {
          window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
            detail: { route: typeof args.route === "string" ? args.route : "/tagungsraeume", anchor: args.anchor },
          }));
        }

        // Hero-Update + globaler Overlay + Inline-Bild im Chat
        // Images permanently disabled for Clara.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const broadcastOverlay = (_m: ClaraResolvedMedia | null) => { /* images disabled */ };

        if (tc.name === "recommend_room" || tc.name === "show_room") {
          const roomName = typeof args.name === "string" ? args.name : typeof args.room === "string" ? args.room : typeof args.room_name === "string" ? args.room_name : undefined;
          const media = readResolvedMedia(tc.result?.data);
          pushMedia(media);
          broadcastOverlay(media);
          const image = media?.media_type === "video" ? (media.thumbnail_url ?? media.url) : media?.url ?? (typeof args.image_url === "string" ? args.image_url : typeof args.image === "string" ? args.image : undefined);
          const info = media?.caption ?? media?.description ?? (typeof args.summary === "string" ? args.summary : typeof args.description === "string" ? args.description : undefined);
          if (isAnfrage) {
            if (roomName || image || info || media?.title) {
              window.dispatchEvent(new CustomEvent("clara:hero-update", {
                detail: { title: roomName ?? media?.title, image, info, mediaType: media?.media_type, kind: "room" },
              }));
            }
          } else if (roomName) {
            const slug = slugifyRoom(roomName);
            window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
              detail: { route: "/tagungsraeume", anchor: `raum-${slug}` }
            }));
          }
        } else if (tc.name === "show_media") {
          const media = readResolvedMedia(tc.result?.data);
          const cat = media?.category ?? args.category as string;
          const topic = args.topic as string;
          if (isFoodCategory(cat) || isFoodCategory(topic)) {
            window.dispatchEvent(new CustomEvent("clara:open-page", {
              detail: { url: "/speisekarte", title: "Speisekarte", target: "hero" },
            }));
          } else {
            pushMedia(media);
            broadcastOverlay(media);
            const image = media?.media_type === "video" ? (media.thumbnail_url ?? media.url) : media?.url;
            const info = media?.caption ?? media?.description ?? undefined;
            if (image) window.dispatchEvent(new CustomEvent("clara:hero-update", { detail: { title: media?.title, image, info, mediaType: media?.media_type, kind: "media" } }));
            
            if (!isAnfrage) {
              const topicVal = typeof args.topic === "string" ? args.topic : undefined;
              const categoryVal = typeof args.category === "string" ? args.category : undefined;
              let route: string | undefined;
              if (categoryVal === "getraenke" || categoryVal === "drinks" || categoryVal === "drink") {
                route = "/getraenkekarte";
              } else if (categoryVal === "speise" || categoryVal === "food" || categoryVal === "food_and_drink") {
                route = "/speisekarte";
              } else if (categoryVal === "raum" || categoryVal === "rooms" || categoryVal === "room") {
                route = "/tagungsraeume";
              } else if (categoryVal === "spa" || categoryVal === "wellness" || categoryVal === "beauty") {
                route = "/wellness";
              }
              if (route) {
                const anchor = topicVal ? slugifyRoom(topicVal) : undefined;
                window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
                  detail: { route, anchor }
                }));
              }
            }
          }
        } else if (tc.name === "show_gallery") {
          const cat = args.category as string;
          const topic = args.topic as string;
          if (isFoodCategory(cat) || isFoodCategory(topic)) {
            window.dispatchEvent(new CustomEvent("clara:open-page", {
              detail: { url: "/speisekarte", title: "Speisekarte", target: "hero" },
            }));
          } else {
            const data = asRecord(tc.result?.data);
            const matches = Array.isArray(data.matches) ? data.matches : [];
            for (const m of matches) {
              pushMedia(readResolvedMedia(m));
            }
            const first = readResolvedMedia(matches[0]);
            broadcastOverlay(first);
            if (first?.url) {
              const image = first.media_type === "video" ? (first.thumbnail_url ?? first.url) : first.url;
              window.dispatchEvent(new CustomEvent("clara:hero-update", {
                detail: { title: first.title, image, info: first.caption ?? first.description ?? undefined, mediaType: first.media_type, kind: "gallery" },
              }));
            }
            
            if (!isAnfrage) {
              const categoryVal = typeof args.category === "string" ? args.category : undefined;
              const topicVal = typeof args.topic === "string" ? args.topic : undefined;
              let route: string | undefined;
              if (categoryVal === "getraenke" || categoryVal === "drinks" || categoryVal === "drink") {
                route = "/getraenkekarte";
              } else if (categoryVal === "speise" || categoryVal === "food" || categoryVal === "food_and_drink") {
                route = "/speisekarte";
              } else if (categoryVal === "raum" || categoryVal === "rooms" || categoryVal === "room") {
                route = "/tagungsraeume";
              } else if (categoryVal === "spa" || categoryVal === "wellness" || categoryVal === "beauty") {
                route = "/wellness";
              }
              if (route) {
                const anchor = topicVal ? slugifyRoom(topicVal) : undefined;
                window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
                  detail: { route, anchor }
                }));
              }
            }
          }
        } else if (tc.name === "show_menu") {
          if (isAnfrage) {
            window.dispatchEvent(new CustomEvent("clara:open-page", {
              detail: { url: "/speisekarte", title: "Speisekarte", target: "hero" },
            }));
          } else {
            window.dispatchEvent(new CustomEvent("clara:navigate-internal", {
              detail: { route: "/speisekarte" }
            }));
          }
        }
      }

      const assistantMsg: ChatMsg = {
        role: "assistant",
        content: data.reply || "…",
        ts: Date.now(),
        toolBadges: badges.length ? Array.from(new Set(badges)) : undefined,
        media: collectedMedia.length ? collectedMedia : undefined,
        pageUrl: collectedPageUrl,
        pageTitle: collectedPageTitle,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const sentInquiry = (data.toolCalls ?? []).some((tc) => tc.name === "send_inquiry" && tc.result?.ok);
      if (sentInquiry) {
        setInquirySent(true);
        inquirySentRef.current = true;
        toast.success("Anfrage erfolgreich gesendet – wir melden uns!");
      }

      const orderTc = (data.toolCalls ?? []).find((tc) => tc.name === "create_conference_order");
      if (orderTc?.result?.ok) {
        const d = orderTc.result.data as { room_name?: string } | undefined;
        toast.success(`Bestellung an Küche übermittelt – Raum ${d?.room_name ?? ""}`);
      } else if (orderTc && !orderTc.result?.ok) {
        toast.error(`Bestellung fehlgeschlagen: ${orderTc.result?.error ?? "Unbekannt"}`);
      }
      const statusTc = (data.toolCalls ?? []).find((tc) => tc.name === "update_order_status");
      if (statusTc?.result?.ok) {
        const d = statusTc.result.data as { status?: string } | undefined;
        toast.success(`Status aktualisiert: ${d?.status ?? ""}`);
      }

      if (data.reply) {
        void speak(data.reply);
      } else if (shouldListenRef.current && !inquirySentRef.current) {
        window.setTimeout(() => startListeningRef.current(), 180);
      }
      if (data.terminate) {
        setInquirySent(true);
        inquirySentRef.current = true;
        shouldListenRef.current = false;
        recognitionRef.current?.stop();
      }
    } catch (e) {
      const message = getChatErrorMessage(e, null, assistantName);
      console.warn("clara-chat failed:", message);
      toast.error(message);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: message,
        ts: Date.now(),
      }]);
      if (shouldListenRef.current && !inquirySentRef.current) {
        window.setTimeout(() => startListeningRef.current(), 450);
      }
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
    }
  }, [assistantName, initialContext, isSending, isVoiceMode, messages, persona, sessionId, speak]);

  useEffect(() => {
    sendMessageRef.current = (text: string) => { void sendMessage(text); };
  }, [sendMessage]);

  const [weatherText, setWeatherText] = useState<string>("");
  const [weatherFetched, setWeatherFetched] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active && !weatherFetched) {
        setWeatherFetched(true);
      }
    }, 400);

    async function fetchWeather() {
      try {
        const { data } = await supabase.functions.invoke("weather-integration", {
          body: { location: "Ingolstadt" }
        });
        if (active && data?.success && data?.today) {
          const temp = Math.round(data.today.temp);
          const condition = (data.today.condition || "").toLowerCase();
          let weatherDesc = "";
          if (condition.includes("klar") || condition.includes("sonn")) {
            weatherDesc = `die Sonne strahlt gerade bei ${temp} Grad in Ingolstadt`;
          } else if (condition.includes("regen") || condition.includes("schauer") || condition.includes("niesel")) {
            weatherDesc = `es regnet gerade bei ${temp} Grad in Ingolstadt`;
          } else if (condition.includes("bewölkt") || condition.includes("bedeckt")) {
            weatherDesc = `es ist bewölkt bei ${temp} Grad in Ingolstadt`;
          } else {
            weatherDesc = `wir haben gerade ${temp} Grad und ${data.today.condition} in Ingolstadt`;
          }
          setWeatherText(weatherDesc);
        }
      } catch (err) {
        console.warn("Failed to fetch weather:", err);
      } finally {
        if (active) {
          setWeatherFetched(true);
          clearTimeout(timer);
        }
      }
    }
    fetchWeather();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [weatherFetched]);

  // Auto-greeting – sofort (kein Warten auf Wetter), deckt alle Kategorien ab
  useEffect(() => {
    if (messages.length > 0 || sessionStorage.getItem(`clara_greeted_${persona}`)) return;
    if (greetedRef.current) return;

    greetedRef.current = true;
    sessionStorage.setItem(`clara_greeted_${persona}`, "true");

    const topic = initialContext?.topic;
    const room = initialContext?.room;
    const category = initialContext?.category ?? "general";
    const sizeBits = [
      initialContext?.area_sqm ? `${initialContext.area_sqm} m²` : "",
      initialContext?.capacity ? `bis ${initialContext.capacity} Personen` : "",
    ].filter(Boolean).join(", ");

    let opener: string;
    if (category === "drink") {
      opener = topic
        ? `Sie schauen sich „${topic}" an – soll ich das gleich servieren lassen oder haben Sie eine Frage dazu?`
        : `Zur Getränkekarte: Wein, Cocktail oder alkoholfrei – wonach ist Ihnen?`;
    } else if (category === "food") {
      opener = topic
        ? `„${topic}" hat Sie angesprochen – möchten Sie reservieren oder mehr darüber wissen?`
        : `Zum Restaurant: Galadinner, à la carte oder Tagungsverpflegung – was passt?`;
    } else if (category === "wellness") {
      opener = topic
        ? `„${topic}" – darf ich Ihnen direkt einen Termin im Spa vorschlagen?`
        : `Zum SPA: Treatment, Sauna oder Pool – was interessiert Sie?`;
    } else if (category === "event") {
      opener = topic
        ? `Reservierung „${topic}" – wann und für wie viele Personen?`
        : `Reservierung – wann und für wie viele Personen?`;
    } else if (category === "package") {
      opener = topic
        ? `Sie interessieren sich für die Pauschale „${topic}"${sizeBits ? ` (${sizeBits})` : ""}. Wie viele Personen und welcher Termin?`
        : `Kurz vorab: Personenzahl, Wunschtermin, Art der Veranstaltung?`;
    } else if (room || category === "tagung") {
      const r = room ?? topic;
      opener = r
        ? `Sie interessieren sich für „${r}"${sizeBits ? ` – ${sizeBits}` : ""}. Tagung, Feier oder Event – und an welchem Datum?`
        : `Kurz vorab: Personenzahl, Wunschtermin, Art der Veranstaltung?`;
    } else {
      opener = topic ? `Sie interessieren sich für „${topic}" – wobei darf ich helfen?` : `Wobei darf ich helfen?`;
    }


    setMessages([{ role: "assistant", content: opener, ts: Date.now() }]);
    if (voiceFirst) void speak(opener, true);
  }, [initialContext, persona, voiceFirst, speak, weatherText, messages.length]);


  // Voice input via Web Speech API
  const startContinuousListening = useCallback(() => {
    if (isSendingRef.current || isSpeakingRef.current || inquirySentRef.current) return;
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      toast.error("Spracheingabe wird in diesem Browser nicht unterstützt – bitte tippen.");
      return;
    }

    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    recognitionRef.current?.stop();
    const rec = new Ctor();
    rec.lang = "de-DE";
    rec.interimResults = false;
    rec.continuous = true;
    rec.onresult = (e) => {
      const transcript = extractFinalTranscript(e);
      if (transcript) sendMessageRef.current(transcript);
    };
    rec.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    rec.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      if (shouldListenRef.current && !isSendingRef.current && !isSpeakingRef.current && !inquirySentRef.current) {
        restartTimerRef.current = window.setTimeout(() => startListeningRef.current(), 450);
      }
    };
    recognitionRef.current = rec;
    setIsListening(true);
    try {
      rec.start();
    } catch {
      setIsListening(false);
    }
  }, []);

  // Mobile/iOS: Aufnahme via MediaRecorder, Auto-Stopp bei 1s Stille, dann cartesia-stt.
  const stopMobileRecording = useCallback((keepConversationActive = false) => {
    if (!keepConversationActive) {
      shouldListenRef.current = false;
      setIsVoiceMode(false);
    }
    setIsListening(false);
    if (silenceTimerRef.current) { window.clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    const analyser = audioAnalyserRef.current;
    if (analyser) {
      if (analyser.raf !== null) cancelAnimationFrame(analyser.raf);
      try { void analyser.ctx.close(); } catch { /* noop */ }
      audioAnalyserRef.current = null;
    }
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") { try { rec.stop(); } catch { /* noop */ } }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
  }, []);

  const startMobileRecording = useCallback(async () => {
    if (isSendingRef.current || isSpeakingRef.current || inquirySentRef.current) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Mikrofon wird in diesem Browser nicht unterstützt – bitte tippen.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      mediaStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      recordMimeRef.current = mime || "audio/webm";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      recordChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(recordChunksRef.current, { type: recordMimeRef.current });
        if (blob.size < 1200) {
          if (shouldListenRef.current && !inquirySentRef.current) {
            window.setTimeout(() => startListeningRef.current(), 220);
          }
          return;
        }
        try {
          setIsSending(true);
          isSendingRef.current = true;
          const form = new FormData();
          const ext = recordMimeRef.current.includes("mp4") ? "m4a" : "webm";
          form.append("file", blob, `speech.${ext}`);
          form.append("language", "de");
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cartesia-stt`, {
            method: "POST",
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: form,
          });
          const json = await res.json();
          setIsSending(false);
          isSendingRef.current = false;
          const text: string | undefined = json?.text;
          if (text && text.trim()) sendMessageRef.current(text.trim());
          else {
            toast.error(json?.error ?? "Sprache nicht erkannt – bitte nochmal.");
            if (shouldListenRef.current && !inquirySentRef.current) {
              window.setTimeout(() => startListeningRef.current(), 350);
            }
          }
        } catch (err) {
          setIsSending(false);
          isSendingRef.current = false;
          toast.error("Sprache konnte nicht verarbeitet werden.");
          console.warn(err);
          if (shouldListenRef.current && !inquirySentRef.current) {
            window.setTimeout(() => startListeningRef.current(), 450);
          }
        }
      };
      rec.start();
      setIsListening(true);
      setIsVoiceMode(true);
      shouldListenRef.current = true;

      // Auto-Stopp via VAD: nach ~1.2s Stille
      const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let lastVoiceTs = performance.now();
      let speechStarted = false;
      const startTs = performance.now();
      const tick = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        const now = performance.now();
        if (rms > 0.015) { lastVoiceTs = now; speechStarted = true; }
        const silenceMs = now - lastVoiceTs;
        const totalMs = now - startTs;
        if ((speechStarted && silenceMs > 700) || totalMs > 20000) {
          stopMobileRecording(true);
          return;
        }
        const next = requestAnimationFrame(tick);
        if (audioAnalyserRef.current) audioAnalyserRef.current.raf = next;
      };
      const first = requestAnimationFrame(tick);
      audioAnalyserRef.current = { ctx, analyser, raf: first };
    } catch (err) {
      console.warn("mic permission failed:", err);
      toast.error("Mikrofon-Zugriff verweigert.");
      stopMobileRecording();
    }
  }, [stopMobileRecording]);

  useEffect(() => {
    const hasWebSpeech = !!getSpeechRecognitionConstructor();
    startListeningRef.current = hasWebSpeech ? startContinuousListening : startMobileRecording;
  }, [startContinuousListening, startMobileRecording]);

  const toggleListening = useCallback(() => {
    // Web Speech API (Chrome/Edge Desktop) → bevorzugen.
    const hasWebSpeech = !!getSpeechRecognitionConstructor();
    if (isVoiceMode || isListening) {
      shouldListenRef.current = false;
      setIsVoiceMode(false);
      if (hasWebSpeech) {
        recognitionRef.current?.stop();
        if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      } else {
        stopMobileRecording();
      }
      return;
    }
    if (hasWebSpeech) {
      shouldListenRef.current = true;
      setIsVoiceMode(true);
      startContinuousListening();
    } else {
      void startMobileRecording();
    }
  }, [isListening, isVoiceMode, startContinuousListening, startMobileRecording, stopMobileRecording]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 min-w-0 flex-1 min-h-0">
      {/* Chat messages */}
      <div
        ref={scrollRef}
        className={cn(
          "w-full scroll-smooth",
          isMinimized
            ? "flex-1 min-h-0 max-h-[80px] overflow-y-auto px-2 py-1 flex flex-col gap-1 bg-transparent border-0 shadow-none"
            : seamless
              ? "flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-1 flex flex-col gap-3"
              : "flex-1 min-h-0 overflow-y-auto rounded-2xl md:rounded-3xl border border-apple/20 bg-black/50 backdrop-blur-xl p-3 sm:p-4 md:p-6 flex flex-col gap-3 shadow-inner"
        )}
      >
        {(isMinimized ? messages.slice(-1) : messages).map((m, idx) => (
          <div key={idx} className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
            {m.role === "assistant" && !isMinimized && (
              <span className="text-xs uppercase tracking-[0.3em] text-apple-bright/90 inline-flex items-center gap-1.5 px-1">
                <Sparkles className="w-3 h-3" /> {assistantName}
              </span>
            )}
            <div
              className={cn(
                m.role === "user"
                  ? "bg-gradient-to-br from-apple to-apple-deep text-white rounded-br-sm"
                  : "bg-white/[0.06] text-white/95 rounded-bl-sm border border-white/10 backdrop-blur-sm",
                isMinimized
                  ? "px-3 py-1 text-xs leading-normal max-w-[95%] rounded-lg"
                  : "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md"
              )}
            >
              {m.role === "user" ? m.content : <RichMarkdown content={m.content} />}
            </div>
            {false && !textOnly && !isMinimized && m.media && m.media.length > 0 && (
              <div className={cn(
                "mt-2 grid gap-2 w-full",
                m.media.length === 1
                  ? "grid-cols-1"
                  : m.media.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3"
              )}>
                {m.media.map((media, i) => (
                  <figure key={`${media.url}-${i}`} className="relative rounded-xl overflow-hidden border border-apple/20 bg-black/40 group">
                    {media.mediaType === "video" ? (
                      <video
                        src={media.url}
                        poster={media.thumbnailUrl ?? undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        className="w-full aspect-[16/10] object-cover cursor-pointer"
                        onClick={() => setLightboxMedia(media)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLightboxMedia(media)}
                        aria-label={media.title ?? "Bild vergrößern"}
                        className="w-full h-full text-left outline-none block relative"
                      >
                        <img
                          src={media.url}
                          alt={media.title ?? media.caption ?? "Heidehof"}
                          loading="lazy"
                          className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </button>
                    )}
                    {(media.title || media.caption) && (
                      <figcaption className="absolute inset-x-0 bottom-0 px-2.5 py-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-xs text-white/95 pointer-events-none">
                        {media.title && <span className="font-medium">{media.title}</span>}
                        {media.caption && <span className="block text-white/75 line-clamp-1">{media.caption}</span>}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
            {!isMinimized && m.pageUrl && (
              <div className="mt-2 max-w-[85%] w-full flex flex-wrap gap-2">
                <a
                  href={m.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-apple/40 bg-gradient-to-br from-apple/25 to-apple-deep/25 px-3 py-2 text-xs font-medium text-white hover:from-apple/40 hover:to-apple-deep/40 transition shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-apple-bright" />
                  {m.pageTitle ?? "Heidehof öffnen"} ↗
                </a>
                <a
                  href={HEIDEHOF_SECTIONS.buchung}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/90 hover:bg-white/10 transition"
                >
                  Direkt buchen ↗
                </a>
              </div>
            )}
            {!isMinimized && m.toolBadges && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {m.toolBadges.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-apple-bright/90 bg-apple/10 border border-apple/20 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> {assistantName} denkt nach …
          </div>
        )}
      </div>

      {/* ── Voice mode: dedicated full UI replaces the text form ── */}
      {(isVoiceMode || isListening) && !isMinimized ? (
        <div className="shrink-0 flex flex-col items-center gap-4 py-5 px-4 rounded-2xl border border-apple/30 bg-background/80 backdrop-blur-md">

          {/* Animated orb */}
          <div className="relative flex items-center justify-center w-24 h-24">
            {/* Outer ping ring */}
            <span className={cn(
              "absolute w-24 h-24 rounded-full animate-ping",
              isSpeaking ? "bg-gold/15" : "bg-apple/15"
            )} style={{ animationDuration: "1.8s" }} />
            {/* Middle ring */}
            <span className={cn(
              "absolute w-16 h-16 rounded-full animate-ping",
              isSpeaking ? "bg-gold/20" : "bg-apple/20"
            )} style={{ animationDuration: "1.2s" }} />
            {/* Core orb */}
            <div className={cn(
              "relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl",
              isSpeaking
                ? "bg-gradient-to-br from-gold to-gold/60 shadow-gold/40"
                : "bg-gradient-to-br from-apple-bright to-apple-deep shadow-apple/50"
            )}>
              {isSpeaking
                ? <Volume2 className="w-6 h-6 text-white" />
                : <Mic className="w-6 h-6 text-white" />}
            </div>
          </div>

          {/* State label */}
          <div className="text-center">
            <p className={cn(
              "text-sm font-medium",
              isSpeaking ? "text-gold" : "text-apple-bright"
            )}>
              {isSpeaking ? `${assistantName} spricht …` : "Ich höre zu …"}
            </p>
            <p className="text-xs text-white/60 mt-0.5 uppercase tracking-[0.2em]">
              {isSpeaking ? "automatisch fortgesetzt" : "sprechen Sie jetzt"}
            </p>
          </div>

          {/* Waveform bars */}
          <div className="flex items-end gap-[3px] h-7">
            {[30, 55, 80, 100, 70, 90, 45, 75, 60, 35, 80, 50].map((h, i) => (
              <span
                key={i}
                className={cn("voice-bar w-[3px] rounded-full", isSpeaking ? "bg-gold/70" : "bg-[hsl(var(--apple-bright))]/70")}
                style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 w-full justify-center">
            <button
              type="button"
              onClick={() => setMuted((v) => !v)}
              aria-label={muted ? "Stimme aktivieren" : "Stimme stummschalten"}
              className={cn(
                "h-11 px-4 rounded-full inline-flex items-center gap-2 text-sm font-medium border transition-all",
                muted
                  ? "bg-white/10 text-white/65 border-white/20 hover:bg-white/15"
                  : "bg-apple/15 text-apple-bright border-apple/35 hover:bg-apple/25"
              )}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className={cn("w-4 h-4", isSpeaking && "animate-pulse")} />}
              <span>{muted ? "Ton an" : "Ton aus"}</span>
            </button>
            <button
              type="button"
              onClick={toggleListening}
              disabled={inquirySent}
              aria-label="Mikrofon beenden und schreiben"
              className="h-11 px-5 rounded-full inline-flex items-center gap-2 text-sm font-medium bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all active:scale-95"
            >
              <MicOff className="w-4 h-4" />
              Schreiben
            </button>
          </div>
        </div>
      ) : (
        /* ── Compact single-row input bar ── */
        <form
          onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }}
          className={cn(
            "flex flex-row items-end gap-1.5 rounded-2xl border border-apple/30 bg-background/80 backdrop-blur-md shadow-[0_4px_20px_-8px] shadow-apple/25 focus-within:border-apple/50 transition-all w-full min-w-0 shrink-0",
            isMinimized ? "px-1.5 py-1.5 rounded-xl" : "px-2 py-2",
            seamless && "mb-[env(safe-area-inset-bottom,0px)]"
          )}
        >
          {/* Mic button — 44px touch target on mobile, compact on desktop */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={inquirySent}
            aria-label="Spracheingabe starten"
            className={cn(
              "shrink-0 rounded-xl inline-flex items-center justify-center transition-all border",
              isMinimized ? "h-9 w-9 sm:h-8 sm:w-8" : "h-11 w-11 sm:h-9 sm:w-9",
              "bg-apple/10 text-apple-bright border-apple/25 hover:bg-apple/20 active:scale-95 disabled:opacity-40"
            )}
          >
            <Mic className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>

          {/* Mute button — 44px touch target on mobile */}
          <button
            type="button"
            onClick={() => setMuted((v) => !v)}
            aria-label={muted ? "Stimme aktivieren" : "Stimme stummschalten"}
            className={cn(
              "shrink-0 rounded-xl inline-flex items-center justify-center transition-all border",
              isMinimized ? "h-9 w-9 sm:h-8 sm:w-8" : "h-11 w-11 sm:h-9 sm:w-9",
              muted
                ? "bg-white/10 text-white/60 border-white/20 hover:bg-white/15"
                : "bg-apple/10 text-apple-bright border-apple/25 hover:bg-apple/20 active:scale-95"
            )}
          >
            {muted ? <VolumeX className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Volume2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
          </button>

          {/* Text input — 16px font prevents iOS zoom; dynamic placeholder */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            rows={1}
            disabled={inquirySent}
            placeholder={
              inquirySent
                ? "Anfrage versendet"
                : isListening
                  ? "Ich höre zu …"
                  : isSpeaking
                    ? `${assistantName} spricht …`
                    : muted
                      ? "Nachricht eingeben oder Mikro tippen …"
                      : "Sprechen Sie oder schreiben Sie …"
            }
            className={cn(
              "flex-1 min-w-0 resize-none bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/50 py-1.5 px-2 leading-snug",
              isMinimized ? "min-h-[32px] max-h-14" : "min-h-[44px] sm:min-h-[36px] max-h-24"
            )}
            style={{ fontSize: "16px" }}
          />

          {/* Send button — 44px touch target on mobile */}
          <Button
            type="submit"
            disabled={!input.trim() || isSending || inquirySent}
            aria-label="Nachricht senden"
            className={cn(
              "shrink-0 bg-gradient-to-br from-apple to-apple-deep text-white hover:from-apple-bright hover:to-apple font-medium rounded-xl active:scale-95 p-0",
              isMinimized ? "h-9 w-9 sm:h-8 sm:w-8" : "h-11 w-11 sm:h-9 sm:w-9"
            )}
          >
            {isSending ? <Loader2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 animate-spin" /> : <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
          </Button>
        </form>
      )}

      {/* Glassmorphic Lightbox Zoom Modal Overlay */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300 animate-in fade-in"
          onClick={() => setLightboxMedia(null)}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-[max(1rem,env(safe-area-inset-top,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-[110] inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition-all border border-white/10 hover:scale-105 active:scale-95"
            onClick={() => setLightboxMedia(null)}
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lightbox content */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl p-2 sm:p-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
              {lightboxMedia.mediaType === "video" ? (
                <video
                  src={lightboxMedia.url}
                  controls
                  autoPlay
                  className="max-h-[70vh] max-w-full rounded-lg shadow-inner object-contain"
                />
              ) : (
                <img
                  src={lightboxMedia.url}
                  alt={lightboxMedia.title || lightboxMedia.caption || "Heidehof"}
                  className="max-h-[70vh] max-w-full rounded-lg shadow-inner object-contain select-none"
                />
              )}
            </div>

            {(lightboxMedia.title || lightboxMedia.caption) && (
              <div className="w-full text-center px-4 py-3 bg-gradient-to-b from-transparent to-black/30">
                {lightboxMedia.title && (
                  <h4 className="font-serif text-white text-base md:text-lg font-medium tracking-wide">
                    {lightboxMedia.title}
                  </h4>
                )}
                {lightboxMedia.caption && (
                  <p className="text-xs md:text-sm text-white/80 mt-1 max-w-2xl mx-auto leading-relaxed">
                    {lightboxMedia.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <audio ref={audioRef} hidden />
    </div>
  );
}

export default ClaraRagChat;
