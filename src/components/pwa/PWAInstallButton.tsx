
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Smartphone, X, Wifi, WifiOff, CheckCircle, Clock } from 'lucide-react';
import { usePWA } from '@/components/pwa/PWAContext';
import { toast } from 'sonner';

export const PWAInstallButton = () => {
  const pwa = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Only show if installable and not installed and not dismissed
    if (pwa.isInstallable && !pwa.isInstalled && !sessionStorage.getItem('pwa-prompt-dismissed') && !localStorage.getItem('pwa-prompt-permanently-dismissed')) {
      // Much longer delay to avoid being intrusive - show after 30 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
      
      return () => clearTimeout(timer);
    }

    if (pwa.updateAvailable) {
      toast.info('App-Update verfügbar', {
        action: {
          label: 'Neu laden',
          onClick: () => window.location.reload()
        },
        duration: 10000
      });
    }
  }, [pwa.isInstallable, pwa.isInstalled, pwa.updateAvailable]);

  const handleInstall = async () => {
    const success = await pwa.installPWA();
    if (success) {
      setShowPrompt(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Don't show again permanently
    localStorage.setItem('pwa-prompt-permanently-dismissed', 'true');
  };

  // Don't show if already installed, dismissed, or not ready
  if (pwa.isInstalled || !pwa.isInstallable || !showPrompt || localStorage.getItem('pwa-prompt-permanently-dismissed')) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[60] md:bottom-4 md:right-4">
      <Card className="bg-card/90 backdrop-blur-sm border-muted/30 shadow-sm max-w-xs">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-3 h-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                App verfügbar
              </p>
            </div>
            <div className="flex gap-1">
              <Button 
                onClick={handleInstall}
                size="sm" 
                variant="outline"
                className="h-6 px-2 text-xs"
              >
                <Download className="w-2 h-2 mr-1" />
                App
              </Button>
              <Button 
                onClick={dismissPrompt}
                variant="ghost" 
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="w-2 h-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallButton;
