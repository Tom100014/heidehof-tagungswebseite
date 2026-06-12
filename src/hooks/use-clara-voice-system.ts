import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_CLARA_VOICE_SYSTEM,
  isClaraVoiceSystemId,
  type ClaraVoiceSystemId,
} from "@/lib/clara/voice-systems";

export function useClaraVoiceSystem() {
  const [system, setSystem] = useState<ClaraVoiceSystemId>(DEFAULT_CLARA_VOICE_SYSTEM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "clara_voice_system")
        .maybeSingle();

      if (!cancelled) {
        setSystem(isClaraVoiceSystemId(data?.value) ? data.value : DEFAULT_CLARA_VOICE_SYSTEM);
        setLoading(false);
      }
    };

    void load();

    const channel = supabase
      .channel(`clara_voice_system_setting_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.clara_voice_system" },
        (payload) => {
          const next = (payload.new as { value?: unknown } | null)?.value;
          if (isClaraVoiceSystemId(next)) setSystem(next);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { system, loading };
}
