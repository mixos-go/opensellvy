import type {
  PlatformCode,
  UnifiedOrder,
  UnifiedProduct,
  ProductStockSku,
  ReturnRequest,
} from '@opensellvy/types';
import type { ConnectorContext, OAuthToken } from './connector.types';

export type Capability =
  | 'order.pull'
  | 'order.push'
  | 'order.fulfill'
  | 'order.tracking'
  | 'product.pull'
  | 'product.push'
  | 'inventory.sync'
  | 'promotion.sync'
  | 'return.manage'
  | 'webhook.receive';

export interface PlatformAuth {
  getAuthorizeUrl(): Promise<string>;
  exchangeCode(code: string): Promise<OAuthToken>;
  /**
   * Perbarui access token dari refreshToken milik context.
   * Return token baru agar caller bisa mem-persist ke TokenStore.
   * Melempar jika tidak ada refreshToken valid.
   */
  refreshToken(context: ConnectorContext): Promise<OAuthToken>;
}

export interface PlatformShopProfile {
  platformShopId: string;
  shopName: string;
  marketplace: string;
}

/**
 * Gateway — contract yang diimplementasikan setiap adapter platform.
 * Seluruh method berbicara dalam DOMAIN types kita, bukan payload platform.
 */
export interface PlatformGateway {
  getShop(context: ConnectorContext): Promise<PlatformShopProfile>;
  pullOrders(context: ConnectorContext, opts?: { since?: Date }): Promise<UnifiedOrder[]>;
  getOrder(context: ConnectorContext, platformOrderId: string): Promise<UnifiedOrder>;
  pushOrder(context: ConnectorContext, order: UnifiedOrder): Promise<void>;
  updateOrder(context: ConnectorContext, orderId: string, patch: UnknownOrderPatch): Promise<void>;
  pullProducts(context: ConnectorContext): Promise<UnifiedProduct[]>;
  pushProduct(context: ConnectorContext, product: UnifiedProduct): Promise<void>;
  pushProducts(context: ConnectorContext, products: UnifiedProduct[]): Promise<void>;
  syncInventory(context: ConnectorContext, items: ProductStockSku[]): Promise<void>;
  manageReturn(context: ConnectorContext, request: ReturnRequest, action: ReturnAction): Promise<void>;
}

export interface UnknownOrderPatch {
  status?: string;
  trackingNumber?: string;
  courier?: string;
  [key: string]: unknown;
}

export type ReturnAction = 'approve' | 'reject' | 'receive' | 'refund';

export interface PlatformWebhookHandler {
  verify(payload: unknown, signature: string): Promise<boolean>;
  map(event: string, payload: unknown): Promise<{ type: string; data: unknown }>;
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