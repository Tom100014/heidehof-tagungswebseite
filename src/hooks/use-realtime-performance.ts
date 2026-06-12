import { useState, useEffect, useCallback } from 'react';

interface PerformanceData {
  timestamp: number;
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  memoryUsage?: number;
  errorCount: number;
}

interface CoreWebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

interface NetworkStats {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
}

export const useRealTimePerformance = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    timestamp: Date.now(),
    pageLoadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
    errorCount: 0,
  });

  const [coreWebVitals, setCoreWebVitals] = useState<CoreWebVitals>({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  });

  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    requestCount: 0,
    averageResponseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
  });

  // Collect Core Web Vitals
  const collectCoreWebVitals = useCallback(() => {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setCoreWebVitals(prev => ({ ...prev, lcp: lastEntry.startTime }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID - First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            setCoreWebVitals(prev => ({ 
              ...prev, 
              fid: (entry as any).processingStart - entry.startTime 
            }));
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS - Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              setCoreWebVitals(prev => ({ ...prev, cls: clsValue }));
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }

    // TTFB - Time to First Byte
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const ttfb = navigationEntries[0].responseStart - navigationEntries[0].requestStart;
      setCoreWebVitals(prev => ({ ...prev, ttfb }));
    }
  }, []);

  // Collect performance data
  const collectPerformanceData = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const data: PerformanceData = {
      timestamp: Date.now(),
      pageLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      errorCount: (window as any).performanceErrorCount || 0,
    };

    // Memory usage (if available)
    if ('memory' in performance) {
      data.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    setPerformanceData(data);
  }, []);

  // Collect network statistics
  const collectNetworkStats = useCallback(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    if (resources.length > 0) {
      const totalResponseTime = resources.reduce((sum, resource) => {
        return sum + (resource.responseEnd - resource.requestStart);
      }, 0);

      const errorCount = resources.filter(resource => {
        return (resource as any).transferSize === 0 && resource.duration > 0;
      }).length;

      const cacheHits = resources.filter(resource => {
        return (resource as any).transferSize === 0 && resource.duration === 0;
      }).length;

      setNetworkStats({
        requestCount: resources.length,
        averageResponseTime: totalResponseTime / resources.length,
        errorRate: (errorCount / resources.length) * 100,
        cacheHitRate: (cacheHits / resources.length) * 100,
      });
    }
  }, []);

  // Error tracking
  useEffect(() => {
    let errorCount = 0;
    
    const errorHandler = (event: ErrorEvent) => {
      errorCount++;
      (window as any).performanceErrorCount = errorCount;
      setPerformanceData(prev => ({ ...prev, errorCount }));
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      errorCount++;
      (window as any).performanceErrorCount = errorCount;
      setPerformanceData(prev => ({ ...prev, errorCount }));
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);

  // Initialize and update data
  useEffect(() => {
    // Initial collection
    collectPerformanceData();
    collectCoreWebVitals();
    collectNetworkStats();

    // Set up periodic updates every 30 seconds for better performance
    const interval = setInterval(() => {
      collectPerformanceData();
      collectNetworkStats();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [collectPerformanceData, collectCoreWebVitals, collectNetworkStats]);

  const refreshData = useCallback(() => {
    collectPerformanceData();
    collectCoreWebVitals();
    collectNetworkStats();
  }, [collectPerformanceData, collectCoreWebVitals, collectNetworkStats]);

  return {
    performanceData,
    coreWebVitals,
    networkStats,
    refreshData,
  };
};