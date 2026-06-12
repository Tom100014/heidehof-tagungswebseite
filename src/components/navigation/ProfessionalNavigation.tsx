import React from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, ChevronRight } from 'lucide-react';
import { useNavigation } from '@/hooks/use-navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIOSDeviceDetection } from '@/hooks/use-ios-device-detection';
import { cn } from '@/lib/utils';

interface ProfessionalNavigationProps {
  title?: string;
  subtitle?: string;
  showHome?: boolean;
  showBack?: boolean;
  variant?: 'default' | 'admin' | 'service' | 'welcome';
  className?: string;
}

const ProfessionalNavigation: React.FC<ProfessionalNavigationProps> = ({
  title,
  subtitle,
  showHome = true,
  showBack = true,
  variant = 'default',
  className
}) => {
  const location = useLocation();
  const { goBack, goHome, getPreviousPage } = useNavigation();
  const isMobile = useIsMobile();
  const iosDevice = useIOSDeviceDetection();
  
  const previousPage = getPreviousPage();
  const shouldShowBack = showBack && previousPage && location.pathname !== '/welcome' && location.pathname !== '/';

  const handleGoBack = () => {
    const success = goBack();
    if (!success) {
      goHome();
    }
  };

  const handleGoHome = () => {
    goHome();
  };

  // Dynamic safe area styling based on device and variant
  const getContainerStyles = () => {
    const baseStyles = "sticky top-0 z-50 w-full border-b backdrop-blur-xl";
    
    const variantStyles = {
      default: "bg-background/95 border-border/20",
      admin: "bg-background/95 border-border/40",
      service: "bg-black border-gold/10 shadow-sm",
      welcome: "bg-background/95 border-primary/20 shadow-dark"
    };

    const topPadding = iosDevice.isIOS
      ? iosDevice.hasDynamicIsland ? 'pt-8' : iosDevice.hasNotch ? 'pt-6' : 'pt-4'
      : 'safe-area-top';
    
    return cn(
      baseStyles,
      variantStyles[variant],
      topPadding,
      className
    );
  };

  const getTextStyles = () => {
    const textStyles = {
      default: "text-foreground",
      admin: "text-foreground",
      service: "text-gold",
      welcome: "text-gold"
    };
    
    return textStyles[variant];
  };

  const getButtonStyles = () => {
    const buttonStyles = {
      default: "text-muted-foreground hover:text-foreground hover:bg-accent",
      admin: "text-muted-foreground hover:text-foreground hover:bg-accent",
      service: "text-white hover:bg-white/5",
      welcome: "text-gold hover:text-gold-light hover:bg-gold/10"
    };
    
    return buttonStyles[variant];
  };

  const getHomeButtonStyles = () => {
    const homeStyles = {
      default: "text-primary hover:text-primary/80 hover:bg-primary/10",
      admin: "text-primary hover:text-primary/80 hover:bg-primary/10",
      service: "text-gold hover:bg-gold/10",
      welcome: "text-gold hover:text-gold-light hover:bg-gold/10"
    };
    
    return homeStyles[variant];
  };

  return (
    <div className={getContainerStyles()}>
      <div className="container mx-auto flex items-center justify-between px-3 py-2 h-auto min-h-14">
        {/* Left side - Back button */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {shouldShowBack && (
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "icon"}
              onClick={handleGoBack}
              className={cn(getButtonStyles(), "mobile-touch-target flex-shrink-0 px-2")}
            >
              <ArrowLeft className="h-4 w-4" />
              {isMobile && <span className="ml-1 text-sm font-medium">Zurück</span>}
            </Button>
          )}
          
          {/* Title and subtitle */}
          {title && (
            <div className="min-w-0 flex-1 py-1">
              <h1 className={cn(
                isMobile 
                  ? "font-serif font-medium text-base leading-tight" 
                  : "font-serif font-medium text-lg",
                "truncate",
                getTextStyles()
              )}>
                {title}
              </h1>
              {subtitle && (
                <p className={cn(
                  isMobile 
                    ? "text-sm leading-tight mt-0.5" 
                    : "text-sm",
                  "opacity-70 truncate",
                  getTextStyles()
                )}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right side - Home button */}
        {showHome && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoHome}
            className={cn(getHomeButtonStyles(), "mobile-touch-target flex-shrink-0")}
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Zur Startseite</span>
          </Button>
        )}
      </div>

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && iosDevice.isIOS && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 opacity-50 z-10">
          {iosDevice.deviceModel}
        </div>
      )}
    </div>
  );
};

export default ProfessionalNavigation;