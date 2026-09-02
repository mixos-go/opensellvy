import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createPgAuthDeps, createPostgresRepositories } from '../src';
import { users, storeMembers, schema } from '@opensellvy/db';
import { createAuthService, hashPassword } from '@opensellvy/core';
import { runMigrations } from '@opensellvy/db';
import { connectors, registerPlatform } from '@opensellvy/connector';
import type { PlatformPlugin, TokenStore } from '@opensellvy/connector';
import type { UnifiedOrder } from '@opensellvy/types';
import { createServices } from '@opensellvy/module';
import type { Services } from '@opensellvy/module';

const URL = process.env.DATABASE_URL ?? 'postgres://opensellvy:opensellvy@127.0.0.1:5432/opensellvy';
const TEST_DB = URL.replace(/\/[^/]+$/, '/opensellvy_pg_test');

let pool: Pool;
let db: NodePgDatabase<typeof schema>;
let services: Services;

function memoryTokenStore(): TokenStore {
  const map = new Map<string, unknown>();
  return {
    save: (storeId, platform, token) => Promise.resolve(void map.set(`${storeId}:${platform}`, token)),
    get: (storeId, platform) => Promise.resolve(map.get(`${storeId}:${platform}`) as never),
    delete: (storeId, platform) => Promise.resolve(void map.delete(`${storeId}:${platform}`)),
  };
}

async function dropAndMigrate(): Promise<void> {
  const admin = new Pool({ connectionString: URL });
  await admin.query(`DROP DATABASE IF EXISTS opensellvy_pg_test`);
  await admin.query(`CREATE DATABASE opensellvy_pg_test OWNER opensellvy`);
  await admin.end();
  await runMigrations(TEST_DB);
}

let counter = 0;
const seeded = new Map<string, UnifiedOrder>();
function seedOrder(storeId: string): UnifiedOrder {
  counter += 1;
  const now = new Date().toISOString();
  const o: UnifiedOrder = {
    id: `o-${counter}`,
    storeId,
    channelId: 'ch-local',
    platform: 'local',
    platformOrderId: `PLAT-${counter}`,
    orderNumber: `INV-${counter}`,
    customer: { id: `cust-${counter}`, customerName: 'Budi' },
    lines: [{ id: `l-${counter}`, productId: `p-${counter}`, sku: `SKU-${counter}`, name: 'Produk', quantity: 2, unitPrice: { amount: 50_000, currency: 'IDR' }, total: { amount: 100_000, currency: 'IDR' } }],
    shipping: { address: { name: 'Budi', phone: '0812', province: 'DKI Jakarta', city: 'Jakarta', district: 'Gambir', subDistrict: 'Gambir', postalCode: '10110', detail: 'Jl. 1' }, courier: 'jne', service: 'REG' },
    totals: { subtotal: { amount: 100_000, currency: 'IDR' }, shippingFee: { amount: 12_000, currency: 'IDR' }, discount: { amount: 0, currency: 'IDR' }, tax: { amount: 0, currency: 'IDR' }, grandTotal: { amount: 112_000, currency: 'IDR' } },
    status: 'paid',
    paidAt: now,
    createdAt: now,
    updatedAt: now,
  };
  seeded.set(o.platformOrderId, o);
  return o;
}

const dummy: PlatformPlugin = {
  platform: 'local',
  name: 'Local',
  baseUrl: 'memory://local',
  capabilities: ['order.pull', 'order.push', 'product.pull', 'product.push', 'inventory.sync'],
  auth: {
    getAuthorizeUrl: (_c) => Promise.resolve('http://local/authorize'),
    exchangeCode: (_c, _code) => Promise.resolve({ accessToken: 't', expiresAt: Date.now() + 60_000 }),
    refreshToken: () => Promise.resolve({ accessToken: '' }),
  },
  gateway: {
    getShop: () => Promise.resolve({ platformShopId: 'shop-local', shopName: 'Local Shop', marketplace: 'local' }),
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
  webhook: { verify: () => Promise.resolve(true), map: (_e, d) => Promise.resolve({ type: _e, data: d }) },
};

describe('demobean-pg: lifecycle penuh di Postgres nyata', () => {
  beforeAll(async () => {
    await dropAndMigrate();
    pool = new Pool({ connectionString: TEST_DB });
    db = drizzle(pool, { schema });
    const repos = createPostgresRepositories(db);
    services = createServices({
      deps: { registry: connectors, tokens: memoryTokenStore(), credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }) },
      repositories: repos,
    });
    connectors.register(dummy);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('store → channel → sync order → fulfill → analytics', async () => {
    seedOrder('store-pg-1');
    seedOrder('store-pg-1');

    const store = await services.stores.create({ name: 'Toko PG', slug: 'toko-pg', config: { currency: 'IDR' } });
    const channel = await services.channels.connect({ storeId: store.id, platform: 'local', oauth: { code: 'c' } });
    expect(channel.auth.state).toBe('connected');

    const res = await services.orders.sync(store.id);
    expect(res).toEqual({ pulled: 2, created: 2, updated: 0 });

    const listed = await services.orders.list({ storeId: store.id });
    expect(listed.items).toHaveLength(2);
    expect(listed.pageInfo.totalCount).toBe(2);

    const again = await services.orders.sync(store.id);
    expect(again).toEqual({ pulled: 2, created: 0, updated: 0 });

    const [order] = listed.items;
    const shipped = await services.orders.fulfill(order.id, 'JNE-PG-1', 'jne');
    expect(shipped.status).toBe('shipped');
    const stored = await services.orders.getById(order.id);
    expect(stored?.status).toBe('shipped');

    // analytics periode penuh
    const summary = await services.analytics.salesSummary({
      storeId: store.id,
      from: new Date(Date.now() - 86_400_000).toISOString(),
      to: new Date().toISOString(),
    });
    expect(summary.orderCount).toBe(2);
    expect(summary.grossRevenue.amount).toBe(224_000);
  });

  it('produk + inventory persisted lalu analytics akurat /stock ter-sync', async () => {
    const store = await services.stores.create({ name: 'Toko PG 2', slug: 'toko-pg-2', config: {} });
    await services.channels.connect({ storeId: store.id, platform: 'local', oauth: { code: 'c' } });

    const product = await services.products.create({
      storeId: store.id,
      name: 'Produk PG',
      description: 'x',
      variants: [{ id: 'v1', sku: 'SKU-PG', options: {}, price: { amount: 80_000, currency: 'IDR' }, stock: 0 }],
      images: [],
      categoryIds: [],
      attributes: {},
      status: 'active',
    });

    await services.inventory.ensureFromProduct(product, 'wh-pg');
    await services.inventory.adjust({ productId: product.id, sku: 'SKU-PG', warehouseId: 'wh-pg', quantity: 25, reason: 'initial' });

    const items = await services.inventory.get('SKU-PG');
    expect(items[0].stock.available).toBe(25);

    const bySku = await services.products.getBySku('SKU-PG');
    expect(bySku?.id).toBe(product.id);

    // nolak stock negatif
    await services.inventory.adjust({ productId: product.id, sku: 'SKU-PG', warehouseId: 'wh-pg', quantity: -100, reason: 'oversell' })
      .then(() => expect.fail('harus menolak'))
      .catch((e) => expect(String(e)).toContain('Stock tidak cukup'));
  });

  it('core/auth end-to-end di Postgres: login → verify → refresh rotation → logout/revoke', async () => {
    const auth = createAuthService(createPgAuthDeps(db, 'pg-test-secret', { issuer: 'opensellvy', audience: 'panel' }));
    const store = await services.stores.create({ name: 'Toko Auth PG', slug: 'toko-auth-pg', config: {} });
    const passwordHash = await hashPassword('ini-rahasia');

    await db.insert(users).values({
      id: 'pg-user-1',
      email: 'seller@warung.id',
      name: 'Seller PG',
      passwordHash,
      status: 'active',
    });
    await db.insert(users).values({
      id: 'pg-user-2',
      email: 'sus@warung.id',
      name: 'Suspended',
      passwordHash,
      status: 'suspended',
    });
    await db.insert(storeMembers).values({
      storeId: store.id,
      userId: 'pg-user-1',
      role: 'manager',
      status: 'active',
    });

    // valid → scope store, role dari membership
    const login = await auth.login('seller@warung.id', 'ini-rahasia', { storeId: store.id });
    const ctx = await auth.verifyToken(login.accessToken);
    expect(ctx.storeId).toBe(store.id);
    expect(ctx.role).toBe('manager');
    expect(ctx.permissions).toContain('order.write');

    // password salah → INVALID_CREDENTIALS; user suspended → ACCOUNT_SUSPENDED; non-member → NOT_A_MEMBER
    await expect(auth.login('seller@warung.id', 'salah')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(auth.login('sus@warung.id', 'ini-rahasia')).rejects.toMatchObject({ code: 'ACCOUNT_SUSPENDED' });
    await expect(auth.login('seller@warung.id', 'ini-rahasia', { storeId: 'store-lain' })).rejects.toMatchObject({ code: 'NOT_A_MEMBER' });

    // rotation: refresh lama invalid, refresh baru jalan, session lama ter-revoke
    const rotated = await auth.refresh(login.refreshToken);
    expect(rotated.refreshToken).not.toBe(login.refreshToken);
    const ctx2 = await auth.verifyToken(rotated.accessToken);
    expect(ctx2.role).toBe('manager');
    await expect(auth.refresh(login.refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });

    // logout: session aktif dicabut
    const third = await auth.refresh(rotated.refreshToken);
    await auth.logout(third.refreshToken);
    await expect(auth.refresh(third.refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });

    // session memakai hash token — raw refresh token tidak tersimpan di DB
    const rows = await pool.query('SELECT token_hash FROM refresh_tokens');
    expect(rows.rows.every((r) => r.token_hash !== third.refreshToken)).toBe(true);
  });
});
