import React from 'react';
import { cn } from '@/lib/utils';
import { MobileAdminCard } from './MobileAdminCard';

interface MobileAdminListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  itemClassName?: string;
}

export function MobileAdminList<T>({
  items,
  renderItem,
  loading = false,
  emptyMessage = "Keine Einträge gefunden",
  emptyIcon,
  className,
  itemClassName
}: MobileAdminListProps<T>) {
  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-24 bg-muted/30 rounded-lg animate-pulse",
              itemClassName
            )}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        {emptyIcon && (
          <div className="flex justify-center mb-4 text-muted-foreground">
            {emptyIcon}
          </div>
        )}
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <div key={index} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}