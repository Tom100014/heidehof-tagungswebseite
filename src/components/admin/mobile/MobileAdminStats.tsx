import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: 'default' | 'success' | 'warning' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface MobileAdminStatsProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const MobileAdminStats: React.FC<MobileAdminStatsProps> = ({
  stats,
  columns = 2,
  className
}) => {
  const getColorClasses = (color: StatItem['color']) => {
    switch (color) {
      case 'success':
        return 'text-zinc-600 dark:text-zinc-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className={cn(
      "grid gap-3",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-3",
      columns === 4 && "grid-cols-2 sm:grid-cols-4",
      className
    )}>
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card/50">
          <CardContent className="p-4 text-center space-y-2">
            {stat.icon && (
              <div className="flex justify-center">
                <stat.icon className={cn("h-5 w-5", getColorClasses(stat.color))} />
              </div>
            )}
            <div>
              <div className={cn("text-2xl font-bold", getColorClasses(stat.color))}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground leading-tight">
                {stat.label}
              </div>
              {stat.trend && (
                <div className={cn(
                  "text-xs mt-1",
                  stat.trend.isPositive ? "text-zinc-600" : "text-red-600"
                )}>
                  {stat.trend.isPositive ? "↗" : "↘"} {Math.abs(stat.trend.value)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};