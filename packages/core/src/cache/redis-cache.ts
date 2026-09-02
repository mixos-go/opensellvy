import Redis from 'ioredis';
import type { CacheService } from './cache.service';

export interface RedisCacheOptions {
  /** connection string redis://... atau opsi ioredis. */
  url?: string;
  client?: Redis;
  /** auto-increment keyspace untuk isolation test/tenant. */
  prefix?: string;
}

/**
 * Cache di atas Redis (ioredis). JSON-serialized; TTL native Redis.
 * `invalidate(pattern)` → SCAN + DEL (klien non-atomik, cukup utk cache).
 */
export class RedisCache implements CacheService {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor(opts?: RedisCacheOptions) {
    this.client = opts?.client ?? new Redis(opts?.url ?? 'redis://127.0.0.1:6379');
    this.prefix = opts?.prefix ?? '';
  }

  private key(raw: string): string {
    return this.prefix ? `${this.prefix}:${raw}` : raw;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const raw = await this.client.get(this.key(key));
    if (raw === null || raw === '') return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds === undefined) {
      await this.client.set(this.key(key), raw);
    } else {
      await this.client.setex(this.key(key), ttlSeconds, raw);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.key(key));
  }

  async invalidate(pattern: string): Promise<void> {
    const full = this.key(pattern);
    const match = full.includes('*') ? full : `${full}*`;
    let cursor = '0';
    do {
      const [next, keys] = await this.client.scan(cursor, 'MATCH', match, 'COUNT', 100);
      cursor = next;
      if (keys.length) await this.client.del(...keys);
    } while (cursor !== '0');
  }

  async flush(): Promise<void> {
    await this.client.flushdb();
  }

  async quit(): Promise<void> {
    if (this.client.status === 'ready' || this.client.status === 'wait') {
      await this.client.quit();
    }
  }
}

export function createRedisCache(opts?: RedisCacheOptions): CacheService {
  return new RedisCache(opts);
}