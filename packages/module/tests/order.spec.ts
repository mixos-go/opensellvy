import { describe, expect, it, beforeEach } from 'vitest';
import type { PlatformPlugin, TokenStore } from '@opensellvy/connector';
import { connectors, registerPlatform } from '@opensellvy/connector';
import type { UnifiedOrder, UnifiedProduct } from '@opensellvy/types';
import { createServices } from '../src';

function memoryTokenStore(): TokenStore {
  const map = new Map<string, unknown>();
  return {
    save: (storeId, platform, token) => Promise.resolve(void map.set(`${storeId}:${platform}`, token)),
    get: (storeId, platform) => Promise.resolve(map.get(`${storeId}:${platform}`) as never),
    delete: (storeId, platform) => Promise.resolve(void map.delete(`${storeId}:${platform}`)),
  };
}

let orderCounter = 0;
let shopCounter = 0;
const seeded = new Map<string, UnifiedOrder>();
const registryOrder = { id: 'n/a', storeId: 'n/a', channelId: 'n/a', platform: 'local' } as const;
const baseShop = { platformShopId: 'shop-local', shopName: 'Local Shop', marketplace: 'local' };
const token = { accessToken: 't', expiresAt: Date.now() + 60_000 };

const dummy: PlatformPlugin = {
  platform: 'local',
  name: 'Local',
  baseUrl: 'memory://local',
  capabilities: ['order.pull', 'order.push', 'product.pull', 'product.push', 'inventory.sync'],
  auth: {
    getAuthorizeUrl: (_c) => Promise.resolve('http://local/authorize'),
    exchangeCode: (_c, _code) => Promise.resolve(token),
    refreshToken: () => Promise.resolve({ accessToken: '' }),
  },
  gateway: {
    getShop: () => Promise.resolve(baseShop),
    pullOrders: () => Promise.resolve([...seeded.values()]),
    getOrder: (_c, id) => {
      const found = [...seeded.values()].find((o) => o.platformOrderId === id);
      return found ? Promise.resolve(found) : Promise.reject(new Error('not found'));
    },
    pushOrder: () => Promise.resolve(),
    updateOrder: () => Promise.resolve(),
    pullProducts: () => Promise.resolve([]),
    pushProduct: () => Promise.resolve(),
    pushProducts: () => Promise.resolve(),
    syncInventory: () => Promise.resolve(),
    manageReturn: () => Promise.resolve(),
  },
  webhook: {
    verify: () => Promise.resolve(true),
    map: (event, payload) => Promise.resolve({ type: event, data: payload }),
  },
};

function seedOrder(storeId: string): UnifiedOrder {
  orderCounter += 1;
  const now = new Date().toISOString();
  const order: UnifiedOrder = {
    ...registryOrder,
    id: `order-${orderCounter}`,
    storeId,
    channelId: `ch-local`,
    platform: 'local',
    platformOrderId: `P${orderCounter}`,
    orderNumber: `INV-${orderCounter}`,
    customer: { id: `cust-${orderCounter}`, customerName: 'Budi' },
    lines: [{ id: `l-${orderCounter}`, productId: `p-${orderCounter}`, sku: `SKU-${orderCounter}`, name: 'Produk', quantity: 2, unitPrice: { amount: 50_000, currency: 'IDR' }, total: { amount: 100_000, currency: 'IDR' } }],
    shipping: { address: { line1: 'Jln. Merdeka 1', city: 'Jakarta', province: 'DKI Jakarta', country: 'ID', postalCode: '10110' }, courier: 'jne', service: 'REG' },
    totals: { subtotal: { amount: 100_000, currency: 'IDR' }, shippingFee: { amount: 12_000, currency: 'IDR' }, discount: { amount: 0, currency: 'IDR' }, tax: { amount: 0, currency: 'IDR' }, grandTotal: { amount: 112_000, currency: 'IDR' } },
    status: 'paid',
    createdAt: now,
    updatedAt: now,
  };
  seeded.set(order.platformOrderId, order);
  return order;
}

describe('order module — satu gate (domain logic tanpa platform hardcode)', () => {
  beforeEach(() => {
    orderCounter = 0;
    shopCounter = 0;
    seeded.clear();
    connectors.register(dummy, { replace: true });
  });

  it('connect channel via OAuth, lalu sync menarik order dari adapter', async () => {
    seedOrder('store-1');
    seedOrder('store-1');

    const services = createServices({ deps: { registry: connectors, tokens: memoryTokenStore(), credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }) } });

    const store = await services.stores.create({ name: 'Toko', slug: 'toko', config: { timezone: 'Asia/Jakarta', currency: 'IDR' } });
    const channel = await services.channels.connect({
      storeId: store.id,
      platform: 'local',
      oauth: { code: 'auth-code' },
    });
    expect(channel.shopName).toBe('Local Shop');
    expect(channel.auth.state).toBe('connected');

    const res = await services.orders.sync(store.id);
    expect(res).toEqual({ pulled: 2, created: 2, updated: 0 });

    const stored = await services.orders.list({ storeId: store.id, platform: 'local' });
    expect(stored.items).toHaveLength(2);
    expect(stored.items[0].storeId).toBe(store.id);

    // idempoten — sync lagi tidak menambah
    const again = await services.orders.sync(store.id);
    expect(again.created).toBe(0);
  });

  it('updateStatus mengikuti status machine & emit events', async () => {
    seedOrder('store-1');
    const events: string[] = [];
    const services = createServices({
      deps: {
        registry: connectors,
        tokens: memoryTokenStore(),
        credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }),
        events: { emit: async (name) => void events.push(name) },
      },
    });
    await services.stores.create({ name: 'Toko', slug: 'toko' });
    await services.channels.connect({ storeId: 'store-1', platform: 'local', oauth: { code: 'c' } });
    await services.orders.sync('store-1');

    const [order] = (await services.orders.list({ storeId: 'store-1' })).items;
    const shipped = await services.orders.fulfill(order.id, 'JNE123', 'jne');
    expect(shipped.status).toBe('shipped');
    expect(shipped.shipping.trackingNumber).toBe('JNE123');
    expect(events).toContain('order.status.updated');

    const cancelled = await services.orders.updateStatus(order.id, { action: 'cancel', reason: 'buyer batal' });
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeTruthy();
  });

  it('inventory adjust + sync stock ke channel', async () => {
    seedOrder('store-1');
    let syncedPayload: Array<{ sku: string; stock: number }> = [];
    const plugin = connectors.get('local');
    plugin.gateway.syncInventory = (_, items) => {
      syncedPayload = items as never;
      return Promise.resolve();
    };

    const services = createServices({
      deps: { registry: connectors, tokens: memoryTokenStore(), credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }) },
    });
    await services.channels.connect({ storeId: 'store-1', platform: 'local', oauth: { code: 'c' } });

    // seed product manual + inventory
    const product = await services.products.create({
      storeId: 'store-1',
      name: 'Produk',
      description: 'x',
      variants: [{ id: 'v1', sku: 'SKU-1', options: {}, price: { amount: 50_000, currency: 'IDR' }, stock: 0 }],
      images: [],
      categoryIds: [],
      attributes: {},
      status: 'active',
    });
    await services.inventory.ensureFromProduct(product, 'wh-1');
    await services.inventory.adjust({ productId: product.id, sku: 'SKU-1', warehouseId: 'wh-1', quantity: 10, reason: 'initial' });

    await services.inventory.syncToChannels('store-1');
    expect(syncedPayload).toEqual([{ sku: 'SKU-1', stock: 10, warehouseId: 'wh-1' }]);

    const items = await services.inventory.get('SKU-1');
    expect(items[0].stock.available).toBe(10);
    await services.inventory.adjust({ productId: product.id, sku: 'SKU-1', warehouseId: 'wh-1', quantity: -13, reason: 'oversell' })
      .then(() => expect.fail('harusnya menolak stock negatif'))
      .catch((e) => expect(String(e)).toContain('Stock tidak cukup'));
  });

  it('push product ke channel terhubung (adapter menerima UnifiedProduct)', async () => {
    let pushed: UnifiedProduct | undefined;
    const plugin = connectors.get('local');
    plugin.gateway.pushProduct = (_c, p) => {
      pushed = p;
      return Promise.resolve();
    };

    const services = createServices({ deps: { registry: connectors, tokens: memoryTokenStore(), credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }) } });
    await services.channels.connect({ storeId: 'store-1', platform: 'local', oauth: { code: 'c' } });

    const product = await services.products.create({
      storeId: 'store-1',
      name: 'Produk',
      description: 'x',
      variants: [{ id: 'v1', sku: 'SKU-1', options: {}, price: { amount: 50_000, currency: 'IDR' } }],
      images: [],
      categoryIds: [],
      attributes: {},
      status: 'active',
    });
    await services.products.pushToChannel(product.id, 'store-1', 'local');
    expect(pushed?.id).toBe(product.id);
  });

  it('channel tidak terhubung → sync tidak berjalan', async () => {
    const services = createServices({ deps: { registry: connectors } });
    const res = await services.orders.sync('store-1');
    expect(res.created).toBe(0);
  });

  it('lazy-refresh token saat expiresAt mendekati kedaluwarsa, lalu dipersist', async () => {
    let refreshed = 0;
    const plugin = connectors.get('local');
    plugin.auth.refreshToken = () => {
      refreshed += 1;
      return Promise.resolve({ accessToken: 'fresh', refreshToken: 'fresh-refresh', expiresAt: Date.now() + 3600_000 });
    };

    const tokens = memoryTokenStore();
    // simpan token yang SUDAH kedaluwarsa
    await tokens.save('store-1', 'local', { accessToken: 'stale', expiresAt: Date.now() - 1_000 });

    const services = createServices({ deps: { registry: connectors, tokens, credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }) } });
    let lastToken = '';
    plugin.gateway.syncInventory = (_c, _items) => {
      lastToken = _c.token.accessToken;
      return Promise.resolve();
    };

    await services.channels.connect({ storeId: 'store-1', platform: 'local', oauth: { code: 'c' } });
    const product = await services.products.create({
      storeId: 'store-1', name: 'P', description: 'x',
      variants: [{ id: 'v1', sku: 'SKU-R', options: {}, price: { amount: 10_000, currency: 'IDR' }, stock: 0 }],
      images: [], categoryIds: [], attributes: {}, status: 'active',
    });
    await services.inventory.ensureFromProduct(product, 'wh-1');
    await services.inventory.syncToChannels('store-1');

    expect(refreshed).toBeGreaterThan(0);
    expect(lastToken).toBe('fresh');
    // token baru ter-persist
    const persisted = await tokens.get('store-1', 'local');
    expect(persisted.accessToken).toBe('fresh');
  });
});