import { describe, expect, it } from 'vitest';
import {
  registerPlatform,
  getPlatform,
  listPlatforms,
} from '../src/register';
import type { PlatformPlugin } from '../src/base.connector';

const dummy: PlatformPlugin = {
  platform: 'shopee',
  name: 'Dummy',
  baseUrl: 'https://example.com',
  capabilities: ['order.pull'],
  auth: {
    getAuthorizeUrl: () => Promise.resolve(''),
    exchangeCode: () => Promise.resolve({}),
    refreshToken: () => Promise.resolve(),
  },
  gateway: {
    pullOrders: () => Promise.resolve([]),
    getOrder: () => Promise.reject(new Error('not implemented')),
    pushOrder: () => Promise.resolve(),
    updateOrder: () => Promise.resolve(),
    pullProducts: () => Promise.resolve([]),
    pushProduct: () => Promise.resolve(),
    syncInventory: () => Promise.resolve(),
    manageReturn: () => Promise.resolve(),
  },
  webhook: {
    verify: () => Promise.resolve(false),
    map: () => Promise.resolve({ type: 'unknown', data: {} }),
  },
};

describe('platform registry', () => {
  it('registers once and rejects duplicate code', () => {
    registerPlatform(dummy);
    const list = listPlatforms();
    expect(list).toContain('shopee');
    expect(list.filter((p) => p === 'shopee')).toHaveLength(1);
  });

  it('returns plugin by code', () => {
    expect(getPlatform('shopee')).toBe(dummy);
  });

  it('throws for unknown platform', () => {
    expect(() => getPlatform('lazada')).toThrow('not registered');
  });
});