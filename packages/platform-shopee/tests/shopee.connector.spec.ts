import { describe, expect, it } from 'vitest';
import { createShopeePlugin } from '../src/shopee.connector';

const PARTNER_ID = '2001887';
const PARTNER_KEY = 'k';
const ACCESS = 'at-1';
const SHOP = '14701711';

const TS = 1655714431;

function route(handler: (url: URL) => unknown) {
  return (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    const responseBody = handler(url);
    return Promise.resolve({
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve(JSON.stringify(responseBody)),
    } as Response);
  };
}

function context(extra: Partial<Record<string, unknown>> = {}) {
  return {
    storeId: 's-1',
    platformAccountId: 's-1:shopee',
    credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'r', shopId: SHOP },
    token: { accessToken: ACCESS },
    ...extra,
  };
}

describe('Shopee connector gateway (stub fetch)', () => {
  it('getShop → platformShopId/shopName/marketplace dari get_shop_info', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({
        error: '',
        response: { shop_id: 14701711, shop_name: 'Toko Andi', region: 'ID' },
      })),
    });
    const shop = await plugin.gateway.getShop(context() as never);
    expect(shop.platformShopId).toBe('14701711');
    expect(shop.shopName).toBe('Toko Andi');
    expect(shop.marketplace).toBe('ID');
  });

  it('pullOrders memetakan order list + detail → UnifiedOrder', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route((url) => {
        if (url.pathname.includes('/get_order_detail')) {
          return {
            error: '',
            response: { order_list: [{ order_sn: 'ORD1', order_status: 'READY_TO_SHIP', currency: 'IDR' }] },
          };
        }
        return { error: '', response: { order_list: [{ order_sn: 'ORD1' }], more: false } };
      }),
    });
    const orders = await plugin.gateway.pullOrders(context() as never);
    expect(orders).toHaveLength(1);
    expect(orders[0].platformOrderId).toBe('ORD1');
    expect(orders[0].status).toBe('awaiting_fulfillment');
  });

  it('pullOrders: filter by `since` (order lama dilewati)', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({
        error: '',
        response: { order_list: [{ order_sn: 'OLD', create_time: 1600000000 }] },
      })),
    });
    const orders = await plugin.gateway.pullOrders(context() as never, { since: new Date('2023-01-01') });
    expect(orders).toHaveLength(0);
  });

  it('pullProducts memetakan item info → UnifiedProduct', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route((url) => {
        if (url.pathname.includes('/get_item_detail')) {
          return {
            error: '',
            response: {
              item: [
                {
                  item_id: 555,
                  item_name: 'Sendal',
                  item_status: 'NORMAL',
                  currency: 'IDR',
                  models: [{ model_id: 1, model_sku: 'SKU-1', price: 50000, normal_stock: 4 }],
                },
              ],
            },
          };
        }
        return { error: '', response: { item: [{ item_id: 555 }], total_count: 1 } };
      }),
    });
    const products = await plugin.gateway.pullProducts(context() as never);
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Sendal');
    expect(products[0].variants[0].stock).toBe(4);
  });

  it('syncInventory memanggil update_stock per item', async () => {
    let calls = 0;
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => {
        calls++;
        return { error: '', response: {} as Record<string, unknown>, request_id: 'r' };
      }),
    });
    await plugin.gateway.syncInventory(
      context() as never,
      [{ sku: 'SKU-1', stock: 3 }],
    );
    expect(calls).toBe(1);
  });

  it('getShop menanggapi error platform → melempar ShopeeApiError', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: 'access_token_value_expired', message: 'token expired', request_id: 'x' })),
    });
    await expect(plugin.gateway.getShop(context() as never)).rejects.toMatchObject({ name: 'ShopeeApiError', code: 'access_token_value_expired' });
  });
});

describe('Shopee auth default & re-export', () => {
  it('getAuthorizeUrl via plugin.auth menghasilkan URL auth_partner', async () => {
    const plugin = createShopeePlugin({ now: () => TS });
    const url = await plugin.auth.getAuthorizeUrl(context() as never);
    expect(url).toContain('/api/v2/shop/auth_partner');
    expect(url).toContain('redirect=r');
  });
});
