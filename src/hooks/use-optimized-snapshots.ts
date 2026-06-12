// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SnapshotWindow = "morning" | "noon" | "afternoon" | "overnight";

export interface OptimizedSnapshot {
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
 * Bestimmt das optimale Snapshot-Fenster basierend auf der aktuellen Zeit.
 * 06:00-11:59 → "morning" 
 * 12:00-17:59 → "noon"
 * 18:00-05:59 → "afternoon"
 */
function getCurrentWindowLabel(): SnapshotWindow {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 18) {
    return 'noon';
  } else {
    return 'afternoon';
  }
}

/**
 * Optimierter Snapshot-Hook: Nur noch Datenbank-Abfragen, KEINE Live-API-Calls!
 * Reduziert API-Aufrufe von hunderten auf nur 57/Tag (19 Kategorien × 3 Zeiten).
 * Simuliert 3-Sekunden Suche für bessere UX.
 */
export function useOptimizedSnapshots(category: string) {
  return useQuery<OptimizedSnapshot | null>({
    queryKey: ["optimized-snapshots", category],
    queryFn: async (): Promise<OptimizedSnapshot | null> => {
      // 3-Sekunden "Suche wird simuliert" für konsistente UX
      const minSearchTime = delay(3000);
      
      console.log('🔍 Starte optimierte Snapshot-Suche für Kategorie:', category);
      
      // Bestimme optimales Fenster basierend auf aktueller Zeit
      const preferredWindow = getCurrentWindowLabel();
      console.log('⏰ Bevorzugtes Zeitfenster:', preferredWindow);
      
      try {
        // 1. Versuche bevorzugtes Zeitfenster (aktueller Tageszeit entsprechend)
        const { data: preferredData, error: preferredError } = await (supabase as any)
          .from("ingolstadt_live_snapshots" as any)
          .select("*")
          .eq("category", category)
          .eq("window_label", preferredWindow)
          .order("generated_at", { ascending: false })
          .limit(1);

        if (!preferredError && preferredData?.[0]) {
          await minSearchTime;
          const snapshot = preferredData[0] as OptimizedSnapshot;
          console.log('✅ Optimaler Snapshot gefunden:', {
            window: snapshot.window_label,
            events: snapshot.payload?.length || 0,
            generated: new Date(snapshot.generated_at).toLocaleTimeString('de-DE')
          });
          return snapshot;
        }

        // 2. Fallback: Neuesten verfügbaren Snapshot laden (beliebiges Fenster)
        console.log('📦 Fallback: Lade neuesten verfügbaren Snapshot...');
        const { data: fallbackData, error: fallbackError } = await (supabase as any)
          .from("ingolstadt_live_snapshots" as any)
          .select("*")
          .eq("category", category)
          .order("generated_at", { ascending: false })
          .limit(1);

        await minSearchTime;

        if (fallbackError) {
          console.error('❌ Snapshot-Fehler:', fallbackError);
          throw new Error(fallbackError.message);
        }

        const snapshot = (fallbackData?.[0] || null) as OptimizedSnapshot | null;
        
        if (snapshot) {
          console.log('✅ Fallback-Snapshot geladen:', {
            window: snapshot.window_label,
            events: snapshot.payload?.length || 0,
            generated: new Date(snapshot.generated_at).toLocaleTimeString('de-DE')
          });
        } else {
          console.log('📭 Keine Snapshot-Daten gefunden');
        }
        
        return snapshot;

      } catch (error) {
        await minSearchTime;
        console.error('❌ Optimierte Snapshot-Suche fehlgeschlagen:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 Minuten - länger als Live-Daten, da wir auf Cron-Updates warten
    gcTime: 1000 * 60 * 60, // 1 Stunde im Cache
    refetchOnWindowFocus: false,
    retry: 2,
    meta: {
      onError: (err: any) => {
        console.error("Optimized snapshot fetch error:", err);
      },
    },
  });
}

/**
 * Hilfsfunktion: Formatierte Anzeige des Snapshot-Zeitstempels
 */
export function formatSnapshotTimestamp(snapshot: OptimizedSnapshot | null): string {
  if (!snapshot) return '';
  
  const generated = new Date(snapshot.generated_at);
  const time = generated.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const windowLabels = {
    morning: 'Morgen',
    noon: 'Mittag', 
    afternoon: 'Abend',
    overnight: 'Nacht'
  };
  
  return `${windowLabels[snapshot.window_label]} (${time})`;
}

/**
 * Hook für Snapshot-Status-Informationen
 */
export function useSnapshotStatus(category: string) {
  const { data: snapshot, isLoading } = useOptimizedSnapshots(category);
  
  return {
    isLoading,
    hasData: !!snapshot,
    eventCount: snapshot?.payload?.length || 0,
    lastUpdate: snapshot ? formatSnapshotTimestamp(snapshot) : null,
    dataSource: 'Snapshot-Cache' // Immer Cache, nie Live-API
  };
}