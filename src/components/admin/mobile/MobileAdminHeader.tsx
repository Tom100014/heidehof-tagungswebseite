import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon, Plus, Filter, Search } from 'lucide-react';

interface MobileAdminHeaderProps {
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
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterable?: boolean;
  onFilterClick?: () => void;
  className?: string;
}

export const MobileAdminHeader: React.FC<MobileAdminHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions = [],
  searchable = false,
  searchValue = '',
  onSearchChange,
  filterable = false,
  onFilterClick,
  className
}) => {
  return (
    <div className={cn("space-y-4 mb-6", className)}>
      {/* Title and Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif font-bold text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
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

      {/* Search and Filter */}
      {(searchable || filterable) && (
        <div className="flex gap-2">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-base rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
          {filterable && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onFilterClick}
              className="shrink-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="mobile-touch-target flex-1"
            >
              {action.icon && <action.icon className="h-4 w-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};