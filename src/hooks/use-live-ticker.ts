import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LiveTickerEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  date?: string;
  time?: string;
  price?: string;
  link?: string;
  category?: string;
  source?: string;
  coordinates?: { lat: number; lng: number };
}

export interface LiveTickerResponse {
  success: boolean;
  events: LiveTickerEvent[];
  provider: string;
  timestamp: string;
  fallbackReason?: string;
  message?: string;
  debug?: any;
}

export function useLiveTicker() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  const fetchLiveData = async (category: string): Promise<LiveTickerResponse | null> => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Lade Live-Daten für Kategorie:', category);
      
      const { data, error } = await supabase.functions.invoke('ingolstadt-live-ticker', {
        body: { category }
      });

      if (error) {
        console.error('❌ Live Ticker Fehler:', error);
        toast.error('Live-Daten konnten nicht geladen werden');
        return null;
      }

      console.log('✅ Live Ticker Response:', data);
      setLastProvider(data.provider);

      // Debug Info anzeigen wenn vorhanden
      if (data.debug) {
        console.log('🔍 Debug Info:', data.debug);
        
        // Wenn alle Provider fehlgeschlagen sind, zeige Details
        if (data.provider === 'fallback') {
          const availableProviders = data.debug.availableProviders?.filter((p: any) => p.hasKey) || [];
          const missingProviders = data.debug.availableProviders?.filter((p: any) => !p.hasKey) || [];
          
          if (missingProviders.length > 0) {
            console.warn('⚠️ Fehlende API Keys:', missingProviders.map((p: any) => p.name));
          }
          
          if (availableProviders.length === 0) {
            toast.error('⚙️ API Setup erforderlich - Verwende Snapshot-Daten');
          } else {
            toast.warning(`⏰ Live-APIs temporär nicht verfügbar - ${data.fallbackReason || 'Verwende Snapshot-Daten'}`);
          }
        } else {
          toast.success(`🚀 Live-Daten via ${data.provider} geladen (${data.events?.length || 0} Events)`);
        }
      } else if (data.provider !== 'fallback') {
        toast.success(`✅ Live-Daten geladen (${data.events?.length || 0} Events)`);
      }

      return data;
    } catch (error) {
      console.error('💥 Live Ticker Request Fehler:', error);
      toast.error('Fehler beim Laden der Live-Daten');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchLiveData,
    isLoading,
    lastProvider
  };
}