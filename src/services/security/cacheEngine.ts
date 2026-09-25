/**
 * Production In-Memory TTL Cache Engine
 * Provides sub-millisecond response caching for read-heavy resources
 * with automated expiration and hit-rate monitoring.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheEngine {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    // Purge expired entries every 3 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, 180_000);
  }

  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlMs: number = 60_000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  public invalidate(prefixOrKey: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 100;
    return {
      activeKeys: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatePercent: Math.round(hitRate * 10) / 10,
    };
  }
}

export const serverCache = new CacheEngine();
