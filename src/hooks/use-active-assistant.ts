import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActiveAssistant = "elevenlabs" | "clara" | "none";

export const DEFAULT_ACTIVE_ASSISTANT: ActiveAssistant = "clara";

export const ACTIVE_ASSISTANT_LABELS: Record<ActiveAssistant, { name: string; badge: string; summary: string }> = {
  elevenlabs: {
    name: "ElevenLabs – Maximilian",
    badge: "Voice-Agent",
    summary: "Nur Maximilian-Voice-Widget sichtbar. Clara-Bubble und proaktives Popup ausgeblendet.",
  },
  clara: {
    name: "Clara",
    badge: "Standard-Chat",
    summary: "Nur Clara-Chat/Voice sichtbar. ElevenLabs-Widget ausgeblendet.",
  },
  none: {
    name: "Keiner / Inaktiv",
    badge: "Aus",
    summary: "Beide Assistenten sind deaktiviert. Auf der Website erscheint kein Chat-/Voice-Widget.",
  },
};

export const OPEN_MAXIMILIAN_EVENT = "maximilian:open";

export const openMaximilianWidget = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_MAXIMILIAN_EVENT));
};

export const isActiveAssistant = (v: unknown): v is ActiveAssistant =>
  v === "elevenlabs" || v === "clara" || v === "none";

export function useActiveAssistant() {
  const [assistant, setAssistant] = useState<ActiveAssistant>(DEFAULT_ACTIVE_ASSISTANT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "active_assistant")
        .maybeSingle();
      if (cancelled) return;
      setAssistant(isActiveAssistant(data?.value) ? data.value : DEFAULT_ACTIVE_ASSISTANT);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`active_assistant_setting_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.active_assistant" },
        (payload) => {
          const next = (payload.new as { value?: unknown } | null)?.value;
          if (isActiveAssistant(next)) setAssistant(next);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { assistant, loading };
}
