import type { PlatformConnector } from '../base.connector';
import { connectors } from '../register';

const LAZADA_BASE_URL = 'https://api.lazada.com.my';

export class LazadaConnector implements PlatformConnector {
  readonly platform = 'lazada' as const;
  readonly baseUrl = LAZADA_BASE_URL;

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

connectors.register('lazada', () => new LazadaConnector());
