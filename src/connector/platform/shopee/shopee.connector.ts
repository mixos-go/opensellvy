import type { PlatformConnector } from '../base.connector';
import { connectors } from '../register';

const SHOPEE_BASE_URL = 'https://partner.shopeemobile.com';

export class ShopeeConnector implements PlatformConnector {
  readonly platform = 'shopee' as const;
  readonly baseUrl = SHOPEE_BASE_URL;

  auth = {
    getAuthorizeUrl: () => Promise.resolve(''),
    exchangeCode: () => Promise.resolve({}),
    refreshToken: () => Promise.resolve(),
  };

  sync = {
    pullOrders: () => Promise.resolve([]),
    pushOrder: () => Promise.resolve(),
    pullProducts: () => Promise.resolve([]),
    pushProduct: () => Promise.resolve(),
    syncInventory: () => Promise.resolve(),
  };
}

connectors.register('shopee', () => new ShopeeConnector());
