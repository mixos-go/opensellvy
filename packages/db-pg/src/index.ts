import { and, arrayContains, count, desc, eq, gte, ilike, inArray, or, lte } from 'drizzle-orm';
import type {
  UnifiedOrder,

  UnifiedProduct,
  InventoryItem,
  StockMovement,
  UnifiedCustomer,

  ChannelConnection,
  Store,
  Warehouse,
  ReturnRequest,
  Payment,
  Settlement,
  Promotion,
  Shipment,
  Notification,
  AuditLog,
  User,
  StoreMember,

  Paginated,
} from '@opensellvy/types';
import type { Repositories } from '@opensellvy/module';
import type {
  AuthDeps,
  AuthUserRecord,
  RefreshSession,
  RefreshSessionStore,
  RoleCode,
} from '@opensellvy/core';
import {
  stores,
  users,
  storeMembers,
  refreshTokens,
  channels,
  orders,
  products,
  inventoryItems,
  inventoryMovements,
  customers,
  customerProfiles,
  warehouses,
  returns,
  payments,
  settlements,
  promotions,
  shipments,
  notifications,
  audits,
  schema,
} from '@opensellvy/db';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

type DB = NodePgDatabase<typeof schema>;

function paginate<T>(
  rows: T[],
  total: number,
  opts?: { cursor?: string; limit?: number },
): Paginated<T> {
  const limit = opts?.limit ?? 50;
  const offset = opts?.cursor ? Number(opts.cursor) || 0 : 0;
  const end = Math.min(offset + limit, rows.length);
  return {
    items: rows.slice(offset, end),
    pageInfo: {
      totalCount: total,
      hasNextPage: end < total,
      cursor: String(offset + limit),
    },
  };
}

/** Masing-masing repo berisi payload JSONB = entity domain utuh (source of truth). */
function toDate(v?: string): Date | null {
  return v ? new Date(v) : null;
}

export class PostgresRepositories {
  constructor(private db: DB) {}

  readonly ordersRepo: Repositories['orders'] = {
    save: async (o) => {
      await this.db.insert(orders).values({
        id: o.id,
        storeId: o.storeId,
        platform: o.platform,
        platformOrderId: o.platformOrderId,
        orderNumber: o.orderNumber,
        channelId: o.channelId,
        status: o.status,
        subStatus: o.subStatus,
        total: o.totals.grandTotal,
        items: o.lines,
        raw: o.raw ?? {},
        payload: o,
        paidAt: toDate(o.paidAt) ?? toDate(o.createdAt),
      }).onConflictDoUpdate({
        target: [orders.storeId, orders.platform, orders.platformOrderId],
        set: {
          status: o.status,
          subStatus: o.subStatus,
          total: o.totals.grandTotal,
          items: o.lines,
          raw: o.raw ?? {},
          payload: o,
          paidAt: toDate(o.paidAt) ?? toDate(o.createdAt),
          updatedAt: new Date(),
        },
      });
    },
    merge: async (o) => {
      const existing = await this.db.query.orders.findFirst({
        where: and(
          eq(orders.storeId, o.storeId),
          eq(orders.platform, o.platform),
          eq(orders.platformOrderId, o.platformOrderId),
        ),
      });
      if (!existing) {
        await this.ordersRepo.save(o);
        return o;
      }
      const merged: UnifiedOrder = {
        ...(existing.payload as UnifiedOrder),
        ...o,
        id: existing.id,
        createdAt: existing.payload?.createdAt ?? o.createdAt,
        updatedAt: o.updatedAt ?? new Date().toISOString(),
      } as UnifiedOrder;
      await this.ordersRepo.save(merged);
      return merged;
    },
    update: async (id, patch) => {
      const row = await this.db.query.orders.findFirst({ where: eq(orders.id, id) });
      if (!row) throw new Error(`Order ${id} not found`);
      const current = row.payload as UnifiedOrder;
      const merged: UnifiedOrder = {
        ...current,
        ...patch,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      await this.ordersRepo.save(merged);
      return merged;
    },
    find: async (filter) => {
      const conds = [eq(orders.storeId, filter.storeId)];
      if (filter.platform) conds.push(eq(orders.platform, filter.platform));
      if (filter.status?.length) conds.push(inArray(orders.status, filter.status));
      if (filter.orderNumber) conds.push(eq(orders.orderNumber, filter.orderNumber));
      if (filter.from) conds.push(gte(orders.createdAt, new Date(filter.from)));
      if (filter.to) conds.push(lte(orders.createdAt, new Date(filter.to)));
      const where = and(...conds);
      const rows = await this.db.select().from(orders).where(where)
        .orderBy(desc(orders.createdAt));
      return paginate(
        rows.map((r) => r.payload as UnifiedOrder),
        rows.length,
        { ...(filter.limit !== undefined ? { limit: filter.limit } : {}), ...(filter.cursor !== undefined ? { cursor: filter.cursor } : {}) },
      );
    },
    findById: async (id) => (await this.db.query.orders.findFirst({
      where: eq(orders.id, id),
    }))?.payload as UnifiedOrder | undefined,
    findByChannelKey: async (platform, platformOrderId) =>
      (await this.db.query.orders.findFirst({
        where: and(eq(orders.platform, platform as never), eq(orders.platformOrderId, platformOrderId)),
      }))?.payload as UnifiedOrder | undefined,
    countByStore: async (storeId, from, to) => {
      const conds = [eq(orders.storeId, storeId)];
      if (from) conds.push(gte(orders.paidAt, new Date(from)));
      if (to) conds.push(lte(orders.paidAt, new Date(to)));
      const row = await this.db.select({ n: count() }).from(orders).where(and(...conds));
      return row[0]?.n ?? 0;
    },
  };

  readonly productsRepo: Repositories['products'] = {
    save: async (p) => {
      await this.db.insert(products).values({
        id: p.id,
        storeId: p.storeId,
        name: p.name,
        status: p.status,
        skus: p.variants.map((v) => v.sku),
        payload: p,
      }).onConflictDoUpdate({
        target: products.id,
        set: {
          name: p.name,
          status: p.status,
          skus: p.variants.map((v) => v.sku),
          payload: p,
          updatedAt: new Date(),
        },
      });
      return p;
    },
    update: async (id, patch) => {
      const row = await this.db.query.products.findFirst({ where: eq(products.id, id) });
      if (!row) throw new Error(`Product ${id} not found`);
      const current = row.payload as UnifiedProduct;
      const merged: UnifiedProduct = {
        ...current,
        ...patch,
        id: current.id,
        storeId: current.storeId,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      await this.productsRepo.save(merged);
      return merged;
    },
    findById: async (id) => (await this.db.query.products.findFirst({
      where: eq(products.id, id),
    }))?.payload as UnifiedProduct | undefined,
    findBySku: async (sku) => {
      const row = await this.db.query.products.findFirst({
        where: arrayContains(products.skus, [sku]),
      });
      return row?.payload as UnifiedProduct | undefined;
    },
    list: async (storeId, opts) => {
      const conds = [eq(products.storeId, storeId)];
      if (opts?.query) conds.push(ilike(products.name, `%${opts.query}%`));
      const where = and(...conds);
      const rows = await this.db.select().from(products).where(where)
        .orderBy(desc(products.updatedAt));
      return paginate(
        rows.map((r) => r.payload as UnifiedProduct),
        rows.length,
        { ...(opts?.limit !== undefined ? { limit: opts.limit } : {}), ...(opts?.cursor !== undefined ? { cursor: opts.cursor } : {}) },
      );
    },
    delete: async (id) => void this.db.delete(products).where(eq(products.id, id)),
  };

  readonly inventoryRepo: Repositories['inventory'] = {
    upsert: async (item) => {
      const product = await this.db.query.products.findFirst({
        where: eq(products.id, item.productId),
      });
      const storeId = product?.storeId ?? '';
      await this.db.insert(inventoryItems).values({
        id: item.id,
        storeId,
        productId: item.productId,
        sku: item.sku,
        warehouseId: item.warehouseId,
        available: item.stock.available,
        reserved: item.stock.reserved,
        incoming: item.stock.incoming,
        holding: item.stock.holding,
        payload: item,
      }).onConflictDoUpdate({
        target: [inventoryItems.sku, inventoryItems.warehouseId],
        set: {
          productId: item.productId,
          storeId,
          available: item.stock.available,
          reserved: item.stock.reserved,
          incoming: item.stock.incoming,
          holding: item.stock.holding,
          payload: item,
          updatedAt: new Date(),
        },
      });
      return item;
    },
    findBySku: async (sku, warehouseId) => {
      const conds = [eq(inventoryItems.sku, sku)];
      if (warehouseId) conds.push(eq(inventoryItems.warehouseId, warehouseId));
      const rows = await this.db.select().from(inventoryItems).where(and(...conds));
      return rows.map((r) => r.payload as InventoryItem);
    },
    list: async (storeId) => {
      const rows = await this.db
        .select({ item: inventoryItems })
        .from(inventoryItems)
        .innerJoin(products, eq(inventoryItems.productId, products.id))
        .where(eq(products.storeId, storeId));
      return rows.map((r) => r.item.payload as InventoryItem);
    },
    addMovement: async (m) => {
      await this.db.insert(inventoryMovements).values({
        id: m.id,
        inventoryItemId: m.inventoryItemId,
        type: m.type,
        quantity: m.quantity,
        reason: m.reason,
        referenceId: m.referenceId,
        actorId: m.actorId,
        occurredAt: new Date(m.occurredAt),
      });
    },
    listMovements: async (sku, limit = 20) => {
      const ids = (await this.db.query.inventoryItems.findMany({ where: eq(inventoryItems.sku, sku) }))
        .map((i) => i.id);
      if (!ids.length) return [];
      const rows = await this.db.select().from(inventoryMovements)
        .where(inArray(inventoryMovements.inventoryItemId, ids))
        .orderBy(desc(inventoryMovements.occurredAt))
        .limit(limit);
      return rows.map((r) => ({
        id: r.id,
        inventoryItemId: r.inventoryItemId,
        type: r.type as StockMovement['type'],
        quantity: r.quantity,
        reason: r.reason,
        ...(r.referenceId !== null ? { referenceId: r.referenceId } : {}),
        ...(r.actorId !== null ? { actorId: r.actorId } : {}),
        occurredAt: r.occurredAt.toISOString(),
      }));
    },
  };

  readonly customersRepo: Repositories['customers'] = {
    save: async (c) => {
      await this.db.insert(customers).values({
        id: c.id,
        storeId: c.storeId,
        name: c.name,
        email: c.email ?? null,
        phone: c.phone ?? null,
        tags: c.tags,
        payload: c,
      }).onConflictDoUpdate({
        target: customers.id,
        set: {
          name: c.name,
          email: c.email ?? null,
          phone: c.phone ?? null,
          tags: c.tags,
          payload: c,
          updatedAt: new Date(),
        },
      });
      if (c.platformProfiles?.length) {
        for (const p of c.platformProfiles) {
          await this.db.insert(customerProfiles).values({
            customerId: c.id,
            platform: p.platform,
            platformUserId: p.platformUserId,
            username: p.username,
            channelId: p.channelId ?? null,
          }).onConflictDoUpdate({
            target: [customerProfiles.platform, customerProfiles.platformUserId],
            set: { customerId: c.id, username: p.username, channelId: p.channelId ?? null },
          });
        }
      }
      return c;
    },
    findById: async (id) => (await this.db.query.customers.findFirst({
      where: eq(customers.id, id),
    }))?.payload as UnifiedCustomer | undefined,
    findByPlatformProfile: async (platform, platformUserId) => {
      const profile = await this.db.query.customerProfiles.findFirst({
        where: and(
          eq(customerProfiles.platform, platform as never),
          eq(customerProfiles.platformUserId, platformUserId),
        ),
      });
      if (!profile) return undefined;
      return (await this.db.query.customers.findFirst({
        where: eq(customers.id, profile.customerId),
      }))?.payload as UnifiedCustomer | undefined;
    },
    find: async (filter) => {
      const conds = [eq(customers.storeId, filter.storeId)];
      if (filter.query) {
        const q = `%${filter.query}%`;
        conds.push(or(ilike(customers.name, q), ilike(customers.email ?? '', q), ilike(customers.phone ?? '', q))!);
      }
      if (filter.tag) conds.push(arrayContains(customers.tags, [filter.tag]));
      const where = and(...conds);
      const rows = await this.db.select().from(customers).where(where)
        .orderBy(desc(customers.updatedAt));
      return paginate(
        rows.map((r) => r.payload as UnifiedCustomer),
        rows.length,
        { ...(filter.limit !== undefined ? { limit: filter.limit } : {}), ...(filter.cursor !== undefined ? { cursor: filter.cursor } : {}) },
      );
    },
  };

  readonly channelsRepo: Repositories['channels'] = {
    save: async (c) => {
      await this.db.insert(channels).values({
        id: c.id,
        storeId: c.storeId,
        platform: c.platform,
        platformShopId: c.platformShopId,
        shopName: c.shopName,
        marketplace: c.marketplace,
        scopes: c.scopes,
        payload: c,
      }).onConflictDoUpdate({
        target: c.platformShopId ? [channels.platform, channels.platformShopId] : channels.id,
        set: {
          shopName: c.shopName,
          marketplace: c.marketplace,
          scopes: c.scopes,
          payload: c,
          updatedAt: new Date(),
        },
      });
      return c;
    },
    findById: async (id) => (await this.db.query.channels.findFirst({
      where: eq(channels.id, id),
    }))?.payload as ChannelConnection | undefined,
    findByStore: async (storeId) => {
      const rows = await this.db.select().from(channels).where(eq(channels.storeId, storeId));
      return rows.map((r) => r.payload as ChannelConnection);
    },
    findByShop: async (platform, platformShopId) =>
      (await this.db.query.channels.findFirst({
        where: and(eq(channels.platform, platform as never), eq(channels.platformShopId, platformShopId)),
      }))?.payload as ChannelConnection | undefined,
    delete: async (id) => void this.db.delete(channels).where(eq(channels.id, id)),
  };

  readonly storesRepo: Repositories['stores'] = {
    save: async (s) => {
      await this.db.insert(stores).values({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logoUrl: s.logoUrl ?? null,
        config: s.config,
      }).onConflictDoUpdate({
        target: stores.id,
        set: { name: s.name, slug: s.slug, logoUrl: s.logoUrl ?? null, config: s.config, updatedAt: new Date() },
      });
      return s;
    },
    findById: async (id) => {
      const row = await this.db.query.stores.findFirst({ where: eq(stores.id, id) });
      return row ? mapStore(row) : undefined;
    },
    findBySlug: async (slug) => {
      const row = await this.db.query.stores.findFirst({ where: eq(stores.slug, slug) });
      return row ? mapStore(row) : undefined;
    },
    list: async () => {
      const rows = await this.db.select().from(stores);
      return rows.map(mapStore);
    },
    delete: async (id) => void this.db.delete(stores).where(eq(stores.id, id)),
  };

  readonly usersRepo: Repositories['users'] = {
    save: async (u) => {
      await this.db.insert(users).values({
        id: u.id,
        email: u.email,
        name: u.name,
        status: u.status,
      }).onConflictDoUpdate({
        target: users.id,
        set: { email: u.email, name: u.name, status: u.status, updatedAt: new Date() },
      });
      return u;
    },
    findById: async (id) => {
      const row = await this.db.query.users.findFirst({ where: eq(users.id, id) });
      return row ? mapUser(row) : undefined;
    },
    findByEmail: async (email) => {
      const row = await this.db.query.users.findFirst({ where: eq(users.email, email) });
      return row ? mapUser(row) : undefined;
    },
  };

  readonly membersRepo: Repositories['members'] = {
    add: async (m) => {
      await this.db.insert(storeMembers).values({
        storeId: m.storeId,
        userId: m.userId,
        role: m.role,
        status: m.status,
      }).onConflictDoUpdate({
        target: [storeMembers.storeId, storeMembers.userId],
        set: { role: m.role, status: m.status, updatedAt: new Date() },
      });
    },
    update: async (storeId, userId, patch) => {
      const row = await this.db.query.storeMembers.findFirst({
        where: and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)),
      });
      if (!row) throw new Error(`Member ${storeId}:${userId} not found`);
      const merged: StoreMember = {
        storeId,
        userId,
        role: (patch.role ?? row.role) as StoreMember['role'],
        status: (patch.status ?? row.status) as StoreMember['status'],
        createdAt: row.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.membersRepo.add(merged);
      return merged;
    },
    findByStore: async (storeId) => {
      const rows = await this.db.select().from(storeMembers).where(eq(storeMembers.storeId, storeId));
      return rows.map((r) => ({
        storeId: r.storeId,
        userId: r.userId,
        role: r.role as StoreMember['role'],
        status: r.status as StoreMember['status'],
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    },
    find: async (storeId, userId) => {
      const row = await this.db.query.storeMembers.findFirst({
        where: and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)),
      });
      return row
        ? {
            storeId: row.storeId,
            userId: row.userId,
            role: row.role as StoreMember['role'],
            status: row.status as StoreMember['status'],
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          }
        : undefined;
    },
  };

  readonly warehousesRepo: Repositories['warehouses'] = {
    save: async (w) => {
      await this.db.insert(warehouses).values({
        id: w.id,
        storeId: w.storeId,
        code: w.code,
        name: w.name,
        isDefault: w.isDefault,
        status: w.status,
        payload: w,
      }).onConflictDoUpdate({
        target: [warehouses.storeId, warehouses.code],
        set: { name: w.name, isDefault: w.isDefault, status: w.status, payload: w, updatedAt: new Date() },
      });
      return w;
    },
    findById: async (id) => (await this.db.query.warehouses.findFirst({
      where: eq(warehouses.id, id),
    }))?.payload as Warehouse | undefined,
    list: async (storeId) => {
      const rows = await this.db.select().from(warehouses).where(eq(warehouses.storeId, storeId));
      return rows.map((r) => r.payload as Warehouse);
    },
    delete: async (id) => void this.db.delete(warehouses).where(eq(warehouses.id, id)),
  };

  readonly returnsRepo: Repositories['returns'] = {
    save: async (r) => {
      await this.db.insert(returns).values({
        id: r.id,
        orderId: r.orderId,
        channelId: r.channelId,
        status: r.status,
        refundAmount: r.refundAmount ?? null,
        label: r.label ?? null,
        payload: r,
      }).onConflictDoUpdate({
        target: returns.id,
        set: {
          status: r.status,
          refundAmount: r.refundAmount ?? null,
          label: r.label ?? null,
          payload: r,
          updatedAt: new Date(),
        },
      });
      return r;
    },
    findById: async (id) => (await this.db.query.returns.findFirst({
      where: eq(returns.id, id),
    }))?.payload as ReturnRequest | undefined,
    findByOrder: async (orderId) => {
      const rows = await this.db.select().from(returns).where(eq(returns.orderId, orderId));
      return rows.map((r) => r.payload as ReturnRequest);
    },
  };

  readonly paymentsRepo: Repositories['payments'] = {
    save: async (p) => {
      await this.db.insert(payments).values({
        id: p.id,
        orderId: p.orderId,
        method: p.method,
        status: p.status,
        amount: p.amount,
        transactionId: p.transactionId ?? null,
        payload: p,
      }).onConflictDoUpdate({
        target: payments.id,
        set: { method: p.method, status: p.status, amount: p.amount, transactionId: p.transactionId ?? null, payload: p, updatedAt: new Date() },
      });
      return p;
    },
    findByOrder: async (orderId) => {
      const rows = await this.db.select().from(payments).where(eq(payments.orderId, orderId));
      return rows.map((r) => r.payload as Payment);
    },
  };

  readonly shipmentsRepo: Repositories['shipments'] = {
    save: async (s) => {
      await this.db.insert(shipments).values({
        id: s.id,
        orderId: s.orderId,
        courier: s.courier,
        trackingNumber: s.trackingNumber,
        status: s.status,
        payload: s,
      }).onConflictDoUpdate({
        target: shipments.id,
        set: { courier: s.courier, trackingNumber: s.trackingNumber, status: s.status, payload: s, updatedAt: new Date() },
      });
      return s;
    },
    findByTracking: async (trackingNumber) =>
      (await this.db.query.shipments.findFirst({
        where: eq(shipments.trackingNumber, trackingNumber),
      }))?.payload as Shipment | undefined,
    findByOrder: async (orderId) => {
      const rows = await this.db.select().from(shipments).where(eq(shipments.orderId, orderId));
      return rows.map((r) => r.payload as Shipment);
    },
  };

  readonly settlementsRepo: Repositories['settlements'] = {
    save: async (s) => {
      await this.db.insert(settlements).values({
        id: s.id,
        storeId: s.storeId,
        channelId: s.channelId,
        platform: s.platform,
        status: s.status,
        payload: s,
      }).onConflictDoUpdate({
        target: settlements.id,
        set: { status: s.status, payload: s, updatedAt: new Date() },
      });
      return s;
    },
    list: async (storeId, opts) => {
      const conds = [eq(settlements.storeId, storeId)];
      if (opts?.from) conds.push(gte(settlements.createdAt, new Date(opts.from)));
      if (opts?.to) conds.push(lte(settlements.createdAt, new Date(opts.to)));
      const rows = await this.db.select().from(settlements).where(and(...conds))
        .orderBy(desc(settlements.createdAt));
      return rows.map((r) => r.payload as Settlement);
    },
  };

  readonly promotionsRepo: Repositories['promotions'] = {
    save: async (p) => {
      await this.db.insert(promotions).values({
        id: p.id,
        storeId: p.storeId,
        code: p.code ?? null,
        type: p.type,
        status: p.status,
        startAt: p.startAt ? new Date(p.startAt) : null,
        endAt: p.endAt ? new Date(p.endAt) : null,
        payload: p,
      }).onConflictDoUpdate({
        target: promotions.id,
        set: {
          code: p.code ?? null,
          type: p.type,
          status: p.status,
          startAt: p.startAt ? new Date(p.startAt) : null,
          endAt: p.endAt ? new Date(p.endAt) : null,
          payload: p,
          updatedAt: new Date(),
        },
      });
      return p;
    },
    findByCode: async (storeId, code) =>
      (await this.db.query.promotions.findFirst({
        where: and(eq(promotions.storeId, storeId), eq(promotions.code, code)),
      }))?.payload as Promotion | undefined,
    list: async (storeId) => {
      const rows = await this.db.select().from(promotions).where(eq(promotions.storeId, storeId));
      return rows.map((r) => r.payload as Promotion);
    },
  };

  readonly notificationsRepo: Repositories['notifications'] = {
    save: async (n) => {
      await this.db.insert(notifications).values({
        id: n.id,
        storeId: n.storeId,
        channel: n.channel,
        status: n.status,
        payload: n,
      });
      return n;
    },
    findById: async (id) => (await this.db.query.notifications.findFirst({
      where: eq(notifications.id, id),
    }))?.payload as Notification | undefined,
    list: async (storeId, limit = 50) => {
      const rows = await this.db.select().from(notifications).where(eq(notifications.storeId, storeId))
        .orderBy(desc(notifications.createdAt)).limit(limit);
      return rows.map((r) => r.payload as Notification);
    },
  };

  readonly auditsRepo: Repositories['audits'] = {
    save: async (log) => {
      await this.db.insert(audits).values({
        id: log.id,
        storeId: log.storeId ?? null,
        actorId: log.actorId,
        action: log.action,
        payload: log,
      });
      return log;
    },
    list: async (filter) => {
      const conds: unknown[] = [];
      if (filter.storeId) conds.push(eq(audits.storeId, filter.storeId));
      if (filter.actorId) conds.push(eq(audits.actorId, filter.actorId));
      if (filter.action) conds.push(eq(audits.action, filter.action));
      const rows = await this.db.select().from(audits)
        .where(conds.length ? and(...(conds as [])) : undefined)
        .orderBy(desc(audits.createdAt));
      return rows.map((r) => r.payload as AuditLog);
    },
  };

  readonly analyticsRepo: Repositories['analytics'] = {
    getSalesSummary: async (storeId, from, to) => {
      const conds = [eq(orders.storeId, storeId)];
      if (from) conds.push(gte(orders.paidAt, new Date(from)));
      if (to) conds.push(lte(orders.paidAt, new Date(to)));
      const rows = await this.db.select().from(orders).where(and(...conds));
      const summarized = rows.filter((r) => !['cancelled', 'returned', 'failed'].includes(r.status));
      const gross = summarized.reduce((s, r) => s + ((r.payload as UnifiedOrder).totals.grandTotal.amount ?? 0), 0);
      const net = summarized.reduce((s, r) => {
        const t = (r.payload as UnifiedOrder).totals;
        return s + (t.grandTotal.amount ?? 0) - (t.discount.amount ?? 0);
      }, 0);
      const orderCount = summarized.length;
      const soldItemCount = summarized.reduce(
        (s, r) => s + (r.payload as UnifiedOrder).lines.reduce((a, l) => a + l.quantity, 0),
        0,
      );
      const refundAmount = rows
        .filter((r) => r.status === 'returned' || r.status === 'cancelled')
        .reduce((s, r) => s + ((r.payload as UnifiedOrder).totals.grandTotal.amount ?? 0), 0);
      return {
        grossRevenue: { amount: gross, currency: 'IDR' },
        netRevenue: { amount: net, currency: 'IDR' },
        orderCount,
        soldItemCount,
        refundAmount: { amount: refundAmount, currency: 'IDR' },
      };
    },
  };

  readonly asRepositories: Repositories = {
    orders: this.ordersRepo,
    products: this.productsRepo,
    inventory: this.inventoryRepo,
    customers: this.customersRepo,
    channels: this.channelsRepo,
    stores: this.storesRepo,
    users: this.usersRepo,
    members: this.membersRepo,
    warehouses: this.warehousesRepo,
    returns: this.returnsRepo,
    payments: this.paymentsRepo,
    shipments: this.shipmentsRepo,
    settlements: this.settlementsRepo,
    promotions: this.promotionsRepo,
    notifications: this.notificationsRepo,
    audits: this.auditsRepo,
    analytics: this.analyticsRepo,
  };
}

function mapStore(r: { id: string; name: string; slug: string; logoUrl: string | null; config: Store['config']; createdAt: Date; updatedAt: Date }): Store {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    config: r.config,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    ...(r.logoUrl !== null ? { logoUrl: r.logoUrl } : {}),
  };
}

function mapUser(r: { id: string; email: string; name: string; status: string; createdAt: Date; updatedAt: Date }): User {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    status: r.status as User['status'],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function createPostgresRepositories(db: DB): Repositories {
  return new PostgresRepositories(db).asRepositories;
}

/**
 * Refresh session store di Postgres (contract core/auth).
 * Hard-delete pada revoke; revisi hak entri dengan token_hash sama utk idempotensi.
 */
export function createPgRefreshSessionStore(db: DB): RefreshSessionStore {
  return {
    async save(session: RefreshSession) {
      await db.insert(refreshTokens).values({
        id: session.id,
        userId: session.userId,
        email: session.email,
        storeId: session.storeId ?? null,
        role: session.role,
        tokenHash: session.tokenHash,
        expiresAt: new Date(session.expiresAt),
        revoked: false,
      }).onConflictDoUpdate({
        target: refreshTokens.tokenHash,
        set: {
          id: session.id,
          email: session.email,
          storeId: session.storeId ?? null,
          role: session.role,
          expiresAt: new Date(session.expiresAt),
          revoked: false,
        },
      });
    },
    async findByTokenHash(tokenHash) {
      const rows = await db.select().from(refreshTokens)
        .where(and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.revoked, false)))
        .limit(1);
      const r = rows[0];
      if (!r) return undefined;
      return mapRefreshSession(r);
    },
    async deleteById(sessionId) {
      await db.delete(refreshTokens).where(eq(refreshTokens.id, sessionId));
    },
    async revokeAllForUser(userId) {
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    },
  };
}

/** Deps lengkap untuk `createAuthService` dari core: credential lookup + membership + session store. */
export function createPgAuthDeps(
  db: DB,
  jwtSecret: string,
  opts?: { issuer?: string; audience?: string; accessTokenTtlSeconds?: number; refreshTokenTtlSeconds?: number },
): AuthDeps {
  return {
    ...opts,
    jwtSecret,
    findUserByEmail: findAuthUserByEmail(db),
    getMemberRole: async (storeId, userId) => {
      const rows = await db.select().from(storeMembers)
        .where(and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId)))
        .limit(1);
      const row = rows[0];
      if (!row || row.status !== 'active') return undefined;
      return row.role as RoleCode;
    },
    sessions: createPgRefreshSessionStore(db),
  };
}

function findAuthUserByEmail(db: DB): (email: string) => Promise<AuthUserRecord | undefined> {
  return async (email) => {
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const r = rows[0];
    if (!r) return undefined;
    return {
      id: r.id,
      email: r.email,
      name: r.name,
      passwordHash: r.passwordHash,
      status: r.status as 'active' | 'suspended',
    };
  };
}

function mapRefreshSession(r: {
  id: string;
  userId: string;
  email: string;
  storeId: string | null;
  role: string;
  expiresAt: Date;
  createdAt: Date;
  tokenHash: string;
}): RefreshSession {
  return {
    id: r.id,
    userId: r.userId,
    email: r.email,
    role: r.role as RoleCode,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    tokenHash: r.tokenHash,
    ...(r.storeId !== null ? { storeId: r.storeId } : {}),
  };
}

export { schema };
