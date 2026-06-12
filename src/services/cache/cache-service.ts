
class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private publishTimestamp: number = 0;

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
      this.cache.delete(key);
    });
    
    console.log(`🗑️ Cache pattern invalidated: ${pattern} (${matchingKeys.length} keys)`);
  }

  invalidateAll(): void {
    this.cache.clear();
    console.log('🗑️ All cache cleared');
  }

  invalidateAllMedia(): void {
    this.invalidatePattern('media');
    this.invalidatePattern('image');
    this.invalidatePattern('upload');
    console.log('🗑️ All media cache cleared');
  }

  // NEW: Media-specific methods
  getCacheBustedUrl(url: string): string {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  }

  shouldRefreshMedia(url: string, maxAge: number = 5 * 60 * 1000): boolean {
    if (!url) return false;
    
    const mediaKey = `media_${url}`;
    const cached = this.cache.get(mediaKey);
    
    if (!cached) return true;
    
    const cacheExpiry = Date.now() - maxAge;
    return cached.timestamp < cacheExpiry;
  }

  touchMediaUrl(url: string): void {
    if (url) {
      this.set(`media_${url}`, true, 30 * 60 * 1000); // 30 minutes
    }
  }

  setMediaUrl(url: string): void {
    this.touchMediaUrl(url);
  }

  invalidateMedia(url: string): void {
    this.invalidate(`media_${url}`);
  }

  // NEW: Bar Max specific methods
  invalidateBarMaxData(): void {
    this.invalidatePattern('bar_max');
    console.log('🗑️ Bar Max cache cleared');
  }

  // NEW: Device pixel ratio method
  updateDevicePixelRatio(ratio?: number): void {
    const deviceRatio = ratio || window.devicePixelRatio || 1;
    this.set('device_pixel_ratio', deviceRatio, 24 * 60 * 60 * 1000);
  }

  markPublish(): void {
    this.publishTimestamp = Date.now();
    localStorage.setItem('content_published', this.publishTimestamp.toString());
    console.log('📤 Content published, cache marked for invalidation');
  }

  shouldInvalidate(): boolean {
    const lastPublish = localStorage.getItem('content_published');
    if (!lastPublish) return false;
    
    const publishTime = parseInt(lastPublish);
    return publishTime > this.publishTimestamp;
  }

  // Development helper
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cacheService = new CacheService();
