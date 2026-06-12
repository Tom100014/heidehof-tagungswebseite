import React from 'react';
import { Order } from '@/types/order';
import { X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewOrderNotificationProps {
  order: Order | null;
  isVisible: boolean;
  onClose: () => void;
}

export const NewOrderNotification: React.FC<NewOrderNotificationProps> = ({
  order,
  isVisible,
  onClose,
}) => {
  if (!isVisible || !order) return null;

  const getDepartmentColor = () => {
    switch (order.department) {
      case 'restaurant':
        return 'bg-orange-500';
      case 'beauty':
        return 'bg-purple-500';
      case 'shop':
        return 'bg-zinc-500';
      case 'bar_max':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getDepartmentLabel = () => {
    switch (order.department) {
      case 'restaurant':
        return 'Restaurant';
      case 'beauty':
        return 'Beauty';
      case 'shop':
        return 'Shop';
      case 'bar_max':
        return 'Bar Mäx';
      default:
        return 'Service';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5 duration-300">
      <div className="bg-card border-2 border-primary text-card-foreground rounded-lg shadow-2xl p-4 max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getDepartmentColor()} animate-pulse`} />
            <Bell className="w-5 h-5 text-primary animate-bounce" />
            <span className="font-semibold text-foreground">Neue Bestellung!</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Benachrichtigung schließen"
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Kunde:</span>
            <span className="text-sm font-semibold text-foreground">{order.customer_name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Department:</span>
            <span
              className={`text-sm font-semibold px-2 py-1 rounded-full text-primary-foreground ${getDepartmentColor()}`}
            >
              {getDepartmentLabel()}
            </span>
          </div>

          {order.room_number && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Zimmer:</span>
              <span className="text-sm font-semibold text-foreground">{order.room_number}</span>
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {typeof order.items === 'string' ? order.items : 'Neue Bestellung eingegangen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
