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

  async function shopAcc(context: ConnectorContext): Promise<{ accessToken: string; shopId?: string }> {
    const token = await validToken(context);
    const shopId = context.credentials.shopId ?? options.shopId;
    return { accessToken: token.accessToken, ...(shopId ? { shopId } : {}) };
  }

  function notImplemented(name: string): never {
    throw new Error(`Shopee gateway ${name} belum diimplementasikan`);
  }

  const gateway: PlatformPlugin['gateway'] = {
    shop: {
      async getProfile(context) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const info = await client.request<{ shop_id?: string | number; shop_name?: string; region?: string }>(
          { apiType: 'shop', path: '/api/v2/shop/get_shop_info', method: 'GET' },
          acc,
        );
        return {
          platformShopId: info.shop_id !== undefined ? String(info.shop_id) : acc.shopId ?? '',
          shopName: info.shop_name ?? '',
          marketplace: info.region ?? '',
        };
      },
      async updateProfile(context, patch) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const body: Record<string, unknown> = {};
        if (patch.shopName !== undefined) body.shop_name = patch.shopName;
        if (patch.description !== undefined) body.description = patch.description;
        if (Object.keys(body).length > 0) {
          await client.request(
            { apiType: 'shop', path: '/api/v2/shop/update_shop_info', method: 'POST', params: body },
            acc,
          );
        }
      },
    },

    order: {
      async pull(context, opts) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
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
        return orderList
          .map((raw) => mapOrder(context.storeId, context.platformAccountId, 'shopee', raw))
          .filter((o) => (opts?.since ? new Date(o.createdAt).getTime() >= opts.since.getTime() : true));
      },
      async get(context, platformOrderId) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
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
      async push(_context, _order) {
        // Shopee tidak punya "buat pesanan" dari sisi seller; order selalu masuk via pull.
        return;
      },
      async update(context, orderId, patch) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
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
      async track(context, orderId) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const detail = await client.request<{ package_list?: Array<{ status?: string; update_time?: number }> }>(
          { apiType: 'shop', path: '/api/v2/logistics/get_logistics_detail', method: 'GET', params: { order_sn: orderId } },
          acc,
        );
        return (detail.package_list ?? []).map((p) => ({
          status: p.status ?? 'in_transit',
          description: p.status ?? '',
          occurredAt: new Date((p.update_time ?? 0) * 1000).toISOString(),
        }));
      },
    },

    product: {
      async pull(context, opts) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const list = await client.request<{ item?: Array<{ item_id?: number | string }>; total_count?: number }>(
          {
            apiType: 'shop',
            path: '/api/v2/product/get_item_list',
            method: 'GET',
            params: { offset: opts?.offset ?? 0, page_size: opts?.limit ?? 100, item_status: ['NORMAL'] },
          },
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
      async push(context, product) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const items = Array.isArray(product) ? product : [product];
        for (const p of items) {
          const body = {
            item_name: p.name,
            description: p.description,
            images: p.images.map((i) => ({ image: i.url })),
            item_sku: p.variants[0]?.sku ?? p.name,
            price: p.variants[0]?.price.amount ?? 0,
            stock: p.variants[0]?.stock ?? 0,
            category_id: Number(p.categoryIds[0] ?? '') || 0,
            weight: '1',
            dimensions: {},
            tier_variation: [],
          };
          await client.request(
            { apiType: 'shop', path: '/api/v2/product/add_item', method: 'POST', params: body as unknown as Record<string, unknown> },
            acc,
          );
        }
      },
      async update(context, productId, patch) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const body: Record<string, unknown> = { item_id: productId };
        if (patch.name !== undefined) body.item_name = patch.name;
        if (patch.description !== undefined) body.description = patch.description;
        if (patch.price !== undefined) body.price = patch.price as number;
        if (patch.stock !== undefined) body.stock = patch.stock as number;
        await client.request(
          { apiType: 'shop', path: '/api/v2/product/update_item', method: 'POST', params: body },
          acc,
        );
      },
      async listCategories(context, parentId) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const res = await client.request<{ category_list?: Array<{ category_id?: number | string; category_name?: string; has_children?: boolean; parent_id?: number | string }> }>(
          {
            apiType: 'shop',
            path: '/api/v2/product/get_category',
            method: 'GET',
            params: parentId ? { parent_id: parentId } : {},
          },
          acc,
        );
        return (res.category_list ?? []).map((c) => ({
          id: String(c.category_id ?? ''),
          platform: 'shopee',
          ...(c.parent_id !== undefined ? { parentId: String(c.parent_id) } : {}),
          name: c.category_name ?? '',
          level: 1,
          hasChildren: c.has_children ?? false,
        }));
      },
    },

    inventory: {
      async getStockLevels(_context, _skus) {
        notImplemented('inventory.getStockLevels');
      },
      async sync(context, items) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
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
      async adjust(_context, _adjustments) {
        notImplemented('inventory.adjust');
      },
    },

    fulfillment: {
      async ship(context, orderId, opts) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        await client.request(
          {
            apiType: 'shop',
            path: '/api/v2/logistics/ship_order',
            method: 'POST',
            params: {
              order_sn: orderId,
              package_list: [
                {
                  logistics_channel_id: Number(opts.courier || '') || 0,
                  tracking_number: opts.trackingNumber ?? '',
                },
              ],
            },
          },
          acc,
        );
      },
      async updateStatus(context, orderId, status) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        await client.request(
          {
            apiType: 'shop',
            path: '/api/v2/order/update_order_status',
            method: 'POST',
            params: { order_sn: orderId, order_status: status },
          },
          acc,
        );
      },
    },

    returns: {
      async list(context) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const res = await client.request<{ return_list?: Array<{ return_sn?: string; status?: string; order_sn?: string }> }>(
          { apiType: 'shop', path: '/api/v2/returns/get_return_list', method: 'GET', params: {} },
          acc,
        );
        return (res.return_list ?? []).map((r) =>
          mapReturn(context.platformAccountId, r.order_sn ?? '', { return_sn: r.return_sn, status: r.status }),
        );
      },
      async get(context, returnId) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const res = await client.request<{ return_detail?: { return_sn?: string; status?: string; order_sn?: string } }>(
          { apiType: 'shop', path: '/api/v2/returns/get_return_detail', method: 'GET', params: { return_sn: returnId.replace('srn-', '') } },
          acc,
        );
        const d = res.return_detail ?? {};
        return mapReturn(context.platformAccountId, d.order_sn ?? '', d);
      },
      async act(context, returnId, action) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const path =
          action === 'approve' || action === 'receive'
            ? '/api/v2/returns/confirm'
            : action === 'reject' || action === 'refund'
              ? '/api/v2/returns/refund'
              : notImplemented(`returns.act:${action}`);
        await client.request(
          {
            apiType: 'shop',
            path,
            method: 'POST',
            params: { return_sn: returnId.replace('srn-', '') },
          },
          acc,
        );
      },
    },

    shipping: {
      async getRates(context, _request) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const res = await client.request<{ logistics_channel_list?: Array<{ logistics_channel_id?: string; logistics_channel_name?: string }> }>(
          { apiType: 'shop', path: '/api/v2/logistics/get_logistics_channel_list', method: 'GET', params: {} },
          acc,
        );
        return (res.logistics_channel_list ?? []).map((c) => ({
          courier: 'custom',
          service: c.logistics_channel_name ?? '',
          cost: { amount: 0, currency: 'IDR' },
        }));
      },
      async listShipments() {
        return notImplemented('shipping.listShipments');
      },
      async getShipment() {
        return notImplemented('shipping.getShipment');
      },
    },

    payment: {
      async list() {
        notImplemented('payment.list');
      },
      async get() {
        notImplemented('payment.get');
      },
      async refund() {
        notImplemented('payment.refund');
      },
    },

    promotion: {
      async list() {
        notImplemented('promotion.list');
      },
      async get() {
        notImplemented('promotion.get');
      },
      async create(context, promotion) {
        return Promise.resolve(promotion);
      },
      async update() {
        notImplemented('promotion.update');
      },
      async setActive() {
        notImplemented('promotion.setActive');
      },
    },

    media: {
      async upload() {
        notImplemented('media.upload');
      },
      async list() {
        notImplemented('media.list');
      },
    },

    merchant: {
      async getProfile(context) {
        return {
          id: 'merchant-shopee',
          platform: 'shopee',
          name: context.credentials.appId,
          status: 'active',
          shops: [context.credentials.shopId ?? ''],
        };
      },
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
      'payment.read',
      'shipping.rate',
      'category.read',
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
