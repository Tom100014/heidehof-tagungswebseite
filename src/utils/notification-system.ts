import { toast } from 'sonner';
import { hotelNotificationSounds } from './hotel-notification-sounds';

export class AdminNotificationSystem {
  private audioContext: AudioContext | null = null;
  private notificationPermission: NotificationPermission = 'default';
  private isAdminActive = false;
  private soundsEnabled = true;

  constructor() {
    this.requestNotificationPermission();
    this.initializeAudio();
    this.setupVisibilityHandler();
  }

  // Aktiviert das Benachrichtigungssystem für Admin
  enableAdminNotifications() {
    console.log('🔔 Admin Benachrichtigungen aktiviert');
    this.isAdminActive = true;
    this.requestNotificationPermission();
  }

  // Deaktiviert das System
  disableAdminNotifications() {
    console.log('🔕 Admin Benachrichtigungen deaktiviert');
    this.isAdminActive = false;
  }

  // Fordert Berechtigung für Browser-Benachrichtigungen an
  private async requestNotificationPermission() {
    if ('Notification' in window) {
      try {
        this.notificationPermission = await Notification.requestPermission();
        console.log('📱 Notification Permission:', this.notificationPermission);
        
        if (this.notificationPermission === 'granted') {
          toast.success('Browser-Benachrichtigungen aktiviert');
        } else if (this.notificationPermission === 'denied') {
          toast.error('Browser-Benachrichtigungen blockiert');
        }
      } catch (error) {
        console.error('❌ Fehler bei Notification Permission:', error);
      }
    }
  }

  // Initialisiert Audio-System
  private initializeAudio() {
    try {
      // Erstelle AudioContext bei User-Interaktion
      document.addEventListener('click', () => {
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
          console.log('🔊 Audio Context initialisiert (click)');
        }
      }, { once: true });

      // iOS/Android: auch auf touchstart und keydown initialisieren
      const initOnGesture = () => {
        if (!this.audioContext) {
          this.audioContext = new AudioContext();
          console.log('🔊 Audio Context initialisiert (gesture)');
        }
        document.removeEventListener('touchstart', initOnGesture);
        document.removeEventListener('keydown', initOnGesture);
      };
      document.addEventListener('touchstart', initOnGesture, { once: true, passive: true });
      document.addEventListener('keydown', initOnGesture, { once: true });
    } catch (error) {
      console.error('❌ Audio Context Fehler:', error);
    }
  }

  // Überwacht ob Tab aktiv ist
  private setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      console.log('👁️ Tab Sichtbarkeit:', document.hidden ? 'versteckt' : 'sichtbar');
    });
  }

  // Erzeugt einen langen Benachrichtigungston
  private async playNotificationSound() {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch (error) {
        console.error('❌ AudioContext Fehler:', error);
        return;
      }
    }

    try {
      // Langer Benachrichtigungston (2 Sekunden)
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Frequenz für angenehmen Ton (wie iPhone Notification)
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.3);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 2);
      
      // Lautstärke-Envelope
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 1.5);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 2);
      
      console.log('🔊 Benachrichtigungston abgespielt');
    } catch (error) {
      console.error('❌ Fehler beim Abspielen des Tons:', error);
    }
  }

  // Zeigt einfache Mobile Push-Notification für Dashboard
  private showDashboardNotification(messageType: string) {
    if (this.notificationPermission !== 'granted') {
      console.log('⚠️ Keine Berechtigung für Browser-Benachrichtigungen');
      return;
    }

    try {
      const typeLabel = this.getMessageTypeLabel(messageType);
      
      const notification = new Notification('📱 Hotel Heidehof Dashboard', {
        body: `Neue ${typeLabel} verfügbar`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'dashboard-message',
        requireInteraction: false, // Verschwindet automatisch
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        window.location.href = this.getAdminRouteForMessageType(messageType);
      };

      // Auto-close nach 6 Sekunden
      setTimeout(() => {
        notification.close();
      }, 6000);

      console.log('📱 Dashboard-Benachrichtigung angezeigt:', `Neue ${typeLabel} verfügbar`);
    } catch (error) {
      console.error('❌ Fehler bei Dashboard-Benachrichtigung:', error);
    }
  }

  // Aktiviert/Deaktiviert Sounds
  enableSounds() {
    this.soundsEnabled = true;
    console.log('🔊 Hotel-Benachrichtigungstöne aktiviert');
  }

  disableSounds() {
    this.soundsEnabled = false;
    console.log('🔇 Hotel-Benachrichtigungstöne deaktiviert');
  }

  // Haupt-Methode für neue Nachricht - ERWEITERT mit Hotel-Sounds
  async handleNewMessage(messageData: any) {
    if (!this.isAdminActive) {
      console.log('🔕 Admin-Benachrichtigungen deaktiviert');
      return;
    }

    console.log('🚨 NEUE ADMIN-NACHRICHT EMPFANGEN:', messageData);

    const customerName = messageData.customer_name || 'Unbekannt';
    const messageType = this.getMessageTypeLabel(messageData.message_type);
    const sourceForm = messageData.source_form || messageData.message_type;

    // ✨ HOTEL-SPEZIFISCHE SOUNDS basierend auf Message Type
    if (this.soundsEnabled) {
      await hotelNotificationSounds.playNotificationForMessageType(messageData.message_type);
    } else {
      // Fallback auf den alten generischen Sound
      await this.playNotificationSound();
    }

    // Toast-Benachrichtigung (immer sichtbar) - mit passendem Emoji
    const emoji = this.getMessageTypeEmoji(messageData.message_type);
    toast.success(`${emoji} Neue ${messageType}`, {
      description: `Von: ${customerName}`,
      duration: 8000,
      action: {
        label: 'Ansehen',
        onClick: () => {
          window.location.href = this.getAdminRouteForMessageType(messageData.message_type);
        }
      }
    });

    // Push-Benachrichtigung für Dashboard
    this.showDashboardNotification(messageData.message_type);

    // Zusätzliche Vibration für mobile Geräte
    if ('vibrate' in navigator) {
      navigator.vibrate([300, 100, 300, 100, 300]);
    }

    // Tab-Titel blinken lassen
    this.blinkTabTitle(`(!) Neue Nachricht - Admin`);
  }

  // Tab-Titel blinken lassen
  private blinkTabTitle(newTitle: string) {
    const originalTitle = document.title;
    let blinkCount = 0;
    const maxBlinks = 6;

    const blinkInterval = setInterval(() => {
      document.title = blinkCount % 2 === 0 ? newTitle : originalTitle;
      blinkCount++;

      if (blinkCount >= maxBlinks) {
        clearInterval(blinkInterval);
        document.title = originalTitle;
      }
    }, 1000);

    // Stoppe Blinken wenn User Tab fokussiert
    const stopBlinking = () => {
      clearInterval(blinkInterval);
      document.title = originalTitle;
      document.removeEventListener('visibilitychange', stopBlinking);
    };

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        stopBlinking();
      }
    });
  }

  // Hilfsmethode für Message-Type Labels
  private getMessageTypeLabel(messageType: string): string {
    const labels: { [key: string]: string } = {
      'restaurant_reservation': 'Restaurant-Reservierung',
      'table_reservation': 'Tischreservierung',
      'bar_max_order': 'Bar Mäx Bestellung',
      'conference_order': 'Konferenz-Bestellung',
      'beauty_appointment': 'Beauty-Termin',
      'contact_complaint': 'Beschwerde/Kontakt',
      'Beschwerde/Kontakt': 'Beschwerde/Kontakt',
      'shop_order': 'Shop-Bestellung'
    };
    return labels[messageType] || messageType;
  }

  private getAdminRouteForMessageType(messageType: string): string {
    const routes: { [key: string]: string } = {
      restaurant_reservation: '/admin/service',
      table_reservation: '/admin/service',
      bar_max_order: '/admin/service',
      conference_order: '/admin/conference-orders',
      beauty_appointment: '/admin/service?filter=wellness',
      contact_complaint: '/admin/service',
      'Beschwerde/Kontakt': '/admin/service',
      shop_order: '/admin/service',
    };
    return routes[messageType] || '/admin';
  }

  // Hilfsmethode für Message-Type Emojis
  private getMessageTypeEmoji(messageType: string): string {
    const emojis: { [key: string]: string } = {
      'restaurant_reservation': '🍽️',
      'table_reservation': '🍽️',
      'bar_max_order': '🍷',
      'conference_order': '🏢',
      'beauty_appointment': '💅',
      'contact_complaint': '⚠️',
      'Beschwerde/Kontakt': '⚠️',
      'shop_order': '🛍️'
    };
    return emojis[messageType] || '📱';
  }

  // Test-Methode - ERWEITERT für alle Message Types
  async testNotification(messageType?: string) {
    const testMessageType = messageType || 'restaurant_reservation';
    console.log(`🧪 Teste Benachrichtigungssystem für: ${testMessageType}`);
    
    await this.handleNewMessage({
      customer_name: 'Test User',
      message_type: testMessageType,
      source_form: this.getMessageTypeLabel(testMessageType),
      id: `test-${Date.now()}`
    });
  }

  // Test alle Hotel-Sounds
  async testAllHotelSounds() {
    console.log('🧪 Teste alle Hotel-Benachrichtigungstöne...');
    
    const messageTypes = [
      'restaurant_reservation',
      'beauty_appointment', 
      'bar_max_order',
      'shop_order',
      'conference_order',
      'contact_complaint'
    ];

    for (let i = 0; i < messageTypes.length; i++) {
      const messageType = messageTypes[i];
      console.log(`🔊 Teste Sound ${i + 1}/${messageTypes.length}: ${messageType}`);
      
      await this.testNotification(messageType);
      
      // 3 Sekunden Pause zwischen Tests
      if (i < messageTypes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    toast.success('🎵 Alle Hotel-Sounds getestet!', {
      description: 'Alle Benachrichtigungstöne wurden abgespielt.',
      duration: 5000
    });
  }

  // 5-Sekunden Test-Ton
  async playLongTestSound() {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch (error) {
        console.error('❌ AudioContext Fehler:', error);
        return;
      }
    }

    try {
      console.log('🔊 Spiele 5-Sekunden Test-Ton...');
      
      // Erstelle einen melodischen 5-Sekunden Ton
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Melodische Frequenz-Änderungen über 5 Sekunden
      const now = this.audioContext.currentTime;
      oscillator.frequency.setValueAtTime(440, now); // A4
      oscillator.frequency.exponentialRampToValueAtTime(523, now + 1); // C5
      oscillator.frequency.exponentialRampToValueAtTime(659, now + 2); // E5
      oscillator.frequency.exponentialRampToValueAtTime(784, now + 3); // G5
      oscillator.frequency.exponentialRampToValueAtTime(880, now + 4); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 5); // Zurück zu A4
      
      // Lautstärke-Envelope für 5 Sekunden
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 1);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 2.5);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 4);
      gainNode.gain.linearRampToValueAtTime(0, now + 5);
      
      oscillator.start(now);
      oscillator.stop(now + 5);
      
      // Toast-Nachricht für den Test
      toast.success('🔊 5-Sekunden Test-Ton wird abgespielt', {
        description: 'Melodischer Test-Ton läuft für 5 Sekunden',
        duration: 5000
      });
      
      console.log('🔊 5-Sekunden Test-Ton gestartet');
    } catch (error) {
      console.error('❌ Fehler beim 5-Sekunden Test-Ton:', error);
      toast.error('Fehler beim Abspielen des Test-Tons');
    }
  }
}

// Singleton Instance
export const notificationSystem = new AdminNotificationSystem();
