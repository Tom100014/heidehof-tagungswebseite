
import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeSubscriptionProps {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onData: (payload: any) => void;
  channelName?: string;
}

export const useRealtimeSubscription = ({
  table,
  event,
  onData,
  channelName
}: UseRealtimeSubscriptionProps) => {
  const channelRef = useRef<any>(null);
  const onDataRef = useRef(onData);

  // Keep latest onData without re-subscribing
  useEffect(() => {
    onDataRef.current = onData;
  }, [onData]);

  useEffect(() => {
    const channel = supabase
      .channel(channelName || `${table}-${event}-${Date.now()}`)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table
        },
        (payload) => {
          console.log(`🔔 Real-time Event [${table}]:`, payload);
          try {
            onDataRef.current?.(payload);
          } catch (err) {
            console.error('Realtime onData handler error:', err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Erfolgreich abonniert: ${table}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Fehler beim Abonnieren: ${table}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`🔄 Echtzeit-Abonnement beenden für ${table}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, event, channelName]);

  return channelRef.current;
};
