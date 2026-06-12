import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ClaraCartesiaVoice } from "./ClaraCartesiaVoice";
import { ClaraOpenAIRealtimeVoice } from "./ClaraOpenAIRealtimeVoice";
import { Sparkles, X } from "lucide-react";
import {
  readClaraInquiryContext,
  writeClaraInquiryContext,
  markClaraOpenPending,
  consumeClaraOpenPending,
  type ClaraContextCategory,
  type ClaraInquiryContext,
} from "@/lib/clara/inquiry-context";
import { useClaraContext, type ClaraInteraction } from "@/context/ClaraContext";
import { useClaraVoiceSystem } from "@/hooks/use-clara-voice-system";
import { useAssistantMode, triggerWebCall } from "@/hooks/use-assistant-mode";
import { useActiveAssistant } from "@/hooks/use-active-assistant";

const HIDE_ON = ["/admin"];
const OPEN_EVENT = "clara:open-panel";
const CLOSE_EVENT = "clara:close-panel";
const CONTEXT_DWELL_MS = 900;
const FIRST_VISIT_MS = 2200;
const SECTION_DWELL_MS = 7500;
const SUPPRESS_KEY = "clara_proactive_suppressed_until";
const FIRST_GREETING_KEY = "clara_first_greeting_done";
const LAST_PROACTIVE_KEY = "clara_last_proactive_signature";

const routeContext: Record<string, { category: ClaraInquiryContext["category"]; topic: string }> = {
  "/": { category: "tagung", topic: "Hotel Der Heidehof" },
  "/tagungsraeume": { category: "tagung", topic: "Tagungsraeume" },
  "/tagungspauschalen": { category: "package", topic: "Tagungspauschalen" },
  "/ausstattung-technik": { category: "tagung", topic: "Tagungstechnik und Ausstattung" },
  "/restaurant": { category: "food", topic: "Restaurant Maxwell und Bar Maex" },
  "/speisekarte": { category: "food", topic: "Speisekarte" },
  "/getraenkekarte": { category: "drink", topic: "Getraenkekarte" },
  "/wellness": { category: "wellness", topic: "Wellness" },
  "/spa": { category: "wellness", topic: "Spa und Beauty" },
  "/veranstaltungen": { category: "event", topic: "Veranstaltungen" },
  "/outdoor-aktiv": { category: "event", topic: "Outdoor und Aktiv" },
  "/ein-tag-bei-uns": { category: "tagung", topic: "Ein Tag bei uns" },
};

const toCategory = (value?: string): ClaraContextCategory | undefined => {
  if (!value) return undefined;
  if (["drink", "food", "event", "tagung", "room", "wellness", "package", "general"].includes(value)) {
    return value as ClaraContextCategory;
  }
  if (value === "essen" || value === "restaurant") return "food";
  if (value === "spa" || value === "beauty") return "wellness";
  return undefined;
};

const cleanLabel = (label?: string): string | undefined => {
  const text = label?.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.slice(0, 90);
};

const buildTimeContext = (): Pick<ClaraInquiryContext, "timeOfDay" | "dayLabel" | "localDate" | "localTime"> => {
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay =
    hour < 5 ? "nachts" :
    hour < 11 ? "morgens" :
    hour < 14 ? "mittags" :
    hour < 18 ? "nachmittags" :
    hour < 22 ? "abends" : "nachts";
  return {
    timeOfDay,
    dayLabel: new Intl.DateTimeFormat("de-DE", { weekday: "long" }).format(now),
    localDate: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(now),
    localTime: new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(now),
  };
};

const weatherText = (code: number | undefined, temp: number | undefined): string | undefined => {
  if (typeof temp !== "number") return undefined;
  const condition =
    code === 0 ? "klar" :
    code && code <= 3 ? "wechselhaft" :
    code && code < 50 ? "bedeckt" :
    code && code < 70 ? "regnerisch" :
    code && code < 80 ? "winterlich" :
    code && code < 90 ? "schauerartig" :
    code ? "gewitterig" : "aktuell";
  return `${Math.round(temp)} °C, ${condition}`;
};

const isSuppressed = () => {
  try {
    return Number(sessionStorage.getItem(SUPPRESS_KEY) ?? "0") > Date.now();
  } catch {
    return false;
  }
};

const suppressProactive = (ms = 120_000) => {
  try {
    sessionStorage.setItem(SUPPRESS_KEY, String(Date.now() + ms));
  } catch { /* ignore */ }
};

const contextFromInteraction = (
  interaction: ClaraInteraction | null,
  pathname: string,
  trigger: ClaraInquiryContext["trigger"],
): ClaraInquiryContext | null => {
  const topic = cleanLabel(interaction?.label);
  if (!topic) return null;
  return {
    category: toCategory(interaction?.category) ?? routeContext[pathname]?.category ?? "general",
    topic,
    section: topic,
    source: pathname,
    trigger,
  };
};

const inferContext = (
  pathname: string,
  viewing: string[],
  lastHover: ClaraInteraction | null,
): ClaraInquiryContext => {
  const hoverCtx = contextFromInteraction(lastHover, pathname, "cursor-hover");
  if (hoverCtx) return hoverCtx;

  const base = routeContext[pathname] ?? { category: "general" as const, topic: "Hotel Der Heidehof" };
  const section = cleanLabel(viewing[0]);
  return {
    ...base,
    section,
    source: pathname,
    trigger: section ? "section-dwell" : "route-dwell",
  };
};

export const openClaraBubble = (ctx?: ClaraInquiryContext) => {
  if (typeof window === "undefined") return;
  const next = ctx ?? readClaraInquiryContext() ?? { category: "general" as const, topic: "Hotel Der Heidehof", trigger: "manual" };
  writeClaraInquiryContext(next);
  markClaraOpenPending(next);
  if (import.meta.env.DEV) console.log("[Clara] open requested", next);
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: next }));
  // Retry, falls Listener noch nicht montiert (Lazy/Suspense-Race)
  window.setTimeout(() => window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: next })), 60);
};

export const closeClaraBubble = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLOSE_EVENT));
};

export const ClaraFloatingBubble = () => {
  const { pathname } = useLocation();
  const claraPage = useClaraContext();
  const [active, setActive] = useState(false);
  const [context, setContext] = useState<ClaraInquiryContext | null>(() => readClaraInquiryContext());
  const [promptContext, setPromptContext] = useState<ClaraInquiryContext | null>(null);
  const [weather, setWeather] = useState<string | undefined>();
  const [sessionKey, setSessionKey] = useState(0);
  const { system: voiceSystem } = useClaraVoiceSystem();
  const { mode: assistantMode } = useAssistantMode();
  const { assistant: activeAssistant } = useActiveAssistant();
  const isPhoneOnly = assistantMode === "phone_only";
  // Clara wird komplett unterdrückt, wenn ElevenLabs/Maximilian als aktiver Assistent gewählt ist
  // oder wenn der Admin "Keiner" gewählt hat. Außerdem auf Admin-Routen ausblenden.
  const isHidden =
    HIDE_ON.some((p) => pathname.startsWith(p)) ||
    isPhoneOnly ||
    activeAssistant !== "clara";

  const currentContext = useMemo(
    () => ({
      ...inferContext(pathname, claraPage.currentlyViewing, claraPage.lastHover),
      ...buildTimeContext(),
      weather,
    }),
    [claraPage.currentlyViewing, claraPage.lastHover, pathname, weather],
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    window.setTimeout(() => controller.abort(), 2200);
    fetch("https://api.open-meteo.com/v1/forecast?latitude=48.80&longitude=11.37&current=temperature_2m,weather_code&timezone=Europe%2FBerlin", {
      signal: controller.signal,
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.current) return;
        setWeather(weatherText(data.current.weather_code, data.current.temperature_2m));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const eventContext = (e as CustomEvent<ClaraInquiryContext | null>).detail ?? readClaraInquiryContext() ?? currentContext;
      if (isPhoneOnly) {
        if (import.meta.env.DEV) console.log("[Clara] phone_only mode → triggerWebCall", eventContext);
        triggerWebCall(eventContext, "proactive");
        return;
      }
      if (isHidden) {
        if (import.meta.env.DEV) console.log("[Clara] hidden on route → ignore open", pathname);
        return;
      }
      const ctx = eventContext;
      writeClaraInquiryContext(ctx);
      setContext(ctx);
      setPromptContext(null);
      setActive((wasActive) => {
        if (!wasActive) setSessionKey((n) => n + 1);
        return true;
      });
    };
    const onClose = () => setActive(false);
    const onContext = (e: Event) => setContext((e as CustomEvent<ClaraInquiryContext>).detail ?? readClaraInquiryContext());
    window.addEventListener(OPEN_EVENT, onOpen as EventListener);
    window.addEventListener(CLOSE_EVENT, onClose);
    window.addEventListener("clara:context-updated", onContext as EventListener);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen as EventListener);
      window.removeEventListener(CLOSE_EVENT, onClose);
      window.removeEventListener("clara:context-updated", onContext as EventListener);
    };
  }, [currentContext, isHidden, isPhoneOnly, pathname]);

  // Mount-Race-Fix: falls openClaraBubble feuerte, bevor der Listener montiert war,
  // holen wir den Open-Wunsch hier nach (sessionStorage-Flag, max. 5 s alt).
  useEffect(() => {
    if (isHidden) return;
    const pending = consumeClaraOpenPending();
    if (!pending) return;
    if (isPhoneOnly) {
      triggerWebCall(pending, "proactive");
      return;
    }
    if (import.meta.env.DEV) console.log("[Clara] consumed pending open on mount", pending);
    writeClaraInquiryContext(pending);
    setContext(pending);
    setPromptContext(null);
    setSessionKey((n) => n + 1);
    setActive(true);
  }, [isHidden, isPhoneOnly]);


  useEffect(() => {
    if (isHidden) return;
    const timer = window.setTimeout(() => {
      writeClaraInquiryContext(currentContext);
      setContext(currentContext);
    }, CONTEXT_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [currentContext, isHidden]);

  useEffect(() => {
    if (isHidden || active || isSuppressed()) return;
    const timer = window.setTimeout(() => {
      if (active || isSuppressed()) return;
      try {
        if (sessionStorage.getItem(FIRST_GREETING_KEY)) return;
        sessionStorage.setItem(FIRST_GREETING_KEY, "1");
      } catch { /* ignore */ }
      const next = { ...currentContext, trigger: "first-visit" as const };
      writeClaraInquiryContext(next);
      setContext(next);
      setPromptContext(next);
    }, FIRST_VISIT_MS);
    return () => window.clearTimeout(timer);
  }, [active, currentContext, isHidden]);

  useEffect(() => {
    if (isHidden || active || isSuppressed()) return;
    const signature = `${pathname}:${currentContext.category}:${currentContext.topic ?? currentContext.section ?? ""}`;
    const timer = window.setTimeout(() => {
      if (active || isSuppressed()) return;
      try {
        if (sessionStorage.getItem(LAST_PROACTIVE_KEY) === signature) return;
        sessionStorage.setItem(LAST_PROACTIVE_KEY, signature);
      } catch { /* ignore */ }
      const next = { ...currentContext, trigger: currentContext.trigger ?? "section-dwell" };
      writeClaraInquiryContext(next);
      setContext(next);
      setPromptContext(next);
    }, SECTION_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [active, currentContext, isHidden, pathname]);

  if (isHidden) return null;

  if (!active && promptContext) {
    const subject = promptContext.topic ?? promptContext.section ?? "diesen Bereich";
    const line =
      promptContext.category === "drink"
        ? `Sie schauen gerade ${subject} an. Soll Clara eine Bestellung aufnehmen?`
        : promptContext.category === "food"
          ? `Sie schauen gerade ${subject} an. Soll Clara etwas empfehlen oder reservieren?`
          : promptContext.category === "tagung" || promptContext.category === "package"
            ? `Sie schauen gerade ${subject} an. Soll Clara ein passendes Angebot vorbereiten?`
            : promptContext.category === "wellness"
              ? `Sie schauen gerade ${subject} an. Soll Clara einen Terminwunsch aufnehmen?`
              : `Sie schauen gerade ${subject} an. Kann Clara behilflich sein?`;
    return (
      <div className="fixed bottom-5 right-5 z-[998] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[hsl(38_45%_72%/0.28)] bg-black/88 p-4 text-[hsl(38_35%_94%)] shadow-2xl backdrop-blur-xl print:hidden">
        <button
          type="button"
          onClick={() => {
            suppressProactive();
            setPromptContext(null);
          }}
          aria-label="Clara-Hinweis schließen"
          className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex gap-3 pr-7">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[hsl(38_45%_72%/0.30)] bg-white/[0.06]">
            <Sparkles className="h-4 w-4 text-[hsl(38_55%_76%)]" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(38_45%_72%)]">Clara</p>
            <p className="mt-1 text-sm leading-relaxed text-white/90">{line}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => openClaraBubble(promptContext)}
                className="rounded-full bg-[hsl(38_45%_82%)] px-4 py-2 text-xs font-semibold text-black transition hover:bg-white"
              >
                Clara starten
              </button>
              <button
                type="button"
                onClick={() => {
                  suppressProactive();
                  setPromptContext(null);
                }}
                className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Nicht jetzt
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!active) return null;

  const commonProps = {
    key: sessionKey,
    persona: "clara" as const,
    headless: false,
    autoStart: true,
    context,
    onClose: () => {
      suppressProactive();
      setActive(false);
    },
  };

  return voiceSystem === "openai_realtime"
    ? <ClaraOpenAIRealtimeVoice {...commonProps} />
    : <ClaraCartesiaVoice {...commonProps} />;
};

export default ClaraFloatingBubble;
