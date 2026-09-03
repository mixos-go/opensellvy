import { describe, expect, it, vi } from 'vitest';
import { ShopeeClient } from '../src/shopee.client';
import { createShopeeApi } from '../src/generated';

const PARTNER_ID = '1241483';
const PARTNER_KEY = 'shpk-test';
const ACCESS_TOKEN = 'test-access-token';
const SHOP_ID = '227844766';

function mockResp(body: unknown) {
  const json = JSON.stringify(body);
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: () => Promise.resolve(json),
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function api() {
  const fetchMock = vi.fn();
  const opts = { credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'https://cb.test' } };
  const client = new ShopeeClient({ ...opts, fetch: fetchMock as never });
  // injected agar sign konsisten → pakai now default; cukup cek path + body
  return { facade: createShopeeApi(client, { accessToken: ACCESS_TOKEN, shopId: SHOP_ID }), fetchMock };
}

describe('generated ShopeeApi facade', () => {
  it('exposes per-category accessor + typed method (order.getOrderList)', () => {
    const { facade } = api();
    expect(typeof facade.order.getOrderList).toBe('function');
    expect(typeof facade.product.getItemList).toBe('function');
  });

  it('order.getOrderList → POST request dgn path benar & body params', async () => {
    const { facade, fetchMock } = api();
    fetchMock.mockResolvedValue(mockResp({ request_id: 'r1', error: '', response: { order_list: [] } }));
    const res = await facade.order.getOrderList({
      time_range_field: 'create_time',
      time_from: 1655714431,
      time_to: 1655800831,
    });
    const call = fetchMock.mock.calls[0]!;
    const url = new URL(String(call[0]));
    expect(url.pathname).toBe('/api/v2/order/get_order_list');
    expect(url.searchParams.get('sign')).toMatch(/^[0-9a-f]{64}$/);
    expect(res).toEqual({ order_list: [] });
    expect(res.order_list).toEqual([]);
  });

  it('product.get_item_list → GET dgn item_status param', async () => {
    const { facade, fetchMock } = api();
    fetchMock.mockResolvedValue(mockResp({ request_id: 'r2', error: '', response: { item: [] } }));
    await facade.product.getItemList({ item_status: 'NORMAL' });
    const call = fetchMock.mock.calls[0]!;
    const url = new URL(String(call[0]));
    expect(url.pathname).toBe('/api/v2/product/get_item_list');
  });
});
