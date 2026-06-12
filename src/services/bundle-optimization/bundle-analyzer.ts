
// Bundle size tracking and analysis
export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private loadTimes: Map<string, number> = new Map();
  private chunkSizes: Map<string, number> = new Map();

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  trackComponentLoad(componentName: string, startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.loadTimes.set(componentName, loadTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    }
  }

  trackChunkSize(chunkName: string, size: number): void {
    this.chunkSizes.set(chunkName, size);
  }

  getPerformanceReport(): {
    loadTimes: Record<string, number>;
    chunkSizes: Record<string, number>;
    totalLoadTime: number;
  } {
    const loadTimes = Object.fromEntries(this.loadTimes);
    const chunkSizes = Object.fromEntries(this.chunkSizes);
    const totalLoadTime = Array.from(this.loadTimes.values()).reduce((sum, time) => sum + time, 0);

    return {
      loadTimes,
      chunkSizes,
      totalLoadTime
    };
  }

  clearMetrics(): void {
    this.loadTimes.clear();
    this.chunkSizes.clear();
  }
}

export const bundleAnalyzer = BundleAnalyzer.getInstance();
