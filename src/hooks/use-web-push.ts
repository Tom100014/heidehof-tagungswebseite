import { useState, useEffect } from 'react';
import { webPushService } from '@/services/web-push-service';

export interface WebPushHook {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: (userId?: string) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  isLoading: boolean;
}

export function useWebPush(): WebPushHook {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  const isSupported = webPushService.isPushSupported();

  // Prüfe initial Status
  useEffect(() => {
    if (!isSupported) return;

    const checkStatus = async () => {
      const hasSubscription = await webPushService.hasActiveSubscription();
      setIsSubscribed(hasSubscription);
      setPermission(Notification.permission);
    };

    checkStatus();
  }, [isSupported]);

  // Subscribe zu Push Notifications
  const subscribe = async (userId?: string): Promise<boolean> => {
    if (!isSupported) {
      console.warn('⚠️ Push Notifications nicht unterstützt');
      return false;
    }

    setIsLoading(true);
    try {
      const subscription = await webPushService.subscribeToPush(userId);
      if (subscription) {
        setIsSubscribed(true);
        setPermission('granted');
        console.log('✅ Push Notifications aktiviert');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Fehler beim Aktivieren von Push Notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe von Push Notifications
  const unsubscribe = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await webPushService.unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
        console.log('✅ Push Notifications deaktiviert');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Fehler beim Deaktivieren von Push Notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Test Notification senden
  const sendTestNotification = async (): Promise<boolean> => {
    try {
      const success = await webPushService.sendTestNotification();
      if (success) {
        console.log('✅ Test-Benachrichtigung gesendet');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Fehler beim Senden der Test-Benachrichtigung:', error);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    isLoading
  };
}