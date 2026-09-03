import type {
  PlatformPlugin,
  ConnectorContext,
  OAuthToken,
  PlatformCredentials,
} from '@opensellvy/connector';
import { registerPlatform, createMemoryTokenStore } from '@opensellvy/connector';
import type { TokenStore } from '@opensellvy/connector';
import { ShopeeClient } from './shopee.client';
import { createShopeeAuth, ShopeeAuth } from './shopee.auth';
import { createShopeeWebhook } from './shopee.webhook';
import { mapOrder, mapProduct, mapReturn, ShopeeOrderDetail, ShopeeItemInfo } from './shopee.mapper';
import { createShopeeApi, type ShopeeApi } from './generated';

export interface ShopeePluginOptions {
  /** default credentials — biasanya diisi per-context dari registry, bukan di sini */
  credentials?: PlatformCredentials;
  /** injeksi fetch utk test. */
  fetch?: typeof fetch;
  /** injeksi timestamp (detik) utk test signing deterministik. */
  now?: () => number;
  /**
   * TokenStore persist OAuth per seller (key storeId+platform). Default: memory
   * (single-process). Di produksi berikan store yang ter-connect ke DB kamu.
   */
  tokenStore?: TokenStore;
  /** refresh otomatis bila token mendekati kadaluarsa (default true). */
  autoRefresh?: boolean;
  /** dev/quick-start: access token langsung (bukan desain produksi — gunakan OAuth). */
  accessToken?: string;
  /** dev/quick-start: shop_id sandbox/live utk access token di atas. */
  shopId?: string;
  /** ambang refresh dini (ms sebelum kadaluarsa), default 5 menit. */
  refreshBeforeMs?: number;
}

const PLATFORM = 'shopee' as const;

/** Akses ke SELURUH 29 kategori / 444 API Shopee via facade generated (bukan hanya ~10 method gateway). */
export interface ShopeeApiAccessor {
  /**
   * Facade lengkap (29 kategori) ter-bind pada satu seller (context):
   * client + accessToken (valid, auto-refresh) + shopId ter-resolve dari context.
   * shop/public API dibedakan otomatis (ShopeeApiType per kategori).
   */
  api(context: ConnectorContext): Promise<ShopeeApi>;
  /** Client Shopee low-level ter-bind pada credentials context (tanpa token resolution). */
  client(context: ConnectorContext): ShopeeClient;
}

export type ShopeePlugin = PlatformPlugin & ShopeeApiAccessor;

/**
 * Adapter Shopee (full Open Platform v2). Contoh referensi penerapan
 * PlatformPlugin nyata: signing HMAC-SHA256 benar + satu-gate registry +
 * sinambung OAuth per-seller via TokenStore + auto-refresh.
 *
 * Desain produksi: tiap seller otorisasi SEKALI via exchangeCode → token
 * (access+refresh) di-persist ke TokenStore. Saat accessToken mendekati/lewat
 * kadaluarsa, tokenFor() otomatis refreshToken() dari refreshToken yang
 * tersimpan — tanpa perlu intervensi manual per seller.
 */
export function createShopeePlugin(options: ShopeePluginOptions = {}): ShopeePlugin {
  const tokenStore = options.tokenStore ?? createMemoryTokenStore();
  const autoRefresh = options.autoRefresh ?? true;
  const refreshBeforeMs = options.refreshBeforeMs ?? 5 * 60 * 1000;

  function clientFor(credentials: PlatformCredentials): ShopeeClient {
    return new ShopeeClient({ credentials, ...(options.fetch ? { fetch: options.fetch } : {}), ...(options.now ? { now: options.now } : {}) });
  }

  async function loadToken(context: ConnectorContext): Promise<OAuthToken | undefined> {
    const fromDev = options.accessToken ? { accessToken: options.accessToken } : undefined;
    const stored = await tokenStore.get(context.storeId, PLATFORM);
    return stored ?? fromDev ?? context.token;
  }

  /** Ambil token valid utk request shop; auto-refresh bila perlu lalu persist. */
  async function validToken(context: ConnectorContext): Promise<OAuthToken> {
    let token = await loadToken(context);
    if (!token || !token.accessToken) {
      token = context.token;
    }
    if (autoRefresh && token.refreshToken) {
      const expired = token.expiresAt ? Date.now() + refreshBeforeMs >= token.expiresAt : false;
      if (expired || !token.accessToken) {
        const client = clientFor(context.credentials);
        const sa = createShopeeAuth(client) as ShopeeAuth;
        const refreshed = await sa.refreshToken(token.refreshToken, context.credentials.shopId);
        token = { ...token, ...refreshed };
        await tokenStore.save(context.storeId, PLATFORM, token);
      }
    }
    return token;
  }

  const auth: PlatformPlugin['auth'] = {
    getAuthorizeUrl(context) {
      const client = clientFor(context.credentials);
      const sa = createShopeeAuth(client) as ShopeeAuth;
      return sa.getAuthorizeUrl(context.credentials.redirectUri);
    },
    async exchangeCode(context, code) {
      const client = clientFor(context.credentials);
      const sa = createShopeeAuth(client) as ShopeeAuth;
      const token = await sa.exchangeCode(code, context.credentials.shopId);
      await tokenStore.save(context.storeId, PLATFORM, token);
      return token;
    },
    async refreshToken(context) {
      const token = await validToken(context);
      return token;
    },
  };

  const gateway: PlatformPlugin['gateway'] = {
    async getShop(context) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const info = await client.request<{ shop_id?: string | number; shop_name?: string; region?: string }>(
        { apiType: 'shop', path: '/api/v2/shop/get_shop_info', method: 'GET' },
        { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) },
      );
      return {
        platformShopId: info.shop_id !== undefined ? String(info.shop_id) : shopId ?? '',
        shopName: info.shop_name ?? '',
        marketplace: info.region ?? '',
      };
    },

    async pullOrders(context, opts) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const acc = { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) };
      const list = await client.request<{ order_list?: Array<{ order_sn?: string }>; more?: boolean }>(
        {
          apiType: 'shop',
          path: '/api/v2/order/get_order_list',
          method: 'GET',
          params: {
            time_range_field: 'create_time',
            time_from: opts?.since ? opts.since.getTime() / 1000 : Math.floor(Date.now() / 1000) - 7 * 86400,
            time_to: Math.floor(Date.now() / 1000),
            page_size: 100,
          },
        },
        acc,
      );
      const ids = (list.order_list ?? []).map((o) => o.order_sn).filter((x): x is string => !!x);
      if (ids.length === 0) return [];
      const detail = await client.request<{ order_list?: ShopeeOrderDetail[] }>(
        { apiType: 'shop', path: '/api/v2/order/get_order_detail', method: 'GET', params: { order_sn_list: ids.join(',') } },
        acc,
      );
      const orderList = detail.order_list ?? [];
      if (orderList.length === 0) return [];
      const domain = mapOrder(context.storeId, context.platformAccountId, 'shopee', orderList[0]!);
      if (opts?.since && domain.createdAt && new Date(domain.createdAt).getTime() < opts.since.getTime()) {
        return [];
      }
      return [domain];
    },

    async getOrder(context, platformOrderId) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const acc = { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) };
      const detail = await client.request<{ order_list?: ShopeeOrderDetail[] }>(
        { apiType: 'shop', path: '/api/v2/order/get_order_detail', method: 'GET', params: { order_sn_list: platformOrderId } },
        acc,
      );
      return mapOrder(
        context.storeId,
        context.platformAccountId,
        'shopee',
        detail.order_list?.[0] ?? ({ order_sn: platformOrderId } as ShopeeOrderDetail),
      );
    },

    async pushOrder(_context, _order) {
      // Shopee tidak punya "buat pesanan" dari sisi seller; order selalu masuk via pull.
      return;
    },

    async updateOrder(context, orderId, patch) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const acc = { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) };
      const status = patch.status;
      if (status === 'cancel' || /cancel/i.test(String(status ?? ''))) {
        await client.request(
          { apiType: 'shop', path: '/api/v2/order/update_order_status', method: 'POST', params: { order_sn: orderId, order_status: 'CANCELLED' } },
          acc,
        );
        return;
      }
      if (status === 'accept') {
        await client.request(
          { apiType: 'shop', path: '/api/v2/order/update_order_status', method: 'POST', params: { order_sn: orderId, order_status: 'READY_TO_SHIP' } },
          acc,
        );
        return;
      }
      if (patch.trackingNumber || (status && /ship|fulfill/i.test(String(status)))) {
        await client.request(
          {
            apiType: 'shop',
            path: '/api/v2/logistics/ship_order',
            method: 'POST',
            params: {
              order_sn: orderId,
              package_list: [
                {
                  logistics_channel_id: Number(patch.courier || '') || 0,
                  tracking_number: patch.trackingNumber ?? '',
                },
              ],
            },
          },
          acc,
        );
      }
    },

    async pullProducts(context) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const acc = { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) };
      const list = await client.request<{ item?: Array<{ item_id?: number | string }>; total_count?: number }>(
        { apiType: 'shop', path: '/api/v2/product/get_item_list', method: 'GET', params: { offset: 0, page_size: 100, item_status: ['NORMAL'] } },
        acc,
      );
      const ids = (list.item ?? []).map((i) => i.item_id).filter((x): x is string | number => x !== undefined);
      if (ids.length === 0) return [];
      const detail = await client.request<{ item_list?: ShopeeItemInfo[] }>(
        {
          apiType: 'shop',
          path: '/api/v2/product/get_item_base_info',
          method: 'GET',
          params: { item_id_list: ids.map(String).join(','), need_tax_info: true },
        },
        acc,
      );
      return (detail.item_list ?? []).map((it) => mapProduct(context.storeId, it));
    },

    async pushProduct(context, product) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const acc = { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) };
      const body = {
        item_name: product.name,
        description: product.description,
        images: product.images.map((i) => ({ image: i.url })),
        item_sku: product.variants[0]?.sku ?? product.name,
        price: product.variants[0]?.price.amount ?? 0,
        stock: product.variants[0]?.stock ?? 0,
        category_id: Number(product.categoryIds[0] ?? '') || 0,
        weight: '1',
        dimensions: {},
        tier_variation: [],
      };
      await client.request(
        { apiType: 'shop', path: '/api/v2/product/add_item', method: 'POST', params: body as unknown as Record<string, unknown> },
        acc,
      );
    },

    async pushProducts(context, products) {
      for (const p of products) await gateway.pushProduct(context, p);
    },

    async syncInventory(context, items) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const acc = { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) };
      for (const item of items) {
        await client.request(
          {
            apiType: 'shop',
            path: '/api/v2/product/update_stock',
            method: 'POST',
            params: {
              item_id: item.sku,
              stock_list: [{ model_id: item.sku, stock: item.stock }],
            },
          },
          acc,
        );
      }
    },

    async manageReturn(context, request, action) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const acc = { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) };
      const path =
        action === 'approve'
          ? '/api/v2/returns/confirm'
          : action === 'reject'
            ? '/api/v2/returns/refund'
            : action === 'refund'
              ? '/api/v2/returns/refund'
              : '/api/v2/returns/confirm';
      await client.request({ apiType: 'shop', path, method: 'POST', params: { return_sn: request.id.replace('srn-', '') } }, acc);
    },
  };

  const webhook = createShopeeWebhook({ partnerKey: '', baseUrl: '' });

  return {
    platform: 'shopee',
    name: 'Shopee',
    baseUrl: 'https://partner.shopeemobile.com',
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
    auth,
    gateway,
    webhook,
    client(context) {
      return clientFor(context.credentials);
    },
    async api(context) {
      const client = clientFor(context.credentials);
      const token = await validToken(context);
      const shopId = context.credentials.shopId ?? options.shopId;
      const opts: { accessToken?: string; shopId?: string } = {};
      if (token.accessToken) opts.accessToken = token.accessToken;
      if (shopId) opts.shopId = shopId;
      return createShopeeApi(client, opts);
    },
  };
}

export const shopeePlugin: PlatformPlugin = createShopeePlugin();

export function registerShopee(): void {
  registerPlatform(shopeePlugin);
}

export { mapOrder, mapProduct, mapReturn };
