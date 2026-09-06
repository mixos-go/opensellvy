import { describe, expect, it } from 'vitest';
import { createTtsPlugin } from '../src/tts.connector';

const APP_KEY = 'tt-app';
const APP_SECRET = 'tt-secret';
const ACCESS = 'tt-at-1';
const SHOP_CIPHER = 'SHOP_CIPHER_1';

function route(handler: (url: URL, init?: RequestInit) => Record<string, unknown>) {
  return (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    const responseBody = handler(url, init);
    return Promise.resolve({
      status: 200,
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve(JSON.stringify(responseBody)),
    } as Response);
  };
}

function context() {
  return {
    storeId: 's-1',
    platformAccountId: 's-1:tts',
    credentials: { appId: APP_KEY, secret: APP_SECRET, redirectUri: 'r', shopId: SHOP_CIPHER },
    token: { accessToken: ACCESS },
  } as never;
}

describe('TikTok Shop connector gateway (stub fetch)', () => {
  it('shop.getProfile → platformShopId/shopName/marketplace dari Get Authorized Shops (token-level, tanpa shop_cipher)', async () => {
    const seen: string[] = [];
    const plugin = createTtsPlugin({
      fetch: route((url) => {
        seen.push(url.pathname);
        return {
          code: 0,
          data: {
            shops: [{ id: '7494', code: 'IDIDLCFEQLWNN', name: 'Toko Andi', region: 'ID', cipher: 'ROW_X', seller_type: 'LOCAL' }],
          },
        };
      }),
    });
    const shop = await plugin.gateway.shop.getProfile(context());
    expect(shop.platformShopId).toBe('7494');
    expect(shop.shopName).toBe('Toko Andi');
    expect(shop.marketplace).toBe('ID');
    expect(seen).toEqual(['/authorization/202309/shops']);
  });

  it('shop_cipher auto-resolve: Get Authorized Shops sekali, lalu dipakai request shop-scoped', async () => {
    const calls: string[] = [];
    const plugin = createTtsPlugin({
      fetch: route((url) => {
        calls.push(url.pathname);
        if (url.pathname === '/authorization/202309/shops') {
          return {
            code: 0,
            data: { shops: [{ id: '7494', name: 'Toko Andi', region: 'ID', cipher: 'ROW_AUTORESOLVE' }] },
          };
        }
        if (url.pathname.includes('/inventory/search')) {
          return { code: 0, data: { inventory: [{ product_id: 'P1', skus: [{ id: 'S1' }] }] } };
        }
        return { code: 0, data: {} };
      }),
    });
    await plugin.gateway.inventory.sync(context(), [{ sku: 'S1', stock: 5 }]);
    await plugin.gateway.inventory.sync(context(), [{ sku: 'S1', stock: 6 }]);
    const withCipher = calls.filter((p) => p === '/product/202309/inventory/search');
    expect(withCipher).toHaveLength(2);
    expect(calls.find((p) => p === '/authorization/202309/shops')).toBeDefined();
    expect(calls.filter((p) => p === '/authorization/202309/shops')).toHaveLength(1);
  });

  it('order.pull memetakan list + detail → UnifiedOrder', async () => {
    const plugin = createTtsPlugin({
      fetch: route((url) => {
        if (url.pathname.includes('/order/202507/orders')) {
          return {
            code: 0,
            data: {
              orders: [
                {
                  id: 'ORD1',
                  order_status: 'AWAITING_SHIPMENT',
                  create_time: 1655714431,
                  update_time: 1655714431,
                  payment: { total_amount: '100000', currency: 'IDR' },
                  items: [],
                  recipient_address: { name: 'Andi', phone_number: '0812' },
                },
              ],
            },
          };
        }
        return { code: 0, data: { orders: [{ id: 'ORD1' }] } };
      }),
    });
    const orders = await plugin.gateway.order.pull(context());
    expect(orders).toHaveLength(1);
    expect(orders[0].platformOrderId).toBe('ORD1');
    expect(orders[0].status).toBe('awaiting_fulfillment');
    expect(orders[0].customer.customerName).toBe('Andi');
  });

  it('order.pull dengan `since` memfilter order lama', async () => {
    const plugin = createTtsPlugin({
      fetch: route((url) => {
        if (url.pathname.includes('/order/202507/orders')) {
          return { code: 0, data: { orders: [{ id: 'OLD', create_time: 1600000000 }] } };
        }
        return { code: 0, data: { orders: [{ id: 'OLD' }] } };
      }),
    });
    const orders = await plugin.gateway.order.pull(context(), { since: new Date('2023-01-01') });
    expect(orders).toHaveLength(0);
  });

  it('product.pull memetakan search + detail → UnifiedProduct dengan variants', async () => {
    const plugin = createTtsPlugin({
      fetch: route((url) => {
        if (url.pathname.includes('/products/search')) {
          return { code: 0, data: { products: [{ id: 'P1' }] } };
        }
        return {
          code: 0,
          data: {
            id: 'P1',
            title: 'Sendal',
            description: 'Sendal karet',
            product_status: 'ACTIVATE',
            category_id: '1001',
            main_images: [{ urls: ['https://img/x.jpg'] }],
            skus: [{ id: 'S1', seller_sku: 'SKU-1', price: { sale_price: '50000', currency: 'IDR' } }],
          },
        };
      }),
    });
    const products = await plugin.gateway.product.pull(context());
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Sendal');
    expect(products[0].status).toBe('active');
    expect(products[0].variants[0].sku).toBe('SKU-1');
    expect(products[0].categoryIds).toEqual(['1001']);
  });

  it('inventory.sync: resolve product/warehouse via inventorySearch lalu updateInventory', async () => {
    const calls: string[] = [];
    const plugin = createTtsPlugin({
      shopCipher: SHOP_CIPHER,
      fetch: route((url, init) => {
        calls.push(url.pathname);
        if (url.pathname.includes('/inventory/search')) {
          return {
            code: 0,
            data: { inventory: [{ product_id: 'P1', skus: [{ id: 'S1', warehouses: [{ out_warehouse_id: 'WH-1' }] }] }] },
          };
        }
        return { code: 0, data: {} };
      }),
    });
    await plugin.gateway.inventory.sync(context(), [{ sku: 'S1', stock: 12 }]);
    expect(calls).toEqual([
      '/product/202309/inventory/search',
      '/product/202309/products/P1/inventory/update',
    ]);
  });

  it('inventory.getStockLevels → StockLevel[] dari inventorySearch', async () => {
    const plugin = createTtsPlugin({
      fetch: route(() => ({
        code: 0,
        data: {
          inventory: [
            {
              skus: [
                {
                  id: 'S1',
                  total_available_inventory_distribution: [
                    { in_shop_inventory: { quantity: 7 }, campaign_inventory: [], creator_inventory: [] },
                  ],
                },
              ],
            },
          ],
        },
      })),
    });
    const levels = await plugin.gateway.inventory.getStockLevels(context(), ['S1']);
    expect(levels[0].available).toBe(7);
  });

  it('returns.list memetakan return_orders → ReturnRequest', async () => {
    const plugin = createTtsPlugin({
      fetch: route(() => ({
        code: 0,
        data: {
          return_orders: [
            { return_id: 'R1', order_id: 'ORD1', return_status: 'REQUESTED', return_reason: 'salah ukuran', create_time: 1655714431 },
          ],
        },
      })),
    });
    const returns = await plugin.gateway.returns.list(context());
    expect(returns).toHaveLength(1);
    expect(returns[0].id).toBe('ttrn-R1');
    expect(returns[0].status).toBe('requested');
    expect(returns[0].note).toBe('salah ukuran');
  });

  it('promotion.list memetakan activities → Promotion', async () => {
    const plugin = createTtsPlugin({
      fetch: route(() => ({
        code: 0,
        data: {
          activities: [
            { activity_id: 'A1', title: 'Flash Sale 10.10', status: 'ONGOING', begin_time: 1655714431, end_time: 1655800831 },
          ],
        },
      })),
    });
    const promos = await plugin.gateway.promotion.list(context());
    expect(promos).toHaveLength(1);
    expect(promos[0].id).toBe('A1');
    expect(promos[0].name).toBe('Flash Sale 10.10');
    expect(promos[0].status).toBe('active');
  });

  it('payment.list memetakan get_payments → Payment[]', async () => {
    const plugin = createTtsPlugin({
      fetch: route(() => ({
        code: 0,
        data: {
          payments: [
            { id: 'PAY1', order_id: 'ORD1', amount: { value: '50000', currency: 'IDR' }, create_time: 1655714431 },
          ],
        },
      })),
    });
    const payments = await plugin.gateway.payment.list(context());
    expect(payments).toHaveLength(1);
    expect(payments[0].id).toBe('PAY1');
    expect(payments[0].amount.amount).toBe(50000);
  });

  it('shipping.getRates memetakan shipping_providers → ShippingRate[]', async () => {
    const plugin = createTtsPlugin({
      fetch: route(() => ({
        code: 0,
        data: { shipping_providers: [{ name: 'J&T Express', shipping_provider_name: 'J&T' }] },
      })),
    });
    const rates = await plugin.gateway.shipping.getRates(context(), { toAddress: {} as never });
    expect(rates).toHaveLength(1);
    expect(rates[0].service).toBe('J&T Express');
  });

  it('fulfillment.ship mengirim body mark_package_as_shipped', async () => {
    let seen: unknown;
    const plugin = createTtsPlugin({
      fetch: async (input: unknown, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.pathname.includes('/orders/ORD1/packages')) seen = JSON.parse(String(init?.body ?? '{}'));
        return Promise.resolve({ status: 200, ok: true, headers: new Headers(), text: () => Promise.resolve('{"code":0,"data":{}}') } as Response);
      },
    });
    await plugin.gateway.fulfillment.ship(context(), 'ORD1', { courier: 'SP-1', trackingNumber: 'TRK-9' });
    expect(seen).toEqual({
      order_line_item_ids: [],
      shipping_provider_id: 'SP-1',
      tracking_number: 'TRK-9',
    });
  });

  it('order.track memetakan tracking events → TrackingEvent[]', async () => {
    const plugin = createTtsPlugin({
      fetch: route(() => ({
        code: 0,
        data: { tracking: [{ status: 'IN_TRANSIT', description: 'dalam perjalanan', location: 'Jakarta', time: 1655714431 }] },
      })),
    });
    const events = await plugin.gateway.order.track(context(), 'ORD1');
    expect(events).toHaveLength(1);
    expect(events[0].status).toBe('IN_TRANSIT');
    expect(events[0].occurredAt).toBe(new Date(1655714431 * 1000).toISOString());
  });

  it('api(ctx) → facade dengan 25 kategori ter-bind + header access token ditebar', async () => {
    let seenHeader = '';
    const plugin = createTtsPlugin({
      fetch: (input: unknown, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        seenHeader = headers.get('x-tts-access-token') ?? '';
        return Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve('{"code":0,"data":{}}'),
        } as Response);
      },
    });
    const facade = await plugin.api(context());
    const cats = [
      'affiliate', 'affiliateCreator', 'affiliatePartner', 'affiliateSeller', 'analytics',
      'authorization', 'customerEngagement', 'customerService', 'dataReconciliation', 'epharmacy',
      'event', 'fbt', 'finance', 'fulfillment', 'gsFullServiceCommodity', 'gsFullServiceInventory',
      'gsFullServiceShipment', 'logistics', 'order', 'product', 'promotion', 'returnRefund',
      'reviewRating', 'seller', 'supplyChain',
    ];
    for (const c of cats) expect(facade).toHaveProperty(c);
    expect(Object.keys(facade)).toHaveLength(25);
    await (facade as unknown as { seller: { getSellerStatus: (p: never, o?: never) => Promise<unknown> } }).seller.getSellerStatus({});
    expect(seenHeader).toBe(ACCESS);
  });
});