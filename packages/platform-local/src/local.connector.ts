import type { OrderStatus, UnifiedOrder } from '@opensellvy/types';
import type { PlatformPlugin } from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';
import { createLocalStore, LocalStore } from './local.store';

export interface LocalPluginOptions {
  /** gunakan store yang sudah ada (mis. seeding sebelum sync) */
  store?: LocalStore;
}

export function createLocalPlugin(options: LocalPluginOptions = {}): PlatformPlugin {
  const store = options.store ?? new LocalStore();
  const token = { accessToken: 'local-token', refreshToken: 'local-refresh', expiresAt: new Date('2099-01-01').getTime() };

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
      'return.manage',
      'webhook.receive',
    ],
    auth: {
      getAuthorizeUrl: (_ctx) => Promise.resolve('memory://local/authorize?shop=local'),
      exchangeCode: (_ctx, _code) => Promise.resolve(token),
      refreshToken: () => Promise.resolve({ ...token, expiresAt: Date.now() + 24 * 60 * 60 * 1000 }),
    },
    gateway: {
      getShop: (context) =>
        Promise.resolve({
          platformShopId: store.shop.platformShopId,
          shopName: store.shop.shopName,
          marketplace: store.shop.marketplace,
        }),
      pullOrders: (context, opts) => {
        let orders = store.listOrders(context.storeId);
        if (opts?.since) orders = orders.filter((o) => new Date(o.createdAt).getTime() >= opts.since!.getTime());
        return Promise.resolve(orders);
      },
      getOrder: (context, platformOrderId) => {
        const found = store.getOrder(context.storeId, platformOrderId);
        return found ? Promise.resolve(found) : Promise.reject(new Error(`Order ${platformOrderId} not found on local`));
      },
      pushOrder: (context, order) => {
        store.saveOrder({ ...order, storeId: context.storeId });
        return Promise.resolve();
      },
      updateOrder: (context, orderId, patch) => {
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
      pullProducts: (context) => Promise.resolve(store.listProducts(context.storeId)),
      pushProduct: (context, product) => {
        store.upsertProduct(context.storeId, product);
        return Promise.resolve();
      },
      pushProducts: (context, products) => {
        for (const product of products) store.upsertProduct(context.storeId, product);
        return Promise.resolve();
      },
      syncInventory: (context, items) => {
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
      manageReturn: (context, request, action) => {
        store.applyReturnAction(context.storeId, request, action);
        return Promise.resolve();
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