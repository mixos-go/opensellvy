import type { PlatformPlugin } from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';

const BASE_URL = 'https://fs.tokopedia.net';

export const tokopediaPlugin: PlatformPlugin = {
  platform: 'tts-tokopedia',
  name: 'TikTok Shop / Tokopedia',
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

export function registerTokopedia(): void {
  registerPlatform(tokopediaPlugin);
}