import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { notificationSystem } from '@/utils/notification-system';
import { usePushNotifications } from './use-push-notifications';

export const useAdminNotifications = (isAdminMode: boolean = false) => {
  usePushNotifications(); // Initialize push notifications

  useEffect(() => {
    if (!isAdminMode) {
      console.log('👤 Nicht im Admin-Modus - keine Benachrichtigungen');
      return;
    }

    console.log('🔔 Admin-Benachrichtigungen aktiviert');
    notificationSystem.enableAdminNotifications();

    let adminMessagesChannel: any | null = null;
    let ordersChannel: any | null = null;

    try {
      // Überwache ALLE admin_messages Einträge in Echtzeit
      adminMessagesChannel = supabase
        .channel('admin-messages-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_messages'
          },
          (payload) => {
            console.log('🚨 NEUE ADMIN MESSAGE ERKANNT:', payload);
            try {
              // Verarbeite die neue Nachricht
              if (payload.new) {
                notificationSystem.handleNewMessage(payload.new);
              }
            } catch (err) {
              console.error('❌ Fehler im Admin-Message Handler:', err);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'admin_messages'
          },
          (payload) => {
            console.log('📝 ADMIN MESSAGE UPDATE:', payload);
            try {
              // Nur bei Status-Änderungen benachrichtigen (nicht bei jeder kleinen Änderung)
              if (payload.old && payload.new && payload.old.status !== payload.new.status) {
                const statusChangeData = {
                  ...payload.new,
                  statusChanged: true,
                  oldStatus: payload.old.status,
                  newStatus: payload.new.status
                };
                // Optional: Reagiere auf wichtige Status-Änderungen
                if (payload.new.status === 'replied' || payload.new.status === 'completed') {
                  console.log('📬 Status-Änderung zu wichtigem Status:', payload.new.status);
                }
              }
            } catch (err) {
              console.error('❌ Fehler im Admin-Update Handler:', err);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Admin Messages Realtime Status:', status);
        });

      // Zusätzlich: Überwache alle anderen relevanten Tabellen für neue Bestellungen/Termine
      ordersChannel = supabase
        .channel('orders-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'restaurant_bar_orders'
          },
          (payload) => {
            console.log('🍷 Neue Bar Mäx Bestellung:', payload);
            try {
              if (payload.new) {
                const adminMessageData = {
                  message_type: 'bar_max_order',
                  source_form: 'Bar Mäx Bestellung',
                  customer_name: payload.new.customer_name,
                  room_number: payload.new.room_number,
                  created_at: payload.new.created_at
                };
                notificationSystem.handleNewMessage(adminMessageData);
              }
            } catch (err) {
              console.error('❌ Fehler im Bar Mäx Handler:', err);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'appointments'
          },
          (payload) => {
            console.log('💅 Neuer Beauty Termin:', payload);
            try {
              if (payload.new) {
                const adminMessageData = {
                  message_type: 'beauty_appointment',
                  source_form: 'Beauty Termin',
                  customer_name: payload.new.name,
                  room_number: payload.new.room_number,
                  created_at: payload.new.created_at
                };
                notificationSystem.handleNewMessage(adminMessageData);
              }
            } catch (err) {
              console.error('❌ Fehler im Beauty-Termin Handler:', err);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'restaurant_reservations'
          },
          (payload) => {
            console.log('🍽️ Neue Restaurant Reservierung:', payload);
            try {
              if (payload.new) {
                const adminMessageData = {
                  message_type: 'restaurant_reservation',
                  source_form: 'Restaurant Reservierung',
                  customer_name: payload.new.full_name,
                  room_number: payload.new.room_number,
                  created_at: payload.new.created_at
                };
                notificationSystem.handleNewMessage(adminMessageData);
              }
            } catch (err) {
              console.error('❌ Fehler im Reservierungs-Handler:', err);
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Orders Realtime Status:', status);
        });
    } catch (error) {
      console.error('❌ Fehler beim Einrichten der Realtime-Kanäle:', error);
    }

    // Cleanup beim Verlassen des Admin-Modus
    return () => {
      console.log('🔕 Admin-Benachrichtigungen deaktiviert');
      notificationSystem.disableAdminNotifications();

      if (adminMessagesChannel) {
        supabase.removeChannel(adminMessagesChannel);
      }
      if (ordersChannel) {
        supabase.removeChannel(ordersChannel);
      }
    };
  }, [isAdminMode]);

  // Test-Funktionen für Admin
  const testNotification = async (messageType?: string) => {
    await notificationSystem.testNotification(messageType);
  };

  const testAllSounds = async () => {
    await notificationSystem.testAllHotelSounds();
  };

  const enableSounds = () => {
    notificationSystem.enableSounds();
  };

  const disableSounds = () => {
    notificationSystem.disableSounds();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).hotelNotify = {
        test: testNotification,
        testAllSounds,
        enableSounds,
        disableSounds
      };
    }
    return () => {
      if (typeof window !== 'undefined' && (window as any).hotelNotify) {
        delete (window as any).hotelNotify;
      }
    };
  }, [testNotification, testAllSounds, enableSounds, disableSounds]);

  return {
    testNotification,
    testAllSounds,
    enableSounds,
    disableSounds
  };
};