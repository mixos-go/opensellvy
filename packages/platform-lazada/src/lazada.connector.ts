import type { PlatformPlugin } from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';

const BASE_URL = 'https://api.lazada.com.my';

export const lazadaPlugin: PlatformPlugin = {
  platform: 'lazada',
  name: 'Lazada',
  capabilities: [
    'order.pull',
    'order.push',
    'order.fulfill',
    'order.tracking',
    'product.pull',
    'product.push',
    'inventory.sync',
    'webhook.receive',
  ],
  auth: {
    getAuthorizeUrl: () => Promise.resolve(''),
    exchangeCode: () => Promise.resolve({}),
    refreshToken: () => Promise.resolve(),
  },
  gateway: {
    pullOrders: () => Promise.resolve([]),
    pushOrder: () => Promise.resolve(),
    pullProducts: () => Promise.resolve([]),
    pushProduct: () => Promise.resolve(),
    syncInventory: () => Promise.resolve(),
  },
  webhook: {
    verify: () => Promise.resolve(false),
    map: () => Promise.resolve({}),
  },
  baseUrl: BASE_URL,
};

export function registerLazada(): void {
  registerPlatform(lazadaPlugin);
}