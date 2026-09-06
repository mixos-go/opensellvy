import { describe, expect, it } from 'vitest';
import { createShopeePlugin } from '../src/shopee.connector';

const PARTNER_ID = '2001887';
const PARTNER_KEY = 'k';
const ACCESS = 'at-1';
const SHOP = '14701711';

const TS = 1655714431;

function route(handler: (url: URL) => unknown) {
  return (input: unknown, _init?: RequestInit) => {
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
    credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'r', shopId: SHOP, merchantId: '1000010433', merchantToken: 'm-at-1' },
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
    const shop = await plugin.gateway.shop.getProfile(context() as never);
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
    const orders = await plugin.gateway.order.pull(context() as never);
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
    const orders = await plugin.gateway.order.pull(context() as never, { since: new Date('2023-01-01') });
    expect(orders).toHaveLength(0);
  });

  it('pullProducts memetakan item info → UnifiedProduct', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route((url) => {
        if (url.pathname.includes('/get_item_base_info')) {
          return {
            error: '',
            response: {
              item_list: [
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
    const products = await plugin.gateway.product.pull(context() as never);
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
    await plugin.gateway.inventory.sync(
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
    await expect(plugin.gateway.shop.getProfile(context() as never)).rejects.toMatchObject({ name: 'ShopeeApiError', code: 'access_token_value_expired' });
  });

  it('shop.getSettings → ShopSettings dari get_shop_info + holiday mode + warehouse list', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route((url) => {
        if (url.pathname.includes('/get_shop_holiday_mode')) {
          return { error: '', response: { holiday_mode_on: true } };
        }
        if (url.pathname.includes('/get_merchant_warehouse_list')) {
          return { error: '', response: { warehouse_list: [{ warehouse_id: 9, warehouse_name: 'WH-A', warehouse_region: 'ID' }] } };
        }
        return { error: '', response: { shop_name: 'Toko Andi', region: 'ID' } };
      }),
    });
    const settings = await plugin.gateway.shop.getSettings(context() as never);
    expect(settings.holidayMode).toBe(true);
    expect(settings.warehouses[0].name).toBe('WH-A');
  });

  it('shop.setHolidayMode → POST set_shop_holiday_mode dengan holiday_mode_on', async () => {
    let seen: unknown;
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: async (input: unknown, init?: RequestInit) => {
        const url = new URL(String(input));
        const body = JSON.parse(String(init?.body ?? '{}'));
        if (url.pathname.includes('/set_shop_holiday_mode')) seen = body;
        return Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve(JSON.stringify({ error: '', response: {} })),
        } as Response);
      },
    });
    await plugin.gateway.shop.setHolidayMode(context() as never, false);
    expect(seen).toEqual({ holiday_mode_on: false });
  });

  it('shop.listWarehouses → MerchantWarehouse[] dari get_merchant_warehouse_list', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: '', response: { warehouse_list: [{ warehouse_id: 1, warehouse_name: 'Gudang A' }] } })),
    });
    const list = await plugin.gateway.shop.listWarehouses(context() as never);
    expect(list[0].id).toBe('1');
    expect(list[0].name).toBe('Gudang A');
  });

  it('finance.overview → FinanceOverview dari get_income_overview', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: '', response: { latest_payout_date: '2026-09-01' } })),
    });
    const overview = await plugin.gateway.finance.overview(context() as never);
    expect(overview.lastPayoutAt).toBe('2026-09-01');
  });

  it('finance.transactions → WalletTransaction[] dari get_wallet_transaction_list', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({
        error: '',
        response: {
          transaction_list: [
            {
              transaction_type: 'PAYOUT',
              money_flow: 'MONEY_IN',
              amount: 5000,
              current_balance: 12345,
              create_time: 1655714431,
              order_sn: 'SN-1',
            },
          ],
        },
      })),
    });
    const txs = await plugin.gateway.finance.transactions(context() as never);
    expect(txs).toHaveLength(1);
    expect(txs[0].type).toBe('PAYOUT');
    expect(txs[0].direction).toBe('in');
    expect(txs[0].amount.amount).toBe(5000);
  });

  it('finance.statement → FinanceStatement dari get_income_statement', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: '', response: { file_name: 'stmt.pdf', file_link: 'https://x/stmt.pdf', status: 3 } })),
    });
    const st = await plugin.gateway.finance.statement(context() as never);
    expect(st.fileName).toBe('stmt.pdf');
    expect(st.status).toBe('ready');
    expect(st.fileUrl).toBe('https://x/stmt.pdf');
  });

  it('finance.payoutInfo → PayoutInfo dari get_payout_info', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: '', response: { payout_list: [{ encrypted_payout_id: 'P1', payout_amount: 25000 }] } })),
    });
    const info = await plugin.gateway.finance.payoutInfo(context() as never);
    expect(info.payouts[0].id).toBe('P1');
    expect(info.payouts[0].amount.amount).toBe(25000);
  });

  it('finance.payoutInfo → PayoutInfo [] saat platform error', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: 'server_error', message: 'boom' })),
    });
    const empty = await plugin.gateway.finance.payoutInfo(context() as never);
    expect(empty.payouts).toEqual([]);
  });

  it('merchant.listShops → MerchantShop[] dari get_shop_list_by_merchant', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: '', response: { shop_list: [{ shop_id: 14701711 }], more: false } })),
    });
    const shops = await plugin.gateway.merchant.listShops(context() as never);
    expect(shops[0].shopId).toBe('14701711');
  });

  it('merchant.listWarehouses → MerchantWarehouse[] dari get_merchant_warehouse_list', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: '', response: { warehouse_list: [{ warehouse_id: 4, warehouse_name: 'WH-4', warehouse_region: 'SG' }] } })),
    });
    const list = await plugin.gateway.merchant.listWarehouses(context() as never);
    expect(list[0].id).toBe('4');
    expect(list[0].region).toBe('SG');
  });

  it('merchant.listWarehouseLocations → MerchantWarehouse[] dari get_merchant_warehouse_location_list', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: '', response: { response: [{ location_id: 'loc-1', warehouse_name: 'Zone A' }] } })),
    });
    const list = await plugin.gateway.merchant.listWarehouseLocations(context() as never, 'wh-1');
    expect(list[0].id).toBe('loc-1');
    expect(list[0].name).toBe('Zone A');
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

describe('Shopee OAuth persist + auto-refresh (TokenStore)', () => {
  it('exchangeCode menyimpan token ke TokenStore per seller', async () => {
    const store = {
      saved: [] as { storeId: string; token: unknown }[],
      async save(storeId: string, _p: string, token: never) {
        this.saved.push({ storeId, token });
      },
      async get() {
        return undefined;
      },
      async delete() {},
    };
    const plugin = createShopeePlugin({
      now: () => TS,
      tokenStore: store as never,
      fetch: route(() => ({
        error: '',
        response: { access_token: 'at-new', refresh_token: 'rt-new', expires_in: 7200, shop_id: 14701711 },
      })),
    });
    const token = await plugin.auth.exchangeCode(context() as never, 'code-1');
    expect(token.accessToken).toBe('at-new');
    expect(token.refreshToken).toBe('rt-new');
    expect(store.saved).toHaveLength(1);
    expect((store.saved[0] as { token: { accessToken: string } }).token.accessToken).toBe('at-new');
  });

  it('auto-refresh: token kadaluarsa di-refresh dari refreshToken lalu di-persist', async () => {
    let refreshCalls = 0;
    const store = {
      current: { accessToken: 'at-old', refreshToken: 'rt-saved', expiresAt: -1 } as never,
      async save(_s: string, _p: string, t: never) {
        this.current = t;
      },
      async get() {
        return this.current;
      },
      async delete() {},
    };
    const plugin = createShopeePlugin({
      now: () => TS,
      tokenStore: store as never,
      fetch: route((url) => {
        if (url.pathname.includes('/access_token/get')) {
          refreshCalls++;
          return { error: '', response: { access_token: 'at-fresh', refresh_token: 'rt-fresh', expires_in: 7200 } };
        }
        return { error: '', response: { shop_id: 14701711, shop_name: 'Toko', region: 'ID' } };
      }),
    });
    await plugin.gateway.shop.getProfile(context() as never);
    expect(refreshCalls).toBe(1);
    expect((store.current as { accessToken: string }).accessToken).toBe('at-fresh');
  });

  it('dev quick-start: accessToken opsional dipakai tanpa TokenStore', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      accessToken: 'at-dev',
      shopId: SHOP,
      fetch: route(() => ({ error: '', response: { shop_id: 14701711, shop_name: 'T', region: 'ID' } })),
    });
    const shop = await plugin.gateway.shop.getProfile(context() as never);
    expect(shop.shopName).toBe('T');
  });
});

describe('Shopee api accessor (scale semua kategori via facade)', () => {
  it('api(ctx) → facade dengan 29 kategori ter-bind', async () => {
    const plugin = createShopeePlugin({
      now: () => TS,
      fetch: route(() => ({ error: '', response: { item: [{ item_id: 5 }], total_count: 1 } })),
    });
    const facade = await plugin.api(context() as never);
    const cats = [
      'ams', 'account_health', 'add_on_deal', 'ads', 'principal', 'bundle_deal', 'discount',
      'fbs', 'first_mile', 'follow_prize', 'global_product', 'livestream', 'logistics', 'media',
      'media_space', 'merchant', 'order', 'payment', 'product', 'public', 'push', 'returns',
      'sbs', 'shop', 'shop_category', 'shop_flash_sale', 'top_picks', 'video', 'voucher',
    ];
    for (const c of cats) expect(facade).toHaveProperty(c);
    expect(Object.keys(facade)).toHaveLength(29);
  });
});
