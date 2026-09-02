import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type {
  AuditLog,
  ChannelConnection,
  InventoryItem,
  Money,
  Notification,
  Payment,
  PlatformCode,
  Promotion,
  ReturnRequest,
  Settlement,
  Shipment,
  Store,
  StoreMember,
  UnifiedCustomer,
  UnifiedOrder,
  UnifiedProduct,
  User,
  Warehouse,
} from '@opensellvy/types';

const tz = (name: string) => timestamp(name, { withTimezone: true });

export const stores = pgTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  config: jsonb('config').$type<Store['config']>().notNull().default({}),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull().default(''),
  status: text('status').notNull().default('active'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const storeMembers = pgTable(
  'store_members',
  {
    storeId: text('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.storeId, t.userId] })],
);

export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull().default(''),
  storeId: text('store_id').references(() => stores.id, { onDelete: 'set null' }),
  role: text('role').notNull().default('owner'),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: tz('expires_at').notNull(),
  revoked: boolean('revoked').notNull().default(false),
  createdAt: tz('created_at').notNull().defaultNow(),
});

export const platformAccounts = pgTable('platform_accounts', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  shopId: text('shop_id').notNull(),
  shopName: text('shop_name').notNull(),
  authState: text('auth_state').notNull().default('connected'),
  scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
  marketplace: text('marketplace').notNull().default('ID'),
  connectedBy: text('connected_by').references(() => users.id),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const platformTokens = pgTable('platform_tokens', {
  id: text('id').primaryKey(),
  platformAccountId: text('platform_account_id')
    .notNull()
    .references(() => platformAccounts.id, { onDelete: 'cascade' }),
  accessTokenEnc: text('access_token_enc').notNull(),
  refreshTokenEnc: text('refresh_token_enc').notNull(),
  expiresAt: tz('expires_at'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

// --- Domain aggregates: payload JSONB = entity as-is, kolom = subset yang di-query ---

export const channels = pgTable(
  'channels',
  {
    id: text('id').primaryKey(),
    storeId: text('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    platform: text('platform').$type<PlatformCode>().notNull(),
    platformShopId: text('platform_shop_id').notNull(),
    shopName: text('shop_name').notNull(),
    marketplace: text('marketplace').notNull().default('ID'),
    scopes: jsonb('scopes').$type<string[]>().notNull().default([]),
    payload: jsonb('payload').$type<ChannelConnection>().notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_channels_platform_shop').on(t.platform, t.platformShopId)],
);

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    storeId: text('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    platform: text('platform').$type<PlatformCode>().notNull(),
    platformOrderId: text('platform_order_id').notNull(),
    orderNumber: text('order_number').notNull(),
    channelId: text('channel_id'),
    status: text('status').notNull(),
    subStatus: text('sub_status'),
    total: jsonb('total').$type<Money>().notNull(),
    items: jsonb('items').notNull(),
    raw: jsonb('raw').notNull().default({}),
    payload: jsonb('payload').$type<UnifiedOrder>().notNull(),
    paidAt: tz('paid_at'),
    syncedAt: tz('synced_at'),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_orders_id_key').on(t.storeId, t.platform, t.platformOrderId)],
);

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'),
  skus: text('skus').array().notNull().default([]),
  payload: jsonb('payload').$type<UnifiedProduct>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: text('id').primaryKey(),
    storeId: text('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(),
    warehouseId: text('warehouse_id').notNull(),
    available: integer('available').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    incoming: integer('incoming').notNull().default(0),
    holding: integer('holding').notNull().default(0),
    payload: jsonb('payload').$type<InventoryItem>().notNull(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_inventory_sku_wh').on(t.sku, t.warehouseId)],
);

export const inventoryMovements = pgTable('inventory_movements', {
  id: text('id').primaryKey(),
  inventoryItemId: text('inventory_item_id')
    .notNull()
    .references(() => inventoryItems.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  quantity: integer('quantity').notNull(),
  reason: text('reason').notNull(),
  referenceId: text('reference_id'),
  actorId: text('actor_id'),
  occurredAt: tz('occurred_at').notNull().defaultNow(),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  tags: text('tags').array().notNull().default([]),
  payload: jsonb('payload').$type<UnifiedCustomer>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const customerProfiles = pgTable(
  'customer_profiles',
  {
    customerId: text('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    platform: text('platform').$type<PlatformCode>().notNull(),
    platformUserId: text('platform_user_id').notNull(),
    username: text('username').notNull(),
    channelId: text('channel_id'),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.platform, t.platformUserId] })],
);

export const warehouses = pgTable(
  'warehouses',
  {
    id: text('id').primaryKey(),
    storeId: text('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    name: text('name').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    status: text('status').notNull().default('active'),
    payload: jsonb('payload').$type<Warehouse>().notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('uq_warehouses_store_code').on(t.storeId, t.code)],
);

export const returns = pgTable('returns', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  channelId: text('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  refundAmount: jsonb('refund_amount').$type<Money | undefined>(),
  label: text('label'),
  payload: jsonb('payload').$type<ReturnRequest>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  method: text('method').notNull(),
  status: text('status').notNull(),
  amount: jsonb('amount').$type<Money>().notNull(),
  transactionId: text('transaction_id'),
  payload: jsonb('payload').$type<Payment>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const settlements = pgTable('settlements', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  channelId: text('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  platform: text('platform').$type<PlatformCode>().notNull(),
  status: text('status').notNull(),
  payload: jsonb('payload').$type<Settlement>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const promotions = pgTable('promotions', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  code: text('code'),
  type: text('type').notNull(),
  status: text('status').notNull(),
  startAt: tz('start_at'),
  endAt: tz('end_at'),
  payload: jsonb('payload').$type<Promotion>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const shipments = pgTable('shipments', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  courier: text('courier').notNull(),
  trackingNumber: text('tracking_number').notNull().unique(),
  status: text('status').notNull(),
  payload: jsonb('payload').$type<Shipment>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  storeId: text('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull(),
  status: text('status').notNull(),
  payload: jsonb('payload').$type<Notification>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
});

export const audits = pgTable('audits', {
  id: text('id').primaryKey(),
  storeId: text('store_id').references(() => stores.id, { onDelete: 'set null' }),
  actorId: text('actor_id')
    .notNull()
    .references(() => users.id),
  action: text('action').notNull(),
  payload: jsonb('payload').$type<AuditLog>().notNull(),
  createdAt: tz('created_at').notNull().defaultNow(),
});

export const schema = {
  stores,
  users,
  storeMembers,
  refreshTokens,
  platformAccounts,
  platformTokens,
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
};