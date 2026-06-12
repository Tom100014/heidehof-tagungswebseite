import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PremiumFormCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const PremiumFormCard: React.FC<PremiumFormCardProps> = ({
  title,
  description,
  icon,
  children,
  className,
  headerClassName
}) => {
  return (
    <Card 
      className={cn(
        "w-full mx-auto",
        "bg-background/95 backdrop-blur-xl",
        "border border-gold/20 shadow-2xl",
        "overflow-hidden",
        "animate-fade-in",
        className
      )}
    >
      {/* Premium Header with Gold Gradient */}
      <CardHeader 
        className={cn(
          "relative",
          "bg-gradient-to-r from-gold/10 via-gold/5 to-transparent",
          "border-b border-gold/20",
          "pb-4 md:pb-6",
          headerClassName
        )}
      >
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/10 opacity-50" />
        
        <div className="relative flex items-center gap-3">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gold/20 rounded-2xl flex items-center justify-center border border-gold/30">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-base md:text-xl font-serif text-foreground">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Form Content */}
      <CardContent className="pt-4 pb-6 px-4 md:pt-6 md:pb-8 md:px-6">
        {children}
      </CardContent>
    </Card>
  );
};
