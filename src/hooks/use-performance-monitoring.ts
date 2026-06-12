
import React, { useEffect, useCallback } from 'react';
import { bundleAnalyzer } from '@/services/bundle-optimization/bundle-analyzer';

interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  renderTime: number;
}

export const usePerformanceMonitoring = (componentName: string) => {
  const startTime = performance.now();

  const trackLoad = useCallback(() => {
    bundleAnalyzer.trackComponentLoad(componentName, startTime);
  }, [componentName, startTime]);

  const trackRender = useCallback((renderStartTime: number) => {
    const renderTime = performance.now() - renderStartTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }
  }, [componentName]);

  useEffect(() => {
    trackLoad();
  }, [trackLoad]);

  return {
    trackRender,
    getMetrics: () => bundleAnalyzer.getPerformanceReport()
  };
};
