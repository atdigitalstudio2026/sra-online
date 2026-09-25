/**
 * Production Sliding-Window Rate Limiter
 * Provides IP-based rate limiting with granular bucket limits
 * and automated memory cleanup to prevent DoS & brute force attacks.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  bucketName: string;
}

class MemoryRateLimiter {
  private buckets: Map<string, RateLimitEntry> = new Map();
  private options: RateLimiterOptions;
  private totalBlocked: number = 0;
  private totalChecked: number = 0;

  constructor(options: RateLimiterOptions) {
    this.options = options;

    // Periodic cleanup of stale entries every 2 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.buckets.entries()) {
        if (now > entry.resetAt) {
          this.buckets.delete(key);
        }
      }
    }, 120_000);
  }

  public check(ip: string): { allowed: boolean; remaining: number; resetInSec: number; totalLimit: number } {
    this.totalChecked++;
    const now = Date.now();
    const key = `${this.options.bucketName}:${ip || '127.0.0.1'}`;
    const entry = this.buckets.get(key);

    if (!entry || now > entry.resetAt) {
      // First hit or window expired
      this.buckets.set(key, {
        count: 1,
        resetAt: now + this.options.windowMs,
      });
      return {
        allowed: true,
        remaining: this.options.maxRequests - 1,
        resetInSec: Math.ceil(this.options.windowMs / 1000),
        totalLimit: this.options.maxRequests,
      };
    }

    if (entry.count >= this.options.maxRequests) {
      this.totalBlocked++;
      const resetInSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetInSec,
        totalLimit: this.options.maxRequests,
      };
    }

    entry.count++;
    const resetInSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return {
      allowed: true,
      remaining: this.options.maxRequests - entry.count,
      resetInSec,
      totalLimit: this.options.maxRequests,
    };
  }

  public getStats() {
    return {
      bucket: this.options.bucketName,
      windowMs: this.options.windowMs,
      maxRequests: this.options.maxRequests,
      activeTrackedIps: this.buckets.size,
      totalChecked: this.totalChecked,
      totalBlocked: this.totalBlocked,
    };
  }

  public resetAll() {
    this.buckets.clear();
  }
}

// 1. Global API Rate Limiter: 400 requests per 15 mins
export const globalApiLimiter = new MemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 400,
  bucketName: 'global_api',
});

// 2. Sensitive Payment Creation Limiter: 20 attempts per minute
export const paymentLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  bucketName: 'payment_checkout',
});

// 3. Admin Protected Actions Limiter: 100 requests per minute
export const adminLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  bucketName: 'admin_actions',
});

export function getRateLimiterStats() {
  return {
    global: globalApiLimiter.getStats(),
    payment: paymentLimiter.getStats(),
    admin: adminLimiter.getStats(),
    enabled: true,
  };
}
