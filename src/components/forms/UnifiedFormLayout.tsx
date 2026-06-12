import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import ServiceLayout from '@/components/ServiceLayout';

interface UnifiedFormLayoutProps {
  title: string;
  description?: string;
  serviceId?: string;
  backgroundImage?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

interface FormStepOption {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

interface FormStepSelectorProps {
  title: string;
  description?: string;
  options: FormStepOption[];
  selectedOption?: string;
  onSelectOption: (optionId: string) => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

interface FormContentCardProps {
  children: React.ReactNode;
  className?: string;
}

// Main layout wrapper following Conference Guests pattern
export const UnifiedFormLayout: React.FC<UnifiedFormLayoutProps> = ({
  title,
  description,
  serviceId,
  backgroundImage,
  children,
  showBackButton = false,
  onBack,
  className
}) => {
  return (
    <ServiceLayout
      title={title}
      description={description}
      serviceId={serviceId || 'form'}
      backgroundImage={backgroundImage}
    >
      <div className={cn("max-w-md mx-auto py-6 px-4", className)}>
        {showBackButton && onBack && (
          <Button 
            variant="ghost" 
            className="mb-4 text-gold hover:text-gold-dark"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
          </Button>
        )}
        
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-serif font-bold text-gold mb-2">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        {children}
      </div>
    </ServiceLayout>
  );
};

// Step selector with glassmorphism cards
export const FormStepSelector: React.FC<FormStepSelectorProps> = ({
  title,
  description,
  options,
  selectedOption,
  onSelectOption,
  showBackButton = false,
  onBack
}) => {
  return (
    <UnifiedFormLayout
      title={title}
      description={description}
      showBackButton={showBackButton}
      onBack={onBack}
    >
      <div className="space-y-4">
        {options.map((option) => (
          <Card 
            key={option.id}
            className={cn(
              "border transition-all duration-300 cursor-pointer bg-background/80 backdrop-blur-sm",
              "overflow-hidden group flex justify-between items-center p-4",
              selectedOption === option.id
                ? "border-gold ring-2 ring-gold/30 bg-gold/10"
                : "border-gold/20 hover:border-gold hover:shadow-md"
            )}
            onClick={() => onSelectOption(option.id)}
          >
            <div className="flex items-center gap-3">
              {option.icon && (
                <div className="flex-shrink-0">
                  {option.icon}
                </div>
              )}
              <div>
                <h3 className={cn(
                  "font-medium text-lg mb-1 transition-colors",
                  selectedOption === option.id
                    ? "text-gold"
                    : "text-white group-hover:text-gold-dark"
                )}>
                  {option.title}
                </h3>
                {option.description && (
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                )}
              </div>
            </div>
            
            {selectedOption === option.id && (
              <Check className="h-5 w-5 text-gold flex-shrink-0" />
            )}
          </Card>
        ))}
      </div>
    </UnifiedFormLayout>
  );
};

// Content card with glassmorphism
export const FormContentCard: React.FC<FormContentCardProps> = ({
  children,
  className
}) => {
  return (
    <Card className={cn(
      "border-gold/20 bg-background/80 backdrop-blur-sm p-6 space-y-6",
      className
    )}>
      {children}
    </Card>
  );
};

// Form section wrapper
export const FormSection: React.FC<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h3 className="text-gold font-medium text-lg">{title}</h3>
      )}
      {children}
    </div>
  );
};