import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRedisCache, RedisCache } from '../src/cache/redis-cache';

const URL = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';

describe('RedisCache (integrasi Redis nyata)', () => {
  let cache: RedisCache;

  beforeAll(async () => {
    cache = new RedisCache({ url: URL, prefix: `test-${Date.now()}` });
  });

  afterAll(async () => {
    await cache.quit();
  });

  it('set/get roundtrip + del', async () => {
    await cache.set('k', { a: 1 });
    expect(await cache.get('k')).toEqual({ a: 1 });
    await cache.del('k');
    expect(await cache.get('k')).toBeUndefined();
  });

  it('TTL: memakai PTTL Redis', async () => {
    await cache.set('ttl', 'v', 1);
    expect(await cache.get('ttl')).toBe('v');
    await new Promise((r) => setTimeout(r, 1100));
    expect(await cache.get('ttl')).toBeUndefined();
  });

  it('invalidate prefix & glob (SCAN+DEL)', async () => {
    await cache.set('users:1', 'a');
    await cache.set('users:2', 'b');
    await cache.set('orders:1', 'c');
    await cache.invalidate('users:*');
    expect(await cache.get('users:1')).toBeUndefined();
    expect(await cache.get('users:2')).toBeUndefined();
    expect(await cache.get('orders:1')).toBe('c');
  });

  it('nilai korup dianggap miss', async () => {
    const raw = new RedisCache({ url: URL, prefix: `test-raw-${Date.now()}` });
    await raw['client'].set('bad', '{{not-json');
    expect(await raw.get('bad')).toBeUndefined();
    await raw.quit();
  });
});