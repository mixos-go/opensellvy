import type { PlatformPlugin, TokenStore } from '@opensellvy/connector';
import { connectors, registerPlatform } from '@opensellvy/connector';
import type { UnifiedOrder, Money } from '@opensellvy/types';
import { createServices, createMemoryRepositories } from '../src';
import type { Services } from '../src';

export function makeTokenStore(): TokenStore {
  const map = new Map<string, unknown>();
  return {
    save: (storeId, platform, token) => Promise.resolve(void map.set(`${storeId}:${platform}`, token)),
    get: (storeId, platform) => Promise.resolve(map.get(`${storeId}:${platform}`) as never),
    delete: (storeId, platform) => Promise.resolve(void map.delete(`${storeId}:${platform}`)),
  };
}

const baseShop = { platformShopId: 'shop-local', shopName: 'Local Shop', marketplace: 'local' };
const token = { accessToken: 't', expiresAt: Date.now() + 60_000 };

export interface LocalPluginHooks {
  orders?: UnifiedOrder[];
  afterUpdateOrder?: (args: { platformOrderId: string; patch: unknown }) => void;
  afterManageReturn?: (args: { orderId: string; action: string }) => void;
}

export function dummyPlugin(hooks: LocalPluginHooks = {}): PlatformPlugin {
  return {
    platform: 'local',
    name: 'Local',
    baseUrl: 'memory://local',
    capabilities: ['order.pull', 'order.push', 'product.pull', 'product.push', 'inventory.sync', 'return.manage'],
    auth: {
      getAuthorizeUrl: (_c) => Promise.resolve('memory://local/authorize'),
      exchangeCode: (_c, _code) => Promise.resolve(token),
      refreshToken: () => Promise.resolve({ accessToken: 't2', refreshToken: 'r2', expiresAt: Date.now() + 60_000 }),
    },
    gateway: {
      getShop: () => Promise.resolve(baseShop),
      pullOrders: () => Promise.resolve(hooks.orders ?? []),
      getOrder: () => Promise.reject(new Error('not implemented')),
      pushOrder: () => Promise.resolve(),
      updateOrder: (_c, platformOrderId, patch) => {
        hooks.afterUpdateOrder?.({ platformOrderId, patch });
        return Promise.resolve();
      },
      pullProducts: () => Promise.resolve([]),
      pushProduct: () => Promise.resolve(),
      pushProducts: () => Promise.resolve(),
      syncInventory: () => Promise.resolve(),
      manageReturn: (_c, request, action) => {
        hooks.afterManageReturn?.({ orderId: request.orderId, action });
        return Promise.resolve();
      },
    },
    webhook: {
      verify: () => Promise.resolve(true),
      map: (event, payload) => Promise.resolve({ type: event, data: payload }),
    },
  };
}

const ADDRESS = {
  name: 'Buyer Lokal',
  phone: '0812-3456-7890',
  province: 'DKI Jakarta',
  city: 'Jakarta Pusat',
  district: 'Gambir',
  subDistrict: 'Gambir',
  postalCode: '10110',
  detail: 'Jl. Contoh No. 1',
};

let seq = 0;

export function makeOrder(storeId: string, overrides: Partial<UnifiedOrder> = {}): UnifiedOrder {
  seq += 1;
  const stamp = overrides.createdAt ?? new Date().toISOString();
  const subtotal: Money = { amount: 100_000, currency: 'IDR' };
  const shippingFee: Money = { amount: 12_000, currency: 'IDR' };
  const discount: Money = { amount: 0, currency: 'IDR' };
  const tax: Money = { amount: 0, currency: 'IDR' };
  return {
    ...overrides,
    id: overrides.id ?? `order-${seq}`,
    storeId,
    channelId: overrides.channelId ?? `local:${storeId}`,
    platform: overrides.platform ?? 'local',
    platformOrderId: overrides.platformOrderId ?? `LOC${String(seq).padStart(4, '0')}`,
    orderNumber: overrides.orderNumber ?? `INV-${String(seq).padStart(4, '0')}`,
    customer: overrides.customer ?? { id: `cust-${seq}`, customerName: 'Budi' },
    lines: overrides.lines ?? [
      {
        id: `l-${seq}`,
        productId: `p-${seq}`,
        sku: `SKU-${seq}`,
        name: 'Produk',
        quantity: 2,
        unitPrice: { amount: 50_000, currency: 'IDR' },
        total: { amount: 100_000, currency: 'IDR' },
      },
    ],
    shipping: overrides.shipping ?? { address: ADDRESS, courier: 'jne', service: 'REG' },
    totals: overrides.totals ?? { subtotal, shippingFee, discount, tax, grandTotal: { amount: subtotal.amount + shippingFee.amount, currency: 'IDR' } },
    status: overrides.status ?? 'paid',
    createdAt: stamp,
    updatedAt: overrides.updatedAt ?? stamp,
  };
}

export interface HomeHarness {
  services: Services;
  repos: ReturnType<typeof createMemoryRepositories>;
  register(hooks: LocalPluginHooks): void;
}

export function makeHome(plugin: PlatformPlugin = dummyPlugin()): HomeHarness {
  registerPlatform(plugin, { replace: true });
  const repos = createMemoryRepositories();
  const services = createServices({
    deps: {
      registry: connectors,
      tokens: makeTokenStore(),
      credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }),
    },
    repositories: repos,
  });
  return {
    services,
    repos,
    register(hooks) {
      registerPlatform(dummyPlugin(hooks), { replace: true });
    },
  };
}

export async function makeConnectedStore(harness: HomeHarness, name = 'Toko'): Promise<{ storeId: string; channelId: string }> {
  const store = await harness.services.stores.create({ name, slug: `toko-${seq}-${Math.random().toString(36).slice(2, 7)}`, config: { timezone: 'Asia/Jakarta', currency: 'IDR' } });
  const channel = await harness.services.channels.connect({ storeId: store.id, platform: 'local', oauth: { code: 'auth-code' } });
  return { storeId: store.id, channelId: channel.id };
}