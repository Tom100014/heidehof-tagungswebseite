import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { LightweightChart } from './LightweightChart';

interface PerformanceData {
  timestamp: number;
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  memoryUsage?: number;
  errorCount: number;
}

interface PerformanceChartProps {
  data: PerformanceData;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  // Real historical performance data from browser APIs
  const historicalData = React.useMemo(() => {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    
    if (entries.length === 0) return [];
    
    const navigation = entries[0];
    return [{
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      value: navigation.loadEventEnd - navigation.fetchStart,
    }];
  }, []);

  const currentMetrics = [
    {
      name: 'Page Load',
      value: data.pageLoadTime,
      color: '#C0A080',
    },
    {
      name: 'DOM Ready',
      value: data.domContentLoaded,
      color: '#A88B6C',
    },
    {
      name: 'First Paint',
      value: data.firstPaint,
      color: '#D9C4B1',
    },
    {
      name: 'FCP',
      value: data.firstContentfulPaint,
      color: '#C0A080',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Performance Metrics - Lightweight Bar Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Aktuelle Performance Metriken
          </CardTitle>
          <CardDescription>
            Performance-Zeiten in Millisekunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentMetrics.map((metric) => (
              <div key={metric.name} className="text-center">
                <div 
                  className="w-full h-16 rounded mb-2 flex items-end justify-center relative"
                  style={{ backgroundColor: `${metric.color}20` }}
                >
                  <div 
                    className="rounded-t w-6 transition-all duration-300"
                    style={{ 
                      backgroundColor: metric.color,
                      height: `${Math.max(10, Math.min(100, (metric.value / 3000) * 100))}%`,
                      minHeight: '6px'
                    }}
                  />
                </div>
                <div className="text-sm font-medium">{metric.name}</div>
                <div className="text-xs text-muted-foreground">
                  {metric.value?.toFixed(0)}ms
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historical Performance Data */}
      {historicalData.length > 0 ? (
        <LightweightChart
          title="Performance-Trend"
          data={historicalData}
          color="#C0A080"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Performance-Daten</CardTitle>
            <CardDescription>
              Keine historischen Daten verfügbar - Metriken werden in Echtzeit gesammelt
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Performance-Daten werden gesammelt...</p>
              <p className="text-sm mt-2">Navigieren Sie durch die App, um Metriken zu generieren</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PerformanceChart;