/* eslint-disable no-console */
/**
 * Demo SATU-GATE: OMS berjalan penuh tanpa platform API, cukup adapter `local`.
 * Jalankan: pnpm demo:local
 *
 * Alur yang dibuktikan:
 *  1) OpenSellvy SDK membaca config → credential local tersedia
 *  2) OAuth connect (exchangeCode → getShop)
 *  3) order.sync menarik "order marketplace" → idempoten
 *  4) order.fulfill → status machine
 *  5) produk didorong ke channel; stok disinkronkan ke "marketplace"
 */
import { OpenSellvy } from 'opensellvy';
import type { TokenStore } from '@opensellvy/connector';
import { registerLocal, getLocalStore } from '@opensellvy/platform-local';

function memoryTokenStore(): TokenStore {
  const map = new Map<string, unknown>();
  return {
    save: (storeId, platform, token) => Promise.resolve(void map.set(`${storeId}:${platform}`, token)),
    get: (storeId, platform) => Promise.resolve(map.get(`${storeId}:${platform}`) as never),
    delete: (storeId, platform) => Promise.resolve(void map.delete(`${storeId}:${platform}`)),
  };
}

async function main(): Promise<void> {
  registerLocal();
  const local = getLocalStore();
  if (!local) throw new Error('local store tidak tersedia');

  const sdk = new OpenSellvy(
    {
      environment: 'sandbox',
      platforms: { local: { appId: 'local', secret: 'local', redirectUri: 'memory://cb' } },
    },
    { tokens: memoryTokenStore() },
  );
  const modules = await sdk.open();

  console.log('== 1. Buat store & konek channel local (OAuth) ==');
  await modules.stores.create({ name: 'Toko Demo', slug: 'toko-demo' });
  const channel = await modules.channels.connect({ storeId: 'store-1', platform: 'local', oauth: { code: 'csrf-safe' } });
  console.log({ connected: channel.shopName, state: channel.auth.state });

  console.log('\n== 2. Order masuk di "marketplace" (seeded langsung) ==');
  local.createOrder('store-1', {
    customer: { id: 'c1', customerName: 'Budi Santoso' },
    lines: [
      { id: 'l1', productId: 'p1', sku: 'SKU-001', name: 'Tumbler Stainless 500ml', quantity: 2, unitPrice: { amount: 85_000, currency: 'IDR' }, total: { amount: 170_000, currency: 'IDR' } },
      { id: 'l2', productId: 'p2', sku: 'SKU-002', name: 'Totebag Kanvas', quantity: 1, unitPrice: { amount: 45_000, currency: 'IDR' }, total: { amount: 45_000, currency: 'IDR' } },
    ],
    status: 'paid',
  });

  const pulled = await modules.orders.sync('store-1');
  console.log('order.sync:', pulled);
  const list = (await modules.orders.list({ storeId: 'store-1' })).items;
  console.log('order masuk ke DB OMS:', list.map((o) => ({ platform: o.platform, channelId: o.channelId, orderNumber: o.orderNumber, status: o.status })));

  console.log('\n== 3. Fulfill: ship order ==');
  const shipped = await modules.orders.fulfill(list[0].id, 'JX-000-LOCAL-1', 'jne');
  console.log({ status: shipped.status, tracking: shipped.shipping.trackingNumber, courier: shipped.shipping.courier });

  console.log('\n== 4. Simpan produk & dorong ke channel ==');
  const tumbler = await modules.products.create({
    storeId: 'store-1',
    name: 'Tumbler Stainless 500ml',
    description: 'Bodies stainless, tutup anti bocor',
    variants: [{ id: 'v1', sku: 'SKU-001', options: { warna: 'silver' }, price: { amount: 85_000, currency: 'IDR' }, stock: 50 }],
    images: [],
    categoryIds: ['c1'],
    attributes: { material: 'stainless' },
    status: 'active',
  });
  await modules.products.pushToChannel(tumbler.id, 'store-1', 'local');
  console.log('produk di "local marketplace":', local.listProducts('store-1').length);

  console.log('\n== 5. Stok: sesuaikan → sinkron ke semua channel ==');
  await modules.inventory.ensureFromProduct(tumbler, 'wh-1');
  await modules.inventory.adjust({ productId: tumbler.id, sku: 'SKU-001', warehouseId: 'wh-1', quantity: 10, reason: 'restock tambahan' });
  const stocked = await modules.inventory.syncToChannels('store-1');
  console.log('sync inventory:', stocked, '| stok yg dilihat marketplace:', local.getStock('store-1', 'SKU-001'));
  console.log('variant.stock di marketplace:', local.getProductBySku('store-1', 'SKU-001')?.variants[0]?.stock);

  console.log('\n== 6. Sync ulang — idempoten (tidak ada order baru) ==');
  const again = await modules.orders.sync('store-1');
  console.log('sync ulang:', again);

  console.log('\n✅ One-gate terbukti: module OMS tidak pernah tahu deretan adapter.');
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});