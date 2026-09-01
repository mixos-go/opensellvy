import type { PlatformConnector } from '../base.connector';
import { connectors } from '../register';

const BLIBLI_BASE_URL = 'https://api.blibli.com';

export class BlibliConnector implements PlatformConnector {
  readonly platform = 'blibli' as const;
  readonly baseUrl = BLIBLI_BASE_URL;

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

connectors.register('blibli', () => new BlibliConnector());
