import type { PlatformPlugin } from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';

const BASE_URL = 'https://api.lazada.com.my';

export const lazadaPlugin: PlatformPlugin = {
  platform: 'lazada',
  name: 'Lazada',
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
    exchangeCode: () => Promise.resolve({}),
    refreshToken: () => Promise.resolve(),
  },
  gateway: {
    pullOrders: () => Promise.resolve([]),
    getOrder: () => Promise.reject(new Error('not implemented')),
    pushOrder: () => Promise.resolve(),
    updateOrder: () => Promise.resolve(),
    pullProducts: () => Promise.resolve([]),
    pushProduct: () => Promise.resolve(),
    syncInventory: () => Promise.resolve(),
    manageReturn: () => Promise.resolve(),
  },
  webhook: {
    verify: () => Promise.resolve(false),
    map: () => Promise.resolve({ type: 'unknown', data: {} }),
  },
};

export function registerLazada(): void {
  registerPlatform(lazadaPlugin);
}