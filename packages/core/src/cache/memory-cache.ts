import type { CacheService } from './cache.service';

interface CacheEntry {
  value: unknown;
  expiresAt: number | null;
}

export interface MemoryCacheOptions {
  /** interval async cleanup expired entries (ms). 0 = nonaktif. */
  sweepIntervalMs?: number;
}

/**
 * Cache in-memory dengan TTL (lazy expiry + optional periodic sweep).
 * `invalidate(pattern)` mendukung prefix (`users:*`) dan glob sederhana (`*`).
 */
export class MemoryCache implements CacheService {
  private readonly store = new Map<string, CacheEntry>();
  private readonly timer: ReturnType<typeof setInterval> | undefined;

  constructor(opts?: MemoryCacheOptions) {
    const interval = opts?.sweepIntervalMs ?? 60_000;
    if (interval > 0) {
      this.timer = setInterval(() => this.sweep(), interval);
      this.timer.unref?.();
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds === undefined ? null : Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidate(pattern: string): Promise<void> {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.split('*').map(escapeRegex).join('.*') + '$');
      for (const key of this.store.keys()) {
        if (regex.test(key)) this.store.delete(key);
      }
      return;
    }
    this.store.delete(pattern);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) this.store.delete(key);
    }
  }
}

export function createMemoryCache(opts?: MemoryCacheOptions): CacheService & Pick<MemoryCache, 'clear' | 'dispose' | 'size'> {
  return new MemoryCache(opts);
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}