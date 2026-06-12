
import React, { useMemo, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cacheService } from '@/services/cache/cache-service';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  mobileSrc?: string;
  lazy?: boolean;
  disableCache?: boolean;
  forceRefresh?: boolean;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  mobileSrc, 
  lazy = true,
  disableCache = false,
  forceRefresh = false,
  className = '',
  ...props 
}: OptimizedImageProps) => {
  const isMobile = useIsMobile();
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loaded, setLoaded] = useState<boolean>(false);
  const [lastError, setLastError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Generate a cache-busting URL if needed
  const processedSrc = useMemo(() => {
    const baseUrl = isMobile && mobileSrc ? mobileSrc : src;
    
    if (!baseUrl) return '';
    
    // Always use cache-busting in the following cases:
    // 1. If there was a previous error loading the image
    // 2. If cache is explicitly disabled
    // 3. If a refresh is forced
    // 4. If the cache service indicates the media should be refreshed
    if (lastError || disableCache || forceRefresh || cacheService.shouldRefreshMedia(baseUrl)) {
      return cacheService.getCacheBustedUrl(baseUrl);
    }
    
    // Touch the cache entry to mark it as recently used
    cacheService.touchMediaUrl(baseUrl);
    
    return baseUrl;
  }, [src, mobileSrc, isMobile, disableCache, forceRefresh, lastError]);

  // Update image source when processed source changes
  useEffect(() => {
    if (processedSrc) {
      setImageSrc(processedSrc);
    }
  }, [processedSrc]);

  // Handle publish events by forcing a refresh
  useEffect(() => {
    // Clear retry count when component mounts or src changes
    setRetryCount(0);
    
    const handleVisibilityChange = () => {
      // When tab becomes visible again, refresh images
      if (document.visibilityState === 'visible') {
        if (processedSrc) {
          console.log('Tab is visible again, refreshing images');
          setImageSrc(cacheService.getCacheBustedUrl(processedSrc));
          setLastError(false); // Reset error state on visibility change
        }
      }
    };
    
    // Storage event for communication between tabs
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'app_updated' || event.key?.includes('image_update') || event.key === 'last_publish_timestamp') {
        console.log('Application was updated, reloading images');
        if (processedSrc) {
          setImageSrc(cacheService.getCacheBustedUrl(processedSrc));
          setLastError(false); // Reset error state on update
        }
      }
    };

    // Handle screen size/orientation changes
    const handleResize = () => {
      cacheService.updateDevicePixelRatio();
      // Force refresh of image
      if (processedSrc) {
        setImageSrc(cacheService.getCacheBustedUrl(processedSrc));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [processedSrc]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      loading={lazy ? "lazy" : "eager"}
      className={`mobile-optimized-image ${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ transition: 'opacity 0.3s ease-in-out' }}
      onLoad={() => {
        setLoaded(true);
        setLastError(false); // Reset error indicator
        setRetryCount(0); // Reset retry count on successful load
      }}
      onError={(e) => {
        console.log(`Failed to load image: ${imageSrc} (attempt ${retryCount + 1})`);
        setLastError(true); // Set error indicator
        
        // Implement limited retry with backoff
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          
          // Clear cache for this image
          cacheService.invalidateMedia(imageSrc);
          
          // Try again with a fresh cache-busted URL after a small delay
          setTimeout(() => {
            const freshUrl = cacheService.getCacheBustedUrl(src);
            console.log(`Retrying with fresh URL: ${freshUrl}`);
            setImageSrc(freshUrl);
          }, 500 * (retryCount + 1)); // Increasing delay with each retry
        } else if (imageSrc.includes('_t=')) {
          // After retries fail, try to load without cache busting as last resort
          const fallbackSrc = src || (isMobile && mobileSrc ? mobileSrc : '');
          if (fallbackSrc && fallbackSrc !== imageSrc) {
            console.log('Trying to load image without cache busting as last resort');
            setImageSrc(fallbackSrc);
          }
        }
      }}
      {...props}
    />
  );
};
