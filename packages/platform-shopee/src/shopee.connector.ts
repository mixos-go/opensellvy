import type {
  PlatformPlugin,
  ConnectorContext,
  OAuthToken,
  PlatformCredentials,
} from '@opensellvy/connector';
import { registerPlatform } from '@opensellvy/connector';
import { ShopeeClient } from './shopee.client';
import { createShopeeAuth, ShopeeAuth } from './shopee.auth';
import { createShopeeWebhook } from './shopee.webhook';
import { mapOrder, mapProduct, mapReturn, ShopeeOrderDetail, ShopeeItemInfo } from './shopee.mapper';

export interface ShopeePluginOptions {
  /** default credentials — biasanya diisi per-context dari registry, bukan di sini */
  credentials?: PlatformCredentials;
  /** injeksi fetch utk test. */
  fetch?: typeof fetch;
  /** injeksi timestamp (detik) utk test signing deterministik. */
  now?: () => number;
}

interface ShopeeTokenCache {
  token: OAuthToken;
  shopId?: string;
}

/**
 * Adapter Shopee (full Open Platform v2). Contoh referensi penerapan
 * PlatformPlugin nyata: signing HMAC-SHA256 benar + satu-gate registry.
 */
export function createShopeePlugin(options: ShopeePluginOptions = {}): PlatformPlugin {
  // token per-context disimpan di sini (adapter stateless kalau TokenStore dipakai);
  // utk pola rujukan kita simpan sederhana key=storeId.
  const cache = new Map<string, ShopeeTokenCache>();

  function clientFor(credentials: PlatformCredentials): ShopeeClient {
    return new ShopeeClient({ credentials, ...(options.fetch ? { fetch: options.fetch } : {}), ...(options.now ? { now: options.now } : {}) });
  }

  function shopAccess(context: ConnectorContext): ShopeeClient {
    return new ShopeeClient({ credentials: context.credentials, ...(options.fetch ? { fetch: options.fetch } : {}), ...(options.now ? { now: options.now } : {}) });
  }

  function tokenFor(context: ConnectorContext): ShopeeTokenCache {
    const existing = cache.get(context.storeId);
    if (existing) return existing;
    const entry: ShopeeTokenCache = { token: context.token };
    if (context.credentials.shopId) entry.shopId = context.credentials.shopId;
    cache.set(context.storeId, entry);
    return entry;
  }

  /** request opts shop-level — accessToken wajib, shopId jika ada. */
  function shopOpts(entry: ShopeeTokenCache): { accessToken: string; shopId?: string } {
    return { accessToken: entry.token.accessToken, ...(entry.shopId ? { shopId: entry.shopId } : {}) };
  }

  function shopClient(context: ConnectorContext): ShopeeClient {
    return shopAccess(context);
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
      const entry: ShopeeTokenCache = { token };
      const resolvedShopId = token.shopId ?? context.credentials.shopId;
      if (resolvedShopId) entry.shopId = resolvedShopId;
      cache.set(context.storeId, entry);
      return token;
    },
    async refreshToken(context) {
      const entry = tokenFor(context);
      const client = clientFor(context.credentials);
      const sa = createShopeeAuth(client) as ShopeeAuth;
      const token = await sa.refreshToken(entry.token.refreshToken ?? '', entry.shopId as string | undefined);
      entry.token = token;
      return token;
    },
  };

  const gateway: PlatformPlugin['gateway'] = {
    async getShop(context) {
      const client = shopClient(context);
      const entry = tokenFor(context);
      const info = await client.request<{ shop_id?: string | number; shop_name?: string; region?: string }>(
        { apiType: 'shop', path: '/api/v2/shop/get_shop_info', method: 'GET' },
        shopOpts(entry),
      );
      return {
        platformShopId: info.shop_id !== undefined ? String(info.shop_id) : entry.shopId ?? '',
        shopName: info.shop_name ?? '',
        marketplace: info.region ?? '',
      };
    },

    async pullOrders(context, opts) {
      const client = shopClient(context);
      const entry = tokenFor(context);
      const list = await client.request<{ orders?: Array<{ order_sn?: string }>; more?: boolean }>(
        { apiType: 'shop', path: '/api/v2/order/get_order_list', method: 'GET', params: { time_range_field: 'create_time', page_size: 100 } },
        shopOpts(entry),
      );
      const ids = (list.orders ?? []).map((o) => o.order_sn).filter((x): x is string => !!x);
      if (ids.length === 0) return [];
      const detail = await client.request<{ order?: ShopeeOrderDetail }>(
        { apiType: 'shop', path: '/api/v2/order/get_order_detail', method: 'GET', params: { order_sn_list: ids.join(',') } },
        shopOpts(entry),
      );
      const rawOrder = detail.order ?? {};
      const domain = mapOrder(context.storeId, context.platformAccountId, 'shopee', rawOrder);
      if (opts?.since && domain.createdAt && new Date(domain.createdAt).getTime() < opts.since.getTime()) {
        return [];
      }
      return [domain];
    },

    async getOrder(context, platformOrderId) {
      const client = shopClient(context);
      const entry = tokenFor(context);
      const detail = await client.request<{ order?: ShopeeOrderDetail }>(
        { apiType: 'shop', path: '/api/v2/order/get_order_detail', method: 'GET', params: { order_sn_list: platformOrderId } },
        shopOpts(entry),
      );
      return mapOrder(context.storeId, context.platformAccountId, 'shopee', detail.order ?? { order_sn: platformOrderId });
    },

    async pushOrder(_context, _order) {
      // Shopee tidak punya "buat pesanan" dari sisi seller; order selalu masuk via pull.
      return;
    },

    async updateOrder(context, orderId, patch) {
      const client = shopClient(context);
      const entry = tokenFor(context);
      const acc = shopOpts(entry);
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
      const client = shopClient(context);
      const entry = tokenFor(context);
      const list = await client.request<{ item?: Array<{ item_id?: number | string }>; total_count?: number }>(
        { apiType: 'shop', path: '/api/v2/product/get_item_list', method: 'GET', params: { offset: 0, page_size: 100 } },
        shopOpts(entry),
      );
      const ids = (list.item ?? []).map((i) => i.item_id).filter((x): x is string | number => x !== undefined);
      if (ids.length === 0) return [];
      const detail = await client.request<{ item?: ShopeeItemInfo[] }>(
        { apiType: 'shop', path: '/api/v2/product/get_item_detail', method: 'GET', params: { item_id_list: ids.join(',') } },
        shopOpts(entry),
      );
      return (detail.item ?? []).map((it) => mapProduct(context.storeId, it));
    },

    async pushProduct(context, product) {
      const client = shopClient(context);
      const entry = tokenFor(context);
      const acc = shopOpts(entry);
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
      const client = shopClient(context);
      const entry = tokenFor(context);
      const acc = shopOpts(entry);
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
      const client = shopClient(context);
      const entry = tokenFor(context);
      const acc = shopOpts(entry);
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
  };
}

export const shopeePlugin: PlatformPlugin = createShopeePlugin();

export function registerShopee(): void {
  registerPlatform(shopeePlugin);
}

export { mapOrder, mapProduct, mapReturn };
