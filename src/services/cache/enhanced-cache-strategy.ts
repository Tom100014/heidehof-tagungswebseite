
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  dependencies?: string[];
  tags?: string[];
}

interface CacheConfig {
  maxSize: number;
  defaultTtl: number;
  enablePersistence: boolean;
  compressionThreshold: number;
  warmupKeys: string[];
}

class EnhancedCacheStrategy {
  private cache = new Map<string, CacheEntry>();
  private batchWriteQueue = new Map<string, any>();
  private batchTimeout: NodeJS.Timeout | null = null;
  private dependencyGraph = new Map<string, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    operations: 0
  };

  private config: CacheConfig = {
    maxSize: 1000,
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    enablePersistence: true,
    compressionThreshold: 1024, // 1KB
    warmupKeys: [
      'homepage-background-image-url',
      'bar_max_menu',
      'restaurant_maxwell_menu',
      'beauty_treatments'
    ]
  };

  constructor(customConfig?: Partial<CacheConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
    this.initializeCache();
  }

  private initializeCache() {
    // Warmup critical cache entries
    this.warmupCache();
    
    // Setup periodic cleanup
    setInterval(() => this.performMaintenance(), 60000); // Every minute
    
    // Setup beforeunload cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flushPendingOperations());
    }
  }

  private async warmupCache() {
    try {
      for (const key of this.config.warmupKeys) {
        const stored = this.getFromPersistence(key);
        if (stored && this.isValidEntry(stored)) {
          this.cache.set(key, stored);
        }
      }
    } catch (error) {
      console.warn('Cache warmup failed:', error);
    }
  }

  set<T>(
    key: string, 
    data: T, 
    options: {
      ttl?: number;
      dependencies?: string[];
      tags?: string[];
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): boolean {
    try {
      this.stats.operations++;
      
      const ttl = options.ttl || this.config.defaultTtl;
      const now = Date.now();
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        ttl,
        accessCount: 0,
        lastAccessed: now,
        dependencies: options.dependencies || [],
        tags: options.tags || []
      };

      // Check cache size and evict if necessary
      if (this.cache.size >= this.config.maxSize) {
        this.evictLeastUsed();
      }

      // Update dependency graph
      if (entry.dependencies) {
        this.updateDependencyGraph(key, entry.dependencies);
      }

      // Update tag index
      if (entry.tags) {
        this.updateTagIndex(key, entry.tags);
      }

      this.cache.set(key, entry);

      // Queue for persistence if enabled
      if (this.config.enablePersistence) {
        this.queueForPersistence(key, entry);
      }

      return true;
    } catch (error) {
      console.error('Cache set failed:', error);
      return false;
    }
  }

  get<T>(key: string): T | null {
    this.stats.operations++;
    
    const entry = this.cache.get(key) as CacheEntry<T>;
    
    if (!entry) {
      this.stats.misses++;
      // Try to load from persistence
      const persisted = this.getFromPersistence(key);
      if (persisted && this.isValidEntry(persisted)) {
        this.cache.set(key, persisted);
        this.stats.hits++;
        return persisted.data;
      }
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromPersistence(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  invalidate(key: string): void {
    try {
      // Remove from cache
      this.cache.delete(key);
      this.removeFromPersistence(key);

      // Invalidate dependents
      const dependents = this.getDependents(key);
      dependents.forEach(dependent => {
        this.cache.delete(dependent);
        this.removeFromPersistence(dependent);
      });

      // Trigger update events
      this.triggerUpdateEvent(key);
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }

  invalidateByTag(tag: string): void {
    const keysWithTag = this.tagIndex.get(tag);
    if (keysWithTag) {
      keysWithTag.forEach(key => this.invalidate(key));
      this.tagIndex.delete(tag);
    }
  }

  invalidatePattern(pattern: string): void {
    const keysToInvalidate: string[] = [];
    
    // Check in-memory cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToInvalidate.push(key);
      }
    }

    // Check persistence
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.startsWith('cache_') && storageKey.includes(pattern)) {
          const cacheKey = storageKey.replace('cache_', '');
          keysToInvalidate.push(cacheKey);
        }
      });
    }

    keysToInvalidate.forEach(key => this.invalidate(key));
  }

  private updateDependencyGraph(key: string, dependencies: string[]) {
    dependencies.forEach(dep => {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)!.add(key);
    });
  }

  private updateTagIndex(key: string, tags: string[]) {
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  private getDependents(key: string): Set<string> {
    return this.dependencyGraph.get(key) || new Set();
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private isValidEntry(entry: any): entry is CacheEntry {
    return entry && 
           typeof entry === 'object' && 
           'data' in entry && 
           'timestamp' in entry && 
           'ttl' in entry;
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastUsedEntry: CacheEntry | null = null;
    let minScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Calculate eviction score (lower = more likely to evict)
      const ageWeight = (Date.now() - entry.lastAccessed) / entry.ttl;
      const accessWeight = 1 / (entry.accessCount + 1);
      const score = ageWeight + accessWeight;

      if (score < minScore) {
        minScore = score;
        leastUsedKey = key;
        leastUsedEntry = entry;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.removeFromPersistence(leastUsedKey);
      this.stats.evictions++;
    }
  }

  private queueForPersistence(key: string, entry: CacheEntry): void {
    this.batchWriteQueue.set(key, entry);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.flushPendingOperations();
    }, 100); // Batch writes every 100ms
  }

  private flushPendingOperations(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      for (const [key, entry] of this.batchWriteQueue) {
        const serialized = this.serializeEntry(entry);
        if (serialized) {
          localStorage.setItem(`cache_${key}`, serialized);
        }
      }
    } catch (error) {
      console.warn('Failed to flush cache operations:', error);
    } finally {
      this.batchWriteQueue.clear();
      this.batchTimeout = null;
    }
  }

  private serializeEntry(entry: CacheEntry): string | null {
    try {
      const serialized = JSON.stringify(entry);
      
      // Compress if over threshold
      if (serialized.length > this.config.compressionThreshold) {
        // Simple compression placeholder - could use actual compression library
        return serialized;
      }
      
      return serialized;
    } catch (error) {
      console.warn('Failed to serialize cache entry:', error);
      return null;
    }
  }

  private getFromPersistence(key: string): CacheEntry | null {
    if (typeof localStorage === 'undefined') return null;

    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      if (this.isValidEntry(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load from persistence:', error);
    }

    return null;
  }

  private removeFromPersistence(key: string): void {
    if (typeof localStorage === 'undefined') return;

    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.warn('Failed to remove from persistence:', error);
    }
  }

  private triggerUpdateEvent(key: string): void {
    if (typeof window === 'undefined') return;

    try {
      const timestamp = Date.now().toString();
      localStorage.setItem(`${key}_updated`, timestamp);
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: `${key}_updated`,
        newValue: timestamp
      }));
    } catch (error) {
      console.warn('Failed to trigger update event:', error);
    }
  }

  private performMaintenance(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    // Remove expired entries
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeFromPersistence(key);
    });

    // Log maintenance stats
    if (expiredKeys.length > 0) {
      console.log(`Cache maintenance: removed ${expiredKeys.length} expired entries`);
    }
  }

  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    return {
      ...this.stats,
      hitRate: (hitRate * 100).toFixed(2) + '%',
      cacheSize: this.cache.size,
      maxSize: this.config.maxSize
    };
  }

  clear(): void {
    this.cache.clear();
    this.dependencyGraph.clear();
    this.tagIndex.clear();
    this.batchWriteQueue.clear();
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    // Clear persistence
    if (typeof localStorage !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_') || key.endsWith('_updated')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Reset stats
    this.stats = { hits: 0, misses: 0, evictions: 0, operations: 0 };
  }

  // Legacy compatibility methods
  getCacheBustedUrl(url: string): string {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  }

  setMediaUrl(url: string): void {
    if (url) {
      this.set(`media_${url}`, Date.now(), {
        ttl: 30 * 60 * 1000, // 30 minutes
        tags: ['media']
      });
    }
  }

  shouldRefreshMedia(url: string, maxAge: number = 5 * 60 * 1000): boolean {
    if (!url) return false;
    
    const mediaEntry = this.get(`media_${url}`);
    if (!mediaEntry) return true;
    
    const age = Date.now() - (mediaEntry as number);
    return age > maxAge;
  }

  touchMediaUrl(url: string): void {
    this.setMediaUrl(url);
  }

  invalidateMedia(url: string): void {
    this.invalidate(`media_${url}`);
    this.triggerUpdateEvent('media_updated');
  }

  invalidateAllMedia(): void {
    this.invalidateByTag('media');
    this.triggerUpdateEvent('all_media_updated');
  }

  invalidateBarMaxData(): void {
    this.invalidatePattern('bar_max');
    this.triggerUpdateEvent('bar_max_updated');
  }

  markPublish(): void {
    this.triggerUpdateEvent('content_published');
  }

  updateDevicePixelRatio(ratio?: number): void {
    const deviceRatio = ratio || (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
    this.set('device_pixel_ratio', deviceRatio, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      tags: ['device']
    });
  }
}

export const enhancedCacheStrategy = new EnhancedCacheStrategy();
