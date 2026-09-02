import type { PlatformPlugin } from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';

const BASE_URL = 'https://api.blibli.com';

export const blibliPlugin: PlatformPlugin = {
  platform: 'blibli',
  name: 'Blibli',
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
    getAuthorizeUrl: (_ctx) => Promise.resolve(''),
    exchangeCode: (_ctx, _code) => Promise.resolve({ accessToken: '' }),
    refreshToken: () => Promise.resolve({ accessToken: '' }),
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

export function registerBlibli(): void {
  registerPlatform(blibliPlugin);
}