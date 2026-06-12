
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedCacheStrategy } from '@/services/cache/enhanced-cache-strategy';

interface UseCacheOptions {
  ttl?: number;
  dependencies?: string[];
  tags?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useEnhancedCache = <T>(
  key: string,
  fetcher: () => Promise<T> | T,
  options: UseCacheOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  const isMountedRef = useRef(true);

  // Update fetcher ref when it changes
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Try cache first unless forced refresh
      if (!forceRefresh) {
        const cached = enhancedCacheStrategy.get<T>(key);
        if (cached !== null) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      // Fetch fresh data
      const result = await fetcherRef.current();
      
      if (isMountedRef.current) {
        // Cache the result
        enhancedCacheStrategy.set(key, result, {
          ttl: options.ttl,
          dependencies: options.dependencies,
          tags: options.tags
        });

        setData(result);
        return result;
      }
    } catch (err) {
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        console.error(`Cache fetch failed for key ${key}:`, error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, options.ttl, options.dependencies, options.tags]);

  const invalidate = useCallback(() => {
    enhancedCacheStrategy.invalidate(key);
    fetchData(true);
  }, [key, fetchData]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh setup
  useEffect(() => {
    if (!options.autoRefresh || !options.refreshInterval) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, options.refreshInterval);

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, fetchData]);

  // Listen for cache invalidations
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${key}_updated`) {
        fetchData(true);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    invalidate,
    refresh,
    isStale: loading && data !== null
  };
};

export const useCacheStats = () => {
  const [stats, setStats] = useState(enhancedCacheStrategy.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(enhancedCacheStrategy.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
};
