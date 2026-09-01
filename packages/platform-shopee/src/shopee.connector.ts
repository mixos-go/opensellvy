import type { PlatformPlugin } from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';

const BASE_URL = 'https://partner.shopeemobile.com';

export const shopeePlugin: PlatformPlugin = {
  platform: 'shopee',
  name: 'Shopee',
  baseUrl: BASE_URL,
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
    getAuthorizeUrl: () => Promise.resolve(''),
    exchangeCode: () => Promise.resolve({ accessToken: '' }),
    refreshToken: () => Promise.resolve(),
  },
  gateway: {
    getShop: () => Promise.resolve({ platformShopId: '', shopName: '', marketplace: '' }),
    pullOrders: () => Promise.resolve([]),
    getOrder: () => Promise.reject(new Error('not implemented')),
    pushOrder: () => Promise.resolve(),
    updateOrder: () => Promise.resolve(),
    pullProducts: () => Promise.resolve([]),
    pushProduct: () => Promise.resolve(),
    pushProducts: () => Promise.resolve(),
    syncInventory: () => Promise.resolve(),
    manageReturn: () => Promise.resolve(),
  },
  webhook: {
    verify: () => Promise.resolve(false),
    map: () => Promise.resolve({ type: 'unknown', data: {} }),
  },
};

export function registerShopee(): void {
  registerPlatform(shopeePlugin);
}