export class HotelNotificationSounds {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
        this.isInitialized = true;
        console.log('🔊 Hotel Audio System initialisiert');
      }
    } catch (error) {
      console.error('❌ Audio Context Fehler:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      try {
        this.audioContext = new AudioContext();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.error('❌ Audio Context Aktivierung fehlgeschlagen:', error);
        return false;
      }
    }
    return true;
  }

  // 🍽️ Restaurant-Reservierung: Eleganter Glockenklang
  async playRestaurantNotification() {
    if (!(await this.ensureAudioContext())) return;

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      const now = this.audioContext!.currentTime;
      
      // Elegante Glockensequenz (C5-E5-G5)
      oscillator.frequency.setValueAtTime(523, now); // C5
      oscillator.frequency.exponentialRampToValueAtTime(659, now + 0.3); // E5
      oscillator.frequency.exponentialRampToValueAtTime(784, now + 0.6); // G5
      oscillator.frequency.exponentialRampToValueAtTime(523, now + 1.2); // Zurück zu C5
      
      // Sanfte Lautstärke-Envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.8);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
      
      oscillator.start(now);
      oscillator.stop(now + 1.5);
      
      console.log('🍽️ Restaurant-Benachrichtigungston abgespielt');
    } catch (error) {
      console.error('❌ Restaurant-Ton Fehler:', error);
    }
  }

  // 💅 Beauty-Termin: Sanfter Chime
  async playBeautyNotification() {
    if (!(await this.ensureAudioContext())) return;

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      const now = this.audioContext!.currentTime;
      
      // Sanfte Wellness-Melodie (F4-A4-C5-F5)
      oscillator.frequency.setValueAtTime(349, now); // F4
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.4); // A4
      oscillator.frequency.exponentialRampToValueAtTime(523, now + 0.8); // C5
      oscillator.frequency.exponentialRampToValueAtTime(698, now + 1.2); // F5
      
      // Sehr sanfte Lautstärke für entspannte Atmosphäre
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 1.0);
      gainNode.gain.linearRampToValueAtTime(0, now + 2.0);
      
      oscillator.start(now);
      oscillator.stop(now + 2.0);
      
      console.log('💅 Beauty-Benachrichtigungston abgespielt');
    } catch (error) {
      console.error('❌ Beauty-Ton Fehler:', error);
    }
  }

  // 🍷 Bar Mäx Bestellung: Freundlicher Bestätigungston
  async playBarMaxNotification() {
    if (!(await this.ensureAudioContext())) return;

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      const now = this.audioContext!.currentTime;
      
      // Fröhliche Bar-Melodie (G4-B4-D5-G5)
      oscillator.frequency.setValueAtTime(392, now); // G4
      oscillator.frequency.exponentialRampToValueAtTime(494, now + 0.2); // B4
      oscillator.frequency.exponentialRampToValueAtTime(587, now + 0.4); // D5
      oscillator.frequency.exponentialRampToValueAtTime(784, now + 0.6); // G5
      oscillator.frequency.exponentialRampToValueAtTime(392, now + 1.0); // Zurück zu G4
      
      // Lebendige Lautstärke für Bar-Atmosphäre
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.7);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.2);
      
      oscillator.start(now);
      oscillator.stop(now + 1.2);
      
      console.log('🍷 Bar Mäx-Benachrichtigungston abgespielt');
    } catch (error) {
      console.error('❌ Bar Mäx-Ton Fehler:', error);
    }
  }

  // 🛍️ Shop-Bestellung: Bestätigungston
  async playShopNotification() {
    if (!(await this.ensureAudioContext())) return;

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      const now = this.audioContext!.currentTime;
      
      // Shopping-Bestätigungsmelodie (E4-G4-C5)
      oscillator.frequency.setValueAtTime(330, now); // E4
      oscillator.frequency.exponentialRampToValueAtTime(392, now + 0.3); // G4
      oscillator.frequency.exponentialRampToValueAtTime(523, now + 0.6); // C5
      
      // Freundliche Bestätigungssequenz
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.5);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
      
      oscillator.start(now);
      oscillator.stop(now + 1.0);
      
      console.log('🛍️ Shop-Benachrichtigungston abgespielt');
    } catch (error) {
      console.error('❌ Shop-Ton Fehler:', error);
    }
  }

  // 🏢 Konferenz-Bestellung: Professioneller Ton
  async playConferenceNotification() {
    if (!(await this.ensureAudioContext())) return;

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      const now = this.audioContext!.currentTime;
      
      // Professionelle Business-Melodie (C4-E4-G4)
      oscillator.frequency.setValueAtTime(262, now); // C4
      oscillator.frequency.exponentialRampToValueAtTime(330, now + 0.4); // E4
      oscillator.frequency.exponentialRampToValueAtTime(392, now + 0.8); // G4
      
      // Dezente, professionelle Lautstärke
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.6);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.2);
      
      oscillator.start(now);
      oscillator.stop(now + 1.2);
      
      console.log('🏢 Konferenz-Benachrichtigungston abgespielt');
    } catch (error) {
      console.error('❌ Konferenz-Ton Fehler:', error);
    }
  }

  // ⚠️ Beschwerde/Kontakt: Dringender, aber professioneller Ton
  async playComplaintNotification() {
    if (!(await this.ensureAudioContext())) return;

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      const now = this.audioContext!.currentTime;
      
      // Dringende, aber höfliche Aufmerksamkeitssequenz (A4-C5-A4)
      oscillator.frequency.setValueAtTime(440, now); // A4
      oscillator.frequency.exponentialRampToValueAtTime(523, now + 0.2); // C5
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.4); // A4
      oscillator.frequency.exponentialRampToValueAtTime(523, now + 0.6); // C5
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.8); // A4
      
      // Aufmerksamkeitsstarke, aber respektvolle Lautstärke
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.6);
      gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
      
      oscillator.start(now);
      oscillator.stop(now + 1.0);
      
      console.log('⚠️ Beschwerde-Benachrichtigungston abgespielt');
    } catch (error) {
      console.error('❌ Beschwerde-Ton Fehler:', error);
    }
  }

  // 🎵 Allgemeiner Hotel-Benachrichtigungston (Fallback)
  async playGeneralHotelNotification() {
    if (!(await this.ensureAudioContext())) return;

    try {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      
      const now = this.audioContext!.currentTime;
      
      // Hotel-Atmosphäre: Warme, einladende Melodie (F4-A4-C5-F5)
      oscillator.frequency.setValueAtTime(349, now); // F4
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.5); // A4
      oscillator.frequency.exponentialRampToValueAtTime(523, now + 1.0); // C5
      oscillator.frequency.exponentialRampToValueAtTime(698, now + 1.5); // F5
      
      // Warme, einladende Hotel-Lautstärke
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 1.2);
      gainNode.gain.linearRampToValueAtTime(0, now + 2.0);
      
      oscillator.start(now);
      oscillator.stop(now + 2.0);
      
      console.log('🎵 Allgemeiner Hotel-Benachrichtigungston abgespielt');
    } catch (error) {
      console.error('❌ Allgemeiner Hotel-Ton Fehler:', error);
    }
  }

  // 🧪 Test-Ton für alle Sounds
  async playTestSound(soundType: string) {
    console.log(`🧪 Teste Hotel-Sound: ${soundType}`);
    
    switch (soundType) {
      case 'restaurant':
        await this.playRestaurantNotification();
        break;
      case 'beauty':
        await this.playBeautyNotification();
        break;
      case 'bar_max':
        await this.playBarMaxNotification();
        break;
      case 'shop':
        await this.playShopNotification();
        break;
      case 'conference':
        await this.playConferenceNotification();
        break;
      case 'complaint':
        await this.playComplaintNotification();
        break;
      default:
        await this.playGeneralHotelNotification();
    }
  }

  // Bestimme den richtigen Sound basierend auf Message Type
  async playNotificationForMessageType(messageType: string) {
    console.log(`🔊 Spiele Hotel-Benachrichtigungston für: ${messageType}`);
    
    // Mapping von Message Types zu Hotel-Sounds
    if (messageType.includes('restaurant') || messageType.includes('table')) {
      await this.playRestaurantNotification();
    } else if (messageType.includes('beauty') || messageType.includes('appointment')) {
      await this.playBeautyNotification();
    } else if (messageType.includes('bar') || messageType.includes('max')) {
      await this.playBarMaxNotification();
    } else if (messageType.includes('shop') || messageType.includes('store')) {
      await this.playShopNotification();
    } else if (messageType.includes('conference') || messageType.includes('meeting')) {
      await this.playConferenceNotification();
    } else if (messageType.includes('complaint') || messageType.includes('contact')) {
      await this.playComplaintNotification();
    } else {
      await this.playGeneralHotelNotification();
    }
  }
}

// Singleton Instance
export const hotelNotificationSounds = new HotelNotificationSounds();