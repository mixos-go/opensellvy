import { describe, expect, it } from 'vitest';
import { createMemoryCache } from '../src/cache/memory-cache';

describe('MemoryCache', () => {
  it('set/get roundtrip tanpa TTL', async () => {
    const cache = createMemoryCache({ sweepIntervalMs: 0 });
    await cache.set('x', { a: 1 });
    expect(await cache.get('x')).toEqual({ a: 1 });
    expect(await cache.get('nope')).toBeUndefined();
  });

  it('TTL: nilai kedaluwarsa dianggap miss', async () => {
    const cache = createMemoryCache({ sweepIntervalMs: 0 });
    await cache.set('x', 'v', 0.01);
    expect(await cache.get('x')).toBe('v');
    await new Promise((r) => setTimeout(r, 30));
    expect(await cache.get('x')).toBeUndefined();
  });

  it('nilai non-TTL tidak ikut kedaluwarsa', async () => {
    const cache = createMemoryCache({ sweepIntervalMs: 0 });
    await cache.set('x', 'v');
    await new Promise((r) => setTimeout(r, 30));
    expect(await cache.get('x')).toBe('v');
  });

  it('del menghapus key', async () => {
    const cache = createMemoryCache({ sweepIntervalMs: 0 });
    await cache.set('x', 1);
    await cache.del('x');
    expect(await cache.get('x')).toBeUndefined();
  });

  it('invalidate prefix dan glob', async () => {
    const cache = createMemoryCache({ sweepIntervalMs: 0 });
    await cache.set('users:1', 'a');
    await cache.set('users:2', 'b');
    await cache.set('orders:1', 'c');
    await cache.invalidate('users:*');
    expect(await cache.get('users:1')).toBeUndefined();
    expect(await cache.get('users:2')).toBeUndefined();
    expect(await cache.get('orders:1')).toBe('c');

    await cache.invalidate('orders:1');
    expect(await cache.get('orders:1')).toBeUndefined();
  });
});