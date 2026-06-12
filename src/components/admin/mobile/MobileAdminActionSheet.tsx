import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'default' | 'destructive' | 'ghost';
  disabled?: boolean;
}

interface MobileAdminActionSheetProps {
  title: string;
  actions: ActionItem[];
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const MobileAdminActionSheet: React.FC<MobileAdminActionSheetProps> = ({
  title,
  actions,
  trigger,
  open,
  onOpenChange,
  className
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className={cn("h-auto max-h-[80vh] rounded-t-xl", className)}
      >
        <SheetHeader className="text-left pb-4">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2 pb-4">
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              <Button
                variant={action.variant || 'ghost'}
                onClick={() => {
                  action.onClick();
                  onOpenChange?.(false);
                }}
                disabled={action.disabled}
                className="w-full justify-start h-12 text-left"
              >
                {action.icon && (
                  <action.icon className="h-5 w-5 mr-3" />
                )}
                {action.label}
              </Button>
              {index < actions.length - 1 && (
                <Separator className="my-1" />
              )}
            </React.Fragment>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};