// @ts-nocheck

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLiveTicker, LiveTickerResponse } from "./use-live-ticker";

export type SnapshotWindow = "morning" | "noon" | "afternoon" | "overnight";

export interface IngolstadtSnapshot {
  id: string;
  category: string;
  payload: any[];
  sources: any[];
  window_label: SnapshotWindow;
  window_start: string;
  window_end: string;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Lädt Live-Daten und Snapshots für eine Kategorie.
 * Kombiniert Live-Ticker mit Snapshot-Fallback.
 */
export function useIngolstadtSnapshots(category: string) {
  const { fetchLiveData } = useLiveTicker();

  return useQuery<IngolstadtSnapshot | null>({
    queryKey: ["ingolstadt-snapshots", category],
    queryFn: async (): Promise<IngolstadtSnapshot | null> => {
      const minLoad = delay(3000);

      console.log('🎯 Starte Daten-Laden für Kategorie:', category);

      // 1. Versuche Live-Daten zu laden
      let liveData: LiveTickerResponse | null = null;
      try {
        console.log('🚀 Versuche Live-Daten...');
        liveData = await fetchLiveData(category);
        
        if (liveData && liveData.success && liveData.events.length > 0 && liveData.provider !== 'fallback') {
          console.log('✅ Live-Daten erfolgreich geladen:', liveData.events.length, 'Events via', liveData.provider);
          
          await minLoad;
          
          // Erstelle Snapshot-ähnliche Struktur aus Live-Daten
          const liveSnapshot: IngolstadtSnapshot = {
            id: `live-${Date.now()}`,
            category: category,
            payload: liveData.events,
            sources: [{ provider: liveData.provider, timestamp: liveData.timestamp }],
            window_label: 'noon' as SnapshotWindow,
            window_start: new Date().toISOString(),
            window_end: new Date(Date.now() + 3600000).toISOString(),
            generated_at: liveData.timestamp,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          return liveSnapshot;
        }
      } catch (liveError) {
        console.warn('⚠️ Live-Daten Fehler:', liveError);
      }

      // 2. Fallback: Lade Snapshot-Daten
      console.log('📦 Fallback: Lade Snapshot-Daten...');
      const { data, error } = await (supabase as any)
        .from("ingolstadt_live_snapshots" as any)
        .select("*")
        .eq("category", category)
        .order("window_start", { ascending: false })
        .limit(1);

      await minLoad;

      if (error) {
        console.error('❌ Snapshot-Fehler:', error);
        throw new Error(error.message);
      }

      const snapshot = (data?.[0] || null) as IngolstadtSnapshot | null;
      
      if (snapshot) {
        console.log('✅ Snapshot-Daten geladen:', snapshot.payload?.length || 0, 'Events');
      } else {
        console.log('📭 Keine Snapshot-Daten gefunden');
      }
      
      return snapshot;
    },
    staleTime: 1000 * 60 * 5, // 5 Minuten für Live-Daten
    gcTime: 1000 * 60 * 30, // 30 Minuten im Cache
    refetchOnWindowFocus: false,
    retry: 2,
    meta: {
      onError: (err: any) => {
        console.error("Snapshot fetch error:", err);
      },
    },
  });
}
