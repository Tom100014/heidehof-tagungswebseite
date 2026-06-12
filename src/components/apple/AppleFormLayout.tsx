import React from 'react';
import { cn } from '@/lib/utils';
import { AppleCard } from './AppleCard';

export interface AppleFormLayoutProps {
  title?: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'card';
  size?: 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  centerContent?: boolean;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

const AppleFormLayout = React.forwardRef<HTMLDivElement, AppleFormLayoutProps>(({
  title,
  subtitle,
  description,
  children,
  className,
  variant = 'default',
  size = 'md',
  maxWidth = 'lg',
  centerContent = true,
  showProgress = false,
  currentStep,
  totalSteps,
  ...props
}, ref) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const sizeClasses = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8'
  };

  const containerClasses = cn(
    'w-full apple-safe-area',
    maxWidthClasses[maxWidth],
    centerContent && 'mx-auto',
    sizeClasses[size],
    className
  );

  const HeaderSection = () => (
    <>
      {/* Progress Bar */}
      {showProgress && currentStep && totalSteps && (
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="apple-text-caption1 text-ios-gray3 font-sf-pro">
              Schritt {currentStep} von {totalSteps}
            </span>
            <span className="apple-text-caption1 text-ios-gray3 font-sf-pro">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-ios-systemFill rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-ios-blue rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Header Content */}
      {(title || subtitle || description) && (
        <div className="text-center space-y-3 mb-8">
          {subtitle && (
            <p className="apple-text-subheadline text-ios-blue font-sf-pro font-medium">
              {subtitle}
            </p>
          )}
          
          {title && (
            <h1 className="apple-text-title2 text-ios-gray font-sf-pro">
              {title}
            </h1>
          )}
          
          {description && (
            <p className="apple-text-body text-ios-gray3 font-sf-pro max-w-md mx-auto">
              {description}
            </p>
          )}
        </div>
      )}
    </>
  );

  if (variant === 'card') {
    return (
      <div ref={ref} className={containerClasses} {...props}>
        <AppleCard variant="elevated" size={size}>
          <HeaderSection />
          {children}
        </AppleCard>
      </div>
    );
  }

  if (variant === 'glass') {
    return (
      <div ref={ref} className={containerClasses} {...props}>
        <AppleCard variant="glass" size={size}>
          <HeaderSection />
          {children}
        </AppleCard>
      </div>
    );
  }

  return (
    <div ref={ref} className={containerClasses} {...props}>
      <HeaderSection />
      {children}
    </div>
  );
});

AppleFormLayout.displayName = 'AppleFormLayout';

// Form Section Component
export interface AppleFormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'grouped';
}

const AppleFormSection = React.forwardRef<HTMLDivElement, AppleFormSectionProps>(({
  title,
  description,
  children,
  className,
  variant = 'default',
  ...props
}, ref) => {
  const sectionClasses = cn(
    'space-y-4',
    variant === 'card' && 'p-6 bg-ios-secondarySystemBackground rounded-[var(--apple-large-radius)] border border-ios-systemFill',
    variant === 'grouped' && 'space-y-2',
    className
  );

  return (
    <div ref={ref} className={sectionClasses} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="apple-text-headline text-ios-gray font-sf-pro font-semibold">
              {title}
            </h3>
          )}
          {description && (
            <p className="apple-text-subheadline text-ios-gray3 font-sf-pro">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={cn(
        variant === 'grouped' ? 'space-y-1' : 'space-y-4'
      )}>
        {children}
      </div>
    </div>
  );
});

AppleFormSection.displayName = 'AppleFormSection';

// Form Group Component for inline layouts
export interface AppleFormGroupProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

const AppleFormGroup = React.forwardRef<HTMLDivElement, AppleFormGroupProps>(({
  children,
  className,
  columns = 1,
  gap = 'md',
  ...props
}, ref) => {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const gridClasses = cn(
    'grid',
    `grid-cols-1 sm:grid-cols-${columns}`,
    gapClasses[gap],
    className
  );

  return (
    <div ref={ref} className={gridClasses} {...props}>
      {children}
    </div>
  );
});

AppleFormGroup.displayName = 'AppleFormGroup';

export { AppleFormLayout, AppleFormSection, AppleFormGroup };