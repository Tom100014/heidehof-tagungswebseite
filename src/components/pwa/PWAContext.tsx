import React, { createContext, useContext } from 'react';

export interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  notificationPermission: NotificationPermission;
  hasOfflineData: boolean;
  syncInProgress: boolean;
  installPWA: () => Promise<boolean>;
  enableNotifications: () => Promise<boolean>;
  syncOfflineData: () => Promise<void>;
  saveOfflineOrder: (orderData: any) => void;
  sendTestNotification: () => void;
  checkOfflineData: () => boolean;
}

export const PWAContext = createContext<PWAContextType | null>(null);

export const defaultPWAContext: PWAContextType = {
  isInstalled: false,
  isInstallable: false,
  isOnline: true,
  updateAvailable: false,
  notificationPermission: 'default',
  hasOfflineData: false,
  syncInProgress: false,
  installPWA: async () => false,
  enableNotifications: async () => false,
  syncOfflineData: async () => {},
  saveOfflineOrder: () => {},
  sendTestNotification: () => {},
  checkOfflineData: () => false,
};

export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    if (typeof window !== 'undefined') {
      console.warn('usePWA called outside of PWAProvider - using fallback context');
    }
    return defaultPWAContext;
  }
  return context;
};
