import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWebPush } from '@/hooks/use-web-push';
import { toast } from 'sonner';

// Deduplication helper to avoid double push sends within a short window
const RECENT_TTL_MS = 15000;
const recentKeys = new Set<string>();
const markAndCheck = (key: string): boolean => {
  if (recentKeys.has(key)) return false;
  recentKeys.add(key);
  setTimeout(() => recentKeys.delete(key), RECENT_TTL_MS);
  return true;
};

const getAdminRouteForMessageType = (messageType: string): string => {
  const routes: Record<string, string> = {
    restaurant_reservation: '/admin/service',
    table_reservation: '/admin/service',
    bar_max_order: '/admin/service',
    conference_order: '/admin/conference-orders',
    beauty_appointment: '/admin/service?filter=wellness',
    contact_complaint: '/admin/service',
    complaint: '/admin/service',
    general_inquiry: '/admin/inbox',
    shop_order: '/admin/service',
  };
  return routes[messageType] || '/admin';
};

interface AdminMessage {
  id: string;
  message_type: string;
  customer_name: string;
  source_form: string;
  status: string;
  created_at: string;
  room_number?: string;
  order_reference?: string;
}

export function usePushNotifications() {
  const webPush = useWebPush();

  useEffect(() => {
    // Push notifications disabled (legacy admin_messages system not in scope)
  }, [webPush.isSupported, webPush.isSubscribed, webPush.permission]);

  useEffect(() => {
    // Höre auf neue Admin Messages und sende Push Notifications
    const channel = supabase
      .channel('admin-messages-push')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages'
        },
        async (payload) => {
          const message = payload.new as AdminMessage;
          console.log('📨 Neue Admin Message für Push:', message);

          // Suppress duplicate push within short window
          const dedupKey = `insert-${message.id}`;
          if (!markAndCheck(dedupKey)) {
            console.log('⏭️ Überspringe doppelte Insert-Push für', message.id);
            return;
          }

          // Sende Push Notification an alle aktiven Subscriptions
          try {
            const { data } = await supabase.functions.invoke('send-push-notification', {
              body: {
                title: `📱 ${getMessageTypeEmoji(message.message_type)} Neue Nachricht`,
                message: `${message.customer_name} - ${getMessageTypeLabel(message.message_type)}`,
                tag: `admin-message-${message.id}`,
                data: {
                  messageId: message.id,
                  messageType: message.message_type,
                  customerName: message.customer_name,
                  sourceForm: message.source_form,
                  roomNumber: message.room_number,
                  orderReference: message.order_reference,
                  url: getAdminRouteForMessageType(message.message_type)
                },
                actions: [
                  {
                    action: 'view',
                    title: 'Anzeigen',
                    icon: '/favicon.ico'
                  },
                  {
                    action: 'dismiss',
                    title: 'Schließen'
                  }
                ]
              }
            });

            if (data?.success) {
              console.log(`✅ Push Notification gesendet: ${data.sentCount} Empfänger`);
            }
          } catch (error) {
            console.error('❌ Fehler beim Senden der Push Notification:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Status Updates für bestehende Messages
  useEffect(() => {
    const channel = supabase
      .channel('admin-messages-status-push')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_messages'
        },
        async (payload) => {
          const message = payload.new as AdminMessage;
          const oldMessage = payload.old as AdminMessage;
          
          // Nur bei Status-Änderungen Push senden
          if (message.status !== oldMessage.status && message.status !== 'sent') {
            console.log('📝 Status-Update für Push:', message);

            // Suppress duplicate status push for same status within short window
            const dedupKey = `status-${message.id}-${message.status}`;
            if (!markAndCheck(dedupKey)) {
              console.log('⏭️ Überspringe doppelte Status-Push für', message.id, message.status);
              return;
            }

            try {
              const { data } = await supabase.functions.invoke('send-push-notification', {
                body: {
                  title: `✅ ${getStatusEmoji(message.status)} Status Update`,
                  message: `${message.customer_name} - ${getStatusLabel(message.status)}`,
                  tag: `status-update-${message.id}`,
                  data: {
                    messageId: message.id,
                    newStatus: message.status,
                    customerName: message.customer_name,
                    url: getAdminRouteForMessageType(message.message_type)
                  }
                }
              });

              if (data?.success) {
                console.log(`✅ Status Push gesendet: ${data.sentCount} Empfänger`);
              }
            } catch (error) {
              console.error('❌ Fehler beim Status Push:', error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

// Utility Funktionen
function getMessageTypeEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    'restaurant_reservation': '🍽️',
    'beauty_appointment': '💅',
    'bar_max_order': '🍹',
    'conference_order': '🏢',
    'complaint': '⚠️',
    'general_inquiry': '💬',
    'shop_order': '🛍️'
  };
  return emojiMap[type] || '📋';
}

function getMessageTypeLabel(type: string): string {
  const labelMap: Record<string, string> = {
    'restaurant_reservation': 'Restaurant Reservierung',
    'beauty_appointment': 'Beauty Termin',
    'bar_max_order': 'Bar Mäx Bestellung',
    'conference_order': 'Konferenz Bestellung',
    'complaint': 'Beschwerde',
    'general_inquiry': 'Allgemeine Anfrage',
    'shop_order': 'Shop Bestellung'
  };
  return labelMap[type] || type;
}

function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    'confirmed': '✅',
    'completed': '🎉',
    'processing': '⏳',
    'cancelled': '❌',
    'rejected': '🚫'
  };
  return emojiMap[status] || '📝';
}

function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    'confirmed': 'Bestätigt',
    'completed': 'Abgeschlossen',
    'processing': 'In Bearbeitung',
    'cancelled': 'Storniert',
    'rejected': 'Abgelehnt'
  };
  return labelMap[status] || status;
}
