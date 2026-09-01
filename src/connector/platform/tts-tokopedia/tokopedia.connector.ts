import type { PlatformConnector } from '../base.connector';
import { connectors } from '../register';

const TOKOPEDIA_BASE_URL = 'https://fs.tokopedia.net';

export class TokopediaConnector implements PlatformConnector {
  readonly platform = 'tts-tokopedia' as const;
  readonly baseUrl = TOKOPEDIA_BASE_URL;

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

connectors.register('tts-tokopedia', () => new TokopediaConnector());
