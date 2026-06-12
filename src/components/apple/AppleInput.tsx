import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export interface AppleInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'filled';
  showPasswordToggle?: boolean;
  helperText?: string;
}

const AppleInput = React.forwardRef<HTMLInputElement, AppleInputProps>(({
  className,
  label,
  error,
  success,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  showPasswordToggle = false,
  helperText,
  type: initialType = 'text',
  onFocus,
  onBlur,
  disabled,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const type = showPasswordToggle && initialType === 'password' 
    ? (isPasswordVisible ? 'text' : 'password')
    : initialType;

  useEffect(() => {
    if (inputRef.current) {
      setHasValue(!!inputRef.current.value);
    }
  }, [props.value, props.defaultValue]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

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

  const inputClasses = cn(
    // Base styles
    'w-full font-sf-pro apple-touch-target apple-haptic-light',
    'rounded-[var(--apple-border-radius)]',
    'transition-all duration-200 ease-out',
    'placeholder:text-ios-gray3',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    
    // Size
    sizeClasses[size],
    
    // Variant
    variantClasses[variant],
    
    // State styles
    isFocused && 'animate-ios-spring',
    
    // Icon padding adjustments
    leftIcon && 'pl-12',
    (rightIcon || showPasswordToggle || error || success) && 'pr-12',
    
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

  const getStatusIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5 text-ios-red" />;
    if (success) return <Check className="w-5 h-5 text-ios-green" />;
    return null;
  };

  const getRightIcon = () => {
    if (showPasswordToggle && initialType === 'password') {
      return (
        <button
          type="button"
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          className="p-1 rounded-md hover:bg-ios-systemFill transition-colors apple-haptic-light"
          tabIndex={-1}
        >
          {isPasswordVisible ? (
            <EyeOff className="w-5 h-5 text-ios-gray3" />
          ) : (
            <Eye className="w-5 h-5 text-ios-gray3" />
          )}
        </button>
      );
    }
    return rightIcon || getStatusIcon();
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-gray3">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref || inputRef}
          type={type}
          disabled={disabled}
          className={inputClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />

        {/* Floating Label */}
        {label && (
          <label className={labelClasses}>
            {label}
          </label>
        )}

        {/* Right Icon */}
        {getRightIcon() && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {getRightIcon()}
          </div>
        )}
      </div>

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

AppleInput.displayName = 'AppleInput';

export { AppleInput };