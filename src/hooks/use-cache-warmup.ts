
import React, { useEffect, useState } from 'react';
import { cacheWarmupService } from '@/services/cache/cache-warmup.service';

interface UseCacheWarmupOptions {
  enabled?: boolean;
  onLoad?: boolean;
  onVisibilityChange?: boolean;
}

export const useCacheWarmup = (options: UseCacheWarmupOptions = {}) => {
  const [isWarming, setIsWarming] = useState(false);
  const { enabled = true, onLoad = true, onVisibilityChange = true } = options;

  const triggerWarmup = async () => {
    if (!enabled) return;
    
    setIsWarming(true);
    try {
      await cacheWarmupService.warmupCriticalData();
    } finally {
      setIsWarming(false);
    }
  };

  // Warmup on component load
  useEffect(() => {
    if (onLoad && enabled) {
      triggerWarmup();
    }
  }, [onLoad, enabled]);

  // Warmup when page becomes visible
  useEffect(() => {
    if (!onVisibilityChange || !enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerWarmup();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onVisibilityChange, enabled]);

  return {
    isWarming,
    triggerWarmup
  };
};
