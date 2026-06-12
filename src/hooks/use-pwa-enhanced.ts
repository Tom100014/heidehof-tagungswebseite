import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  notificationPermission: NotificationPermission;
  hasOfflineData: boolean;
  syncInProgress: boolean;
}

// Built-in PWA detection and management without external dependencies
const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

const isPWAInstallable = (): boolean => {
  return window.deferredPrompt !== null;
};

// Add deferredPrompt to window for global access
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export const usePWAEnhanced = () => {
  const [state, setState] = useState<PWAState>({
    isInstalled: isPWAInstalled(),
    isInstallable: isPWAInstallable(),
    isOnline: navigator.onLine,
    updateAvailable: false,
    notificationPermission: 'default',
    hasOfflineData: false,
    syncInProgress: false,
  });

  const installPWA = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.deferredPrompt) {
        // For iOS Safari, show instructions instead
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          toast.info('Installation auf iOS: Tippen Sie auf das Teilen-Symbol unten und wählen Sie "Zum Home-Bildschirm"', {
            duration: 8000
          });
        } else {
          toast.error('Installation nicht verfügbar - App bereits installiert oder Browser unterstützt PWA nicht');
        }
        return false;
      }

      await window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
        toast.success('App erfolgreich installiert!');
        window.deferredPrompt = null;
        return true;
      } else {
        toast.info('Installation abgebrochen');
      }
      return false;
    } catch (error) {
      console.error('Installation error:', error);
      toast.error('Installation fehlgeschlagen');
      return false;
    }
  }, []);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        toast.error('Benachrichtigungen nicht unterstützt');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setState(prev => ({ ...prev, notificationPermission: 'granted' }));
        toast.success('Benachrichtigungen aktiviert!');
        return true;
      } else {
        toast.error('Benachrichtigungen abgelehnt');
        return false;
      }
    } catch (error) {
      toast.error('Fehler bei Benachrichtigungen');
      return false;
    }
  }, []);

  const syncOfflineData = useCallback(async (): Promise<void> => {
    if (state.syncInProgress) return;

    setState(prev => ({ ...prev, syncInProgress: true }));
    window.dispatchEvent(new CustomEvent('sync-start'));

    try {
      const offlineOrders = getOfflineOrders();
      
      if (offlineOrders.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        localStorage.removeItem('heidehof_offline_orders');
        setState(prev => ({ ...prev, hasOfflineData: false }));
        toast.success(`${offlineOrders.length} Bestellungen synchronisiert`);
      }
    } catch (error) {
      toast.error('Synchronisierung fehlgeschlagen');
    } finally {
      setState(prev => ({ ...prev, syncInProgress: false }));
      window.dispatchEvent(new CustomEvent('sync-complete'));
    }
  }, [state.syncInProgress]);

  const saveOfflineOrder = useCallback((orderData: any) => {
    try {
      const offlineOrders = getOfflineOrders();
      offlineOrders.push({
        ...orderData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        synced: false
      });
      
      localStorage.setItem('heidehof_offline_orders', JSON.stringify(offlineOrders));
      setState(prev => ({ ...prev, hasOfflineData: true }));
      toast.success('Bestellung offline gespeichert');
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  }, []);

  const sendTestNotification = useCallback(() => {
    if (state.notificationPermission === 'granted') {
      const notification = new Notification('Test-Benachrichtigung', {
        body: 'Ihre Benachrichtigungen funktionieren perfekt! 🎉',
        icon: '/lovable-uploads/d9bb821b-b3c5-4a3f-b04f-703cf7c9863b.png',
        badge: '/lovable-uploads/d9bb821b-b3c5-4a3f-b04f-703cf7c9863b.png'
      });
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      toast.success('Test-Benachrichtigung gesendet');
    } else {
      toast.error('Benachrichtigungen sind nicht aktiviert');
    }
  }, [state.notificationPermission]);

  const getOfflineOrders = (): any[] => {
    try {
      const orders = localStorage.getItem('heidehof_offline_orders');
      return orders ? JSON.parse(orders) : [];
    } catch (error) {
      return [];
    }
  };

  const checkOfflineData = useCallback((): boolean => {
    const hasData = getOfflineOrders().length > 0;
    setState(prev => ({ ...prev, hasOfflineData: hasData }));
    return hasData;
  }, []);

  // Initialize PWA status
  useEffect(() => {
    const initializePWA = async () => {
      // Setup beforeinstallprompt listener
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        setState(prev => ({ ...prev, isInstallable: true }));
      });

      // Setup appinstalled listener
      window.addEventListener('appinstalled', () => {
        setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }));
        window.deferredPrompt = null;
      });

      // Check initial states
      setState(prev => ({
        ...prev,
        isInstalled: isPWAInstalled(),
        isInstallable: window.deferredPrompt !== null,
        isOnline: navigator.onLine,
        notificationPermission: 'Notification' in window ? Notification.permission : 'default',
        hasOfflineData: getOfflineOrders().length > 0,
      }));
    };

    initializePWA();
  }, []);

  // Listen for PWA events
  useEffect(() => {
    const handlePWAUpdate = () => {
      setState(prev => ({ ...prev, updateAvailable: true }));
    };

    window.addEventListener('pwa-update-available', handlePWAUpdate);

    return () => {
      window.removeEventListener('pwa-update-available', handlePWAUpdate);
    };
  }, []);

  // Network status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => {
        const newState = { ...prev, isOnline: true };
        if (prev.hasOfflineData) {
          syncOfflineData();
        }
        return newState;
      });
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData]);

  return {
    ...state,
    installPWA,
    enableNotifications,
    syncOfflineData,
    saveOfflineOrder,
    sendTestNotification,
    checkOfflineData
  };
};