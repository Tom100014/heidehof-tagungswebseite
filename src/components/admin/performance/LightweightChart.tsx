import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartDataPoint {
  time: string;
  value: number;
}

interface LightweightChartProps {
  title: string;
  data: ChartDataPoint[];
  color?: string;
}

// Ultra-lightweight chart component replacing Recharts for better performance
export const LightweightChart = memo(({ title, data, color = '#C0A080' }: LightweightChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  const getBarHeight = (value: number) => {
    if (range === 0) return 50;
    return Math.max(10, ((value - minValue) / range) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-32 gap-1">
          {data.slice(-12).map((point, index) => (
            <div 
              key={index}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <div 
                className="w-full rounded-t transition-all duration-300 ease-out"
                style={{
                  height: `${getBarHeight(point.value)}%`,
                  backgroundColor: color,
                  minHeight: '4px'
                }}
              />
              <span className="text-xs text-muted-foreground rotate-45 origin-bottom-left">
                {point.time}
              </span>
            </div>
          ))}
        </div>
        {data.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Latest: {data[data.length - 1]?.value.toFixed(2)}ms
          </div>
        )}
      </CardContent>
    </Card>
  );
});

LightweightChart.displayName = 'LightweightChart';