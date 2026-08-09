// Simple in-memory cache for performance optimization.
// Process-local: for multi-instance deploys, replace the backend with Redis
// while keeping this get/set/delete/clearByPrefix API stable.
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_MAX_ENTRIES = 500;

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly maxEntries: number;

  constructor(maxEntries: number = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = Math.max(1, maxEntries);
  }

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Refresh insertion order for LRU on overwrite
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });

    this.evictIfNeeded();
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    // Move to most-recently-used position (Map preserves insertion order)
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear all cache entries that match a prefix pattern
  clearByPrefix(prefix: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all property-related caches
  clearPropertyCaches(): void {
    this.clearByPrefix('search_properties_');
    this.clearByPrefix('property_');
    this.clearByPrefix('most_viewed_');
    console.log('Property search caches cleared');
  }

  // Clean expired entries periodically
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictIfNeeded(): void {
    while (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) break;
      this.cache.delete(oldestKey);
    }
  }
}

export const cache = new MemoryCache(
  Number(process.env.CACHE_MAX_ENTRIES) > 0
    ? Number(process.env.CACHE_MAX_ENTRIES)
    : DEFAULT_MAX_ENTRIES,
);

// Clean expired entries every 5 minutes
setInterval(() => {
  cache.cleanExpired();
}, 5 * 60 * 1000);
