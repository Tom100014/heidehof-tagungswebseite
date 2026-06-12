import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Download, 
  Wifi, 
  Zap, 
  Shield, 
  Smartphone,
  CheckCircle,
  Settings,
  Vibrate
} from 'lucide-react';
import { usePWA } from '@/components/pwa/PWAContext';
import { useWebPush } from '@/hooks/use-web-push';
import { toast } from 'sonner';

export const PWAFeatures = () => {
  const pwa = usePWA();
  const webPush = useWebPush();
  const [features, setFeatures] = useState({
    offline: true,
    notifications: webPush.isSubscribed && webPush.permission === 'granted',
    backgroundSync: true,
    installable: pwa.isInstallable
  });

  useEffect(() => {
    setFeatures(prev => ({
      ...prev,
      notifications: webPush.isSubscribed && webPush.permission === 'granted',
      installable: pwa.isInstallable
    }));
  }, [webPush.isSubscribed, webPush.permission, pwa.isInstallable]);

  const handleEnableNotifications = async () => {
    const success = await webPush.subscribe();
    if (success) {
      toast.success('🔔 Push-Benachrichtigungen aktiviert!');
    } else {
      toast.error('❌ Aktivierung fehlgeschlagen');
    }
  };

  const testNotification = async () => {
    const success = await webPush.sendTestNotification();
    if (success) {
      toast.success('📱 Test-Benachrichtigung gesendet!');
    } else {
      toast.error('❌ Test fehlgeschlagen');
    }
  };

  const featureList = [
    {
      icon: Wifi,
      title: 'Offline verfügbar',
      description: 'Funktioniert auch ohne Internetverbindung',
      status: features.offline,
      statusColor: 'bg-zinc-500'
    },
    {
      icon: Bell,
      title: 'Push-Benachrichtigungen',
      description: 'Erhalten Sie wichtige Updates sofort',
      status: features.notifications,
      statusColor: features.notifications ? 'bg-zinc-500' : 'bg-gray-400',
      action: !features.notifications && pwa.notificationPermission !== 'denied'
    },
    {
      icon: Zap,
      title: 'Schnelle Performance',
      description: 'Native App-ähnliche Geschwindigkeit',
      status: true,
      statusColor: 'bg-zinc-500'
    },
    {
      icon: Shield,
      title: 'Sicher & Privat',
      description: 'HTTPS und lokale Datenspeicherung',
      status: true,
      statusColor: 'bg-zinc-500'
    },
    {
      icon: Download,
      title: 'Auto-Updates',
      description: 'Automatische Updates im Hintergrund',
      status: true,
      statusColor: 'bg-zinc-500'
    },
    {
      icon: Smartphone,
      title: 'App-ähnlich',
      description: 'Vollbild-Modus ohne Browser-Interface',
      status: pwa.isInstalled,
      statusColor: pwa.isInstalled ? 'bg-zinc-500' : 'bg-gray-400'
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary" />
          PWA Features
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Entdecken Sie die erweiterten Funktionen der Heidehof Web-App
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {featureList.map((feature, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <feature.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={feature.status ? "default" : "secondary"}
                className={`text-xs ${feature.status ? 'bg-zinc-500/10 text-zinc-700 border-zinc-200' : ''}`}
              >
                {feature.status ? (
                  <><CheckCircle className="w-3 h-3 mr-1" /> Aktiv</>
                ) : (
                  'Inaktiv'
                )}
              </Badge>
              
              {feature.action && (
                <Button 
                  onClick={feature.title === 'Push-Benachrichtigungen' ? handleEnableNotifications : undefined}
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs"
                >
                  Aktivieren
                </Button>
              )}
            </div>
          </div>
        ))}

        {features.notifications && (
          <div className="mt-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-zinc-600" />
                <span className="text-sm font-medium text-zinc-700">
                  Push-Benachrichtigungen aktiv
                </span>
              </div>
              <Button 
                onClick={testNotification}
                size="sm" 
                variant="outline"
                className="h-7 text-xs border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                title="Test-Push-Benachrichtigung senden"
              >
                <Bell className="w-3 h-3 mr-1" />
                Test-Push
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            PWA-Status
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Installation:</span>
              <span className={`ml-2 font-medium ${pwa.isInstalled ? 'text-zinc-600' : 'text-amber-600'}`}>
                {pwa.isInstalled ? 'Installiert' : 'Browser-Version'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Benachrichtigungen:</span>
              <span className={`ml-2 font-medium ${features.notifications ? 'text-zinc-600' : 'text-gray-600'}`}>
                {pwa.notificationPermission === 'granted' ? 'Erlaubt' : 
                 pwa.notificationPermission === 'denied' ? 'Blockiert' : 'Nicht aktiviert'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PWAFeatures;