import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import NavigationService from '@/services/navigation/navigation.service';
import { useNavigation } from '@/hooks/use-navigation';
import { cn } from '@/lib/utils';

interface ProfessionalBreadcrumbProps {
  variant?: 'default' | 'admin' | 'service';
  showHomeButton?: boolean;
  className?: string;
}

const ProfessionalBreadcrumb: React.FC<ProfessionalBreadcrumbProps> = ({
  variant = 'default',
  showHomeButton = false,
  className
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationService = NavigationService.getInstance();
  const { goHome } = useNavigation();
  
  const breadcrumbs = navigationService.getBreadcrumbs(location.pathname);
  
  // Don't show breadcrumbs on welcome page or if only one item
  if (location.pathname === '/welcome' || location.pathname === '/' || breadcrumbs.length <= 1) {
    return null;
  }

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  const getVariantStyles = () => {
    const styles = {
      default: {
        container: "bg-muted/30 border-border/40",
        text: "text-foreground",
        link: "text-muted-foreground hover:text-foreground",
        separator: "text-muted-foreground/50",
        button: "text-primary hover:text-primary/80 hover:bg-primary/10"
      },
      admin: {
        container: "bg-muted/40 border-border/50",
        text: "text-foreground",
        link: "text-muted-foreground hover:text-foreground",
        separator: "text-muted-foreground/50",
        button: "text-primary hover:text-primary/80 hover:bg-primary/10"
      },
      service: {
        container: "bg-black/50 border-gold/20",
        text: "text-gold",
        link: "text-gold/70 hover:text-gold",
        separator: "text-gold/50",
        button: "text-gold hover:text-gold-light hover:bg-gold/10"
      }
    };
    
    return styles[variant];
  };

  const styles = getVariantStyles();

  return (
    <div className={cn(
      "w-full border-b py-2 px-4",
      styles.container,
      className
    )}>
      <div className="container mx-auto flex items-center gap-2">
        {/* Optional Home button */}
        {showHomeButton && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goHome}
              className={cn(styles.button, "h-8 px-2")}
            >
              <Home className="h-3 w-3" />
            </Button>
            <ChevronRight className={cn("h-3 w-3", styles.separator)} />
          </>
        )}

        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList className="gap-1">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className={cn("font-medium", styles.text)}>
                      {crumb.title}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      onClick={() => handleBreadcrumbClick(crumb.path)}
                      className={cn("cursor-pointer transition-colors", styles.link)}
                    >
                      {crumb.title}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className={styles.separator}>
                    <ChevronRight className="h-3 w-3" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};

export default ProfessionalBreadcrumb;