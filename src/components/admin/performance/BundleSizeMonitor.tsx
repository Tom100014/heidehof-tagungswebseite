
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, FileText, Timer } from 'lucide-react';
import { bundleAnalyzer } from '@/services/bundle-optimization/bundle-analyzer';
import { resourcePreloader } from '@/services/bundle-optimization/resource-preloader';

const BundleSizeMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState(bundleAnalyzer.getPerformanceReport());
  const [preloadedCount, setPreloadedCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(bundleAnalyzer.getPerformanceReport());
      setPreloadedCount(resourcePreloader.getPreloadedCount());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getLoadTimeColor = (time: number) => {
    if (time < 100) return 'text-zinc-500';
    if (time < 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBundleSizeStatus = () => {
    const componentCount = Object.keys(metrics.loadTimes).length;
    if (componentCount < 10) return { color: 'bg-zinc-500', label: 'Optimal' };
    if (componentCount < 20) return { color: 'bg-yellow-500', label: 'Good' };
    return { color: 'bg-red-500', label: 'Needs Optimization' };
  };

  const status = getBundleSizeStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Bundle Performance Monitor
            <Badge className={status.color}>
              {status.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {Object.keys(metrics.loadTimes).length}
              </div>
              <div className="text-sm text-muted-foreground">Components Loaded</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getLoadTimeColor(metrics.totalLoadTime)}`}>
                {metrics.totalLoadTime.toFixed(0)}ms
              </div>
              <div className="text-sm text-muted-foreground">Total Load Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-zinc-500">
                {preloadedCount}
              </div>
              <div className="text-sm text-muted-foreground">Preloaded Resources</div>
            </div>
          </div>

          {/* Component Load Times */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Component Load Times
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {Object.entries(metrics.loadTimes).map(([component, time]) => (
                <div key={component} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm truncate">{component}</span>
                  <span className={`text-sm font-medium ${getLoadTimeColor(time)}`}>
                    {time.toFixed(1)}ms
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bundle Health Score */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bundle Health Score
            </h4>
            <Progress 
              value={Math.max(0, 100 - (metrics.totalLoadTime / 50))} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {metrics.totalLoadTime < 1000 
                ? 'Excellent performance - bundle is well optimized' 
                : metrics.totalLoadTime < 2000
                ? 'Good performance - minor optimizations possible'
                : 'Poor performance - bundle optimization needed'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BundleSizeMonitor;
