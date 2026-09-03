import { describe, expect, it, beforeEach } from 'vitest';
import { connectors } from '@opensellvy/connector';
import type { TokenStore, PlatformCredentials } from '@opensellvy/connector';
import { createServices, type ModuleDeps } from '@opensellvy/module';
import { createLocalPlugin, LocalStore } from '../src';

function memoryTokenStore(): TokenStore {
  const map = new Map<string, unknown>();
  return {
    save: (storeId, platform, token) => Promise.resolve(void map.set(`${storeId}:${platform}`, token)),
    get: (storeId, platform) => Promise.resolve(map.get(`${storeId}:${platform}`) as never),
    delete: (storeId, platform) => Promise.resolve(void map.delete(`${storeId}:${platform}`)),
  };
}

const credentials: () => Promise<PlatformCredentials> = async () => ({ appId: 'local', secret: 'x', redirectUri: 'memory://cb' });

function deps(overrides: Partial<ModuleDeps> = {}): ModuleDeps {
  return { registry: connectors, tokens: memoryTokenStore(), credentials, ...overrides };
}

describe('one-gate end-to-end dengan adapter LOCAL (tanpa platform API)', () => {
  let store: LocalStore;
  let services: ReturnType<typeof createServices>;

  beforeEach(() => {
    store = new LocalStore();
    connectors.register(createLocalPlugin({ store }), { replace: true });
    services = createServices({ deps: deps() });
  });

  it('connect → sync order masuk → idempoten → stok sinkron + produk didorong', async () => {
    // pending order sudah ada "di luar" (simulasi marketplace)
    store.createOrder('store-1', {
      customer: { id: 'c1', customerName: 'Budi' },
      lines: [
        { id: 'l1', productId: 'p1', sku: 'SKU-1', name: 'Produk A', quantity: 2, unitPrice: { amount: 50_000, currency: 'IDR' }, total: { amount: 100_000, currency: 'IDR' } },
      ],
      status: 'paid',
    });

    await services.stores.create({ name: 'Toko Demo', slug: 'demo' });

    // 1) OAuth connect
    const channel = await services.channels.connect({ storeId: 'store-1', platform: 'local', oauth: { code: 'csrf-safe' } });
    expect(channel.shopName).toBe('Local Shop');
    expect(channel.auth.state).toBe('connected');

    // 2) tarik order lewat satu gate
    const first = await services.orders.sync('store-1');
    expect(first).toEqual({ pulled: 1, created: 1, updated: 0 });

    const [order] = (await services.orders.list({ storeId: 'store-1' })).items;
    expect(order.platform).toBe('local');
    expect(order.customer.customerName).toBe('Budi');

    // 3) status machine (fulfill)
    const shipped = await services.orders.fulfill(order.id, 'LOC-AWB-1', 'jne');
    expect(shipped.status).toBe('shipped');

    // 4) idempotent: sync ulang tidak melipatgandakan & status dua arah sinkron
    const again = await services.orders.sync('store-1');
    expect(again).toEqual({ pulled: 1, created: 0, updated: 0 });
    expect(store.getOrder('store-1', order.platformOrderId)?.status).toBe('shipped');

    // 5) produk di dorong ke "marketplace"
    const product = await services.products.create({
      storeId: 'store-1',
      name: 'Produk A',
      description: 'demo',
      variants: [{ id: 'v1', sku: 'SKU-1', options: {}, price: { amount: 50_000, currency: 'IDR' }, stock: 0 }],
      images: [],
      categoryIds: [],
      attributes: {},
      status: 'active',
    });
    await services.products.pushToChannel(product.id, 'store-1', 'local');
    expect(store.listProducts('store-1')).toHaveLength(1);

    // 6) stok disesuaikan → disinkronkan → marketplace melihat stok baru
    await services.inventory.ensureFromProduct(product, 'wh-1');
    await services.inventory.adjust({ productId: product.id, sku: 'SKU-1', warehouseId: 'wh-1', quantity: 12, reason: 'restock' });
    await services.inventory.syncToChannels('store-1');
    expect(store.getStock('store-1', 'SKU-1')).toBe(12);
    expect((await services.inventory.get('SKU-1'))[0].stock.available).toBe(12);
    expect(store.getProductBySku('store-1', 'SKU-1')?.variants[0]?.stock).toBe(12);
  });

  it('adapter melayani banyak store tanpa saling mencampur', async () => {
    store.createOrder('store-1', { orderNumber: 'LC-0001', customer: { id: 'c1', customerName: 'A' }, lines: [], status: 'paid' });
    store.createOrder('store-2', { orderNumber: 'LC-0002', customer: { id: 'c2', customerName: 'B' }, lines: [], status: 'paid' });

    await services.channels.connect({ storeId: 'store-1', platform: 'local', oauth: { code: 'a' } });
    await services.orders.sync('store-1');
    const s1 = (await services.orders.list({ storeId: 'store-1' })).items;
    expect(s1).toHaveLength(1);
    expect(s1[0].customer.customerName).toBe('A');

    await services.channels.connect({ storeId: 'store-2', platform: 'local', oauth: { code: 'b' } });
    await services.orders.sync('store-2');
    const s2 = (await services.orders.list({ storeId: 'store-2' })).items;
    expect(s2).toHaveLength(1);
    expect(s2[0].customer.customerName).toBe('B');
    // tidak bocor antar store
    expect((await services.orders.list({ storeId: 'store-1' })).items).toHaveLength(1);
  });

  it('webhook local = passthrough (verify true, map echo)', async () => {
    const plugin = connectors.get('local');
    expect(await plugin.webhook.verify({}, 'sig')).toBe(true);
    const mapped = await plugin.webhook.map('order.status', { id: 'x' });
    expect(mapped).toEqual({ type: 'order.status', data: { id: 'x' } });
  });

  it('return refund → order lokal menjadi returned & return tersimpan di marketplace', async () => {
    store.createOrder('store-1', {
      customer: { id: 'c1', customerName: 'Budi' },
      lines: [
        { id: 'l1', productId: 'p1', sku: 'SKU-1', name: 'Produk A', quantity: 1, unitPrice: { amount: 50_000, currency: 'IDR' }, total: { amount: 50_000, currency: 'IDR' } },
      ],
      status: 'paid',
    });
    await services.stores.create({ name: 'Toko Demo', slug: 'demo-2' });
    const channel = await services.channels.connect({ storeId: 'store-1', platform: 'local', oauth: { code: 'r' } });
    await services.orders.sync('store-1');

    const [order] = (await services.orders.list({ storeId: 'store-1' })).items;
    const request = await services.returns.create({
      orderId: order.id,
      channelId: channel.id,
      lines: [{ orderLineId: order.lines[0].id, sku: order.lines[0].sku, quantity: 1 }],
      reason: 'defective',
      note: 'screening retak',
    });
    store.setReturn(request);

    await services.returns.notifyPlatform(request.id, 'store-1', 'refund');

    expect(store.getReturn(request.id)?.status).toBe('refunded');
    expect(store.getOrder('store-1', order.platformOrderId)?.status).toBe('returned');

    const rejected = await store.applyReturnAction('store-1', store.getReturn(request.id)!, 'reject');
    expect(rejected.status).toBe('rejected');
    expect(store.getOrder('store-1', order.platformOrderId)?.status).toBe('returned');
  });
});