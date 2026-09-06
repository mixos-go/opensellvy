import type {
  PlatformPlugin,
  ConnectorContext,
  OAuthToken,
  PlatformCredentials,
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
} from '@opensellvy/types';
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

  /** Auth (apiType/token/id) utk merchant-level API — undefined bila kredensial merchant belum ada. */
  function merchantAcc(context: ConnectorContext): { apiType: 'merchant'; merchantToken: string; merchantId: string } | undefined {
    const { merchantId, merchantToken } = context.credentials;
    if (merchantId && merchantToken) return { apiType: 'merchant', merchantToken, merchantId };
    return undefined;
  }

  interface WarehouseRaw {
    warehouse_list?: Array<{ warehouse_id?: number | string; warehouse_name?: string; warehouse_region?: string; address?: { address?: string }; warehouse_type?: number }>;
  }

  function mapMerchantWarehouses(res: WarehouseRaw): MerchantWarehouse[] {
    return (res.warehouse_list ?? []).map((w) => ({
      id: String(w.warehouse_id ?? ''),
      name: w.warehouse_name ?? '',
      ...(w.warehouse_region !== undefined ? { region: w.warehouse_region } : {}),
      ...(w.address?.address !== undefined ? { address: w.address.address } : {}),
      status: 'active',
    }));
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
      async getSettings(context) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const info = await client.request<{ shop_id?: string | number; holiday_mode_on?: boolean }>(
          { apiType: 'shop', path: '/api/v2/shop/get_shop_info', method: 'GET' },
          acc,
        );
        let holidayMode = false;
        try {
          const holiday = await client.request<{ holiday_mode_on?: boolean }>(
            { apiType: 'shop', path: '/api/v2/shop/get_shop_holiday_mode', method: 'GET' },
            acc,
          );
          holidayMode = holiday.holiday_mode_on ?? false;
        } catch {
          // Holiday mode endpoint may not be available for all shop types
        }
        let warehouses: MerchantWarehouse[] = [];
        const macc = merchantAcc(context);
        if (macc) {
          try {
            const whRes = await client.request<WarehouseRaw>(
              { apiType: 'merchant', path: '/api/v2/merchant/get_merchant_warehouse_list', method: 'POST', params: { warehouse_type: 1, cursor: { page_size: 30 } } },
              macc,
            );
            warehouses = mapMerchantWarehouses(whRes);
          } catch {
            // Merchant warehouse list may not be available for non-merchant accounts
          }
        }
        return {
          platformShopId: String(info.shop_id ?? acc.shopId ?? ''),
          holidayMode,
          warehouses,
        };
      },
      async setHolidayMode(context, enabled) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        await client.request(
          { apiType: 'shop', path: '/api/v2/shop/set_shop_holiday_mode', method: 'POST', params: { holiday_mode_on: enabled } },
          acc,
        );
      },
      async listWarehouses(context) {
        const client = clientFor(context.credentials);
        const macc = merchantAcc(context);
        if (!macc) return [];
        const res = await client.request<WarehouseRaw>(
          { apiType: 'merchant', path: '/api/v2/merchant/get_merchant_warehouse_list', method: 'POST', params: { warehouse_type: 1, cursor: { page_size: 30 } } },
          macc,
        );
        return mapMerchantWarehouses(res);
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
      async getStockLevels(context, skus) {
        if (skus.length === 0) return [];
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const list = await client.request<{ item?: Array<{ item_id?: number | string }>; total_count?: number }>(
          {
            apiType: 'shop',
            path: '/api/v2/product/get_item_list',
            method: 'GET',
            params: { offset: 0, page_size: 100, item_status: ['NORMAL'] },
          },
          acc,
        );
        const results: StockLevel[] = [];
        for (const sku of skus) {
          const itemMatch = (list.item ?? []).find((i) => String(i.item_id) === sku);
          if (!itemMatch?.item_id) {
            results.push({ available: 0, reserved: 0, incoming: 0, holding: 0 });
            continue;
          }
          const models = await client.request<{ model?: Array<{ stock?: number; name?: string }> }>(
            {
              apiType: 'shop',
              path: '/api/v2/product/get_model_list',
              method: 'GET',
              params: { item_id: itemMatch.item_id },
            },
            acc,
          );
          let totalStock = 0;
          for (const m of models.model ?? []) {
            totalStock += m.stock ?? 0;
          }
          results.push({ available: totalStock, reserved: 0, incoming: 0, holding: 0 });
        }
        return results;
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
      async adjust(context, adjustments) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        for (const adj of adjustments) {
          await client.request(
            {
              apiType: 'shop',
              path: '/api/v2/product/update_stock',
              method: 'POST',
              params: {
                item_id: adj.productId,
                stock_list: [{ model_id: adj.sku ?? adj.productId, stock: adj.quantity }],
              },
            },
            acc,
          );
        }
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
        const rid = returnId.replace('srn-', '');
        if (action === 'cancel') {
          await client.request(
            {
              apiType: 'shop',
              path: '/api/v2/returns/cancel_dispute',
              method: 'POST',
              params: { return_sn: rid },
            },
            acc,
          );
          return;
        }
        const path =
          action === 'approve' || action === 'receive'
            ? '/api/v2/returns/confirm'
            : action === 'reject' || action === 'refund'
              ? '/api/v2/returns/refund'
              : '/api/v2/returns/confirm';
        await client.request(
          {
            apiType: 'shop',
            path,
            method: 'POST',
            params: { return_sn: rid },
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
          cost: { amount: 0, currency: 'IDR' as Currency },
        }));
      },
      async listShipments(context, opts) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const now = Math.floor(Date.now() / 1000);
        const timeFrom = opts?.since ? Math.floor(opts.since.getTime() / 1000) : now - 7 * 86400;
        const res = await client.request<{ order_list?: Array<{ order_sn?: string; package_list?: Array<{ package_number?: string; logistics_status?: string; shipping_carrier?: string; tracking_number?: string }> }> }>(
          {
            apiType: 'shop',
            path: '/api/v2/order/get_order_list',
            method: 'GET',
            params: { time_range_field: 'create_time', time_from: timeFrom, time_to: now, page_size: 100 },
          },
          acc,
        );
        const shipments: Shipment[] = [];
        for (const order of res.order_list ?? []) {
          const pkgs = order.package_list ?? [];
          for (const pkg of pkgs) {
            shipments.push({
              id: pkg.package_number ?? order.order_sn ?? '',
              orderId: order.order_sn ?? '',
              courier: 'custom',
              service: pkg.shipping_carrier ?? '',
              trackingNumber: pkg.tracking_number ?? '',
              events: [],
              status: 'pending',
              createdAt: new Date(timeFrom * 1000).toISOString(),
              updatedAt: new Date(now * 1000).toISOString(),
            });
          }
        }
        return shipments;
      },
      async getShipment(context, shipmentId) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const res = await client.request<{ order_sn?: string; logistics_status?: string; tracking_info?: Array<{ update_time?: number; description?: string; logistics_status?: string }> }>(
          {
            apiType: 'shop',
            path: '/api/v2/logistics/get_tracking_info',
            method: 'GET',
            params: { order_sn: shipmentId },
          },
          acc,
        );
        return {
          id: shipmentId,
          orderId: res.order_sn ?? shipmentId,
          courier: 'custom',
          service: '',
          trackingNumber: '',
          events: (res.tracking_info ?? []).map((t) => ({
            status: t.logistics_status ?? 'in_transit',
            description: t.description ?? '',
            occurredAt: t.update_time !== undefined ? new Date(t.update_time * 1000).toISOString() : new Date().toISOString(),
          })),
          status: res.logistics_status === 'LOGISTICS_DELIVERY_SUCCEED' ? 'delivered' : res.logistics_status === 'LOGISTICS_DELIVERY_FAILED' ? 'failed' : 'in_transit',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
    },

    payment: {
      async list(context, opts) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const now = Math.floor(Date.now() / 1000);
        const timeFrom = opts?.since ? Math.floor(opts.since.getTime() / 1000) : now - 30 * 86400;
        const res = await client.request<{ escrow_list?: Array<{ order_sn?: string; payout_amount?: number; escrow_release_time?: number }>; more?: boolean }>(
          {
            apiType: 'shop',
            path: '/api/v2/payment/get_escrow_list',
            method: 'GET',
            params: { release_time_from: timeFrom, release_time_to: now, page_size: 100, page_no: 1 },
          },
          acc,
        );
        return (res.escrow_list ?? []).map((e): Payment => ({
          id: e.order_sn ?? '',
          orderId: e.order_sn ?? '',
          method: 'other',
          status: 'captured',
          amount: { amount: e.payout_amount ?? 0, currency: 'IDR' },
          refunds: [],
          ...(e.escrow_release_time !== undefined ? { paidAt: new Date(e.escrow_release_time * 1000).toISOString() } : {}),
          createdAt: new Date((e.escrow_release_time ?? now) * 1000).toISOString(),
          updatedAt: new Date((e.escrow_release_time ?? now) * 1000).toISOString(),
        }));
      },
      async get(context, paymentId) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const res = await client.request<{ order_sn?: string; order_income?: { escrow_amount?: number; buyer_payment_method?: string }; buyer_payment_info?: { buyer_payment_method?: string } }>(
          {
            apiType: 'shop',
            path: '/api/v2/payment/get_escrow_detail',
            method: 'GET',
            params: { order_sn: paymentId },
          },
          acc,
        );
        const method = res.order_income?.buyer_payment_method ?? res.buyer_payment_info?.buyer_payment_method ?? 'other';
        return {
          id: res.order_sn ?? paymentId,
          orderId: res.order_sn ?? paymentId,
          method: method.toLowerCase().includes('cod') ? 'cod' : method.toLowerCase().includes('transfer') ? 'transfer' : 'other',
          status: 'captured',
          amount: { amount: res.order_income?.escrow_amount ?? 0, currency: 'IDR' },
          refunds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
      async refund(context, paymentId, _amount) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        await client.request(
          {
            apiType: 'shop',
            path: '/api/v2/payment/get_escrow_detail',
            method: 'GET',
            params: { order_sn: paymentId },
          },
          acc,
        );
      },
    },

    promotion: {
      async list(context, opts) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const status = opts?.status?.[0] ?? 'ongoing';
        const res = await client.request<{ discount_list?: Array<{ discount_id?: number | string; discount_name?: string; status?: string; start_time?: number; end_time?: number }>; more?: boolean }>(
          {
            apiType: 'shop',
            path: '/api/v2/discount/get_discount_list',
            method: 'GET',
            params: { discount_status: status, page_no: 1, page_size: 100 },
          },
          acc,
        );
        return (res.discount_list ?? []).map((d): Promotion => ({
          id: String(d.discount_id ?? ''),
          storeId: context.storeId,
          name: d.discount_name ?? '',
          type: 'bundle',
          status: d.status === 'ongoing' ? 'active' : d.status === 'upcoming' ? 'scheduled' : 'ended',
          startAt: d.start_time ? new Date(d.start_time * 1000).toISOString() : '',
          endAt: d.end_time ? new Date(d.end_time * 1000).toISOString() : '',
          usageCount: 0,
          rules: { type: 'fixed', value: 0, appliesTo: 'all_items' },
          createdAt: d.start_time ? new Date(d.start_time * 1000).toISOString() : '',
          updatedAt: d.start_time ? new Date(d.start_time * 1000).toISOString() : '',
        }));
      },
      async get(context, promotionId) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const res = await client.request<{ status?: string; discount_name?: string; start_time?: number; end_time?: number; item_list?: Array<{ item_id?: number | string }> }>(
          {
            apiType: 'shop',
            path: '/api/v2/discount/get_discount',
            method: 'GET',
            params: { discount_id: promotionId, page_no: 1, page_size: 50 },
          },
          acc,
        );
        return {
          id: promotionId,
          storeId: context.storeId,
          name: res.discount_name ?? '',
          type: 'bundle',
          status: res.status === 'ongoing' ? 'active' : res.status === 'upcoming' ? 'scheduled' : 'ended',
          startAt: res.start_time ? new Date(res.start_time * 1000).toISOString() : '',
          endAt: res.end_time ? new Date(res.end_time * 1000).toISOString() : '',
          usageCount: 0,
          rules: { type: 'fixed', value: 0, appliesTo: 'all_items' },
          createdAt: res.start_time ? new Date(res.start_time * 1000).toISOString() : '',
          updatedAt: res.start_time ? new Date(res.start_time * 1000).toISOString() : '',
        };
      },
      async create(context, promotion) {
        return Promise.resolve(promotion);
      },
      async update(context, promotionId, patch) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const body: Record<string, unknown> = { discount_id: promotionId };
        if (patch.name !== undefined) body.discount_name = patch.name;
        if (patch.start_time !== undefined) body.start_time = patch.start_time;
        if (patch.end_time !== undefined) body.end_time = patch.end_time;
        await client.request(
          {
            apiType: 'shop',
            path: '/api/v2/discount/update_discount',
            method: 'POST',
            params: body,
          },
          acc,
        );
      },
      async setActive(context, promotionId, active) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        if (!active) {
          await client.request(
            {
              apiType: 'shop',
              path: '/api/v2/discount/end_discount',
              method: 'POST',
              params: { discount_id: promotionId },
            },
            acc,
          );
        }
      },
    },

    finance: {
      async overview(context) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const res = await client.request<{ latest_payout_date?: string }>(
          { apiType: 'shop', path: '/api/v2/payment/get_income_overview', method: 'GET', params: {} },
          acc,
        );
        return {
          ...(res.latest_payout_date !== undefined ? { lastPayoutAt: res.latest_payout_date } : {}),
        };
      },
      async transactions(context, query) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const params: Record<string, unknown> = { page_no: 1, page_size: query?.limit ?? 50 };
        if (query?.from) params.create_time_from = Math.floor(new Date(query.from).getTime() / 1000);
        if (query?.to) params.create_time_to = Math.floor(new Date(query.to).getTime() / 1000);
        const res = await client.request<{ transaction_list?: Array<{ transaction_type?: string; amount?: number; current_balance?: number; create_time?: number; order_sn?: string; status?: string; money_flow?: string }> }>(
          { apiType: 'shop', path: '/api/v2/payment/get_wallet_transaction_list', method: 'GET', params },
          acc,
        );
        return (res.transaction_list ?? []).map((t): WalletTransaction => {
          const direction: 'in' | 'out' = (t.money_flow === 'MONEY_IN' || (t.amount !== undefined && t.amount >= 0)) ? 'in' : 'out';
          return {
            id: t.order_sn ?? `txn-${String(t.create_time ?? '')}`,
            ...(t.order_sn !== undefined ? { orderId: t.order_sn } : {}),
            type: t.transaction_type ?? 'other',
            direction,
            amount: { amount: Math.abs(t.amount ?? 0), currency: 'IDR' },
            ...(t.current_balance !== undefined ? { balance: { amount: t.current_balance, currency: 'IDR' } } : {}),
            status: t.status ?? 'completed',
            createdAt: t.create_time ? new Date(t.create_time * 1000).toISOString() : new Date().toISOString(),
          };
        });
      },
      async statement(context, opts) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const params: Record<string, unknown> = {};
        if (opts?.from) params.income_statement_id = 0;
        try {
          const res = await client.request<{ id?: number; file_name?: string; status?: number; generated_time?: number; file_link?: string; error?: string }>(
            { apiType: 'shop', path: '/api/v2/payment/get_income_statement', method: 'GET', params },
            acc,
          );
          const statusMap: Record<number, 'generating' | 'ready' | 'failed'> = { 0: 'generating', 1: 'generating', 2: 'ready', 3: 'ready', 4: 'failed' };
          return {
            id: String(res.id ?? ''),
            fileName: res.file_name ?? '',
            status: res.file_link ? 'ready' : (statusMap[res.status ?? 1] ?? 'generating'),
            ...(res.generated_time !== undefined ? { generatedAt: new Date(res.generated_time).toISOString() } : {}),
            ...(res.file_link !== undefined ? { fileUrl: res.file_link } : {}),
            ...(res.error !== undefined ? { error: res.error } : {}),
          };
        } catch {
          return { id: '', fileName: '', status: 'generating' };
        }
      },
      async payoutInfo(context) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        const now = Math.floor(Date.now() / 1000);
        const params: Record<string, unknown> = {
          payout_time_from: now - 30 * 86400,
          payout_time_to: now,
          page_size: 100,
          cursor: '',
        };
        try {
          const res = await client.request<{ payout_list?: Array<{ encrypted_payout_id?: string; payout_amount?: number; payout_time?: number; pay_service?: string; payee_id?: string; payout_currency?: string }> }>(
            { apiType: 'shop', path: '/api/v2/payment/get_payout_info', method: 'GET', params },
            acc,
          );
          return {
            payouts: (res.payout_list ?? []).map((p) => ({
              id: p.encrypted_payout_id ?? '',
              amount: { amount: Math.abs(p.payout_amount ?? 0), currency: (p.payout_currency ?? 'IDR') as Currency },
              status: 'completed',
              method: p.pay_service ?? 'other',
              ...(p.payee_id !== undefined ? { paidTo: p.payee_id } : {}),
              requestedAt: p.payout_time ? new Date(p.payout_time * 1000).toISOString() : new Date().toISOString(),
              ...(p.payout_time !== undefined ? { paidAt: new Date(p.payout_time * 1000).toISOString() } : {}),
            })),
          };
        } catch {
          return { payouts: [] };
        }
      },
    },

    media: {
      async upload(context, opts) {
        const client = clientFor(context.credentials);
        const acc = await shopAcc(context);
        if (opts.type !== 'image') {
          return {
            id: '',
            platform: 'shopee',
            type: opts.type,
            url: '',
            createdAt: new Date().toISOString(),
          };
        }
        const timestamp = client.now();
        const path = '/api/v2/media/upload_image';
        const sign = client.sign({ apiType: 'shop', path }, timestamp, acc.accessToken, acc.shopId);
        const query: Record<string, string> = {
          partner_id: client.partnerId,
          timestamp: String(timestamp),
          ...(acc.accessToken ? { access_token: acc.accessToken } : {}),
          ...(acc.shopId ? { shop_id: acc.shopId } : {}),
          sign,
        };
        const qs = new URLSearchParams(query).toString();
        const url = `${client.baseUrl}${path}?${qs}`;
        const formData = new FormData();
        const blob = new Blob([opts.data], { type: opts.mimeType ?? 'image/jpeg' });
        formData.append('images', blob, opts.fileName ?? 'image.jpg');
        formData.append('business', '2');
        formData.append('scene', '1');
        const resp = await (options.fetch ?? globalThis.fetch)(url, { method: 'POST', body: formData });
        const body = await resp.json() as { error?: string; response?: { image_list?: Array<{ image_id?: string; image_url?: string }> } };
        if (body.error) {
          throw new Error(`Shopee upload_image error: ${body.error}`);
        }
        const img = body.response?.image_list?.[0];
        return {
          id: img?.image_id ?? '',
          platform: 'shopee',
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
          id: 'merchant-shopee',
          platform: 'shopee',
          name: context.credentials.appId,
          status: 'active',
          shops: [context.credentials.shopId ?? ''],
        };
      },
      async listShops(context) {
        const client = clientFor(context.credentials);
        const macc = merchantAcc(context);
        if (!macc) return [];
        try {
          const res = await client.request<{ shop_list?: Array<{ shop_id?: number | string }>; more?: boolean }>(
            { apiType: 'merchant', path: '/api/v2/merchant/get_shop_list_by_merchant', method: 'GET', params: { page_no: 1, page_size: 100 } },
            macc,
          );
          return (res.shop_list ?? []).map((s): MerchantShop => ({
            shopId: String(s.shop_id ?? ''),
          }));
        } catch {
          return [];
        }
      },
      async listWarehouses(context) {
        const client = clientFor(context.credentials);
        const macc = merchantAcc(context);
        if (!macc) return [];
        try {
          const res = await client.request<WarehouseRaw>(
            { apiType: 'merchant', path: '/api/v2/merchant/get_merchant_warehouse_list', method: 'POST', params: { warehouse_type: 1, cursor: { page_size: 30 } } },
            macc,
          );
          return mapMerchantWarehouses(res);
        } catch {
          return [];
        }
      },
      async listWarehouseLocations(context, warehouseId) {
        const client = clientFor(context.credentials);
        const macc = merchantAcc(context);
        if (!macc) return [];
        try {
          const res = await client.request<{ response?: Array<{ location_id?: string; warehouse_name?: string }> }>(
            { apiType: 'merchant', path: '/api/v2/merchant/get_merchant_warehouse_location_list', method: 'GET', params: { warehouse_id: warehouseId } },
            macc,
          );
          const locations = Array.isArray(res.response) ? res.response : [];
          return locations.map((l) => ({
            id: l.location_id ?? warehouseId,
            name: l.warehouse_name ?? '',
          }));
        } catch {
          return [];
        }
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
