
import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedMobileFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export const OptimizedMobileForm: React.FC<OptimizedMobileFormProps> = ({
  children,
  className,
  onSubmit
}) => {
  return (
    <div className={cn(
      "unified-form-card w-full max-w-md mx-auto",
      "bg-card border border-border rounded-xl shadow-lg",
      "p-6 space-y-6",
      className
    )}>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
      </form>
    </div>
  );
};

interface OptimizedFormSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const OptimizedFormSection: React.FC<OptimizedFormSectionProps> = ({
  title,
  children,
  className
}) => {
  return (
    <div className={cn("form-section space-y-4", className)}>
      {title && (
        <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

interface OptimizedFormButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export const OptimizedFormButton: React.FC<OptimizedFormButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  disabled,
  loading,
  onClick,
  className
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/90';
      case 'outline':
        return 'bg-transparent border-2 border-border text-foreground hover:bg-accent';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "form-button w-full",
        "flex items-center justify-center gap-2",
        "rounded-xl font-medium transition-all duration-200",
        "min-h-12 px-6 py-3",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        getVariantClasses(),
        className
      )}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};
