// Optimized image preloader for critical service images
class OptimizedImagePreloader {
  private static instance: OptimizedImagePreloader;
  private preloadedImages = new Set<string>();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  static getInstance(): OptimizedImagePreloader {
    if (!OptimizedImagePreloader.instance) {
      OptimizedImagePreloader.instance = new OptimizedImagePreloader();
    }
    return OptimizedImagePreloader.instance;
  }

  // Preload critical images immediately on app start.
  // No hardcoded URLs — all hero/marketing images are managed via the Admin Image Manager,
  // so old images never flash on reload before admin uploads finish loading.
  preloadCriticalImages(): void {
    // Intentionally empty.
  }

  // Queue images for background preloading
  queueForPreload(imageUrls: string[]): void {
    const newUrls = imageUrls.filter(url => 
      url && !this.preloadedImages.has(url) && !this.preloadQueue.includes(url)
    );
    
    this.preloadQueue.push(...newUrls);
    this.processQueue();
  }

  // Batch preload with optional priority
  private batchPreload(imageUrls: string[], priority = false): void {
    const urls = imageUrls.filter(url => url && !this.preloadedImages.has(url));
    
    if (priority) {
      urls.forEach(url => this.preloadSingle(url));
    } else {
      this.queueForPreload(urls);
    }
  }

  // Process preload queue with throttling
  private async processQueue(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;
    const batch = this.preloadQueue.splice(0, 3); // Process 3 at a time

    try {
      await Promise.allSettled(
        batch.map(url => this.preloadSingle(url))
      );
    } catch (error) {
      console.warn('Batch preload error:', error);
    }

    this.isPreloading = false;
    
    // Continue processing if queue has more items
    if (this.preloadQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100); // Small delay between batches
    }
  }

  // Preload single image
  private preloadSingle(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedImages.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      const timeout = setTimeout(() => {
        img.onload = img.onerror = null;
        reject(new Error(`Image preload timeout: ${url}`));
      }, 5000); // 5 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        this.preloadedImages.add(url);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        console.warn(`Failed to preload image: ${url}`);
        reject(new Error(`Image preload failed: ${url}`));
      };

      img.src = url;
    });
  }

  // Get preload statistics
  getStats(): { preloaded: number; queued: number } {
    return {
      preloaded: this.preloadedImages.size,
      queued: this.preloadQueue.length
    };
  }

  // Clear cache for testing
  clearCache(): void {
    this.preloadedImages.clear();
    this.preloadQueue.length = 0;
    this.isPreloading = false;
  }
}

export const optimizedImagePreloader = OptimizedImagePreloader.getInstance();