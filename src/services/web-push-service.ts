import { supabase } from "@/integrations/supabase/client";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class WebPushService {
  private static instance: WebPushService;
  private vapidPublicKey: string | null = null;

  static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService();
    }
    return WebPushService.instance;
  }

  // Lädt VAPID Public Key vom Server
  async loadVapidKey(): Promise<string | null> {
    if (this.vapidPublicKey) return this.vapidPublicKey;

    try {
      // Fetch VAPID public key from Edge Function
      const { data } = await supabase.functions.invoke('vapid-management');

      const publicKey = data?.publicKey || data?.value || data?.secret || null;
      if (publicKey) {
        this.vapidPublicKey = publicKey;
        console.log('✅ VAPID Public Key geladen');
        return this.vapidPublicKey;
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des VAPID Keys:', error);
    }
    return null;
  }

  // Überprüft Browser-Unterstützung für Push Notifications
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Fordert Berechtigung für Push Notifications an
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isPushSupported()) {
      console.warn('⚠️ Push Notifications nicht unterstützt');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('📱 Push Permission:', permission);
    return permission;
  }

  // Registriert Service Worker und erstellt Push Subscription
  async subscribeToPush(userId?: string): Promise<PushSubscriptionData | null> {
    try {
      // 1. VAPID Key laden
      const vapidKey = await this.loadVapidKey();
      if (!vapidKey) {
        console.error('❌ VAPID Key nicht verfügbar');
        return null;
      }

      // 2. Berechtigung prüfen/anfordern
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Push Notifications nicht erlaubt');
        return null;
      }

      // 3. Service Worker registrieren
      const registration = await navigator.serviceWorker.ready;
      
      // 4. Push Subscription erstellen
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as BufferSource
      });

      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64Url(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64Url(subscription.getKey('auth')!)
        }
      };

      // 5. Subscription in Datenbank speichern
      await this.saveSubscription(subscriptionData, userId);

      console.log('✅ Push Subscription erstellt und gespeichert');
      return subscriptionData;

    } catch (error) {
      console.error('❌ Fehler bei Push Subscription:', error);
      return null;
    }
  }

  // Speichert Push Subscription über Edge Function
  private async saveSubscription(subscription: PushSubscriptionData, userId?: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('save-push-subscription', {
        body: {
          user_id: userId || null,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          user_agent: navigator.userAgent
        }
      });

      if (error || !data?.success) {
        console.error('❌ Fehler beim Speichern der Subscription:', error);
      } else {
        console.log('✅ Push Subscription gespeichert');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Subscription:', error);
    }
  }

  // Sendet Test-Push-Notification
  async sendTestNotification(): Promise<boolean> {
    try {
      const { data } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: '🧪 Test Benachrichtigung',
          message: 'Web Push System funktioniert perfekt!',
          badge: '/favicon.ico',
          icon: '/favicon.ico',
          tag: 'test-notification',
          isTest: true
        }
      });

      if (data?.success) {
        console.log('✅ Test-Push gesendet');
        return true;
      } else {
        console.error('❌ Test-Push fehlgeschlagen:', data?.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Fehler beim Test-Push:', error);
      return false;
    }
  }

  // Utility: Base64 zu Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Utility: ArrayBuffer zu Base64URL
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  // Entfernt Push Subscription
  async unsubscribeFromPush(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
    if (subscription) {
        await supabase.functions.invoke('save-push-subscription', {
          body: { endpoint: subscription.endpoint, action: 'delete' }
        });

        await subscription.unsubscribe();

        console.log('✅ Push Subscription entfernt');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Fehler beim Entfernen der Push Subscription:', error);
      return false;
    }
  }

  // Prüft ob bereits eine Subscription existiert
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch {
      return false;
    }
  }
}

export const webPushService = WebPushService.getInstance();