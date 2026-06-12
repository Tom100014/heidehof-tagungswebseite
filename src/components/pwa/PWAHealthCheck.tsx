
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  Shield,
  Zap,
  Globe,
  Smartphone,
  Bell,
  Database
} from 'lucide-react';
import { pwaSecurity } from '@/utils/pwa-security';

interface HealthCheckResult {
  category: string;
  icon: React.ElementType;
  status: 'success' | 'warning' | 'error';
  title: string;
  description: string;
  details?: string;
}

export const PWAHealthCheck = () => {
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [overallScore, setOverallScore] = useState(0);

  const runHealthCheck = async () => {
    setIsChecking(true);
    const results: HealthCheckResult[] = [];

    // 1. Security Check
    try {
      const securityValidation = await pwaSecurity.validatePWAReadiness();
      results.push({
        category: 'security',
        icon: Shield,
        status: securityValidation.isValid ? 'success' : 'error',
        title: 'Sicherheit',
        description: securityValidation.isValid ? 'Alle Sicherheitsstandards erfüllt' : 'Sicherheitsprobleme gefunden',
        details: securityValidation.errors.join(', ') || 'HTTPS aktiv, CSP konfiguriert'
      });
    } catch (error) {
      results.push({
        category: 'security',
        icon: Shield,
        status: 'error',
        title: 'Sicherheit',
        description: 'Sicherheitsprüfung fehlgeschlagen',
        details: 'Fehler bei der Sicherheitsprüfung'
      });
    }

    // 2. Service Worker Check
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        results.push({
          category: 'performance',
          icon: Zap,
          status: registration ? 'success' : 'warning',
          title: 'Service Worker',
          description: registration ? 'Service Worker aktiv' : 'Service Worker nicht registriert',
          details: registration ? `Status: ${registration.active?.state}` : 'Offline-Funktionen nicht verfügbar'
        });
      } catch (error) {
        results.push({
          category: 'performance',
          icon: Zap,
          status: 'error',
          title: 'Service Worker',
          description: 'Service Worker Fehler',
          details: 'Service Worker konnte nicht geladen werden'
        });
      }
    } else {
      results.push({
        category: 'performance',
        icon: Zap,
        status: 'error',
        title: 'Service Worker',
        description: 'Service Worker nicht unterstützt',
        details: 'Browser unterstützt keine Service Worker'
      });
    }

    // 3. Manifest Check
    try {
      const manifestResponse = await fetch('/manifest.json');
      const manifest = await manifestResponse.json();
      const hasRequiredFields = manifest.name && manifest.start_url && manifest.icons && manifest.icons.length > 0;
      
      results.push({
        category: 'installation',
        icon: Smartphone,
        status: hasRequiredFields ? 'success' : 'warning',
        title: 'Web App Manifest',
        description: hasRequiredFields ? 'Manifest vollständig' : 'Manifest unvollständig',
        details: hasRequiredFields ? `${manifest.icons.length} Icons, ${manifest.shortcuts?.length || 0} Shortcuts` : 'Fehlende Manifest-Felder'
      });
    } catch (error) {
      results.push({
        category: 'installation',
        icon: Smartphone,
        status: 'error',
        title: 'Web App Manifest',
        description: 'Manifest nicht gefunden',
        details: 'manifest.json konnte nicht geladen werden'
      });
    }

    // 4. Network Check
    const networkStatus = navigator.onLine ? 'success' : 'warning';
    results.push({
      category: 'connectivity',
      icon: Globe,
      status: networkStatus,
      title: 'Netzwerkverbindung',
      description: navigator.onLine ? 'Online' : 'Offline',
      details: navigator.onLine ? 'Internetverbindung aktiv' : 'Offline-Modus aktiv'
    });

    // 5. Notifications Check
    const notificationStatus = Notification.permission === 'granted' ? 'success' : 
                             Notification.permission === 'denied' ? 'error' : 'warning';
    results.push({
      category: 'notifications',
      icon: Bell,
      status: notificationStatus,
      title: 'Benachrichtigungen',
      description: Notification.permission === 'granted' ? 'Aktiviert' : 
                   Notification.permission === 'denied' ? 'Blockiert' : 'Nicht aktiviert',
      details: `Status: ${Notification.permission}`
    });

    // 6. Storage Check
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const storageEstimate = await navigator.storage.estimate();
        const usedMB = Math.round((storageEstimate.usage || 0) / (1024 * 1024));
        const quotaMB = Math.round((storageEstimate.quota || 0) / (1024 * 1024));
        
        results.push({
          category: 'storage',
          icon: Database,
          status: usedMB < quotaMB * 0.8 ? 'success' : 'warning',
          title: 'Speicher',
          description: `${usedMB} MB von ${quotaMB} MB verwendet`,
          details: `${Math.round((usedMB / quotaMB) * 100)}% des verfügbaren Speichers`
        });
      } catch (error) {
        results.push({
          category: 'storage',
          icon: Database,
          status: 'warning',
          title: 'Speicher',
          description: 'Speicher-Info nicht verfügbar',
          details: 'Storage API nicht unterstützt'
        });
      }
    } else {
      results.push({
        category: 'storage',
        icon: Database,
        status: 'warning',
        title: 'Speicher',
        description: 'Storage API nicht unterstützt',
        details: 'Browser unterstützt keine Storage-Schätzung'
      });
    }

    // Calculate overall score
    const successCount = results.filter(r => r.status === 'success').length;
    const score = Math.round((successCount / results.length) * 100);
    
    setHealthResults(results);
    setOverallScore(score);
    setIsChecking(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-zinc-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-zinc-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            PWA Gesundheitsprüfung
          </CardTitle>
          <Button 
            onClick={runHealthCheck}
            disabled={isChecking}
            size="sm"
            variant="outline"
          >
            {isChecking ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isChecking ? 'Prüfe...' : 'Erneut prüfen'}
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Gesamt-Score</span>
              <span className={`text-sm font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}%
              </span>
            </div>
            <Progress value={overallScore} className="h-2" />
          </div>
          <Badge 
            variant={overallScore >= 80 ? "default" : overallScore >= 60 ? "secondary" : "destructive"}
            className="text-sm"
          >
            {overallScore >= 80 ? 'Ausgezeichnet' : overallScore >= 60 ? 'Gut' : 'Verbesserung nötig'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <result.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{result.title}</span>
                </div>
                {getStatusIcon(result.status)}
              </div>
              
              <p className="text-sm text-muted-foreground">{result.description}</p>
              
              {result.details && (
                <p className="text-xs text-muted-foreground opacity-75">{result.details}</p>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Empfehlungen</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {overallScore < 100 && (
              <>
                {healthResults.some(r => r.status === 'error') && (
                  <li>• Beheben Sie kritische Fehler für optimale PWA-Funktionalität</li>
                )}
                {healthResults.some(r => r.category === 'notifications' && r.status !== 'success') && (
                  <li>• Aktivieren Sie Benachrichtigungen für bessere Nutzererfahrung</li>
                )}
                {healthResults.some(r => r.category === 'storage' && r.status === 'warning') && (
                  <li>• Überwachen Sie den Speicherverbrauch regelmäßig</li>
                )}
              </>
            )}
            {overallScore >= 80 && (
              <li>• Ihre PWA ist optimal konfiguriert und einsatzbereit!</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
