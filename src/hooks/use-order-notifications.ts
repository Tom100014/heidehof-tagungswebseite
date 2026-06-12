
import React, { useState, useEffect, useCallback } from 'react';
import { Order } from '@/types/order';
import { useRealtimeSubscription } from '@/hooks/use-realtime-subscription';

export const useOrderNotifications = () => {
  const [notificationOrder, setNotificationOrder] = useState<Order | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioReady, setAudioReady] = useState(false);

  // Audio initialisieren
  const initializeAudio = useCallback(async () => {
    try {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
        setAudioReady(true);
        console.log('🔊 Audio Context erfolgreich initialisiert');
        return true;
      }
      return true;
    } catch (error) {
      console.error('Audio Context Fehler:', error);
      return false;
    }
  }, [audioContext]);

  // Test-Ton abspielen
  const playTestTone = useCallback(async () => {
    if (!audioContext) return false;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      return true;
    } catch (error) {
      console.error('Audio Wiedergabe Fehler:', error);
      return false;
    }
  }, [audioContext]);

  // Benachrichtigung für neue Bestellung
  const showOrderNotification = useCallback((order: Order) => {
    console.log('🔔 Neue Bestellung erhalten:', order.customer_name);
    
    setNotificationOrder(order);
    setIsNotificationVisible(true);
    
    // Audio-Benachrichtigung abspielen
    if (audioReady && audioContext) {
      playTestTone();
    }
    
    // Browser-Benachrichtigung
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Neue Bestellung eingegangen!', {
        body: `${order.customer_name} - ${order.department}`,
        icon: '/favicon.ico'
      });
    }
    
    // Auto-hide nach 5 Sekunden
    setTimeout(() => {
      setIsNotificationVisible(false);
    }, 5000);
  }, [audioReady, audioContext, playTestTone]);

  // Realtime-Subscriptions für neue Bestellungen
  useRealtimeSubscription({
    table: 'restaurant_orders',
    event: 'INSERT',
    onData: (payload) => {
      console.log('🍽️ Neue Restaurant Order:', payload);
      if (payload.new) {
        showOrderNotification({
          id: payload.new.id,
          customer_name: payload.new.name || 'Restaurant Kunde',
          department: 'restaurant',
          status: payload.new.status || 'offen',
          created_at: payload.new.created_at,
          items: payload.new.speisen || 'Restaurant Bestellung',
          room_number: payload.new.zustellort,
          timestamp: new Date(payload.new.created_at).toLocaleString('de-DE')
        });
      }
    }
  });

  useRealtimeSubscription({
    table: 'appointments',
    event: 'INSERT',
    onData: (payload) => {
      console.log('💅 Neue Beauty Appointment:', payload);
      if (payload.new) {
        showOrderNotification({
          id: payload.new.id,
          customer_name: payload.new.name || 'Beauty Kunde',
          department: 'beauty',
          status: payload.new.status || 'pending',
          created_at: payload.new.created_at,
          items: payload.new.treatment_name || 'Beauty Behandlung',
          room_number: payload.new.room_number,
          timestamp: new Date(payload.new.created_at).toLocaleString('de-DE')
        });
      }
    }
  });

  useRealtimeSubscription({
    table: 'shop_orders',
    event: 'INSERT',
    onData: (payload) => {
      console.log('🛍️ Neue Shop Order:', payload);
      if (payload.new) {
        showOrderNotification({
          id: payload.new.id,
          customer_name: payload.new.customer_name || 'Shop Kunde',
          department: 'shop',
          status: payload.new.status || 'new',
          created_at: payload.new.created_at,
          items: 'Shop Bestellung',
          room_number: payload.new.room_number,
          timestamp: new Date(payload.new.created_at).toLocaleString('de-DE')
        });
      }
    }
  });

  // NEU: Conference Orders (Tagungsmenüs)
  useRealtimeSubscription({
    table: 'conference_orders',
    event: 'INSERT',
    onData: (payload) => {
      console.log('🏢 Neue Conference Order (Tagungsmenü):', payload);
      if (payload.new) {
        // Sichere Extraktion der guest_info
        let guestInfo: any = {};
        try {
          if (typeof payload.new.guest_info === 'string') {
            guestInfo = JSON.parse(payload.new.guest_info);
          } else if (typeof payload.new.guest_info === 'object') {
            guestInfo = payload.new.guest_info || {};
          }
        } catch (e) {
          guestInfo = {};
        }

        showOrderNotification({
          id: payload.new.id,
          customer_name: guestInfo.name || 'Tagungsgast',
          department: 'conference',
          status: payload.new.status || 'new',
          created_at: payload.new.created_at,
          items: `Tagungsmenü für ${payload.new.order_date}`,
          room_number: guestInfo.conferenceRoom || guestInfo.room || 'Konferenz',
          timestamp: new Date(payload.new.created_at).toLocaleString('de-DE')
        });
      }
    }
  });

  // NEU: Contact Requests (Beschwerden)
  useRealtimeSubscription({
    table: 'contact_requests',
    event: 'INSERT',
    onData: (payload) => {
      console.log('📞 Neue Contact Request (Beschwerde):', payload);
      if (payload.new) {
        // Sichere Extraktion des service_context
        let serviceContext: any = {};
        try {
          if (typeof payload.new.service_context === 'string') {
            serviceContext = JSON.parse(payload.new.service_context);
          } else if (typeof payload.new.service_context === 'object') {
            serviceContext = payload.new.service_context || {};
          }
        } catch (e) {
          serviceContext = {};
        }

        // Beschwerden-Text extrahieren
        let complaintsText = 'Neue Beschwerde';
        if (serviceContext.selectedComplaints && Array.isArray(serviceContext.selectedComplaints)) {
          complaintsText = serviceContext.selectedComplaints.join(', ');
        } else if (serviceContext.message) {
          complaintsText = serviceContext.message.substring(0, 50) + '...';
        }

        showOrderNotification({
          id: payload.new.id,
          customer_name: payload.new.name || 'Gast',
          department: 'contact',
          status: payload.new.status || 'neu',
          created_at: payload.new.created_at,
          items: complaintsText,
          room_number: payload.new.room_number || 'Nicht angegeben',
          timestamp: new Date(payload.new.created_at).toLocaleString('de-DE')
        });
      }
    }
  });

  // NEU: Beschwerden-Signal auch für admin_messages (falls Form nicht in contact_requests schreibt)
  useRealtimeSubscription({
    table: 'admin_messages',
    event: 'INSERT',
    onData: (payload) => {
      console.log('🛎️ Neue Admin-Nachricht (Realtime):', payload);
      const msg = payload.new as any;
      if (!msg) return;
      const type = (msg.message_type || '').toLowerCase();
      const src = (msg.source_form || '').toLowerCase();
      const isComplaint = type === 'complaint' || type.includes('beschwerde') || src.includes('beschwerde');
      if (!isComplaint) return;

      showOrderNotification({
        id: msg.id,
        customer_name: msg.customer_name || 'Gast',
        department: 'contact',
        status: msg.status || 'neu',
        created_at: msg.sent_at || msg.created_at,
        items: (msg.message_content || '').slice(0, 80) + '...',
        room_number: msg.room_number || 'Nicht angegeben',
        timestamp: new Date(msg.sent_at || msg.created_at).toLocaleString('de-DE')
      });
    }
  });

  const closeNotification = useCallback(() => {
    setIsNotificationVisible(false);
    setNotificationOrder(null);
  }, []);

  return {
    notificationOrder,
    isNotificationVisible,
    closeNotification,
    initializeAudio,
    audioReady,
    playTestTone
  };
};
