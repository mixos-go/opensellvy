import type {
  PlatformCode,
  UnifiedOrder,
  UnifiedProduct,
  ProductStockSku,
  ReturnRequest,
  Shipment,
  ShippingRate,
  ShippingRateRequest,
  TrackingEvent,
  Payment,
  Promotion,
  CategoryReference,
  StockLevel,
  InventoryAdjustment,
  MediaAsset,
  MerchantProfile,
  MerchantWarehouse,
  MerchantShop,
  ShopProfilePatch,
  ShopSettings,
  FinanceOverview,
  WalletTransaction,
  FinanceStatement,
  PayoutInfo,
  FinanceQuery,
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
  | 'webhook.receive'
  | 'payment.read'
  | 'shipping.rate'
  | 'category.read'
  | 'media.manage'
  | 'finance.read'
  | 'merchant.read'
  | 'shop.settings';

export interface PlatformAuth {
  getAuthorizeUrl(context: ConnectorContext): Promise<string>;
  exchangeCode(context: ConnectorContext, code: string): Promise<OAuthToken>;
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

export interface UnknownOrderPatch {
  status?: string;
  trackingNumber?: string;
  courier?: string;
  [key: string]: unknown;
}

export type ReturnAction = 'approve' | 'reject' | 'receive' | 'refund' | 'cancel';

/**
 * Gateway — kontrak yang diimplementasikan setiap adapter platform.
 * Seluruh method berbicara dalam DOMAIN types kita (platform-agnostic), BUKAN
 * payload platform. Kontrak di-scale PER-DOMAIN (bukan per-endpoint) sehingga
 * reuse lintas banyak platform (Shopee/Tokopedia/Lazada/Blibli/local) — tiap
 * adapter bertanggung-jawab mapping ke endpoint platform masing-masing.
 *
 * Setiap kelompok domain bisa tidak didukung oleh suatu platform; gate dengan
 * `PlatformPlugin.capabilities`.
 */
export interface PlatformGateway {
  /** Profil & informasi akun toko di platform. */
  shop: {
    getProfile(context: ConnectorContext): Promise<PlatformShopProfile>;
    updateProfile(context: ConnectorContext, patch: ShopProfilePatch): Promise<void>;
    /** Pengaturan operasional shop (holiday mode, daftar gudang). */
    getSettings(context: ConnectorContext): Promise<ShopSettings>;
    setHolidayMode(context: ConnectorContext, enabled: boolean): Promise<void>;
    listWarehouses(context: ConnectorContext): Promise<MerchantWarehouse[]>;
  };

  /** Siklus hidup pesanan. */
  order: {
    pull(context: ConnectorContext, opts?: { since?: Date }): Promise<UnifiedOrder[]>;
    get(context: ConnectorContext, platformOrderId: string): Promise<UnifiedOrder>;
    push(context: ConnectorContext, order: UnifiedOrder): Promise<void>;
    update(context: ConnectorContext, orderId: string, patch: UnknownOrderPatch): Promise<void>;
    track(context: ConnectorContext, orderId: string): Promise<TrackingEvent[]>;
  };

  /** Katalog produk + referensi kategori. */
  product: {
    pull(context: ConnectorContext, opts?: { offset?: number; limit?: number; ids?: string[] }): Promise<UnifiedProduct[]>;
    push(context: ConnectorContext, product: UnifiedProduct | UnifiedProduct[]): Promise<void>;
    update(context: ConnectorContext, productId: string, patch: Record<string, unknown>): Promise<void>;
    listCategories(context: ConnectorContext, parentId?: string): Promise<CategoryReference[]>;
  };

  /** Stok & pergerakan inventory. */
  inventory: {
    getStockLevels(context: ConnectorContext, skus: string[]): Promise<StockLevel[]>;
    sync(context: ConnectorContext, items: ProductStockSku[]): Promise<void>;
    adjust(context: ConnectorContext, adjustments: InventoryAdjustment[]): Promise<void>;
  };

  /** Fulfillment / proses operasional pick-pack-ship. */
  fulfillment: {
    ship(
      context: ConnectorContext,
      orderId: string,
      opts: { courier: string; service?: string; trackingNumber?: string },
    ): Promise<void>;
    updateStatus(context: ConnectorContext, orderId: string, status: string): Promise<void>;
  };

  /** Pengelolaan retur/komplain. */
  returns: {
    list(context: ConnectorContext, opts?: { status?: string[]; since?: Date }): Promise<ReturnRequest[]>;
    get(context: ConnectorContext, returnId: string): Promise<ReturnRequest>;
    act(context: ConnectorContext, returnId: string, action: ReturnAction): Promise<void>;
  };

  /** Ongkir & pelacakan pengiriman. */
  shipping: {
    getRates(context: ConnectorContext, request: ShippingRateRequest): Promise<ShippingRate[]>;
    listShipments(context: ConnectorContext, opts?: { since?: Date; status?: string[] }): Promise<Shipment[]>;
    getShipment(context: ConnectorContext, shipmentId: string): Promise<Shipment>;
  };

  /** Pembayaran & refund. */
  payment: {
    list(context: ConnectorContext, opts?: { since?: Date; status?: string[] }): Promise<Payment[]>;
    get(context: ConnectorContext, paymentId: string): Promise<Payment>;
    refund(context: ConnectorContext, paymentId: string, amount: number): Promise<void>;
  };

  /** Promosi (voucher, diskon, bundle, flash sale). */
  promotion: {
    list(context: ConnectorContext, opts?: { type?: string; status?: string[] }): Promise<Promotion[]>;
    get(context: ConnectorContext, promotionId: string): Promise<Promotion>;
    create(context: ConnectorContext, promotion: Promotion): Promise<Promotion>;
    update(context: ConnectorContext, promotionId: string, patch: Record<string, unknown>): Promise<void>;
    setActive(context: ConnectorContext, promotionId: string, active: boolean): Promise<void>;
  };

  /** Finansial: ringkasan income, transaksi wallet, laporan & payout. */
  finance: {
    overview(context: ConnectorContext): Promise<FinanceOverview>;
    transactions(context: ConnectorContext, query?: FinanceQuery): Promise<WalletTransaction[]>;
    statement(context: ConnectorContext, opts?: { from?: Date; to?: Date }): Promise<FinanceStatement>;
    payoutInfo(context: ConnectorContext): Promise<PayoutInfo>;
  };

  /** Aset & media ter-hosting platform (gambar/video). */
  media: {
    upload(
      context: ConnectorContext,
      opts: { type: 'image' | 'video' | 'file'; data: Uint8Array; fileName?: string; mimeType?: string },
    ): Promise<MediaAsset>;
    list(context: ConnectorContext, opts?: { type?: string }): Promise<MediaAsset[]>;
  };

  /** Profil merchant/brand level platform. */
  merchant: {
    getProfile(context: ConnectorContext): Promise<MerchantProfile>;
    listShops(context: ConnectorContext): Promise<MerchantShop[]>;
    listWarehouses(context: ConnectorContext): Promise<MerchantWarehouse[]>;
    listWarehouseLocations(context: ConnectorContext, warehouseId: string): Promise<MerchantWarehouse[]>;
  };
}

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

export type PlatformConnector = PlatformPlugin;
