import type { PlatformCode } from '@opensellvy/types';
import type { ConnectorContext } from './connector.types';

export type Capability =
  | 'order.pull'
  | 'order.push'
  | 'order.fulfill'
  | 'order.tracking'
  | 'product.pull'
  | 'product.push'
  | 'inventory.sync'
  | 'promotion.sync'
  | 'webhook.receive';

export interface PlatformAuth {
  getAuthorizeUrl(): Promise<string>;
  exchangeCode(code: string): Promise<unknown>;
  refreshToken(): Promise<void>;
}

export interface PlatformGateway {
  pullOrders(context: ConnectorContext, opts?: { since?: Date }): Promise<unknown[]>;
  pushOrder(context: ConnectorContext, order: unknown): Promise<void>;
  pullProducts(context: ConnectorContext): Promise<unknown[]>;
  pushProduct(context: ConnectorContext, product: unknown): Promise<void>;
  syncInventory(context: ConnectorContext, items: unknown[]): Promise<void>;
}

export interface PlatformWebhookHandler {
  verify(payload: unknown, signature: string): Promise<boolean>;
  map(event: string, payload: unknown): Promise<unknown>;
}

export interface PlatformPlugin {
  readonly platform: PlatformCode;
  readonly name: string;
  readonly baseUrl: string;
  readonly capabilities: Capability[];
  auth: PlatformAuth;
  gateway: PlatformGateway;
  webhook: PlatformWebhookHandler;
}

export interface PlatformConnector extends PlatformPlugin {}