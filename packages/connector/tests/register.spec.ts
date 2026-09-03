import { describe, expect, it } from 'vitest';
import { registerPlatform, getPlatform, listPlatforms } from '../src/register';
import type { PlatformPlugin, PlatformGateway } from '../src/base.connector';

export const dummyGateway: PlatformGateway = {
  shop: { getProfile: () => Promise.resolve({ platformShopId: 'shop-1', shopName: 'Dummy', marketplace: 'Dummy' }), updateProfile: () => Promise.resolve() },
  order: {
    pull: () => Promise.resolve([]),
    get: () => Promise.reject(new Error('not implemented')),
    push: () => Promise.resolve(),
    update: () => Promise.resolve(),
    track: () => Promise.resolve([]),
  },
  product: {
    pull: () => Promise.resolve([]),
    push: () => Promise.resolve(),
    update: () => Promise.resolve(),
    listCategories: () => Promise.resolve([]),
  },
  inventory: {
    getStockLevels: () => Promise.resolve([]),
    sync: () => Promise.resolve(),
    adjust: () => Promise.resolve(),
  },
  fulfillment: {
    ship: () => Promise.resolve(),
    updateStatus: () => Promise.resolve(),
  },
  returns: {
    list: () => Promise.resolve([]),
    get: () => Promise.reject(new Error('not implemented')),
    act: () => Promise.resolve(),
  },
  shipping: {
    getRates: () => Promise.resolve([]),
    listShipments: () => Promise.resolve([]),
    getShipment: () => Promise.reject(new Error('not implemented')),
  },
  payment: {
    list: () => Promise.resolve([]),
    get: () => Promise.reject(new Error('not implemented')),
    refund: () => Promise.resolve(),
  },
  promotion: {
    list: () => Promise.resolve([]),
    get: () => Promise.reject(new Error('not implemented')),
    create: (c, p) => Promise.resolve(p),
    update: () => Promise.resolve(),
    setActive: () => Promise.resolve(),
  },
  media: {
    upload: () => Promise.reject(new Error('not implemented')),
    list: () => Promise.resolve([]),
  },
  merchant: {
    getProfile: () => Promise.reject(new Error('not implemented')),
  },
};

const dummy: PlatformPlugin = {
  platform: 'shopee',
  name: 'Dummy',
  baseUrl: 'https://example.com',
  capabilities: ['order.pull'],
  auth: {
    getAuthorizeUrl: (_c) => Promise.resolve(''),
    exchangeCode: (_c, _code) => Promise.resolve({ accessToken: '' }),
    refreshToken: () => Promise.resolve({ accessToken: '' }),
  },
  gateway: dummyGateway,
  webhook: {
    verify: () => Promise.resolve(false),
    map: () => Promise.resolve({ type: 'unknown', data: {} }),
  },
};

describe('platform registry', () => {
  it('registers a plugin and lists its platform', () => {
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

  it('rejects silent duplicate registration by default', () => {
    expect(() => registerPlatform(dummy)).toThrow('sudah terdaftar');
    // plugin asli dipertahankan
    expect(getPlatform('shopee')).toBe(dummy);
  });

  it('allows replacing a plugin explicitly', () => {
    const other: PlatformPlugin = {
      ...dummy,
      name: 'Dummy v2',
      gateway: {
        ...dummy.gateway,
        shop: { ...dummy.gateway.shop, getProfile: () => Promise.resolve({ platformShopId: 's2', shopName: 'V2', marketplace: 'X' }) },
      },
    };
    expect(() => registerPlatform(other, { replace: true })).not.toThrow();
    expect(getPlatform('shopee')).toBe(other);
  });
});