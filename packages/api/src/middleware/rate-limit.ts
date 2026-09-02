import type { MiddlewareHandler } from 'hono';

export interface RateLimitOptions {
  /** jumlah request maksimum per window. */
  limit?: number;
  /** panjang window dalam detik. */
  windowSeconds?: number;
  keyFn?: (c: Parameters<MiddlewareHandler>[0]) => string;
}

const DEFAULTS = { limit: 100, windowSeconds: 60 };

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter in-memory (token bucket) per client key (default IP).
 * Untuk multi-instance, ganti dengan store terdistribusi (mis. Redis) —
 * interface ini sengaja lokal & ringan.
 */
export function rateLimit(options: RateLimitOptions = {}): MiddlewareHandler {
  const opts = { ...DEFAULTS, ...options };
  const buckets = new Map<string, Bucket>();

  return async (c, next) => {
    const key = options.keyFn ? options.keyFn(c) : c.req.header('x-forwarded-for') ?? c.env?.ip ?? 'local';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + opts.windowSeconds * 1000 };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    c.header('X-RateLimit-Limit', String(opts.limit));
    c.header('X-RateLimit-Remaining', String(Math.max(0, opts.limit - bucket.count)));
    if (bucket.count > opts.limit) {
      return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, 429);
    }
    await next();
  };
}
