import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X, Download } from 'lucide-react';
import { toast } from 'sonner';

export const PWAUpdateBanner = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = async () => {
    setInstalling(true);
    try {
      // Skip waiting for the new service worker to take control
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      
      // Reload the page to apply updates
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      toast.success('Update wird installiert...');
    } catch (error) {
      toast.error('Update fehlgeschlagen');
      setInstalling(false);
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[70] md:top-4 md:right-4 md:left-auto md:max-w-md">
      <Card className="bg-gradient-to-r from-blue-500/90 to-blue-600/90 backdrop-blur-md border-blue-400/30 shadow-lg text-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                App-Update verfügbar
              </h3>
              <p className="text-xs opacity-90 mb-3 leading-relaxed">
                Eine neue Version der Heidehof App ist verfügbar. Jetzt aktualisieren für die neuesten Features und Verbesserungen.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpdate}
                  disabled={installing}
                  size="sm" 
                  className="flex-1 h-8 text-xs bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  {installing ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  {installing ? 'Installiert...' : 'Jetzt aktualisieren'}
                </Button>
                <Button 
                  onClick={dismissUpdate}
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-2 text-white hover:bg-white/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAUpdateBanner;