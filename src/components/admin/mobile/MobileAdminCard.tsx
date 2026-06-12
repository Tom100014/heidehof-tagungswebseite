import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MobileAdminCardProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  actions?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'default' | 'outline' | 'ghost';
  }[];
  children?: React.ReactNode;
  className?: string;
  priority?: boolean;
}

export const MobileAdminCard: React.FC<MobileAdminCardProps> = ({
  title,
  subtitle,
  badge,
  actions = [],
  children,
  className,
  priority = false
}) => {
  return (
    <Card className={cn(
      "mobile-touch-target w-full",
      priority && "border-primary/50 bg-primary/5",
      className
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base leading-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          {badge && (
            <Badge variant={badge.variant || 'default'} className="shrink-0">
              {badge.text}
            </Badge>
          )}
        </div>

        {/* Content */}
        {children && (
          <div className="space-y-2">
            {children}
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                className="mobile-touch-target flex-1 min-w-0"
              >
                {action.icon && <action.icon className="h-4 w-4 mr-2 shrink-0" />}
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};