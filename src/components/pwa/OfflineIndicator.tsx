import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, Wifi, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      
      // Check for pending offline data
      const offlineOrders = localStorage.getItem('heidehof_offline_orders');
      if (offlineOrders) {
        setPendingSync(true);
        // Auto-sync after coming back online
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('sync-offline-data'));
          setPendingSync(false);
        }, 2000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
    };

    const handleSyncStart = () => setPendingSync(true);
    const handleSyncComplete = () => setPendingSync(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-start', handleSyncStart);
    window.addEventListener('sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-start', handleSyncStart);
      window.removeEventListener('sync-complete', handleSyncComplete);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  // Show online indicator with sync status
  if (isOnline && !showOfflineMessage) {
    return pendingSync ? (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[65]">
        <Card className="bg-blue-500/90 backdrop-blur-md border-blue-400/30 shadow-lg text-white">
          <CardContent className="px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Daten werden synchronisiert...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    ) : null;
  }

  // Show offline indicator
  if (!isOnline || showOfflineMessage) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[65] md:bottom-4 md:left-1/2 md:transform md:-translate-x-1/2 md:w-96">
        <Card className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-md border-amber-400/30 shadow-lg text-white">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  {isOnline ? <CloudOff className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">
                  {isOnline ? 'Verbindung unterbrochen' : 'Offline-Modus'}
                </h3>
                <p className="text-xs opacity-90 mb-3 leading-relaxed">
                  {isOnline 
                    ? 'Die Verbindung zum Server wurde unterbrochen. Ihre Daten werden automatisch synchronisiert, sobald die Verbindung wiederhergestellt ist.'
                    : 'Sie sind offline. Die App funktioniert weiterhin und synchronisiert Ihre Daten automatisch, sobald eine Internetverbindung verfügbar ist.'
                  }
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1 text-xs">
                    <Cloud className="w-3 h-3" />
                    Offline verfügbar
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <RefreshCw className="w-3 h-3" />
                    Auto-Sync aktiv
                  </div>
                </div>
                
                <Button 
                  onClick={handleRetry}
                  size="sm" 
                  className="h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Erneut versuchen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;