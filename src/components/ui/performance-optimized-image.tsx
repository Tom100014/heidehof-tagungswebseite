
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { optimizedCacheService } from '@/services/cache/optimized-cache-service';

interface PerformanceOptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  mobileSrc?: string;
  lazy?: boolean;
  priority?: boolean;
  disableCache?: boolean;
}

export const PerformanceOptimizedImage = React.memo(({ 
  src, 
  alt, 
  mobileSrc, 
  lazy = true,
  priority = false,
  disableCache = false,
  className = '',
  ...props 
}: PerformanceOptimizedImageProps) => {
  const isMobile = useIsMobile();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const retryCountRef = useRef<number>(0);
  
  // Optimize source selection
  const optimizedSrc = useMemo(() => {
    const baseUrl = isMobile && mobileSrc ? mobileSrc : src;
    if (!baseUrl) return '';
    
    if (disableCache || error) {
      return optimizedCacheService.getCacheBustedUrl(baseUrl);
    }
    
    optimizedCacheService.touchMediaUrl(baseUrl);
    return baseUrl;
  }, [src, mobileSrc, isMobile, disableCache, error]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || !imgRef.current) {
      setImageSrc(optimizedSrc);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(optimizedSrc);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [lazy, priority, optimizedSrc]);

  // Priority loading for above-the-fold images
  useEffect(() => {
    if (priority) {
      setImageSrc(optimizedSrc);
    }
  }, [priority, optimizedSrc]);

  const handleLoad = () => {
    setLoaded(true);
    setError(false);
    retryCountRef.current = 0;
  };

  const handleError = () => {
    setError(true);
    
    if (retryCountRef.current < 2) {
      retryCountRef.current++;
      setTimeout(() => {
        setImageSrc(optimizedCacheService.getCacheBustedUrl(src));
      }, 1000 * retryCountRef.current);
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      loading={lazy && !priority ? "lazy" : "eager"}
      className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
});

PerformanceOptimizedImage.displayName = "PerformanceOptimizedImage";
