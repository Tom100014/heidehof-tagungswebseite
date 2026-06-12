import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  aspectRatio = 'auto',
  ...props 
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    auto: ''
  };

  if (error) {
    return (
      <div className={cn(
        'bg-muted flex items-center justify-center',
        aspectClasses[aspectRatio],
        className
      )}>
        <span className="text-xs text-muted-foreground">Bild nicht verfügbar</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', aspectClasses[aspectRatio], className)}>
      {isLoading && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
