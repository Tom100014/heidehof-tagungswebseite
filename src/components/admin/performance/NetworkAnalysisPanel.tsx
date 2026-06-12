import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Globe, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface NetworkStats {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
}

interface NetworkAnalysisPanelProps {
  networkStats: NetworkStats;
}

const NetworkAnalysisPanel: React.FC<NetworkAnalysisPanelProps> = ({ networkStats }) => {
  const getResponseTimeStatus = (time: number) => {
    if (time < 200) return { status: 'excellent', color: 'green', progress: 100 };
    if (time < 500) return { status: 'good', color: 'blue', progress: 80 };
    if (time < 1000) return { status: 'fair', color: 'yellow', progress: 60 };
    return { status: 'poor', color: 'red', progress: 30 };
  };

  const getErrorRateStatus = (rate: number) => {
    if (rate < 1) return { status: 'excellent', color: 'green', progress: 100 };
    if (rate < 3) return { status: 'good', color: 'yellow', progress: 70 };
    return { status: 'poor', color: 'red', progress: 30 };
  };

  const getCacheHitStatus = (rate: number) => {
    if (rate > 80) return { status: 'excellent', color: 'green', progress: 100 };
    if (rate > 60) return { status: 'good', color: 'blue', progress: 80 };
    if (rate > 40) return { status: 'fair', color: 'yellow', progress: 60 };
    return { status: 'poor', color: 'red', progress: 30 };
  };

  const responseTimeStatus = getResponseTimeStatus(networkStats.averageResponseTime);
  const errorRateStatus = getErrorRateStatus(networkStats.errorRate);
  const cacheHitStatus = getCacheHitStatus(networkStats.cacheHitRate);

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Requests Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStats.requestCount}</div>
            <p className="text-xs text-muted-foreground">
              Aktuelle Session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg. Response Zeit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networkStats.averageResponseTime.toFixed(0)}ms
            </div>
            <Progress value={responseTimeStatus.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networkStats.errorRate.toFixed(1)}%
            </div>
            <Progress value={errorRateStatus.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networkStats.cacheHitRate.toFixed(1)}%
            </div>
            <Progress value={cacheHitStatus.progress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Netzwerk Performance Analyse</CardTitle>
            <CardDescription>
              Detaillierte Bewertung der Netzwerk-Metriken
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Response Zeit</span>
                <Badge variant={
                  responseTimeStatus.status === 'excellent' ? 'default' :
                  responseTimeStatus.status === 'good' ? 'secondary' :
                  responseTimeStatus.status === 'fair' ? 'outline' : 'destructive'
                }>
                  {responseTimeStatus.status === 'excellent' ? 'Ausgezeichnet' :
                   responseTimeStatus.status === 'good' ? 'Gut' :
                   responseTimeStatus.status === 'fair' ? 'Durchschnitt' : 'Schlecht'}
                </Badge>
              </div>
              <Progress value={responseTimeStatus.progress} />
              <p className="text-xs text-muted-foreground">
                Ziel: &lt; 200ms für optimale Performance
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Fehlerrate</span>
                <Badge variant={
                  errorRateStatus.status === 'excellent' ? 'default' :
                  errorRateStatus.status === 'good' ? 'secondary' : 'destructive'
                }>
                  {errorRateStatus.status === 'excellent' ? 'Ausgezeichnet' :
                   errorRateStatus.status === 'good' ? 'Gut' : 'Verbesserung nötig'}
                </Badge>
              </div>
              <Progress value={errorRateStatus.progress} />
              <p className="text-xs text-muted-foreground">
                Ziel: &lt; 1% für stabile Performance
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Effizienz</span>
                <Badge variant={
                  cacheHitStatus.status === 'excellent' ? 'default' :
                  cacheHitStatus.status === 'good' ? 'secondary' :
                  cacheHitStatus.status === 'fair' ? 'outline' : 'destructive'
                }>
                  {cacheHitStatus.status === 'excellent' ? 'Ausgezeichnet' :
                   cacheHitStatus.status === 'good' ? 'Gut' :
                   cacheHitStatus.status === 'fair' ? 'Durchschnitt' : 'Schlecht'}
                </Badge>
              </div>
              <Progress value={cacheHitStatus.progress} />
              <p className="text-xs text-muted-foreground">
                Ziel: &gt; 80% für optimale Cache-Nutzung
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimierungs-Empfehlungen</CardTitle>
            <CardDescription>
              Automatische Vorschläge zur Performance-Verbesserung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {networkStats.averageResponseTime > 500 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Langsame API Responses</p>
                  <p className="text-muted-foreground">
                    Überprüfen Sie API-Endpoints und Datenbankabfragen
                  </p>
                </div>
              </div>
            )}

            {networkStats.errorRate > 3 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Hohe Fehlerrate</p>
                  <p className="text-muted-foreground">
                    Implementieren Sie bessere Error-Handling und Retry-Logic
                  </p>
                </div>
              </div>
            )}

            {networkStats.cacheHitRate < 60 && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Cache-Optimierung möglich</p>
                  <p className="text-muted-foreground">
                    Implementieren Sie aggressiveres Caching für statische Ressourcen
                  </p>
                </div>
              </div>
            )}

            {networkStats.averageResponseTime <= 200 && 
             networkStats.errorRate <= 1 && 
             networkStats.cacheHitRate >= 80 && (
              <div className="flex items-start gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg">
                <CheckCircle className="h-4 w-4 text-zinc-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Optimale Performance!</p>
                  <p className="text-muted-foreground">
                    Alle Netzwerk-Metriken sind im grünen Bereich
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkAnalysisPanel;