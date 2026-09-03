import type { PlatformPlugin, PlatformShopProfile } from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';
import type {
  UnifiedOrder,
  UnifiedProduct,
  TrackingEvent,
  CategoryReference,
  StockLevel,
  ReturnRequest,
  ShippingRate,
  Shipment,
  Payment,
  Promotion,
  MediaAsset,
} from '@opensellvy/types';

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
    getAuthorizeUrl: (_ctx) => Promise.resolve(''),
    exchangeCode: (_ctx, _code) => Promise.resolve({ accessToken: '' }),
    refreshToken: () => Promise.resolve({ accessToken: '' }),
  },
  gateway: {
    shop: {
      getProfile: (_ctx): Promise<PlatformShopProfile> =>
        Promise.resolve({ platformShopId: '', shopName: '', marketplace: '' }),
      updateProfile: (_ctx, _patch) => Promise.resolve(),
    },
    order: {
      pull: (_ctx, _opts): Promise<UnifiedOrder[]> => Promise.resolve([]),
      get: (_ctx, _orderId) => Promise.reject(new Error('not implemented')),
      push: (_ctx, _order) => Promise.resolve(),
      update: (_ctx, _orderId, _patch) => Promise.resolve(),
      track: (_ctx, _orderId): Promise<TrackingEvent[]> => Promise.resolve([]),
    },
    product: {
      pull: (_ctx, _opts): Promise<UnifiedProduct[]> => Promise.resolve([]),
      push: (_ctx, _product) => Promise.resolve(),
      update: (_ctx, _productId, _patch) => Promise.resolve(),
      listCategories: (_ctx, _parentId): Promise<CategoryReference[]> =>
        Promise.resolve([]),
    },
    inventory: {
      getStockLevels: (_ctx, _skus): Promise<StockLevel[]> =>
        Promise.resolve([]),
      sync: (_ctx, _items) => Promise.resolve(),
      adjust: (_ctx, _adjustments) => Promise.resolve(),
    },
    fulfillment: {
      ship: (_ctx, _orderId, _opts) => Promise.resolve(),
      updateStatus: (_ctx, _orderId, _status) => Promise.resolve(),
    },
    returns: {
      list: (_ctx, _opts): Promise<ReturnRequest[]> => Promise.resolve([]),
      get: (_ctx, _returnId) => Promise.reject(new Error('not implemented')),
      act: (_ctx, _returnId, _action) => Promise.resolve(),
    },
    shipping: {
      getRates: (_ctx, _request): Promise<ShippingRate[]> =>
        Promise.resolve([]),
      listShipments: (_ctx, _opts): Promise<Shipment[]> =>
        Promise.resolve([]),
      getShipment: (_ctx, _shipmentId) =>
        Promise.reject(new Error('not implemented')),
    },
    payment: {
      list: (_ctx, _opts): Promise<Payment[]> => Promise.resolve([]),
      get: (_ctx, _paymentId) => Promise.reject(new Error('not implemented')),
      refund: (_ctx, _paymentId, _amount) => Promise.resolve(),
    },
    promotion: {
      list: (_ctx, _opts): Promise<Promotion[]> => Promise.resolve([]),
      get: (_ctx, _promotionId) =>
        Promise.reject(new Error('not implemented')),
      create: (_ctx, promotion): Promise<Promotion> =>
        Promise.resolve(promotion),
      update: (_ctx, _promotionId, _patch) => Promise.resolve(),
      setActive: (_ctx, _promotionId, _active) => Promise.resolve(),
    },
    media: {
      upload: (_ctx, _opts) => Promise.reject(new Error('not implemented')),
      list: (_ctx, _opts): Promise<MediaAsset[]> => Promise.resolve([]),
    },
    merchant: {
      getProfile: (_ctx) => Promise.reject(new Error('not implemented')),
    },
  },
  webhook: {
    verify: () => Promise.resolve(false),
    map: () => Promise.resolve({ type: 'unknown', data: {} }),
  },
};

export function registerTokopedia(): void {
  registerPlatform(tokopediaPlugin);
}
