import React from 'react';
import { useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStep {
  id: string;
  label: string;
  path: string;
}

const steps: ProgressStep[] = [
  { id: 'type', label: 'Gästetyp', path: '/conference-guests' },
  { id: 'info', label: 'Persönliche Daten', path: '/conference-guests/personal-info' },
  { id: 'menu', label: 'Menüauswahl', path: '/conference-guests/menu-selection' },
  { id: 'summary', label: 'Bestätigung', path: '/conference-guests/order-summary' }
];

export const ConferenceProgressBar: React.FC = () => {
  const location = useLocation();
  
  const getCurrentStepIndex = () => {
    const currentStep = steps.findIndex(step => location.pathname === step.path);
    return currentStep === -1 ? 0 : currentStep;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-apple/20 -z-10">
          <div 
            className="h-full bg-apple transition-all duration-500 ease-out"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              {/* Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 mb-2",
                  "border-2 backdrop-blur-sm",
                  isCompleted && "bg-apple border-apple shadow-lg shadow-apple/30",
                  isCurrent && "bg-apple/20 border-apple scale-110 animate-pulse",
                  isFuture && "bg-background/40 border-apple/30"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-apple-foreground" />
                ) : (
                  <span className={cn(
                    "text-sm font-semibold",
                    isCurrent && "text-apple",
                    isFuture && "text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-xs text-center font-medium transition-colors duration-300",
                "max-w-[70px] leading-tight",
                isCompleted && "text-apple",
                isCurrent && "text-apple font-semibold",
                isFuture && "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
