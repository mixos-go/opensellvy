import type {
  PlatformPlugin,
  ConnectorContext,
  OAuthToken,
  PlatformCredentials,
  PlatformShopProfile,
} from '@opensellvy/connector';
import { registerPlatform, createMemoryTokenStore } from '@opensellvy/connector';
import type { TokenStore } from '@opensellvy/connector';
import type {
  StockLevel,
  Payment,
  Promotion,
  Shipment,
  Currency,
  MerchantWarehouse,
  MerchantShop,
  WalletTransaction,
  FinanceOverview,
  TrackingEvent,
  MediaAsset,
} from '@opensellvy/types';
import { TikTokClient } from './tts.client';
import { TikTokCredentials, TikTokRequestOptions } from './tts.types';
import { buildAuthUrl, exchangeAuthCode, refreshAccessToken, TokenResponse } from './tts.auth';
import { createTtsWebhook } from './tts.webhook';
import { mapOrder, mapProduct, mapReturn, TikTokOrderRaw } from './tts.mapper';
import {
  TikTokAffiliateApi,
  TikTokAffiliateCreatorApi,
  TikTokAffiliatePartnerApi,
  TikTokAffiliateSellerApi,
  TikTokAnalyticsApi,
  TikTokAuthorizationApi,
  TikTokCustomerEngagementApi,
  TikTokCustomerServiceApi,
  TikTokDataReconciliationApi,
  TikTokEpharmacyApi,
  TikTokEventApi,
  TikTokFbtApi,
  TikTokFinanceApi,
  TikTokFulfillmentApi,
  TikTokGsFullServiceCommodityApi,
  TikTokGsFullServiceInventoryApi,
  TikTokGsFullServiceShipmentApi,
  TikTokLogisticsApi,
  TikTokOrderApi,
  TikTokProductApi,
  TikTokPromotionApi,
  TikTokReturnRefundApi,
  TikTokReviewRatingApi,
  TikTokSellerApi,
  TikTokSupplyChainApi,
} from './generated';

export interface TtsPluginOptions {
  /** default credentials — biasanya diisi per-context dari registry, bukan di sini */
  credentials?: PlatformCredentials;
  /** injeksi fetch utk test. */
  fetch?: typeof fetch;
  /**
   * TokenStore persist OAuth per seller. Default: memory. Simpan juga
   * `shopCipher` (cross-border) sebagai field tambahan pada token.
   */
  tokenStore?: TokenStore;
  /** refresh otomatis bila token mendekati kadaluarsa (default true). */
  autoRefresh?: boolean;
  /** dev/quick-start: access token langsung (bukan desain produksi — gunakan OAuth). */
  accessToken?: string;
  /** dev/quick-start: shop_cipher utk access token di atas (cross-border). */
  shopCipher?: string;
  /** ambang refresh dini (ms sebelum kadaluarsa), default 5 menit. */
  refreshBeforeMs?: number;
  /** app_secret utk verifikasi webhook (opsional; fallback kredensial per-context). */
  appSecret?: string;
}

export const TTS_BASE_URL = 'https://open-api.tiktokglobalshop.com';
const PLATFORM = 'tts-tokopedia' as const;

/** Facade kategori API TikTok (25 kategori, ter-bind pada satu TikTokClient). */
export interface TtsApi {
  affiliate: TikTokAffiliateApi;
  affiliateCreator: TikTokAffiliateCreatorApi;
  affiliatePartner: TikTokAffiliatePartnerApi;
  affiliateSeller: TikTokAffiliateSellerApi;
  analytics: TikTokAnalyticsApi;
  authorization: TikTokAuthorizationApi;
  customerEngagement: TikTokCustomerEngagementApi;
  customerService: TikTokCustomerServiceApi;
  dataReconciliation: TikTokDataReconciliationApi;
  epharmacy: TikTokEpharmacyApi;
  event: TikTokEventApi;
  fbt: TikTokFbtApi;
  finance: TikTokFinanceApi;
  fulfillment: TikTokFulfillmentApi;
  gsFullServiceCommodity: TikTokGsFullServiceCommodityApi;
  gsFullServiceInventory: TikTokGsFullServiceInventoryApi;
  gsFullServiceShipment: TikTokGsFullServiceShipmentApi;
  logistics: TikTokLogisticsApi;
  order: TikTokOrderApi;
  product: TikTokProductApi;
  promotion: TikTokPromotionApi;
  returnRefund: TikTokReturnRefundApi;
  reviewRating: TikTokReviewRatingApi;
  seller: TikTokSellerApi;
  supplyChain: TikTokSupplyChainApi;
}

export interface TtsApiAccessor {
  /**
   * Facade lengkap (25 kategori) ter-bind pada satu seller (context), dengan
   * access token valid (auto-refresh) + shop_cipher ter-resolve dari context.
   */
  api(context: ConnectorContext): Promise<TtsApi>;
  /** Client TikTok low-level ter-bind pada credentials context. */
  client(context: ConnectorContext): TikTokClient;
}

export type TtsPlugin = PlatformPlugin & TtsApiAccessor;

/** Cast helper — payload JSON platform → tipe request/body generated. */
function R<T>(p: Record<string, unknown>): T {
  return p as unknown as T;
}

function buildFacade(client: TikTokClient): TtsApi {
  return {
    affiliate: new TikTokAffiliateApi(client),
    affiliateCreator: new TikTokAffiliateCreatorApi(client),
    affiliatePartner: new TikTokAffiliatePartnerApi(client),
    affiliateSeller: new TikTokAffiliateSellerApi(client),
    analytics: new TikTokAnalyticsApi(client),
    authorization: new TikTokAuthorizationApi(client),
    customerEngagement: new TikTokCustomerEngagementApi(client),
    customerService: new TikTokCustomerServiceApi(client),
    dataReconciliation: new TikTokDataReconciliationApi(client),
    epharmacy: new TikTokEpharmacyApi(client),
    event: new TikTokEventApi(client),
    fbt: new TikTokFbtApi(client),
    finance: new TikTokFinanceApi(client),
    fulfillment: new TikTokFulfillmentApi(client),
    gsFullServiceCommodity: new TikTokGsFullServiceCommodityApi(client),
    gsFullServiceInventory: new TikTokGsFullServiceInventoryApi(client),
    gsFullServiceShipment: new TikTokGsFullServiceShipmentApi(client),
    logistics: new TikTokLogisticsApi(client),
    order: new TikTokOrderApi(client),
    product: new TikTokProductApi(client),
    promotion: new TikTokPromotionApi(client),
    returnRefund: new TikTokReturnRefundApi(client),
    reviewRating: new TikTokReviewRatingApi(client),
    seller: new TikTokSellerApi(client),
    supplyChain: new TikTokSupplyChainApi(client),
  };
}

export function createTtsPlugin(options: TtsPluginOptions = {}): TtsPlugin {
  const tokenStore = options.tokenStore ?? createMemoryTokenStore();
  const autoRefresh = options.autoRefresh ?? true;
  const refreshBeforeMs = options.refreshBeforeMs ?? 5 * 60 * 1000;

  function clientFor(credentials: PlatformCredentials): TikTokClient {
    const c: TikTokCredentials = { app_key: credentials.appId, app_secret: credentials.secret };
    return new TikTokClient({ credentials: c, ...(options.fetch ? { fetch: options.fetch } : {}) });
  }

  /** Map OAuthToken (RFC6749) dari respons token TikTok. */
  function toOAuthToken(res: TokenResponse, prev?: OAuthToken): OAuthToken {
    const d = res?.data ?? {};
    const token: OAuthToken = {
      accessToken: String(d.access_token ?? prev?.accessToken ?? ''),
      ...(d.refresh_token !== undefined ? { refreshToken: String(d.refresh_token) } : {}),
      ...(d.access_token_expire_in !== undefined
        ? { expiresAt: Date.now() + Number(d.access_token_expire_in) * 1000 }
        : {}),
    };
    if (d.shop_cipher !== undefined && String(d.shop_cipher)) {
      (token as OAuthToken & { shopCipher?: string }).shopCipher = String(d.shop_cipher);
    }
    return token;
  }

  async function loadToken(context: ConnectorContext): Promise<OAuthToken | undefined> {
    const fromDev = options.accessToken ? { accessToken: options.accessToken } : undefined;
    const stored = await tokenStore.get(context.storeId, PLATFORM);
    return stored ?? fromDev ?? context.token;
  }

  /** Resolve shop_cipher: option → credentials extension → token tersimpan. */
  async function storedShopCipher(context: ConnectorContext): Promise<string> {
    if (options.shopCipher) return options.shopCipher;
    const credSc = (context.credentials as PlatformCredentials & { shopCipher?: string }).shopCipher;
    if (credSc) return credSc;
    const stored = await tokenStore.get(context.storeId, PLATFORM);
    return (stored as (OAuthToken & { shopCipher?: string }) | undefined)?.shopCipher ?? '';
  }

  /** Resolve cipher pertama dari Get Authorized Shops, lalu persist ke token store. */
  async function authorizedShopCipher(context: ConnectorContext): Promise<string> {
    const accessToken = await validToken(context);
    const client = clientFor(context.credentials);
    const facade = buildFacade(client);
    const res = (await facade.authorization.getAuthorizedShops(
      R({}),
      { access_token: accessToken.accessToken },
    )) as { data?: { shops?: Array<Record<string, unknown>> } };
    const s = res.data?.shops?.[0];
    if (s && String(s.cipher ?? '')) {
      const existing = (await tokenStore.get(context.storeId, PLATFORM)) ?? context.token;
      await tokenStore.save(context.storeId, PLATFORM, {
        ...existing,
        shopCipher: String(s.cipher),
      } as OAuthToken & { shopCipher: string });
      return String(s.cipher);
    }
    return '';
  }

  /** Resolve shop_cipher: stored → auto-resolve via Get Authorized Shops. */
  async function shopCipherOf(context: ConnectorContext): Promise<string> {
    const stored = await storedShopCipher(context);
    if (stored) return stored;
    return authorizedShopCipher(context);
  }

  /** Ambil token valid utk request; auto-refresh bila perlu lalu persist. */
  async function validToken(context: ConnectorContext): Promise<OAuthToken> {
    let token = await loadToken(context);
    if (!token || !token.accessToken) token = context.token;
    if (autoRefresh && token.refreshToken) {
      const expired = token.expiresAt ? Date.now() + refreshBeforeMs >= token.expiresAt : false;
      if (expired || !token.accessToken) {
        const res = await refreshAccessToken(
          { app_key: context.credentials.appId, app_secret: context.credentials.secret },
          token.refreshToken,
          options.fetch ? { fetch: options.fetch } : {},
        );
        token = { ...token, ...toOAuthToken(res, token) };
        await tokenStore.save(context.storeId, PLATFORM, token);
      }
    }
    return token;
  }

  const auth: PlatformPlugin['auth'] = {
    getAuthorizeUrl(context) {
      return Promise.resolve(
        buildAuthUrl(
          { app_key: context.credentials.appId, app_secret: context.credentials.secret },
          context.credentials.redirectUri,
        ),
      );
    },
    async exchangeCode(context, code) {
      const res = await exchangeAuthCode(
        { app_key: context.credentials.appId, app_secret: context.credentials.secret },
        code,
        options.fetch ? { fetch: options.fetch } : {},
      );
      const token = toOAuthToken(res);
      await tokenStore.save(context.storeId, PLATFORM, token);
      return token;
    },
    async refreshToken(context) {
      return validToken(context);
    },
  };

  /** { accessToken, shopCipher } ter-resolve + valid utk request shop-scoped. */
  async function shopAcc(context: ConnectorContext): Promise<{ accessToken: string; shopCipher: string }> {
    const token = await validToken(context);
    const shopCipher = await shopCipherOf(context);
    return { accessToken: token.accessToken, shopCipher };
  }

  function tokOpts(sc: string, accessToken: string): TikTokRequestOptions {
    const o: TikTokRequestOptions = { access_token: accessToken };
    if (sc) o.shop_cipher = sc;
    return o;
  }

  /** Update stok satu SKU: resolve product_id/warehouse via inventorySearch lalu updateInventory. */
  async function updateInventory(context: ConnectorContext, sku: string, quantity: number): Promise<void> {
    if (!sku) return;
    const client = clientFor(context.credentials);
    const g = buildFacade(client);
    const acc = await shopAcc(context);
    const opts = tokOpts(acc.shopCipher, acc.accessToken);
    const res = (await g.product.inventorySearch(
      R({}),
      R({ sku_ids: [sku] }),
      opts,
    )) as {
      data?: {
        inventory?: Array<{
          product_id?: string;
          skus?: Array<{ id?: string; warehouses?: Array<{ out_warehouse_id?: string }> }>;
        }>;
      };
    };
    const entry = res.data?.inventory?.[0] ?? {};
    const productId = String(entry.product_id ?? '');
    const skuId = String(entry.skus?.[0]?.id ?? sku);
    if (!productId) return;
    const warehouseId = String(entry.skus?.[0]?.warehouses?.[0]?.out_warehouse_id ?? '');
    const stockQty = Math.max(0, Math.floor(quantity));
    const warehouse = warehouseId
      ? { out_warehouse_id: warehouseId, available_stock_quantity: stockQty }
      : { available_stock_quantity: stockQty };
    await g.product.updateInventory(
      R({ product_id: productId }),
      R({ skus: [{ sku_id: skuId, stock_info: { warehouse_stock: [warehouse] } }] }),
      opts,
    );
  }

  const gateway: PlatformPlugin['gateway'] = {
    shop: {
      async getProfile(context): Promise<PlatformShopProfile> {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const token = await validToken(context);
        const res = (await g.authorization.getAuthorizedShops(R({}), { access_token: token.accessToken })) as {
          data?: { shops?: Array<Record<string, unknown>> };
        };
        const s = res.data?.shops?.[0] ?? {};
        return {
          platformShopId: String(s.shop_id ?? s.id ?? context.credentials.shopId ?? context.platformAccountId),
          shopName: String(s.name ?? ''),
          marketplace: String(s.region ?? ''),
        };
      },
      async updateProfile() {
        // TikTok Shop tidak punya endpoint update profil shop dari sisi seller.
        return;
      },
      async getSettings(context) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const opts = tokOpts(acc.shopCipher, acc.accessToken);
        let warehouses: MerchantWarehouse[] = [];
        try {
          const res = (await g.logistics.getWarehouseList(R({}), opts)) as {
            data?: { warehouses?: Array<Record<string, unknown>> };
          };
          warehouses = (res.data?.warehouses ?? []).map((w) => ({
            id: String(w.warehouse_id ?? w.id ?? ''),
            name: String(w.name ?? ''),
            ...(w.region !== undefined ? { region: String(w.region) } : {}),
            ...(w.address !== undefined ? { address: String(w.address) } : {}),
            status: 'active',
          }));
        } catch {
          // warehouse list may not be available untuk semua shop type
        }
        return {
          platformShopId: String(context.credentials.shopId ?? context.platformAccountId),
          holidayMode: false,
          warehouses,
        };
      },
      async setHolidayMode() {
        // TikTok Shop tidak punya holiday mode.
        return;
      },
      async listWarehouses(context): Promise<MerchantWarehouse[]> {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        try {
          const res = (await g.logistics.getWarehouseList(R({}), tokOpts(acc.shopCipher, acc.accessToken))) as {
            data?: { warehouses?: Array<Record<string, unknown>> };
          };
          return (res.data?.warehouses ?? []).map((w) => ({
            id: String(w.warehouse_id ?? w.id ?? ''),
            name: String(w.name ?? ''),
            ...(w.region !== undefined ? { region: String(w.region) } : {}),
            ...(w.address !== undefined ? { address: String(w.address) } : {}),
            status: 'active',
          }));
        } catch {
          return [];
        }
      },
    },

    order: {
      async pull(context, opts) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const topts = tokOpts(acc.shopCipher, acc.accessToken);
        const now = Math.floor(Date.now() / 1000);
        const since = opts?.since ? Math.floor(opts.since.getTime() / 1000) : now - 7 * 86400;
        const list = (await g.order.getOrderList(R({ page_size: 50, sort_field: 'create_time', sort_order: 'DESC' }), R({ create_time_ge: since, create_time_lt: now }), topts)) as {
          data?: { orders?: Array<Record<string, unknown>> };
        };
        const ids = (list.data?.orders ?? []).map((o) => String(o.id ?? o.order_id ?? '')).filter((x) => !!x);
        if (ids.length === 0) return [];
        const detail = (await g.order.getOrderDetail(R({ ids }), topts)) as {
          data?: { orders?: Array<TikTokOrderRaw> };
        };
        return (detail.data?.orders ?? [])
          .map((raw) => mapOrder(context.storeId, context.platformAccountId, 'tts-tokopedia', raw))
          .filter((o) => (opts?.since ? new Date(o.createdAt).getTime() >= opts.since.getTime() : true));
      },
      async get(context, platformOrderId) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const detail = (await g.order.getOrderDetail(R({ ids: [platformOrderId] }), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { orders?: Array<TikTokOrderRaw> };
        };
        return mapOrder(
          context.storeId,
          context.platformAccountId,
          'tts-tokopedia',
          detail.data?.orders?.[0] ?? ({ id: platformOrderId } as TikTokOrderRaw),
        );
      },
      async push() {
        // TikTok Shop tidak punya "buat pesanan" dari sisi seller; order selalu via pull.
        return;
      },
      async update(context, orderId, patch) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const topts = tokOpts(acc.shopCipher, acc.accessToken);
        const status = patch?.status;
        if (status === 'cancel' || /cancel/i.test(String(status ?? ''))) {
          await g.returnRefund.cancelOrder(
            R({}),
            R({ order_id: orderId, cancel_reason: patch?.reason ?? '' }),
            topts,
          );
          return;
        }
        if (patch?.trackingNumber || (status && /ship|fulfill/i.test(String(status)))) {
          await g.fulfillment.updateShippingInfo(
            R({ order_id: orderId }),
            R({ shipping_provider_id: patch?.courier ?? '', tracking_number: patch?.trackingNumber ?? '' }),
            topts,
          );
          return;
        }
        // accept / lainnya: TikTok auto-accept pesanan.
      },
      async track(context, orderId): Promise<TrackingEvent[]> {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const res = (await g.fulfillment.getTracking(R({ order_id: orderId }), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { tracking?: Array<Record<string, unknown>> };
        };
        return (res.data?.tracking ?? []).map((t) => ({
          status: String(t.status ?? t.logistics_status ?? 'in_transit'),
          description: String(t.description ?? t.status ?? ''),
          ...(t.location !== undefined ? { location: String(t.location) } : {}),
          occurredAt:
            t.time !== undefined || t.timestamp !== undefined
              ? new Date(Number(t.time ?? t.timestamp) * 1000).toISOString()
              : new Date().toISOString(),
        }));
      },
    },

    product: {
      async pull(context, opts) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const topts = tokOpts(acc.shopCipher, acc.accessToken);
        const ids = (opts?.ids && opts.ids.length > 0 && (opts.ids as string[])) || undefined;
        if (ids) {
          const out: Ro = [];
          for (const id of ids) {
            const res = (await g.product.getProduct(R({ product_id: id }), topts)) as { data?: Record<string, unknown> };
            if (res.data) out.push(mapProduct(context.storeId, res.data));
          }
          return out;
        }
        const res = (await g.product.searchProducts(R({ page_size: opts?.limit ?? 50 }), R({}), topts)) as {
          data?: { products?: Array<Record<string, unknown>> };
        };
        const found = (res.data?.products ?? []).map((p) => String(p.id ?? p.product_id ?? '')).filter((x) => !!x);
        const out: Ro = [];
        for (const id of found) {
          const d = (await g.product.getProduct(R({ product_id: id }), topts)) as { data?: Record<string, unknown> };
          if (d.data) out.push(mapProduct(context.storeId, d.data));
        }
        return out;
      },
      async push(context, product) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const topts = tokOpts(acc.shopCipher, acc.accessToken);
        const items = Array.isArray(product) ? product : [product];
        for (const p of items) {
          const body: Record<string, unknown> = {
            title: p.name,
            description: p.description,
            ...(p.categoryIds[0] !== undefined ? { category_id: Number(p.categoryIds[0]) || 0 } : {}),
            main_images: p.images.map((i) => i.url),
            external_product_id: p.id,
            skus: p.variants.map((v) => ({
              seller_sku: v.sku,
              ...(v.name !== undefined ? { sku_name: v.name } : {}),
              price: { sale_price: String(v.price.amount), currency: v.price.currency },
            })),
          };
          await g.product.createProduct(R({}), R(body), topts);
        }
      },
      async update(context, productId, patch) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const body: Record<string, unknown> = {};
        if (patch?.name !== undefined) body.title = patch.name;
        if (patch?.description !== undefined) body.description = patch.description;
        if (patch?.price !== undefined) body.skus = [{ price: { sale_price: String(patch.price) } }];
        await g.product.editProduct(R({ product_id: productId }), R(body), tokOpts(acc.shopCipher, acc.accessToken));
      },
      async listCategories(context) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const res = (await g.product.getCategories(R({ keyword: '', page_size: 100 }), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { categories?: Array<Record<string, unknown>> };
        };
        return (res.data?.categories ?? []).map((c) => ({
          id: String(c.id ?? ''),
          platform: 'tts-tokopedia',
          ...(c.parent_id !== undefined ? { parentId: String(c.parent_id) } : {}),
          name: String(c.name ?? ''),
          level: Number(c.level ?? 1) || 1,
          hasChildren: c.is_leaf === false || Number(c.children_count ?? 0) > 0,
        }));
      },
    },

    inventory: {
      async getStockLevels(context, skus): Promise<StockLevel[]> {
        const list = skus ?? [];
        if (list.length === 0) return [];
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const res = (await g.product.inventorySearch(R({}), R({ sku_ids: list }), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: {
            inventory?: Array<{
              skus?: Array<{
                id?: string;
                total_available_inventory_distribution?: Array<{
                  in_shop_inventory?: { quantity?: number };
                  campaign_inventory?: Array<Record<string, unknown>>;
                  creator_inventory?: Array<Record<string, unknown>>;
                }>;
              }>;
            }>;
          };
        };
        const availableBySku = new Map<string, number>();
        for (const inv of res.data?.inventory ?? []) {
          for (const s of inv.skus ?? []) {
            if (s.id === undefined) continue;
            let available = 0;
            for (const d of s.total_available_inventory_distribution ?? []) {
              available += d.in_shop_inventory?.quantity ?? 0;
            }
            availableBySku.set(String(s.id), available);
          }
        }
        return list.map((sku) => ({ available: availableBySku.get(sku) ?? 0, reserved: 0, incoming: 0, holding: 0 }));
      },
      async sync(context, items) {
        for (const it of items ?? []) {
          await updateInventory(context, it.sku, it.stock);
        }
      },
      async adjust(context, adjustments) {
        for (const adj of adjustments ?? []) {
          await updateInventory(context, adj.sku ?? adj.productId, adj.quantity);
        }
      },
    },

    fulfillment: {
      async ship(context, orderId, opts) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        await g.fulfillment.markPackageAsShipped(
          R({ order_id: orderId }),
          R({
            ...(opts?.courier !== undefined ? { shipping_provider_id: opts.courier } : {}),
            ...(opts?.trackingNumber !== undefined ? { tracking_number: opts.trackingNumber } : {}),
            order_line_item_ids: [],
          }),
          tokOpts(acc.shopCipher, acc.accessToken),
        );
      },
      async updateStatus() {
        // update status shipping ditangani domain order.update (ship/cancel).
        return;
      },
    },

    returns: {
      async list(context, opts) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const body: Record<string, unknown> = {};
        if (opts?.status && opts.status.length > 0) body.return_status = opts.status;
        if (opts?.since) body.update_time_ge = Math.floor(opts.since.getTime() / 1000);
        const res = (await g.returnRefund.searchReturns(R({ page_size: '50' }), R(body), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { return_orders?: Array<Record<string, unknown>> };
        };
        return (res.data?.return_orders ?? []).map((r) =>
          mapReturn(context.platformAccountId, String(r.order_id ?? ''), r),
        );
      },
      async get(context, returnId) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const rid = returnId.replace('ttrn-', '');
        const res = (await g.returnRefund.searchReturns(R({ page_size: '10' }), R({ return_ids: [rid] }), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { return_orders?: Array<Record<string, unknown>> };
        };
        return mapReturn(context.platformAccountId, String(res.data?.return_orders?.[0]?.order_id ?? ''), res.data?.return_orders?.[0] ?? { return_id: rid });
      },
      async act(context, returnId, action) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const rid = returnId.replace('ttrn-', '').replace('tt-', '');
        const topts = tokOpts(acc.shopCipher, acc.accessToken);
        if (action === 'cancel') return;
        if (action === 'reject') {
          await g.returnRefund.rejectReturn(R({ return_id: rid }), R({ decision: 'REJECT' }), topts);
          return;
        }
        const decision = action === 'refund' ? 'REFUND_ONLY' : 'RETURN_AND_REFUND';
        await g.returnRefund.approveReturn(R({ return_id: rid }), R({ decision }), topts);
      },
    },

    shipping: {
      async getRates(context) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const res = (await g.logistics.getShippingProviders(R({}), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { shipping_providers?: Array<Record<string, unknown>> };
        };
        return (res.data?.shipping_providers ?? []).map((p) => ({
          courier: 'custom' as Currency extends never ? never : 'custom',
          service: String(p.name ?? p.shipping_provider_name ?? ''),
          cost: { amount: 0, currency: 'IDR' as Currency },
        }));
      },
      async listShipments(context, opts) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const nowSec = Math.floor(Date.now() / 1000);
        const body: Record<string, unknown> = {
          ...(opts?.since ? { create_time_ge: Math.floor(opts.since.getTime() / 1000) } : {}),
          create_time_lt: nowSec,
        };
        const res = (await g.fulfillment.searchPackage(R({ page_size: 50 }), R(body), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { packages?: Array<Record<string, unknown>> };
        };
        return (res.data?.packages ?? []).map((pkg): Shipment => ({
          id: String(pkg.package_id ?? ''),
          orderId: String(pkg.order_id ?? ''),
          courier: 'custom' as Shipment['courier'],
          service: String(pkg.shipping_provider_name ?? ''),
          trackingNumber: String(pkg.tracking_number ?? ''),
          events: [],
          status: mapLogisticsStatus(String(pkg.logistics_status ?? '')),
          createdAt: pkg.create_time !== undefined ? new Date(Number(pkg.create_time) * 1000).toISOString() : new Date().toISOString(),
          updatedAt: pkg.update_time !== undefined ? new Date(Number(pkg.update_time) * 1000).toISOString() : new Date().toISOString(),
        }));
      },
      async getShipment(context, shipmentId): Promise<Shipment> {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const res = (await g.fulfillment.getPackageDetail(R({ package_id: shipmentId }), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: Record<string, unknown>;
        };
        const pkg = res.data ?? {};
        const tracking = Array.isArray(pkg.tracking_info) ? (pkg.tracking_info as Array<Record<string, unknown>>) : [];
        return {
          id: String(pkg.package_id ?? shipmentId),
          orderId: String(pkg.order_id ?? ''),
          courier: 'custom' as Shipment['courier'],
          service: String(pkg.shipping_provider_name ?? ''),
          trackingNumber: String(pkg.tracking_number ?? ''),
          events: tracking.map((t) => ({
            status: String(t.status ?? t.logistics_status ?? 'in_transit'),
            description: String(t.description ?? ''),
            ...(t.location !== undefined ? { location: String(t.location) } : {}),
            occurredAt: t.time !== undefined ? new Date(Number(t.time) * 1000).toISOString() : new Date().toISOString(),
          })),
          status: mapLogisticsStatus(String(pkg.logistics_status ?? '')),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
    },

    payment: {
      async list(context, opts) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const nowSec = Math.floor(Date.now() / 1000);
        const res = (await g.finance.getPayments(
          R({
            sort_field: 'create_time',
            sort_order: 'DESC',
            page_size: 50,
            ...(opts?.since ? { create_time_ge: Math.floor(opts.since.getTime() / 1000) } : {}),
            create_time_lt: nowSec,
          }),
          tokOpts(acc.shopCipher, acc.accessToken),
        )) as { data?: { payments?: Array<Record<string, unknown>> } };
        return (res.data?.payments ?? []).map((p): Payment => {
          const amount = (p.amount ?? {}) as Record<string, unknown>;
          const currency = String(amount.currency ?? 'IDR');
          return {
            id: String(p.id ?? p.order_id ?? ''),
            orderId: String(p.order_id ?? ''),
            method: 'other',
            status: 'captured',
            amount: { amount: Number(amount.value ?? 0) || 0, currency: currency as Currency },
            refunds: [],
            ...(p.create_time !== undefined
              ? { paidAt: new Date(Number(p.create_time) * 1000).toISOString() }
              : {}),
            createdAt: p.create_time !== undefined ? new Date(Number(p.create_time) * 1000).toISOString() : new Date().toISOString(),
            updatedAt: p.create_time !== undefined ? new Date(Number(p.create_time) * 1000).toISOString() : new Date().toISOString(),
          };
        });
      },
      async get(context, paymentId): Promise<Payment> {
        const payments = await gateway.payment.list(context);
        return payments.find((p) => p.id === paymentId) ?? {
          id: paymentId,
          orderId: paymentId,
          method: 'other',
          status: 'captured',
          amount: { amount: 0, currency: 'IDR' as Currency },
          refunds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
      async refund() {
        // Refund TikTok ditangani via domain returns (approveReturn/refund).
        return;
      },
    },

    promotion: {
      async list(context, opts) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const body: Record<string, unknown> = { page_size: 50 };
        if (opts?.status && opts.status.length > 0) body.status = opts.status[0];
        const res = (await g.promotion.searchActivities(R({}), R(body), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { activities?: Array<Record<string, unknown>> };
        };
        return (res.data?.activities ?? []).map((a) => mapPromotion(context.storeId, a));
      },
      async get(context, promotionId): Promise<Promotion> {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const res = (await g.promotion.getActivity(R({ activity_id: promotionId }), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: Record<string, unknown>;
        };
        return mapPromotion(context.storeId, res.data ?? {});
      },
      async create(context, promotion): Promise<Promotion> {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const body: Record<string, unknown> = {
          title: promotion.name,
          product_level: promotion.rules.itemSkus ? 'SKU' : 'PRODUCT',
          begin_time: Math.floor(new Date(promotion.startAt).getTime() / 1000) || Math.floor(Date.now() / 1000),
          end_time: Math.floor(new Date(promotion.endAt).getTime() / 1000),
          discount: { shipping_discount: { type: 'ALL', value: '0' } },
          products: (promotion.rules.itemSkus ?? []).map((sku) => ({ sku_id: sku })),
        };
        const res = (await g.promotion.createActivity(R({}), R(body), tokOpts(acc.shopCipher, acc.accessToken))) as {
          data?: { activity_id?: string };
        };
        return { ...promotion, id: String(res.data?.activity_id ?? promotion.id) };
      },
      async update(context, promotionId, patch) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const body: Record<string, unknown> = { activity_id: promotionId };
        if (patch?.name !== undefined) body.title = patch.name;
        if (patch?.startAt !== undefined) body.begin_time = Math.floor(new Date(patch.startAt as string).getTime() / 1000);
        if (patch?.endAt !== undefined) body.end_time = Math.floor(new Date(patch.endAt as string).getTime() / 1000);
        await g.promotion.updateActivity(R({}), R(body), tokOpts(acc.shopCipher, acc.accessToken));
      },
      async setActive(context, promotionId, active) {
        if (active) return;
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        await g.promotion.deactivateActivity(R({ activity_id: promotionId }), tokOpts(acc.shopCipher, acc.accessToken));
      },
    },

    finance: {
      async overview(context): Promise<FinanceOverview> {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        try {
          const res = (await g.finance.getWithdrawals(
            R({ types: ['WITHDRAW', 'SETTLE'], page_size: 5 }),
            tokOpts(acc.shopCipher, acc.accessToken),
          )) as { data?: { withdrawals?: Array<Record<string, unknown>> } };
          const last = (res.data?.withdrawals ?? []).find((w) => w.create_time !== undefined);
          return last ? { lastPayoutAt: new Date(Number(last.create_time) * 1000).toISOString() } : {};
        } catch {
          return {};
        }
      },
      async transactions(context, query) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        const nowSec = Math.floor(Date.now() / 1000);
        const res = (await g.finance.getWithdrawals(
          R({
            types: ['SETTLE', 'WITHDRAW', 'TRANSFER', 'REVERSE'],
            page_size: query?.limit ?? 50,
            ...(query?.from ? { create_time_ge: Math.floor(new Date(query.from).getTime() / 1000) } : {}),
            create_time_lt: query?.to ? Math.floor(new Date(query.to).getTime() / 1000) : nowSec,
          }),
          tokOpts(acc.shopCipher, acc.accessToken),
        )) as { data?: { withdrawals?: Array<Record<string, unknown>> } };
        return (res.data?.withdrawals ?? []).map((w): WalletTransaction => {
          const type = String(w.type ?? w.transaction_type ?? 'other');
          const direction: 'in' | 'out' = type === 'WITHDRAW' || type === 'REVERSE' ? 'out' : 'in';
          const amount = (w.amount ?? {}) as Record<string, unknown> | undefined;
          return {
            id: String(w.id ?? ''),
            ...(w.order_id !== undefined ? { orderId: String(w.order_id) } : {}),
            type: type.toLowerCase(),
            direction,
            amount: {
              amount: Math.abs(Number((amount as Record<string, unknown>)?.value ?? w.amount ?? 0)) || 0,
              currency: String((amount as Record<string, unknown>)?.currency ?? 'IDR') as Currency,
            },
            status: String(w.status ?? 'completed'),
            createdAt: w.create_time !== undefined ? new Date(Number(w.create_time) * 1000).toISOString() : new Date().toISOString(),
          };
        });
      },
      async statement(context, opts) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        try {
          const res = (await g.finance.getStatements(
            R({
              sort_field: 'statement_time',
              sort_order: 'DESC',
              page_size: 1,
              ...(opts?.from ? { statement_time_ge: Math.floor(opts.from.getTime() / 1000) } : {}),
              ...(opts?.to ? { statement_time_lt: Math.floor(opts.to.getTime() / 1000) } : {}),
            }),
            tokOpts(acc.shopCipher, acc.accessToken),
          )) as { data?: { statements?: Array<Record<string, unknown>> } };
          const s = res.data?.statements?.[0] ?? {};
          const paymentStatus = String(s.payment_status ?? s.status ?? '');
          return {
            id: String(s.statement_id ?? s.id ?? ''),
            fileName: String(s.file_name ?? ''),
            status: paymentStatus === 'PAID' ? 'ready' : paymentStatus === 'FAILED' ? 'failed' : 'generating',
            ...(s.statement_time !== undefined
              ? { generatedAt: new Date(Number(s.statement_time) * 1000).toISOString() }
              : {}),
            ...(s.file_url !== undefined ? { fileUrl: String(s.file_url) } : {}),
          };
        } catch {
          return { id: '', fileName: '', status: 'generating' };
        }
      },
      async payoutInfo(context) {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        try {
          const res = (await g.finance.getWithdrawals(
            R({ types: ['WITHDRAW'], page_size: 50 }),
            tokOpts(acc.shopCipher, acc.accessToken),
          )) as { data?: { withdrawals?: Array<Record<string, unknown>> } };
          return {
            payouts: (res.data?.withdrawals ?? []).map((w) => {
              const amount = (w.amount ?? {}) as Record<string, unknown>;
              return {
                id: String(w.id ?? ''),
                amount: { amount: Math.abs(Number(amount.value ?? 0)) || 0, currency: String(amount.currency ?? 'IDR') as Currency },
                status: 'completed',
                method: 'bank_transfer',
                requestedAt: w.create_time !== undefined ? new Date(Number(w.create_time) * 1000).toISOString() : new Date().toISOString(),
              };
            }),
          };
        } catch {
          return { payouts: [] };
        }
      },
    },

    media: {
      async upload(context, opts): Promise<MediaAsset> {
        if (opts.type !== 'image') {
          return { id: '', platform: 'tts-tokopedia', type: opts.type, url: '', createdAt: new Date().toISOString() };
        }
        const acc = await shopAcc(context);
        const base = context.credentials.baseUrl ?? TTS_BASE_URL;
        const path = '/product/202309/images/upload';
        const timestamp = Math.floor(Date.now() / 1000);
        const query: Record<string, unknown> = { app_key: context.credentials.appId, timestamp: String(timestamp) };
        if (acc.shopCipher) query.shop_cipher = acc.shopCipher;
        const { sign } = await import('./tts.client');
        query.sign = sign(context.credentials.secret, path, query);
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(query)) qs.set(k, String(v));
        const formData = new FormData();
        formData.append('image_name', opts.fileName ?? 'image.jpg');
        formData.append('image_data', new Blob([opts.data], { type: opts.mimeType ?? 'image/jpeg' }), opts.fileName ?? 'image.jpg');
        const resp = await (options.fetch ?? globalThis.fetch)(`${base}${path}?${qs.toString()}`, {
          method: 'POST',
          headers: { 'x-tts-access-token': acc.accessToken },
          body: formData,
        });
        const body = (await resp.json()) as {
          code?: number | string;
          data?: { images?: Array<{ image_id?: string; image_url?: string }> };
        };
        if (body.code !== undefined && Number(body.code) !== 0) {
          throw new Error(`TikTok upload image failed: ${String((body as { message?: string }).message ?? body.code)}`);
        }
        const img = body.data?.images?.[0];
        return {
          id: img?.image_id ?? '',
          platform: 'tts-tokopedia',
          type: 'image',
          url: img?.image_url ?? '',
          createdAt: new Date().toISOString(),
        };
      },
      async list() {
        return [];
      },
    },

    merchant: {
      async getProfile(context) {
        return {
          id: 'merchant-tts',
          platform: 'tts-tokopedia',
          name: context.credentials.appId,
          status: 'active',
          shops: [context.credentials.shopId ?? context.platformAccountId],
        };
      },
      async listShops(context): Promise<MerchantShop[]> {
        const client = clientFor(context.credentials);
        const g = buildFacade(client);
        const acc = await shopAcc(context);
        try {
          const res = (await g.seller.getActiveShops(R({}), tokOpts(acc.shopCipher, acc.accessToken))) as {
            data?: { shops?: Array<Record<string, unknown>> };
          };
          return (res.data?.shops ?? []).map((s): MerchantShop => ({
            shopId: String(s.shop_id ?? ''),
            ...(s.name !== undefined ? { name: String(s.name) } : {}),
            ...(s.region !== undefined ? { accountRegion: String(s.region) } : {}),
            ...(s.type !== undefined ? { shopCb: String(s.type) === 'cross_border' } : {}),
            isDisabled: s.status !== undefined && String(s.status) !== 'ACTIVE',
          }));
        } catch {
          return [];
        }
      },
      async listWarehouses(context): Promise<MerchantWarehouse[]> {
        return gateway.shop.listWarehouses(context);
      },
      async listWarehouseLocations(): Promise<MerchantWarehouse[]> {
        return [];
      },
    },
  };

  const webhook = createTtsWebhook({ appSecret: options.appSecret ?? '' });

  return {
    platform: 'tts-tokopedia',
    name: 'TikTok Shop',
    baseUrl: TTS_BASE_URL,
    capabilities: [
      'order.pull',
      'order.push',
      'order.fulfill',
      'order.tracking',
      'product.pull',
      'product.push',
      'inventory.sync',
      'promotion.sync',
      'return.manage',
      'webhook.receive',
      'payment.read',
      'shipping.rate',
      'category.read',
      'media.manage',
      'finance.read',
      'merchant.read',
      'shop.settings',
    ],
    auth,
    gateway,
    webhook,
    client(context) {
      return clientFor(context.credentials);
    },
    async api(context) {
      const token = await validToken(context);
      const c: TikTokCredentials = { app_key: context.credentials.appId, app_secret: context.credentials.secret };
      const sc = await shopCipherOf(context);
      const client = new TikTokClient({
        credentials: c,
        ...(options.fetch ? { fetch: options.fetch } : {}),
        accessToken: token.accessToken,
        ...(sc ? { shopCipher: sc } : {}),
        beforeRequest: async () => {
          const fresh = await validToken(context);
          if (fresh.accessToken !== token.accessToken) {
            client.updateToken(fresh.accessToken, await shopCipherOf(context) || undefined);
          }
        },
      });
      return buildFacade(client);
    },
  };
}

function mapPromotion(storeId: string, a: Record<string, unknown>): Promotion {
  const status = String(a.status ?? '');
  return {
    id: String(a.activity_id ?? ''),
    storeId,
    name: String(a.title ?? a.activity_name ?? ''),
    type: 'flash_sale',
    status: status === 'UPCOMING' ? 'scheduled' : status === 'ENDED' || status === 'EXPIRED' ? 'ended' : 'active',
    startAt: a.begin_time !== undefined ? new Date(Number(a.begin_time) * 1000).toISOString() : new Date().toISOString(),
    endAt: a.end_time !== undefined ? new Date(Number(a.end_time) * 1000).toISOString() : new Date().toISOString(),
    usageCount: 0,
    rules: { type: 'bundle', value: 0, appliesTo: 'all_items' },
    createdAt: a.create_time !== undefined ? new Date(Number(a.create_time) * 1000).toISOString() : new Date().toISOString(),
    updatedAt: a.update_time !== undefined ? new Date(Number(a.update_time) * 1000).toISOString() : new Date().toISOString(),
  };
}

function mapLogisticsStatus(status: string): Shipment['status'] {
  if (/deliver/i.test(status) || /arrive/i.test(status)) return 'delivered';
  if (/fail/i.test(status) || /error/i.test(status)) return 'failed';
  if (/ship|transit|pick|collect/i.test(status)) return 'in_transit';
  if (/return/i.test(status)) return 'returned';
  return 'pending';
}

/** hide helper */
type Ro = ReturnType<typeof mapProduct>[];

export const ttsPlugin: PlatformPlugin = createTtsPlugin();

export function registerTts(): void {
  registerPlatform(ttsPlugin);
}

export { mapOrder, mapProduct, mapReturn };