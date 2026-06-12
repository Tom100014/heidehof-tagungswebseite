import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const appleButtonVariants = cva(
  [
    // Base styles
    'inline-flex items-center justify-center gap-2',
    'font-sf-pro font-medium apple-touch-target',
    'rounded-[var(--apple-border-radius)]',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-blue focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'apple-haptic-medium',
    'active:animate-ios-bounce',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-ios-blue text-white shadow-ios-button',
          'hover:bg-ios-blue/90',
          'active:shadow-ios-button-pressed active:bg-ios-blue/95',
        ],
        secondary: [
          'bg-ios-systemFill text-ios-blue border border-ios-blue/20',
          'hover:bg-ios-secondarySystemFill',
          'active:bg-ios-tertiarySystemFill',
        ],
        destructive: [
          'bg-ios-red text-white shadow-ios-button',
          'hover:bg-ios-red/90',
          'active:shadow-ios-button-pressed active:bg-ios-red/95',
        ],
        success: [
          'bg-ios-green text-white shadow-ios-button',
          'hover:bg-ios-green/90',
          'active:shadow-ios-button-pressed active:bg-ios-green/95',
        ],
        warning: [
          'bg-ios-orange text-white shadow-ios-button',
          'hover:bg-ios-orange/90',
          'active:shadow-ios-button-pressed active:bg-ios-orange/95',
        ],
        ghost: [
          'text-ios-blue',
          'hover:bg-ios-systemFill',
          'active:bg-ios-secondarySystemFill',
        ],
        glass: [
          'apple-glass text-ios-blue shadow-ios-glass',
          'hover:bg-white/20',
          'active:bg-white/30',
        ],
        link: [
          'text-ios-blue underline-offset-4',
          'hover:underline',
          'active:opacity-70',
        ],
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-14 px-8 text-lg',
        xl: 'h-16 px-10 text-xl',
        icon: 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      rounded: {
        default: 'rounded-[var(--apple-border-radius)]',
        large: 'rounded-[var(--apple-large-radius)]',
        small: 'rounded-[var(--apple-small-radius)]',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      rounded: 'default',
    },
  }
);

export interface AppleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof appleButtonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AppleButton = React.forwardRef<HTMLButtonElement, AppleButtonProps>(
  ({
    className,
    variant,
    size,
    fullWidth,
    rounded,
    loading,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(appleButtonVariants({ variant, size, fullWidth, rounded, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </button>
    );
  }
);

AppleButton.displayName = 'AppleButton';

export { AppleButton, appleButtonVariants };