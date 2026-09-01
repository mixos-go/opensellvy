import type { PlatformCode } from '../types';
import type { ConnectorContext } from './connector.types';

export interface PlatformConnector {
  readonly platform: PlatformCode;
  readonly baseUrl: string;

  auth: {
    getAuthorizeUrl(): Promise<string>;
    exchangeCode(code: string): Promise<unknown>;
    refreshToken(): Promise<void>;
  };

  sync: {
    pullOrders(context: ConnectorContext, opts?: { since?: Date }): Promise<Promise<unknown>[]>;
    pushOrder(context: ConnectorContext, order: unknown): Promise<void>;
    pullProducts(context: ConnectorContext): Promise<unknown[]>;
    pushProduct(context: ConnectorContext, product: unknown): Promise<void>;
    syncInventory(context: ConnectorContext, items: unknown[]): Promise<void>;
  };
}
