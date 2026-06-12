
class OptimizedCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private pendingWrites: Map<string, any> = new Map();

  // Batch localStorage writes to reduce I/O
  private batchWrite(key: string, data: any) {
    this.pendingWrites.set(key, data);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.flushPendingWrites();
    }, 50); // Batch writes every 50ms
  }

  private flushPendingWrites() {
    for (const [key, data] of this.pendingWrites) {
      try {
        localStorage.setItem(`cache_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (error) {
        console.warn(`Failed to write cache for ${key}:`, error);
      }
    }
    this.pendingWrites.clear();
    this.batchTimeout = null;
  }

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
    
    // Batch the localStorage write
    this.batchWrite(key, data);
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.batchWrite(key, null); // Mark for deletion
      return null;
    }
    
    return item.data;
  }

  // Optimized media URL handling
  getCacheBustedUrl(url: string): string {
    if (!url) return url;
    
    // Only add cache busting if needed
    const needsCacheBusting = this.shouldRefreshMedia(url);
    if (!needsCacheBusting) return url;
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }

  shouldRefreshMedia(url: string, maxAge: number = 5 * 60 * 1000): boolean {
    if (!url) return false;
    
    const mediaKey = `media_${url}`;
    const cached = this.cache.get(mediaKey);
    
    if (!cached) return true;
    
    const cacheExpiry = Date.now() - maxAge;
    return cached.timestamp < cacheExpiry;
  }

  touchMediaUrl(url: string) {
    if (url) {
      this.set(`media_${url}`, true, 30 * 60 * 1000); // 30 minutes
    }
  }

  invalidate(key: string) {
    this.cache.delete(key);
    this.batchWrite(key, null);
  }

  invalidatePattern(pattern: string) {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.batchWrite(key, null);
    });
  }

  clear() {
    this.cache.clear();
    this.pendingWrites.clear();
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  // Legacy compatibility methods
  setMediaUrl = this.touchMediaUrl;
  invalidateMedia = (url: string) => this.invalidate(`media_${url}`);
  invalidateAllMedia = () => this.invalidatePattern('media_');
  invalidateBarMaxData = () => this.invalidatePattern('bar_max');
  markPublish = () => this.set('content_published', Date.now(), 24 * 60 * 60 * 1000);
  updateDevicePixelRatio = (ratio?: number) => {
    const deviceRatio = ratio || window.devicePixelRatio || 1;
    this.set('device_pixel_ratio', deviceRatio, 24 * 60 * 60 * 1000);
  };
}

export const optimizedCacheService = new OptimizedCacheService();
