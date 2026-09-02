import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { schema } from '../src';
import { createPostgresRepositories } from '@opensellvy/db-pg';
import { createServices } from '@opensellvy/module';
import { connectors } from '@opensellvy/connector';
import { createLocalPlugin, LocalStore } from '@opensellvy/platform-local';

const ADDRESS = {
  name: 'Warung Serba Ada',
  phone: '0812-3456-7890',
  province: 'Jawa Barat',
  city: 'Bandung',
  district: 'Coblong',
  subDistrict: 'Dago',
  postalCode: '40135',
  detail: 'Jl. Dago Asri No. 10',
};

async function seed(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL wajib di-set (mis. dari .env)');

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  const repos = createPostgresRepositories(db);

  // Satu-gate registry: adapter local saja (marketplace simulasi).
  const store = new LocalStore();
  connectors.register(createLocalPlugin({ store }));

  const services = createServices({
    deps: {
      registry: connectors,
      tokens: {
        save: () => Promise.resolve(),
        get: () => Promise.resolve({ accessToken: 'seed-token', refreshToken: 'seed-refresh', expiresAt: Date.now() + 24 * 3600_000 }),
        delete: () => Promise.resolve(),
      },
      credentials: async () => ({ appId: 'local', secret: 'local', redirectUri: 'memory://cb' }),
    },
    repositories: repos,
  });

  console.log('\n== Seed: bootstrap merchant lokal di Postgres ==');

  // 1. Store
  const merchant = await services.stores.create({
    name: 'Warung Serba Ada',
    slug: 'warung-serba-ada',
    config: { timezone: 'Asia/Jakarta', currency: 'IDR' },
  });
  console.log('store:', merchant.id, merchant.name);

  // 2. Warehouse default
  const wh = await services.warehouses.create({
    storeId: merchant.id,
    code: 'WH-BDG-01',
    name: 'Gudang Bandung',
    address: ADDRESS,
  });
  await services.warehouses.setDefault(wh.id);
  console.log('warehouse:', wh.id, wh.name, '(default)');

  // 3. Produk + stok
  const products = [
    { name: 'Tumbler Stainless 500ml', sku: 'SKU-001', price: 85_000, stock: 120 },
    { name: 'Totebag Kanvas', sku: 'SKU-002', price: 45_000, stock: 80 },
    { name: 'Botol Minum Tritan 1L', sku: 'SKU-003', price: 65_000, stock: 60 },
    { name: 'Tas Ransel Urban', sku: 'SKU-004', price: 195_000, stock: 40 },
  ];
  for (const p of products) {
    const created = await services.products.create({
      storeId: merchant.id,
      name: p.name,
      description: `Produk seed ${p.name}`,
      variants: [{ id: `v-${p.sku}`, sku: p.sku, options: {}, price: { amount: p.price, currency: 'IDR' }, stock: 0 }],
      images: [],
      categoryIds: [],
      attributes: {},
      status: 'active',
    });
    await services.inventory.ensureFromProduct(created, wh.id);
    await services.inventory.adjust({ productId: created.id, sku: p.sku, warehouseId: wh.id, quantity: p.stock, reason: 'seed' });
    console.log('product:', created.id, p.name, `stok ${p.stock}`);
  }

  // 4. Pelanggan contoh
  const customer = await services.customers.create({ storeId: merchant.id, name: 'Budi Santoso', phone: '0813-1111-2222', tags: ['regular'] });
  console.log('customer:', customer.id, customer.name);

  // 5. Connect channel `local` (simulasi OAuth) + order "dari marketplace"
  const channel = await services.channels.connect({ storeId: merchant.id, platform: 'local', oauth: { code: 'seed' } });
  console.log('channel:', channel.id, channel.platform, channel.auth.state);

  store.createOrder(merchant.id, { customer: { id: 'c-seed', customerName: 'Budi Santoso' }, status: 'paid' });
  store.createOrder(merchant.id, { customer: { id: 'c-seed', customerName: 'Budi Santoso' }, status: 'paid' });
  const sync = await services.orders.sync(merchant.id);
  console.log('orders seeded (sync):', sync);

  console.log('\n✅ Seed selesai. Store', merchant.slug, 'siap dipakai.');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});