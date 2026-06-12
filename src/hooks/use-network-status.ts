
import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api/supabase-api';
import { toast } from 'sonner';

/**
 * Hook zur Überwachung des Online-/Offline-Status und Synchronisierung von Offline-Anfragen
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    // Event-Handler für Online-/Offline-Status
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Die Verbindung wurde wiederhergestellt");
      synchronizeOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Sie sind offline. Änderungen werden gespeichert und später synchronisiert.");
    };
    
    // Event-Listener registrieren
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Bereinigen beim Unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  /**
   * Synchronisiert Offline-Daten, wenn die Verbindung wieder hergestellt ist
   */
  const synchronizeOfflineData = async () => {
    if (isOnline && !isSyncing) {
      setIsSyncing(true);
      try {
        await apiService.processPendingOfflineRequests();
      } catch (error) {
        console.error("Fehler bei der Synchronisierung von Offline-Daten:", error);
      } finally {
        setIsSyncing(false);
      }
    }
  };
  
  return { isOnline, isSyncing, synchronizeOfflineData };
};
