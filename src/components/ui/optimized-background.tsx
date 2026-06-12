import { memo } from 'react';

interface OptimizedBackgroundProps {
  src: string;
  className?: string;
  children: React.ReactNode;
}

// Optimized background component with WebP support and lazy loading
export const OptimizedBackground = memo(({ src, className = '', children }: OptimizedBackgroundProps) => {
  return (
    <div 
      className={`relative ${className}`}
      style={{
        backgroundImage: `url('${src}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'scroll',
        // Add performance optimizations
        willChange: 'auto',
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }}
    >
      {children}
    </div>
  );
});

OptimizedBackground.displayName = 'OptimizedBackground';