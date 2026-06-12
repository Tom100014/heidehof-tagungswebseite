import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const appleCardVariants = cva(
  [
    // Base styles
    'relative overflow-hidden',
    'transition-all duration-300 ease-out',
    'apple-haptic-light',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-ios-secondarySystemBackground',
          'border border-ios-systemFill',
          'shadow-ios-card',
        ],
        glass: [
          'apple-glass',
          'shadow-ios-glass',
        ],
        elevated: [
          'bg-ios-systemBackground',
          'shadow-ios-elevated',
        ],
        filled: [
          'bg-ios-systemFill',
        ],
        bordered: [
          'bg-ios-systemBackground',
          'border-2 border-ios-systemFill',
        ],
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      rounded: {
        default: 'rounded-[var(--apple-border-radius)]',
        large: 'rounded-[var(--apple-large-radius)]',
        small: 'rounded-[var(--apple-small-radius)]',
        none: 'rounded-none',
      },
      interactive: {
        true: [
          'cursor-pointer',
          'hover:shadow-ios-elevated hover:-translate-y-1',
          'active:shadow-ios-card active:translate-y-0',
          'active:animate-ios-bounce',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'default',
      interactive: false,
    },
  }
);

export interface AppleCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof appleCardVariants> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const AppleCard = React.forwardRef<HTMLDivElement, AppleCardProps>(
  ({
    className,
    variant,
    size,
    rounded,
    interactive,
    header,
    footer,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(appleCardVariants({ variant, size, rounded, interactive }), className)}
        {...props}
      >
        {header && (
          <div className="mb-4 pb-4 border-b border-ios-systemFill">
            {header}
          </div>
        )}
        
        <div className="flex-1">
          {children}
        </div>
        
        {footer && (
          <div className="mt-4 pt-4 border-t border-ios-systemFill">
            {footer}
          </div>
        )}
      </div>
    );
  }
);

AppleCard.displayName = 'AppleCard';

// Card Header Component
const AppleCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5',
      className
    )}
    {...props}
  />
));
AppleCardHeader.displayName = 'AppleCardHeader';

// Card Title Component
const AppleCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'apple-text-headline text-ios-gray font-sf-pro',
      className
    )}
    {...props}
  />
));
AppleCardTitle.displayName = 'AppleCardTitle';

// Card Description Component
const AppleCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'apple-text-subheadline text-ios-gray3 font-sf-pro',
      className
    )}
    {...props}
  />
));
AppleCardDescription.displayName = 'AppleCardDescription';

// Card Content Component
const AppleCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('space-y-4', className)}
    {...props}
  />
));
AppleCardContent.displayName = 'AppleCardContent';

// Card Footer Component
const AppleCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between',
      className
    )}
    {...props}
  />
));
AppleCardFooter.displayName = 'AppleCardFooter';

export {
  AppleCard,
  AppleCardHeader,
  AppleCardTitle,
  AppleCardDescription,
  AppleCardContent,
  AppleCardFooter,
  appleCardVariants,
};