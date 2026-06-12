import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Smartphone, X, WifiOff, Shield, Zap, Star } from 'lucide-react';
import { usePWA } from '@/components/pwa/PWAContext';
import { toast } from 'sonner';
import hexagonBg from '@/assets/hexagon-bg.jpeg';

export const PWAUnifiedPopup = () => {
  const pwa = usePWA();
  const [currentPopup, setCurrentPopup] = useState<'none' | 'update' | 'install' | 'offline'>('none');
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Priority: Update > Offline > Install
    if (pwa.updateAvailable) {
      setCurrentPopup('update');
    } else if (!pwa.isOnline) {
      setCurrentPopup('offline');
    } else {
      setCurrentPopup('none');
    }
  }, [pwa.updateAvailable, pwa.isOnline, pwa.isInstallable, pwa.isInstalled]);

  const handleUpdate = async () => {
    setInstalling(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        toast.success('App wird aktualisiert...');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      toast.error('Update fehlgeschlagen');
      setInstalling(false);
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    
    // Check device type
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      // Show iOS specific instructions
      toast.info('Für iOS: Tippen Sie auf das Teilen-Symbol (↗️) unten und wählen Sie "Zum Home-Bildschirm"', {
        duration: 8000
      });
      setInstalling(false);
      return;
    }
    
    if (isAndroid) {
      // Try native Android installation first
      const success = await pwa.installPWA();
      if (!success) {
        // Fallback instructions for Android
        toast.info('Für Android: Tippen Sie auf die 3 Punkte (⋮) im Browser-Menü und wählen Sie "App installieren"', {
          duration: 8000
        });
      }
      setInstalling(false);
      return;
    }
    
    // Desktop/other devices
    const success = await pwa.installPWA();
    if (success) {
      setCurrentPopup('none');
    }
    setInstalling(false);
  };

  const dismissPopup = () => {
    if (currentPopup === 'install') {
      sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    }
    setCurrentPopup('none');
  };

  if (currentPopup === 'none') return null;

  const renderPopupContent = () => {
    switch (currentPopup) {
      case 'update':
        return (
          <Card className="bg-card/95 backdrop-blur-md border-border shadow-2xl max-w-md mx-auto">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-foreground">Neues Update verfügbar</h3>
                  <p className="text-sm text-muted-foreground">Version 2.1.0</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-zinc-500" />
                  <span>Verbesserte Performance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>Erweiterte Sicherheit</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Neue Features</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleUpdate}
                  disabled={installing}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {installing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Wird installiert...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Jetzt aktualisieren
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={dismissPopup}
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'install':
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        return (
          <Card className="bg-background/98 backdrop-blur-xl border-gold/10 shadow-2xl max-w-sm mx-auto rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-gold/5 to-gold-dark/5 p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-2xl flex items-center justify-center shadow-lg">
                    <Download className="w-8 h-8 text-background" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-foreground">App installieren</h3>
                    <p className="text-sm text-gold font-medium">Hotel der Heidehof</p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4">
                {/* iOS specific hint with Apple icon */}
                {isIOS && (
                  <div className="bg-blue-500/8 border border-blue-500/15 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7,10 12,15 17,10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                          Installation für iOS
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                          1. Tippen Sie auf <span className="font-semibold">Teilen</span> unten<br/>
                          2. Wählen Sie <span className="font-semibold">"Zum Home-Bildschirm"</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Benefits - Clean minimal design */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-500/8 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-zinc-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Schneller Zugriff</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/8 rounded-xl flex items-center justify-center">
                      <WifiOff className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Offline verfügbar</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/8 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-foreground">100% sicher</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleInstall}
                    disabled={installing}
                    className="w-full bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-background font-semibold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] min-h-[52px] animate-fade-in"
                  >
                    {installing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin mr-3" />
                        {isIOS ? 'Anleitung...' : 'Installiert...'}
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-3" />
                        {isIOS ? 'Anleitung anzeigen' : 'Jetzt installieren'}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={dismissPopup}
                    className="w-full text-muted-foreground hover:text-foreground py-3 text-sm font-medium"
                  >
                    Vielleicht später
                  </Button>
                </div>

                {/* Trust indicator */}
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/50">
                  <Shield className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-muted-foreground font-medium">Kostenlos & vertrauenswürdig</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'offline':
        return (
          <Card className="bg-card/95 backdrop-blur-md border-border shadow-2xl max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="mx-auto p-3 bg-amber-100 dark:bg-amber-900/20 rounded-full w-fit mb-4">
                <WifiOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">Offline Modus</h3>
              <p className="text-muted-foreground mb-4">
                Keine Internetverbindung. Die App funktioniert weiterhin offline.
              </p>
              <Button 
                variant="outline" 
                onClick={dismissPopup}
                className="w-full"
              >
                Verstanden
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] backdrop-blur-sm bg-black/60"
        onClick={dismissPopup} 
      />
      
      {/* Popup Container - Positioned at bottom right for mobile, center for larger screens */}
      <div className="fixed z-[101] pointer-events-none">
        <div className="md:fixed md:inset-0 md:flex md:items-center md:justify-center md:p-4
                        fixed bottom-20 right-4 left-4 md:relative md:bottom-auto md:right-auto md:left-auto">
          <div className="pointer-events-auto animate-in fade-in-0 slide-in-from-bottom-3 md:zoom-in-95 duration-300">
            {renderPopupContent()}
          </div>
        </div>
      </div>
    </>
  );
};
