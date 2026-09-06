import type {
  CategoryReference,
  InventoryAdjustment,
  MediaAsset,
  MerchantProfile,
  OrderStatus,
  Payment,
  ProductStockSku,
  Promotion,
  ReturnRequest,
  Shipment,
  ShippingRate,
  ShippingRateRequest,
  ShopProfilePatch,
  StockLevel,
  TrackingEvent,
  UnifiedOrder,
  UnifiedProduct,
  ShopSettings,
  MerchantWarehouse,
  MerchantShop,
  FinanceOverview,
  WalletTransaction,
  FinanceStatement,
  PayoutInfo,
} from '@opensellvy/types';
import type { PlatformPlugin, PlatformShopProfile, ReturnAction } from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';
import { createLocalStore, LocalStore } from './local.store';

export interface LocalPluginOptions {
  /** gunakan store yang sudah ada (mis. seeding sebelum sync) */
  store?: LocalStore;
}

export function createLocalPlugin(options: LocalPluginOptions = {}): PlatformPlugin {
  const store = options.store ?? new LocalStore();
  const token = { accessToken: 'local-token', refreshToken: 'local-refresh', expiresAt: new Date('2099-01-01').getTime() };

  const mediaSeq = { n: 0 };
  const paymentSeq = { n: 0 };
  const media = new Map<string, MediaAsset>();
  const promotions = new Map<string, Promotion>();
  const payments = new Map<string, Payment>();
  const shipments = new Map<string, Shipment>();

  return {
    platform: 'local',
    name: 'Local Store',
    baseUrl: 'memory://local',
    capabilities: [
      'order.pull',
      'order.push',
      'order.fulfill',
      'order.tracking',
      'product.pull',
      'product.push',
      'inventory.sync',
      'promotion.sync',
      'return.manage',
      'webhook.receive',
      'payment.read',
      'shipping.rate',
      'category.read',
      'media.manage',
      'finance.read',
      'merchant.read',
      'shop.settings',
    ],
    auth: {
      getAuthorizeUrl: (_ctx) => Promise.resolve('memory://local/authorize?shop=local'),
      exchangeCode: (_ctx, _code) => Promise.resolve(token),
      refreshToken: () => Promise.resolve({ ...token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }),
    },
    gateway: {
      shop: {
        getProfile: (): Promise<PlatformShopProfile> =>
          Promise.resolve({
            platformShopId: store.shop.platformShopId,
            shopName: store.shop.shopName,
            marketplace: store.shop.marketplace,
          }),
        updateProfile: (_context, _patch: ShopProfilePatch) => Promise.resolve(),
        getSettings: (): Promise<ShopSettings> =>
          Promise.resolve({
            platformShopId: store.shop.platformShopId,
            holidayMode: false,
            warehouses: [
              { id: 'wh-default', name: 'Default Warehouse', status: 'active' },
            ],
          }),
        setHolidayMode: (_context, _enabled) => Promise.resolve(),
        listWarehouses: (): Promise<MerchantWarehouse[]> =>
          Promise.resolve([
            { id: 'wh-default', name: 'Default Warehouse', status: 'active' },
          ]),
      },

      order: {
        pull: (context, opts) => {
          let orders = store.listOrders(context.storeId);
          if (opts?.since) orders = orders.filter((o) => new Date(o.createdAt).getTime() >= opts.since!.getTime());
          return Promise.resolve(orders);
        },
        get: (context, platformOrderId) => {
          const found = store.getOrder(context.storeId, platformOrderId);
          return found ? Promise.resolve(found) : Promise.reject(new Error(`Order ${platformOrderId} not found on local`));
        },
        push: (context, order) => {
          store.saveOrder({ ...order, storeId: context.storeId });
          return Promise.resolve();
        },
        update: (context, orderId, patch) => {
          const target = store.getOrder(context.storeId, orderId);
          if (!target) throw new Error(`Order ${orderId} not found on local`);
          const partial: Partial<UnifiedOrder> = {};
          if (patch.status) partial.status = patch.status as OrderStatus;
          if (patch.trackingNumber || patch.courier) {
            partial.shipping = {
              ...target.shipping,
              ...(patch.courier ? { courier: patch.courier } : {}),
              ...(patch.trackingNumber ? { trackingNumber: patch.trackingNumber } : {}),
            };
          }
          store.applyOrderPatch(context.storeId, orderId, partial);
          return Promise.resolve();
        },
        track: (context, orderId): Promise<TrackingEvent[]> => {
          const order = store.getOrder(context.storeId, orderId);
          if (!order) return Promise.reject(new Error(`Order ${orderId} not found on local`));
          const trackingNumber = order.shipping.trackingNumber;
          if (!trackingNumber) return Promise.resolve([]);
          const events: TrackingEvent[] = [
            {
              status: 'pending',
              description: 'Order dibuat',
              location: order.shipping.address.city,
              occurredAt: order.createdAt,
            },
          ];
          if (order.subStatus === 'fulfilled') {
            events.push({
              status: 'in_transit',
              description: `Dikirim via ${order.shipping.courier} ${trackingNumber}`,
              location: order.shipping.address.city,
              occurredAt: order.updatedAt,
            });
          }
          if (order.status === 'delivered' || order.status === 'completed') {
            events.push({
              status: 'delivered',
              description: 'Paket diterima',
              location: order.shipping.address.city,
              occurredAt: order.deliveredAt ?? order.updatedAt,
            });
          }
          return Promise.resolve(events);
        },
      },

      product: {
        pull: (context) => Promise.resolve(store.listProducts(context.storeId)),
        push: (context, product) => {
          const products = Array.isArray(product) ? product : [product];
          for (const p of products) store.upsertProduct(context.storeId, p);
          return Promise.resolve();
        },
        update: (context, productId, patch) => {
          const products = store.listProducts(context.storeId);
          const target = products.find((p) => p.id === productId) ?? store.getProductBySku(context.storeId, productId);
          if (!target) throw new Error(`Product ${productId} not found on local`);
          store.upsertProduct(context.storeId, { ...target, ...patch, updatedAt: new Date().toISOString() });
          return Promise.resolve();
        },
        listCategories: (_context, _parentId?): Promise<CategoryReference[]> =>
          Promise.resolve([
            { id: 'cat-1', platform: 'local', name: 'Elektronik', level: 1, hasChildren: true },
            { id: 'cat-1-1', platform: 'local', parentId: 'cat-1', name: 'Handphone', level: 2, hasChildren: false },
            { id: 'cat-2', platform: 'local', name: 'Fashion', level: 1, hasChildren: false },
          ]),
      },

      inventory: {
        getStockLevels: (context, skus): Promise<StockLevel[]> =>
          Promise.resolve(
            skus.map((sku) => {
              const product = store.getProductBySku(context.storeId, sku);
              const variant = product?.variants.find((v) => v.sku === sku);
              const available = store.getStock(context.storeId, sku);
              return {
                available,
                reserved: 0,
                incoming: 0,
                holding: variant?.stock ?? 0,
              };
            }),
          ),
        sync: (context, items: ProductStockSku[]) => {
          for (const item of items) {
            store.setStock(context.storeId, item.sku, item.stock, item.warehouseId);
            const product = store.getProductBySku(context.storeId, item.sku);
            if (product) {
              const variant = product.variants.find((v) => v.sku === item.sku);
              if (variant) {
                variant.stock = item.stock;
                store.upsertProduct(context.storeId, product);
              }
            }
          }
          return Promise.resolve();
        },
        adjust: (context, adjustments: InventoryAdjustment[]) => {
          for (const adj of adjustments) {
            const sku = adj.sku ?? store.getProductBySku(context.storeId, adj.productId)?.variants[0]?.sku;
            if (!sku) {
              throw new Error(`InventoryAdjustment tanpa sku utk product ${adj.productId}`);
            }
            const current = store.getStock(context.storeId, sku);
            store.setStock(context.storeId, sku, current + adj.quantity, adj.warehouseId);
          }
          return Promise.resolve();
        },
      },

      fulfillment: {
        ship: (context, orderId, opts) => {
          store.applyOrderPatch(context.storeId, orderId, {
            status: 'shipped',
            subStatus: 'fulfilled',
            shipping: {
              ...(store.getOrder(context.storeId, orderId)?.shipping ?? {} as UnifiedOrder['shipping']),
              courier: opts.courier,
              ...(opts.service ? { service: opts.service } : {}),
              ...(opts.trackingNumber ? { trackingNumber: opts.trackingNumber } : {}),
            },
          });
          return Promise.resolve();
        },
        updateStatus: (context, orderId, status) => {
          store.applyOrderPatch(context.storeId, orderId, { status: status as OrderStatus });
          return Promise.resolve();
        },
      },

      returns: {
        list: (_context): Promise<ReturnRequest[]> => Promise.resolve(store.listReturns()),
        get: (_context, returnId): Promise<ReturnRequest> => {
          const found = store.getReturn(returnId);
          return found ? Promise.resolve(found) : Promise.reject(new Error(`Return ${returnId} not found on local`));
        },
        act: (context, returnId, action: ReturnAction) => {
          const request = store.getReturn(returnId);
          if (!request) throw new Error(`Return ${returnId} not found on local`);
          store.applyReturnAction(context.storeId, request, action as 'approve' | 'reject' | 'receive' | 'refund');
          return Promise.resolve();
        },
      },

      shipping: {
        getRates: (_context, _request: ShippingRateRequest): Promise<ShippingRate[]> =>
          Promise.resolve([
            { courier: 'jne', service: 'REG', cost: { amount: 15_000, currency: 'IDR' }, estDaysMin: 2, estDaysMax: 4 },
            { courier: 'jne', service: 'YES', cost: { amount: 25_000, currency: 'IDR' }, estDaysMin: 1, estDaysMax: 2 },
            { courier: 'jnt', service: 'EZ', cost: { amount: 14_000, currency: 'IDR' }, estDaysMin: 2, estDaysMax: 5 },
          ]),
        listShipments: (_context): Promise<Shipment[]> => Promise.resolve([...shipments.values()]),
        getShipment: (_context, shipmentId): Promise<Shipment> => {
          const found = shipments.get(shipmentId);
          return found ? Promise.resolve(found) : Promise.reject(new Error(`Shipment ${shipmentId} not found on local`));
        },
      },

      payment: {
        list: (_context): Promise<Payment[]> => Promise.resolve([...payments.values()]),
        get: (_context, paymentId): Promise<Payment> => {
          const found = payments.get(paymentId);
          return found ? Promise.resolve(found) : Promise.reject(new Error(`Payment ${paymentId} not found on local`));
        },
        refund: (_context, paymentId, amount) => {
          const payment = payments.get(paymentId);
          if (!payment) throw new Error(`Payment ${paymentId} not found on local`);
          paymentSeq.n += 1;
          const refund = {
            id: `local-refund-${paymentSeq.n}`,
            amount: { amount, currency: 'IDR' } as const,
            status: 'succeeded' as const,
            createdAt: new Date().toISOString(),
          };
          payments.set(paymentId, { ...payment, status: 'refunded', refunds: [...payment.refunds, refund] });
          return Promise.resolve();
        },
      },

      promotion: {
        list: (_context): Promise<Promotion[]> => Promise.resolve([...promotions.values()]),
        get: (_context, promotionId): Promise<Promotion> => {
          const found = promotions.get(promotionId);
          return found ? Promise.resolve(found) : Promise.reject(new Error(`Promotion ${promotionId} not found on local`));
        },
        create: (_context, promotion): Promise<Promotion> => {
          promotions.set(promotion.id, promotion);
          return Promise.resolve(promotion);
        },
        update: (_context, promotionId, patch) => {
          const current = promotions.get(promotionId);
          if (!current) throw new Error(`Promotion ${promotionId} not found on local`);
          promotions.set(promotionId, { ...current, ...patch });
          return Promise.resolve();
        },
        setActive: (_context, promotionId, active) => {
          const current = promotions.get(promotionId);
          if (!current) throw new Error(`Promotion ${promotionId} not found on local`);
          promotions.set(promotionId, { ...current, status: active ? 'active' : 'paused' });
          return Promise.resolve();
        },
      },

      finance: {
        overview: (): Promise<FinanceOverview> =>
          Promise.resolve({
            lastPayoutAt: new Date().toISOString(),
          }),
        transactions: (_context, _query): Promise<WalletTransaction[]> =>
          Promise.resolve([]),
        statement: (_context, _opts): Promise<FinanceStatement> =>
          Promise.resolve({
            id: '',
            fileName: '',
            status: 'generating',
          }),
        payoutInfo: (): Promise<PayoutInfo> =>
          Promise.resolve({ payouts: [] }),
      },

      media: {
        upload: (_context, opts): Promise<MediaAsset> => {
          mediaSeq.n += 1;
          const asset: MediaAsset = {
            id: `local-media-${mediaSeq.n}`,
            platform: 'local',
            type: opts.type,
            url: `memory://local/media/${mediaSeq.n}`,
            fileSizeBytes: opts.data.byteLength,
            createdAt: new Date().toISOString(),
          };
          media.set(asset.id, asset);
          return Promise.resolve(asset);
        },
        list: (_context): Promise<MediaAsset[]> => Promise.resolve([...media.values()]),
      },

      merchant: {
        getProfile: (): Promise<MerchantProfile> =>
          Promise.resolve({
            id: 'merchant-local',
            platform: 'local',
            name: 'Local Merchant',
            status: 'active',
            shops: [store.shop.platformShopId],
          }),
        listShops: (): Promise<MerchantShop[]> =>
          Promise.resolve([
            { shopId: store.shop.platformShopId },
          ]),
        listWarehouses: (): Promise<MerchantWarehouse[]> =>
          Promise.resolve([
            { id: 'wh-default', name: 'Default Warehouse', status: 'active' },
          ]),
        listWarehouseLocations: (_context, _warehouseId): Promise<Array<{ id: string; name: string }>> =>
          Promise.resolve([
            { id: 'wh-loc-default', name: 'Default Location' },
          ]),
      },
    },
    webhook: {
      verify: () => Promise.resolve(true),
      map: (event, payload) => Promise.resolve({ type: event, data: payload }),
    },
  };
}

let shared: PlatformPlugin | undefined;
let sharedStore: LocalStore | undefined;

/** plugin singleton; panggil createLocalPlugin() utk multi-tenancy eksplisit per proses */
export function registerLocal(): void {
  if (!shared) {
    sharedStore = new LocalStore();
    shared = createLocalPlugin({ store: sharedStore });
  }
  registerPlatform(shared, { replace: true });
}

export function getLocalStore(): LocalStore | undefined {
  return sharedStore;
}

export { LocalStore, createLocalStore };
