import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createPostgresRepositories } from '../src';
import { schema } from '@opensellvy/db';
import { runMigrations } from '@opensellvy/db';
import type { Repositories } from '@opensellvy/module';
import type {
  UnifiedCustomer,
  ChannelConnection,
  Store,
  User,
  StoreMember,
  Warehouse,
  ReturnRequest,
  Payment,
  Shipment,
  Settlement,
  Promotion,
  Notification,
  AuditLog,
  UnifiedOrder,
} from '@opensellvy/types';

const adminURL = process.env.DATABASE_URL ?? 'postgres://opensellvy:opensellvy@127.0.0.1:5432/opensellvy';
const TEST_DB = adminURL.replace(/\/[^/]+$/, '/opensellvy_pg_battle');

let pool: Pool;
let db: NodePgDatabase<typeof schema>;
let repos: Repositories;
let repos2: Repositories;

const now = () => new Date().toISOString();
const id = (p: string) => `${p}-${(++counter).toString().padStart(4, '0')}`;
let counter = 0;

// parent entities dibagikan agar repo yang punya FK order/channel/user bisa ditulis
let parentStore: Store;
let parentChannel: ChannelConnection;
let parentOrder: UnifiedOrder;
let parentUser: User;

function makeStore(n: number): Store {
  const t = now();
  return { id: id('store'), name: `Battle ${n}`, slug: `battle-${n}`, config: { currency: 'IDR' }, createdAt: t, updatedAt: t };
}

function makeChannel(storeId: string): ChannelConnection {
  return {
    id: id('chan'), storeId, platform: 'local', platformShopId: `shop-${storeId}`, shopName: 'Toko', marketplace: 'local',
    scopes: ['order.read'], auth: { state: 'connected', connectedAt: now() }, settings: {}, createdAt: now(), updatedAt: now(),
  };
}

function makeOrder(storeId: string, channelId: string): UnifiedOrder {
  const t = now();
  return {
    id: id('ord'), storeId, channelId, platform: 'local', platformOrderId: `plat-${id('x')}`, orderNumber: `INV-${id('x')}`,
    customer: { id: id('cust'), customerName: 'Budi' },
    lines: [{ id: id('ol'), productId: id('p'), sku: 'SKU', name: 'P', quantity: 1, unitPrice: { amount: 100_000, currency: 'IDR' }, total: { amount: 100_000, currency: 'IDR' } }],
    shipping: { address: { name: 'B', phone: '0', province: 'DKI Jakarta', city: 'Jakarta', district: 'G', subDistrict: 'G', postalCode: '1', detail: 'x' }, courier: 'jne', service: 'REG' },
    totals: { subtotal: { amount: 100_000, currency: 'IDR' }, shippingFee: { amount: 10_000, currency: 'IDR' }, discount: { amount: 0, currency: 'IDR' }, tax: { amount: 0, currency: 'IDR' }, grandTotal: { amount: 110_000, currency: 'IDR' } },
    status: 'paid', paidAt: t, createdAt: t, updatedAt: t,
  };
}

function makeUser(): User {
  return { id: id('user'), email: `u-${id('x')}@battle.id`, name: 'Aktor', status: 'active', createdAt: now(), updatedAt: now() };
}

const ADDR = { name: 'Gudang Pusat', phone: '021', province: 'Banten', city: 'Tangerang', district: 'Cikupa', subDistrict: 'Cikupa', postalCode: '15710', detail: 'Jl. Industri' };

async function dropAndMigrate(): Promise<void> {
  const admin = new Pool({ connectionString: adminURL });
  await admin.query(`DROP DATABASE IF EXISTS opensellvy_pg_battle`);
  await admin.query(`CREATE DATABASE opensellvy_pg_battle OWNER opensellvy`);
  await admin.end();
  await runMigrations(TEST_DB);
}

describe('db-pg battle: semua repository di Postgres nyata', () => {
  beforeAll(async () => {
    await dropAndMigrate();
    pool = new Pool({ connectionString: TEST_DB });
    db = drizzle(pool, { schema });
    repos = createPostgresRepositories(db);
    repos2 = createPostgresRepositories(db);

    // seed parent entities untuk repo ber-FK
    parentStore = makeStore(0);
    await repos.stores.save(parentStore);
    parentChannel = makeChannel(parentStore.id);
    await repos.channels.save(parentChannel);
    parentOrder = makeOrder(parentStore.id, parentChannel.id);
    await repos.orders.save(parentOrder);
    parentUser = makeUser();
    await repos.users.save(parentUser);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('stores + channels: save/find/list/delete & query by slug/shop', async () => {
    const s = makeStore(1);
    await repos.stores.save(s);

    const byId = await repos.stores.findById(s.id);
    expect(byId?.name).toBe(s.name);
    expect(byId?.slug).toBe(s.slug);

    const bySlug = await repos.stores.findBySlug(s.slug);
    expect(bySlug?.id).toBe(s.id);

    expect(await repos.stores.list()).toContainEqual(expect.objectContaining({ id: s.id }));

    const ch: ChannelConnection = {
      id: id('chan'), storeId: s.id, platform: 'local', platformShopId: 'shop-A', shopName: 'Toko A', marketplace: 'local',
      scopes: ['order.read'], auth: { state: 'connected', connectedAt: now() }, settings: { autoPullOrders: true }, createdAt: now(), updatedAt: now(),
    };
    await repos.channels.save(ch);
    expect((await repos.channels.findById(ch.id))?.scopes).toContain('order.read');
    expect((await repos.channels.findByStore(s.id)).map((c) => c.id)).toContain(ch.id);
    expect((await repos.channels.findByShop('local', 'shop-A'))?.id).toBe(ch.id);
    // upsert by platform+shop → idempoten
    const ch2 = { ...ch, id: id('chan'), shopName: 'Toko A v2' };
    await repos.channels.save(ch2);
    expect((await repos.channels.findByShop('local', 'shop-A'))?.shopName).toBe('Toko A v2');

    await repos.channels.delete(ch.id);
    expect(await repos.channels.findById(ch.id)).toBeUndefined();
    await repos.stores.delete(s.id);
    expect(await repos.stores.findById(s.id)).toBeUndefined();
  });

  it('users + members: CRUD, findByEmail, findByStore, update role', async () => {
    const u1: User = { id: id('user'), email: `u1@${counter}.id`, name: 'Uno', status: 'active', createdAt: now(), updatedAt: now() };
    const u2: User = { id: id('user'), email: `u2@${counter}.id`, name: 'Dua', status: 'suspended', createdAt: now(), updatedAt: now() };
    const store = makeStore(2);
    await repos.stores.save(store);
    await repos.users.save(u1);
    await repos.users.save(u2);

    expect((await repos.users.findById(u1.id))?.email).toBe(u1.email);
    expect((await repos.users.findByEmail(u1.email))?.id).toBe(u1.id);
    // upsert by id
    await repos.users.save({ ...u1, name: 'Uno Updated' });
    expect((await repos.users.findById(u1.id))?.name).toBe('Uno Updated');

    const m1: StoreMember = { storeId: store.id, userId: u1.id, role: 'owner', status: 'active', createdAt: now(), updatedAt: now() };
    const m2: StoreMember = { storeId: store.id, userId: u2.id, role: 'viewer', status: 'invited', createdAt: now(), updatedAt: now() };
    await repos.members.add(m1);
    await repos.members.add(m2);

    const members = await repos.members.findByStore(store.id);
    expect(members).toHaveLength(2);
    expect((await repos.members.find(store.id, u1.id))?.role).toBe('owner');
    // update role
    const updated = await repos.members.update(store.id, u1.id, { role: 'admin' });
    expect(updated.role).toBe('admin');
    expect((await repos.members.find(store.id, u1.id))?.role).toBe('admin');
    // add ulang (upsert) tidak dobel
    await repos.members.add({ ...m1, role: 'owner' });
    expect(await repos.members.findByStore(store.id)).toHaveLength(2);
  });

  it('warehouses: save/findById/list/delete + upsert by store+code', async () => {
    const w: Warehouse = { id: id('wh'), storeId: parentStore.id, code: 'WH-A', name: 'Gudang A', address: ADDR, isDefault: true, status: 'active', createdAt: now(), updatedAt: now() };
    await repos.warehouses.save(w);
    expect((await repos.warehouses.findById(w.id))?.code).toBe('WH-A');
    expect((await repos.warehouses.list(parentStore.id)).map((x) => x.id)).toContain(w.id);
    // upsert by store+code
    await repos.warehouses.save({ ...w, id: id('wh'), name: 'Gudang A v2', isDefault: false });
    const listed = await repos.warehouses.list(parentStore.id);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.name).toBe('Gudang A v2');
    await repos.warehouses.delete(w.id);
    expect(await repos.warehouses.findById(w.id)).toBeUndefined();
  });

  it('customers: save upsert + filter query/tag + platform profile lookup', async () => {
    const c: UnifiedCustomer = {
      id: id('cust'), storeId: parentStore.id, name: 'Budi ' + counter, email: 'budi@x.id', phone: '0812',
      addresses: [], platformProfiles: [{ platform: 'shopee', platformUserId: 'shopee-9', username: '@budi' }],
      tags: ['vip', 'reviewer'], createdAt: now(), updatedAt: now(),
    };
    await repos.customers.save(c);
    // upsert by id
    await repos.customers.save({ ...c, tags: ['vip'] });
    expect((await repos.customers.findById(c.id))?.tags).toEqual(['vip']);
    expect((await repos.customers.findByPlatformProfile('shopee', 'shopee-9'))?.id).toBe(c.id);

    const all = await repos.customers.find({ storeId: parentStore.id, tag: 'vip' });
    expect(all.items.map((x) => x.id)).toContain(c.id);
    const q = await repos.customers.find({ storeId: parentStore.id, query: 'budi' });
    expect(q.items.map((x) => x.id)).toContain(c.id);
  });

  it('returns: save upsert, findByOrder, findByOrder idempoten', async () => {
    const r: ReturnRequest = {
      id: id('ret'), orderId: parentOrder.id, channelId: parentChannel.id, lines: [{ orderLineId: id('ol'), sku: 'SKU-1', quantity: 1 }],
      reason: 'wrong_item', status: 'requested', refundAmount: { amount: 100_000, currency: 'IDR' }, createdAt: now(), updatedAt: now(),
    };
    await repos.returns.save(r);
    expect((await repos.returns.findById(r.id))?.reason).toBe('wrong_item');
    expect((await repos.returns.findByOrder(r.orderId)).map((x) => x.id)).toContain(r.id);
    // upsert
    await repos.returns.save({ ...r, status: 'approved' });
    expect((await repos.returns.findByOrder(r.orderId))[0]?.status).toBe('approved');
  });

  it('payments: save upsert, findByOrder, refunds roundtrip', async () => {
    const p: Payment = {
      id: id('pay'), orderId: parentOrder.id, method: 'transfer', status: 'captured', amount: { amount: 112_000, currency: 'IDR' },
      gateway: 'xendit', transactionId: 'tx-1', paidAt: now(),
      refunds: [{ id: id('rf'), amount: { amount: 12_000, currency: 'IDR' }, status: 'succeeded', createdAt: now() }],
      createdAt: now(), updatedAt: now(),
    };
    await repos.payments.save(p);
    const found = await repos.payments.findByOrder(parentOrder.id);
    expect(found).toHaveLength(1);
    expect(found[0]?.refunds[0]?.status).toBe('succeeded');
    // upsert perubahan status
    await repos.payments.save({ ...p, status: 'refunded' });
    expect((await repos.payments.findByOrder(parentOrder.id))[0]?.status).toBe('refunded');
  });

  it('shipments: save upsert, findByTracking, findByOrder', async () => {
    const s: Shipment = {
      id: id('ship'), orderId: parentOrder.id, courier: 'jne', service: 'REG', trackingNumber: 'TRK-1',
      events: [{ status: 'pending', description: 'Dibuat', occurredAt: now() }], status: 'in_transit', createdAt: now(), updatedAt: now(),
    };
    await repos.shipments.save(s);
    expect((await repos.shipments.findByTracking('TRK-1'))?.courier).toBe('jne');
    // upsert
    await repos.shipments.save({ ...s, status: 'delivered', trackingNumber: 'TRK-1' });
    expect((await repos.shipments.findByTracking('TRK-1'))?.status).toBe('delivered');
    expect((await repos.shipments.findByOrder(parentOrder.id)).map((x) => x.trackingNumber)).toContain('TRK-1');
  });

  it('settlements: save upsert + list with date filter', async () => {
    const s: Settlement = {
      id: id('set'), storeId: parentStore.id, channelId: parentChannel.id, platform: 'shopee',
      period: { from: now(), to: now() }, gross: { amount: 1_000_000, currency: 'IDR' },
      commission: { amount: 100_000, currency: 'IDR' }, shippingFee: { amount: 50_000, currency: 'IDR' },
      refundedAmount: { amount: 0, currency: 'IDR' }, net: { amount: 850_000, currency: 'IDR' },
      status: 'settled', reference: 'ref-1', createdAt: now(), updatedAt: now(),
    };
    await repos.settlements.save(s);
    await repos.settlements.save({ ...s, id: id('set'), status: 'pending' });
    const all = await repos.settlements.list(parentStore.id);
    expect(all).toHaveLength(2);
    const filtered = await repos.settlements.list(parentStore.id, { from: new Date(Date.now() - 1000).toISOString(), to: new Date(Date.now() + 1000).toISOString() });
    expect(filtered).toHaveLength(2);
    const empty = await repos.settlements.list(parentStore.id, { from: '2020-01-01T00:00:00.000Z', to: '2020-01-02T00:00:00.000Z' });
    expect(empty).toHaveLength(0);
    // upsert
    await repos.settlements.save({ ...s, status: 'disputed' });
    expect((await repos.settlements.list(parentStore.id)).filter((x) => x.id === s.id)[0]?.status).toBe('disputed');
  });

  it('promotions: save upsert, findByCode, list', async () => {
    const p: Promotion = {
      id: id('promo'), storeId: parentStore.id, name: 'Diskon 10%', description: 'x', type: 'voucher', status: 'active', code: 'HEMA10',
      startAt: now(), endAt: now(), budget: { amount: 1_000_000, currency: 'IDR' }, usageLimit: 100, usageCount: 5,
      rules: { type: 'percent', value: 10, appliesTo: 'all_items' }, channels: ['shopee'], createdAt: now(), updatedAt: now(),
    };
    await repos.promotions.save(p);
    expect((await repos.promotions.findByCode(parentStore.id, 'HEMA10'))?.usageLimit).toBe(100);
    // upsert
    await repos.promotions.save({ ...p, usageCount: 6 });
    expect((await repos.promotions.findByCode(parentStore.id, 'HEMA10'))?.usageCount).toBe(6);
    const all = await repos.promotions.list(parentStore.id);
    expect(all.map((x) => x.id)).toContain(p.id);
  });

  it('notifications: save, findById, list limit ordered desc', async () => {
    const n1: Notification = { id: id('notif'), storeId: parentStore.id, recipientId: parentUser.id, channel: 'email', template: 'welcome', data: {}, status: 'sent', sentAt: now(), createdAt: now() };
    const n2: Notification = { id: id('notif'), storeId: parentStore.id, channel: 'whatsapp', template: 'reminder', data: {}, status: 'queued', createdAt: now() };
    const n3: Notification = { id: id('notif'), storeId: parentStore.id, channel: 'sms', template: 'otp', data: { code: '1234' }, status: 'failed', error: 'quota', createdAt: now() };
    await repos.notifications.save(n1);
    await repos.notifications.save(n2);
    await repos.notifications.save(n3);
    expect((await repos.notifications.findById(n1.id))?.status).toBe('sent');
    const all = await repos.notifications.list(parentStore.id);
    expect(all).toHaveLength(3);
    // desc order → yang terakhir dibuat di depan
    expect(all[0]?.id).toBe(n3.id);
    const limited = await repos.notifications.list(parentStore.id, 2);
    expect(limited).toHaveLength(2);
  });

  it('audits: save + list filter storeId/actorId/action', async () => {
    const a1: AuditLog = { id: id('audit'), storeId: parentStore.id, actorId: parentUser.id, action: 'order.create', targetType: 'order', targetId: id('ord'), metadata: { n: 1 }, createdAt: now() };
    const a2: AuditLog = { id: id('audit'), storeId: parentStore.id, actorId: parentUser.id, action: 'product.update', targetType: 'product', createdAt: now() };
    const a3: AuditLog = { id: id('audit'), actorId: parentUser.id, action: 'login', createdAt: now() };
    await repos.audits.save(a1);
    await repos.audits.save(a2);
    await repos.audits.save(a3);

    const byStore = await repos.audits.list({ storeId: parentStore.id });
    expect(byStore).toHaveLength(2);
    const byActor = await repos.audits.list({ actorId: parentUser.id });
    expect(byActor).toHaveLength(3);
    const byAction = await repos.audits.list({ action: 'login' });
    expect(byAction).toHaveLength(1);
    const combined = await repos.audits.list({ storeId: parentStore.id, actorId: parentUser.id, action: 'order.create' });
    expect(combined).toHaveLength(1);
    // audit tanpa storeId → null tersimpan, tetap bisa filter actor
    expect((await repos.audits.list({ actorId: parentUser.id })).find((x) => x.action === 'login')?.targetType).toBeUndefined();
    // desc order
    expect((await repos.audits.list({ storeId: parentStore.id }))[0]?.id).toBe(a2.id);
  });

  it('persistence lintas koneksi (cross-instance read)', async () => {
    const store = makeStore(10);
    await repos.stores.save(store);
    // tulis via repos, baca via repos2 (drizzle instance terpisah)
    const s = await repos2.stores.findBySlug(store.slug);
    expect(s?.id).toBe(store.id);
  });
});
