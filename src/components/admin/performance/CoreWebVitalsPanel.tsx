import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Cpu, Eye, Globe, AlertCircle, CheckCircle } from 'lucide-react';

interface CoreWebVitals {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
}

interface CoreWebVitalsPanelProps {
  vitals: CoreWebVitals;
}

const CoreWebVitalsPanel: React.FC<CoreWebVitalsPanelProps> = ({ vitals }) => {
  const getScoreStatus = (metric: string, value: number | null) => {
    if (value === null) return { status: 'loading', color: 'gray', progress: 0 };
    
    switch (metric) {
      case 'lcp':
        if (value < 2500) return { status: 'good', color: 'green', progress: 100 };
        if (value < 4000) return { status: 'needs-improvement', color: 'yellow', progress: 60 };
        return { status: 'poor', color: 'red', progress: 20 };
      
      case 'fid':
        if (value < 100) return { status: 'good', color: 'green', progress: 100 };
        if (value < 300) return { status: 'needs-improvement', color: 'yellow', progress: 60 };
        return { status: 'poor', color: 'red', progress: 20 };
      
      case 'cls':
        if (value < 0.1) return { status: 'good', color: 'green', progress: 100 };
        if (value < 0.25) return { status: 'needs-improvement', color: 'yellow', progress: 60 };
        return { status: 'poor', color: 'red', progress: 20 };
      
      case 'ttfb':
        if (value < 800) return { status: 'good', color: 'green', progress: 100 };
        if (value < 1800) return { status: 'needs-improvement', color: 'yellow', progress: 60 };
        return { status: 'poor', color: 'red', progress: 20 };
      
      default:
        return { status: 'loading', color: 'gray', progress: 0 };
    }
  };

  const formatValue = (metric: string, value: number | null) => {
    if (value === null) return 'Laden...';
    
    switch (metric) {
      case 'cls':
        return value.toFixed(3);
      default:
        return `${Math.round(value)}ms`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-zinc-600" />;
      case 'needs-improvement':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'poor':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const vitalsConfig = [
    {
      key: 'lcp',
      title: 'Largest Contentful Paint (LCP)',
      description: 'Zeit bis zum größten sichtbaren Element',
      icon: <Globe className="h-8 w-8" />,
      value: vitals.lcp,
      thresholds: { good: '< 2.5s', needsWork: '2.5s - 4.0s', poor: '> 4.0s' }
    },
    {
      key: 'fid',
      title: 'First Input Delay (FID)',
      description: 'Verzögerung der ersten Benutzerinteraktion',
      icon: <Cpu className="h-8 w-8" />,
      value: vitals.fid,
      thresholds: { good: '< 100ms', needsWork: '100ms - 300ms', poor: '> 300ms' }
    },
    {
      key: 'cls',
      title: 'Cumulative Layout Shift (CLS)',
      description: 'Kumulative Layout-Verschiebung',
      icon: <Eye className="h-8 w-8" />,
      value: vitals.cls,
      thresholds: { good: '< 0.1', needsWork: '0.1 - 0.25', poor: '> 0.25' }
    },
    {
      key: 'ttfb',
      title: 'Time to First Byte (TTFB)',
      description: 'Zeit bis zum ersten empfangenen Byte',
      icon: <Clock className="h-8 w-8" />,
      value: vitals.ttfb,
      thresholds: { good: '< 800ms', needsWork: '800ms - 1.8s', poor: '> 1.8s' }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {vitalsConfig.map((vital) => {
        const scoreStatus = getScoreStatus(vital.key, vital.value);
        
        return (
          <Card key={vital.key} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    {vital.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{vital.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {vital.description}
                    </CardDescription>
                  </div>
                </div>
                {getStatusIcon(scoreStatus.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Current Value */}
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {formatValue(vital.key, vital.value)}
                </div>
                <Progress 
                  value={scoreStatus.progress} 
                  className="mt-2"
                />
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <Badge 
                  variant={
                    scoreStatus.status === 'good' ? 'default' : 
                    scoreStatus.status === 'needs-improvement' ? 'secondary' : 
                    'destructive'
                  }
                >
                  {scoreStatus.status === 'good' ? 'Gut' : 
                   scoreStatus.status === 'needs-improvement' ? 'Verbesserung nötig' : 
                   scoreStatus.status === 'poor' ? 'Schlecht' : 'Laden...'}
                </Badge>
              </div>

              {/* Thresholds */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Gut:</span>
                  <span className="text-zinc-600">{vital.thresholds.good}</span>
                </div>
                <div className="flex justify-between">
                  <span>Verbesserung:</span>
                  <span className="text-yellow-600">{vital.thresholds.needsWork}</span>
                </div>
                <div className="flex justify-between">
                  <span>Schlecht:</span>
                  <span className="text-red-600">{vital.thresholds.poor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CoreWebVitalsPanel;