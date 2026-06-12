
import React from 'react';
import { useOptimizedImage } from '@/hooks/use-optimized-image';
import { PerformanceOptimizedImage } from './performance-optimized-image';

interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  responsive?: boolean;
  placeholder?: boolean;
  priority?: boolean;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  lazy?: boolean;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  responsive = true,
  placeholder = true,
  priority = false,
  quality = 0.8,
  format = 'webp',
  lazy = true,
  className = '',
  ...props
}) => {
  const {
    src: optimizedSrc,
    placeholderSrc,
    responsiveSizes,
    isLoading,
    error
  } = useOptimizedImage(src, {
    responsive,
    placeholder,
    priority,
    quality,
    format
  });

  // Show placeholder while loading
  if (isLoading && placeholderSrc) {
    return (
      <PerformanceOptimizedImage
        src={placeholderSrc}
        alt={alt}
        className={`${className} blur-sm`}
        priority={priority}
        lazy={lazy}
        {...props}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <span className="text-muted-foreground text-sm">Bild konnte nicht geladen werden</span>
      </div>
    );
  }

  // Generate srcSet for responsive images
  const srcSet = responsiveSizes 
    ? `${responsiveSizes.small} 480w, ${responsiveSizes.medium} 768w, ${responsiveSizes.large} 1200w`
    : undefined;

  const sizes = responsive 
    ? "(max-width: 480px) 480px, (max-width: 768px) 768px, 1200px"
    : undefined;

  return (
    <PerformanceOptimizedImage
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      priority={priority}
      lazy={lazy}
      {...props}
    />
  );
};
