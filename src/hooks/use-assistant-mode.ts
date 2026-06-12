import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  readClaraInquiryContext,
  writeClaraInquiryContext,
  type ClaraInquiryContext,
} from "@/lib/clara/inquiry-context";

export type AssistantMode = "clara_only" | "phone_only" | "both";

export const DEFAULT_ASSISTANT_MODE: AssistantMode = "clara_only";

export const START_PHONE_CALL_EVENT = "cartesia:start-call";
export const START_WEBCALL_EVENT = "clara:start-webcall";

export interface PhoneCallStartDetail {
  context?: ClaraInquiryContext | null;
  source?: "button" | "floating-launcher" | "proactive" | "manual";
}

export const isAssistantMode = (v: unknown): v is AssistantMode =>
  v === "clara_only" || v === "phone_only" || v === "both";

/** Trigger den globalen Cartesia-Telefonanruf mit aktuellem Webseitenkontext. */
export const triggerPhoneCall = (context?: ClaraInquiryContext | null, source: PhoneCallStartDetail["source"] = "button") => {
  if (typeof window === "undefined") return;
  const next = context ?? readClaraInquiryContext();
  if (next) writeClaraInquiryContext({ ...next, trigger: next.trigger ?? "phone-call" });
  window.dispatchEvent(new CustomEvent<PhoneCallStartDetail>(START_PHONE_CALL_EVENT, {
    detail: { context: next, source },
  }));
};

/** Startet den Browser-Voice-Call (Cartesia WebSocket Agent) mit aktuellem Webseitenkontext. */
export const triggerWebCall = (context?: ClaraInquiryContext | null, source: PhoneCallStartDetail["source"] = "button") => {
  if (typeof window === "undefined") return;
  const next = context ?? readClaraInquiryContext();
  if (next) writeClaraInquiryContext({ ...next, trigger: next.trigger ?? "web-call" });
  window.dispatchEvent(new CustomEvent<PhoneCallStartDetail>(START_WEBCALL_EVENT, {
    detail: { context: next, source },
  }));
};

export function useAssistantMode() {
  const [mode, setMode] = useState<AssistantMode>(DEFAULT_ASSISTANT_MODE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "assistant_mode")
        .maybeSingle();
      if (cancelled) return;
      setMode(isAssistantMode(data?.value) ? data.value : DEFAULT_ASSISTANT_MODE);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`assistant_mode_setting_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.assistant_mode" },
        (payload) => {
          const next = (payload.new as { value?: unknown } | null)?.value;
          if (isAssistantMode(next)) setMode(next);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { mode, loading };
}
