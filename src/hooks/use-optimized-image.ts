
import React, { useState, useEffect, useMemo } from 'react';
import { imageOptimizer } from '@/services/asset-optimization/image-optimizer';
import { optimizedCacheService } from '@/services/cache/optimized-cache-service';

interface UseOptimizedImageOptions {
  responsive?: boolean;
  placeholder?: boolean;
  priority?: boolean;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
}

export const useOptimizedImage = (
  src: string,
  options: UseOptimizedImageOptions = {}
) => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);
  const [placeholderSrc, setPlaceholderSrc] = useState<string>('');
  const [responsiveSizes, setResponsiveSizes] = useState<{
    small: string;
    medium: string;
    large: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    responsive = false,
    placeholder = false,
    priority = false,
    quality = 0.8,
    format = 'webp'
  } = options;

  const cacheKey = useMemo(() => 
    `optimized_${src}_${quality}_${format}_${responsive}_${placeholder}`, 
    [src, quality, format, responsive, placeholder]
  );

  useEffect(() => {
    const optimizeImage = async () => {
      if (!src) return;

      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const cached = optimizedCacheService.get(cacheKey);
        if (cached) {
          setOptimizedSrc(cached.optimized);
          if (cached.placeholder) setPlaceholderSrc(cached.placeholder);
          if (cached.responsive) setResponsiveSizes(cached.responsive);
          setIsLoading(false);
          return;
        }

        const results: any = {
          optimized: src
        };

        // Optimize main image
        if (quality < 1 || format !== 'jpeg') {
          results.optimized = await imageOptimizer.optimizeImage(src, {
            quality,
            format
          });
        }

        // Generate placeholder if requested
        if (placeholder) {
          results.placeholder = await imageOptimizer.createPlaceholder(src);
          setPlaceholderSrc(results.placeholder);
        }

        // Generate responsive sizes if requested
        if (responsive) {
          results.responsive = await imageOptimizer.generateResponsiveSizes(src);
          setResponsiveSizes(results.responsive);
        }

        // Cache results
        optimizedCacheService.set(cacheKey, results, 24 * 60 * 60 * 1000); // 24 hours

        setOptimizedSrc(results.optimized);

      } catch (err) {
        console.error('Image optimization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setOptimizedSrc(src); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    // Prioritize critical images
    if (priority) {
      optimizeImage();
    } else {
      // Defer non-critical images
      const timer = setTimeout(optimizeImage, 100);
      return () => clearTimeout(timer);
    }
  }, [src, cacheKey, quality, format, responsive, placeholder, priority]);

  return {
    src: optimizedSrc,
    placeholderSrc,
    responsiveSizes,
    isLoading,
    error,
    isOptimized: optimizedSrc !== src
  };
};
