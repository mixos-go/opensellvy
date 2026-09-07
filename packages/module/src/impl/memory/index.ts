import type {
  UnifiedOrder,
  OrderFilter,
  UnifiedProduct,
  InventoryItem,
  StockMovement,
  UnifiedCustomer,
  CustomerFilter,
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
  SalesSummary,
  Paginated,
} from '@opensellvy/types';
import type { Repositories } from '../../ports';

function paginate<T>(items: T[], cursor?: string, limit = 50): Paginated<T> {
  const start = cursor ? Math.max(0, Number(cursor)) : 0;
  const slice = items.slice(start, start + limit);
  return { items: slice, pageInfo: { totalCount: items.length, hasNextPage: start + slice.length < items.length, cursor: String(start + slice.length) } };
}

/** In-memory repository adapter — dipakai sebelum integrasi Postgres (step 5). */
export class MemoryRepositories {
  orders = new Map<string, UnifiedOrder>();
  products = new Map<string, UnifiedProduct>();
  inventory = new Map<string, InventoryItem>();
  movements: StockMovement[] = [];
  customers = new Map<string, UnifiedCustomer>();
  channels = new Map<string, ChannelConnection>();
  stores = new Map<string, Store>();
  warehouses = new Map<string, Warehouse>();
  returns = new Map<string, ReturnRequest>();
  payments = new Map<string, Payment>();
  settlements = new Map<string, Settlement>();
  promotions = new Map<string, Promotion>();
  shipments = new Map<string, Shipment>();
  notifications: Notification[] = [];
  audits: AuditLog[] = [];
  users = new Map<string, User>();
  members = new Map<string, StoreMember>();

  readonly ordersRepo = {
    save: async (order: UnifiedOrder) => void this.orders.set(order.id, order),
    merge: async (order: UnifiedOrder) => {
      const existing = this.orders.get(order.id);
      const merged = { ...existing, ...order, updatedAt: new Date().toISOString() };
      this.orders.set(order.id, merged);
      return merged;
    },
    update: async (id: string, patch: Partial<UnifiedOrder>) => {
      const order = this.orders.get(id);
      if (!order) throw new Error(`Order ${id} not found`);
      const updated = { ...order, ...patch, updatedAt: new Date().toISOString() };
      this.orders.set(id, updated);
      return updated;
    },
    find: async (filter: OrderFilter) => {
      let items = [...this.orders.values()].filter((o) => o.storeId === filter.storeId);
      if (filter.platform) items = items.filter((o) => o.platform === filter.platform);
      if (filter.status?.length) items = items.filter((o) => filter.status!.includes(o.status));
      if (filter.orderNumber) items = items.filter((o) => o.orderNumber === filter.orderNumber);
      if (filter.from) items = items.filter((o) => o.createdAt >= filter.from!);
      if (filter.to) items = items.filter((o) => o.createdAt <= filter.to!);
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paginate(items, filter.cursor, filter.limit);
    },
    findById: async (id: string) => this.orders.get(id),
    findByChannelKey: async (platform: string, platformOrderId: string) =>
      [...this.orders.values()].find((o) => o.platform === platform && o.platformOrderId === platformOrderId),
    countByStore: async (storeId: string, from?: string, to?: string) =>
      [...this.orders.values()].filter((o) => o.storeId === storeId && (!from || o.createdAt >= from) && (!to || o.createdAt <= to)).length,
  };

  readonly productsRepo = {
    save: async (product: UnifiedProduct) => { this.products.set(product.id, product); return product; },
    update: async (id: string, patch: Partial<UnifiedProduct>) => {
      const product = this.products.get(id);
      if (!product) throw new Error(`Product ${id} not found`);
      const updated = { ...product, ...patch, updatedAt: new Date().toISOString() };
      this.products.set(id, updated);
      return updated;
    },
    findById: async (id: string) => this.products.get(id),
    findBySku: async (sku: string) =>
      [...this.products.values()].find((p) => p.variants.some((v) => v.sku === sku)),
    list: async (storeId: string, opts?: { query?: string; cursor?: string; limit?: number }) => {
      let items = [...this.products.values()].filter((p) => p.storeId === storeId);
      if (opts?.query) items = items.filter((p) => p.name.toLowerCase().includes(opts.query!.toLowerCase()));
      items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return paginate(items, opts?.cursor, opts?.limit);
    },
    delete: async (id: string) => void this.products.delete(id),
  };

  readonly inventoryRepo = {
    upsert: async (item: InventoryItem) => { this.inventory.set(item.id, item); return item; },
    findBySku: async (sku: string, warehouseId?: string) =>
      [...this.inventory.values()].filter((i) => i.sku === sku && (!warehouseId || i.warehouseId === warehouseId)),
    list: async () => [...this.inventory.values()],
    addMovement: async (m: StockMovement) => void this.movements.push(m),
    listMovements: async (sku: string, limit = 20) => {
      const itemIds = [...this.inventory.values()].filter((i) => i.sku === sku).map((i) => i.id);
      return this.movements.filter((m) => itemIds.includes(m.inventoryItemId)).slice(-limit);
    },
  };

  readonly customersRepo = {
    save: async (customer: UnifiedCustomer) => { this.customers.set(customer.id, customer); return customer; },
    findById: async (id: string) => this.customers.get(id),
    findByPlatformProfile: async (platform: string, platformUserId: string) =>
      [...this.customers.values()].find((c) =>
        c.platformProfiles.some((p) => p.platform === platform && p.platformUserId === platformUserId)),
    find: async (filter: CustomerFilter) => {
      let items = [...this.customers.values()].filter((c) => c.storeId === filter.storeId);
      if (filter.query) {
        const q = filter.query.toLowerCase();
        items = items.filter((c) => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q));
      }
      if (filter.tag) items = items.filter((c) => c.tags.includes(filter.tag!));
      items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return paginate(items, filter.cursor, filter.limit);
    },
  };

  readonly channelsRepo = {
    save: async (channel: ChannelConnection) => { this.channels.set(channel.id, channel); return channel; },
    findById: async (id: string) => this.channels.get(id),
    findByStore: async (storeId: string) => [...this.channels.values()].filter((c) => c.storeId === storeId),
    findByShop: async (platform: string, platformShopId: string) =>
      [...this.channels.values()].find((c) => c.platform === platform && c.platformShopId === platformShopId),
    delete: async (id: string) => void this.channels.delete(id),
  };

  readonly storesRepo = {
    save: async (store: Store) => { this.stores.set(store.id, store); return store; },
    findById: async (id: string) => this.stores.get(id),
    findBySlug: async (slug: string) => [...this.stores.values()].find((s) => s.slug === slug),
    list: async () => [...this.stores.values()],
    delete: async (id: string) => void this.stores.delete(id),
  };

  readonly usersRepo = {
    save: async (user: User) => { this.users.set(user.id, user); return user; },
    findById: async (id: string) => this.users.get(id),
    findByEmail: async (email: string) => [...this.users.values()].find((u) => u.email === email),
  };

  readonly membersRepo = {
    add: async (member: StoreMember) => {
      this.members.set(`${member.storeId}:${member.userId}`, member);
    },
    update: async (storeId: string, userId: string, patch: Partial<StoreMember>) => {
      const key = `${storeId}:${userId}`;
      const member = this.members.get(key);
      if (!member) throw new Error(`Member ${storeId}:${userId} not found`);
      const updated = { ...member, ...patch, updatedAt: new Date().toISOString() };
      this.members.set(key, updated);
      return updated;
    },
    findByStore: async (storeId: string) => [...this.members.values()].filter((m) => m.storeId === storeId),
    findByUser: async (userId: string) => [...this.members.values()].filter((m) => m.userId === userId),
    find: async (storeId: string, userId: string) => this.members.get(`${storeId}:${userId}`),
  };

  readonly warehousesRepo = {
    save: async (warehouse: Warehouse) => { this.warehouses.set(warehouse.id, warehouse); return warehouse; },
    findById: async (id: string) => this.warehouses.get(id),
    list: async (storeId: string) => [...this.warehouses.values()].filter((w) => w.storeId === storeId),
    delete: async (id: string) => void this.warehouses.delete(id),
  };

  readonly returnsRepo = {
    save: async (request: ReturnRequest) => { this.returns.set(request.id, request); return request; },
    findById: async (id: string) => this.returns.get(id),
    findByOrder: async (orderId: string) => [...this.returns.values()].filter((r) => r.orderId === orderId),
  };

  readonly paymentsRepo = {
    save: async (payment: Payment) => { this.payments.set(payment.id, payment); return payment; },
    findByOrder: async (orderId: string) => [...this.payments.values()].filter((p) => p.orderId === orderId),
  };

  readonly shipmentsRepo = {
    save: async (shipment: Shipment) => { this.shipments.set(shipment.id, shipment); return shipment; },
    findByTracking: async (trackingNumber: string) =>
      [...this.shipments.values()].find((s) => s.trackingNumber === trackingNumber),
    findByOrder: async (orderId: string) => [...this.shipments.values()].filter((s) => s.orderId === orderId),
  };

  readonly settlementsRepo = {
    save: async (settlement: Settlement) => { this.settlements.set(settlement.id, settlement); return settlement; },
    list: async (storeId: string, opts?: { from?: string; to?: string }) =>
      [...this.settlements.values()].filter((s) => s.storeId === storeId && (!opts?.from || s.createdAt >= opts.from) && (!opts?.to || s.createdAt <= opts.to)),
  };

  readonly promotionsRepo = {
    save: async (promotion: Promotion) => { this.promotions.set(promotion.id, promotion); return promotion; },
    findByCode: async (storeId: string, code: string) =>
      [...this.promotions.values()].find((p) => p.storeId === storeId && p.code === code),
    list: async (storeId: string) => [...this.promotions.values()].filter((p) => p.storeId === storeId),
  };

  readonly notificationsRepo = {
    save: async (notification: Notification) => { this.notifications.push(notification); return notification; },
    findById: async (id: string) => this.notifications.find((n) => n.id === id),
    list: async (storeId: string, limit = 50) =>
      this.notifications.filter((n) => n.storeId === storeId).slice(-limit).reverse(),
  };

  readonly auditsRepo = {
    save: async (log: AuditLog) => { this.audits.push(log); return log; },
    list: async (filter: { storeId?: string; actorId?: string; action?: string }) =>
      this.audits.filter((a) => (!filter.storeId || a.storeId === filter.storeId) && (!filter.actorId || a.actorId === filter.actorId) && (!filter.action || a.action === filter.action)),
  };

  readonly analyticsRepo = {
    getSalesSummary: async (storeId: string, from: string, to: string): Promise<SalesSummary> => {
      const items = [...this.orders.values()].filter(
        (o) => o.storeId === storeId && o.createdAt >= from && o.createdAt <= to && o.status !== 'cancelled' && o.status !== 'failed',
      );
      const gross = items.reduce((sum, o) => sum + o.totals.grandTotal.amount, 0);
      const net = items.reduce((sum, o) => sum + (o.totals.grandTotal.amount - o.totals.discount.amount), 0);
      const refunded = [...this.orders.values()]
        .filter((o) => o.storeId === storeId && o.createdAt >= from && o.createdAt <= to && (o.status === 'returned' || o.status === 'cancelled'))
        .reduce((sum, o) => sum + o.totals.grandTotal.amount, 0);
      const sold = items.reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.quantity, 0), 0);
      return {
        grossRevenue: { amount: gross, currency: 'IDR' },
        netRevenue: { amount: net, currency: 'IDR' },
        orderCount: items.length,
        soldItemCount: sold,
        refundAmount: { amount: refunded, currency: 'IDR' },
      };
    },
  };

  // aggregation in Repositories shape (rules of memory repo flat maps above)
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

export function createMemoryRepositories(): Repositories {
  return new MemoryRepositories().asRepositories;
}