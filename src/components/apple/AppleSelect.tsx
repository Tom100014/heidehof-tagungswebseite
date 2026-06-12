import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import * as Select from '@radix-ui/react-select';

export interface AppleSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface AppleSelectProps {
  label?: string;
  placeholder?: string;
  options: AppleSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'filled';
  helperText?: string;
  className?: string;
}

const AppleSelect = React.forwardRef<
  React.ElementRef<typeof Select.Trigger>,
  AppleSelectProps
>(({
  label,
  placeholder = 'Auswählen...',
  options,
  value,
  onValueChange,
  error,
  success,
  disabled,
  size = 'md',
  variant = 'default',
  helperText,
  className,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = !!value;

  const sizeClasses = {
    sm: 'h-10 px-3 text-sm',
    md: 'h-12 px-4 text-base',
    lg: 'h-14 px-5 text-lg'
  };

  const variantClasses = {
    default: cn(
      'bg-ios-secondarySystemBackground border border-ios-systemFill',
      'focus:border-ios-blue focus:bg-ios-systemBackground',
      error && 'border-ios-red focus:border-ios-red',
      success && 'border-ios-green focus:border-ios-green'
    ),
    glass: cn(
      'apple-glass border-0',
      'focus:shadow-ios-input',
      error && 'border border-ios-red/30',
      success && 'border border-ios-green/30'
    ),
    filled: cn(
      'bg-ios-systemFill border-0',
      'focus:bg-ios-secondarySystemFill',
      error && 'bg-ios-red/10',
      success && 'bg-ios-green/10'
    )
  };

  const triggerClasses = cn(
    // Base styles
    'w-full font-sf-pro apple-touch-target apple-haptic-light',
    'rounded-[var(--apple-border-radius)]',
    'transition-all duration-200 ease-out',
    'flex items-center justify-between',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none',
    
    // Size
    sizeClasses[size],
    
    // Variant
    variantClasses[variant],
    
    // State styles
    isFocused && 'animate-ios-spring',
    
    className
  );

  const labelClasses = cn(
    'absolute left-4 font-sf-pro pointer-events-none',
    'transition-all duration-200 ease-out',
    'bg-ios-systemBackground px-1 rounded-sm',
    {
      // Floating state
      'top-0 -translate-y-1/2 text-xs font-medium text-ios-blue': isFocused || hasValue,
      // Placeholder state
      'top-1/2 -translate-y-1/2 text-base text-ios-gray3': !isFocused && !hasValue,
      // Error state
      'text-ios-red': error && (isFocused || hasValue),
      // Success state
      'text-ios-green': success && (isFocused || hasValue),
    }
  );

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative w-full">
      <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <div className="relative">
          <Select.Trigger
            ref={ref}
            className={triggerClasses}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          >
            <div className="flex items-center gap-2">
              {selectedOption?.icon && selectedOption.icon}
              <Select.Value
                placeholder={placeholder}
                className="text-left"
              />
            </div>
            <Select.Icon className="text-ios-gray3">
              <ChevronDown className="w-5 h-5" />
            </Select.Icon>
          </Select.Trigger>

          {/* Floating Label */}
          {label && (
            <label className={labelClasses}>
              {label}
            </label>
          )}
        </div>

        <Select.Portal>
          <Select.Content
            className={cn(
              'relative z-50 max-h-96 min-w-[8rem] overflow-hidden',
              'apple-glass shadow-ios-elevated',
              'rounded-[var(--apple-border-radius)]',
              'animate-ios-spring'
            )}
            position="popper"
            sideOffset={8}
          >
            <Select.ScrollUpButton className="flex cursor-default items-center justify-center h-6 bg-ios-systemBackground text-ios-gray3">
              <ChevronDown className="w-4 h-4 rotate-180" />
            </Select.ScrollUpButton>
            
            <Select.Viewport className="p-2">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    'relative flex items-center gap-2 select-none',
                    'rounded-[var(--apple-small-radius)] px-3 py-2',
                    'apple-text-body font-sf-pro',
                    'cursor-pointer apple-haptic-light',
                    'transition-all duration-150 ease-out',
                    'hover:bg-ios-systemFill focus:bg-ios-systemFill',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'data-[highlighted]:bg-ios-blue data-[highlighted]:text-white'
                  )}
                >
                  <Select.ItemIndicator className="inline-flex items-center">
                    <Check className="w-4 h-4" />
                  </Select.ItemIndicator>
                  
                  <div className="flex items-center gap-2">
                    {option.icon && option.icon}
                    <Select.ItemText>{option.label}</Select.ItemText>
                  </div>
                </Select.Item>
              ))}
            </Select.Viewport>
            
            <Select.ScrollDownButton className="flex cursor-default items-center justify-center h-6 bg-ios-systemBackground text-ios-gray3">
              <ChevronDown className="w-4 h-4" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>

      {/* Helper Text / Error Message */}
      {(helperText || error) && (
        <p className={cn(
          'mt-2 text-sm font-sf-pro animate-ios-slide-up',
          error ? 'text-ios-red' : 'text-ios-gray3'
        )}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

AppleSelect.displayName = 'AppleSelect';

export { AppleSelect };