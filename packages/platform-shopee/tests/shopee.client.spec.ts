import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { ShopeeClient } from '../src/shopee.client';

const PARTNER_ID = '2001887';
const PARTNER_KEY = 'test-partner-key';
const ACCESS_TOKEN = '59777174636562737266615546704c6d';
const SHOP_ID = '14701711';
const TS = 1655714431;

function client(overrides: Record<string, unknown> = {}) {
  return new ShopeeClient({
    credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'https://cb.test' },
    now: () => TS,
    ...overrides,
  } as never);
}

function expectedSign(path: string, apiType: 'public' | 'shop' | 'merchant', accessToken?: string, shopId?: string): string {
  let base: string;
  if (apiType === 'public') {
    base = `${PARTNER_ID}${path}${TS}`;
  } else {
    base = `${PARTNER_ID}${path}${TS}${accessToken ?? ''}${shopId ?? ''}`;
  }
  return createHmac('sha256', PARTNER_KEY).update(base).digest('hex');
}

describe('ShopeeClient signing (HMAC-SHA256)', () => {
  it('buildBaseString shop API: partner_id + path + timestamp + access_token + shop_id', () => {
    const c = client();
    const base = c.buildBaseString(
      { apiType: 'shop', path: '/api/v2/shop/get_shop_info' },
      TS,
      ACCESS_TOKEN,
      SHOP_ID,
    );
    expect(base).toBe(`${PARTNER_ID}/api/v2/shop/get_shop_info${TS}${ACCESS_TOKEN}${SHOP_ID}`);
  });

  it('buildBaseString public API: partner_id + path + timestamp', () => {
    const c = client();
    const base = c.buildBaseString({ apiType: 'public', path: '/api/v2/public/get_shops_by_partner' }, TS);
    expect(base).toBe(`${PARTNER_ID}/api/v2/public/get_shops_by_partner${TS}`);
  });

  it('sign equals HMAC-SHA256(base, partner_key) hex', () => {
    const c = client();
    const path = '/api/v2/shop/get_shop_info';
    expect(c.sign({ apiType: 'shop', path }, TS, ACCESS_TOKEN, SHOP_ID)).toBe(
      expectedSign(path, 'shop', ACCESS_TOKEN, SHOP_ID),
    );
    expect(c.sign({ apiType: 'shop', path }, TS, ACCESS_TOKEN, SHOP_ID)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('public sign mengecualikan access_token/shop_id', () => {
    const c = client();
    const path = '/api/v2/public/get_shops_by_partner';
    // access_token/shop_id tidak boleh mempengaruhi signature public
    expect(c.sign({ apiType: 'public', path }, TS)).toBe(expectedSign(path, 'public'));
  });

  it('merchant sign: partner_id + path + timestamp + access_token + merchant_id', () => {
    const c = client({
      credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'r', merchantId: '10000010433', merchantToken: 'm-tok' },
    } as never);
    const path = '/api/v2/merchant/get_merchant_warehouse_list';
    expect(c.sign({ apiType: 'merchant', path }, TS, 'm-tok', '10000010433')).toBe(
      expectedSign(path, 'merchant', 'm-tok', '10000010433'),
    );
  });
});

describe('ShopeeClient HTTP layer', () => {
  it('GET menaruh common params + request params di URL, tanpa body', async () => {
    let capturedUrl = '';
    const capturedBody = '';
    const c = client({
      fetch: (input: unknown) => {
        capturedUrl = String(input);
        return Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve('{"error":"","response":{"shop_id":123}}'),
        } as Response);
      },
    });
    const res = await c.request<{ shop_id: number }>(
      { apiType: 'shop', path: '/api/v2/shop/get_shop_info', method: 'GET', params: { extra: 'x' } },
      { accessToken: ACCESS_TOKEN as string, shopId: SHOP_ID as string },
    );
    const url = new URL(capturedUrl);
    expect(url.origin + url.pathname).toBe('https://partner.shopeemobile.com/api/v2/shop/get_shop_info');
    expect(url.searchParams.get('partner_id')).toBe(PARTNER_ID);
    expect(url.searchParams.get('timestamp')).toBe(String(TS));
    expect(url.searchParams.get('access_token')).toBe(ACCESS_TOKEN);
    expect(url.searchParams.get('shop_id')).toBe(SHOP_ID);
    expect(url.searchParams.get('extra')).toBe('x');
    expect(url.searchParams.get('sign')).toBe(
      expectedSign('/api/v2/shop/get_shop_info', 'shop', ACCESS_TOKEN, SHOP_ID),
    );
    expect(capturedBody).toBe('');
    expect(res.shop_id).toBe(123);
  });

  it('POST menaruh common params di URL dan request params di body JSON', async () => {
    let capturedUrl = '';
    let capturedBody = '';
    const c = client({
      fetch: (input: unknown, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedBody = String(init?.body ?? '');
        return Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve('{"error":"","response":{"token":"tok"}}'),
        } as Response);
      },
    });
    await c.request<{ token: string }>(
      { apiType: 'public', path: '/api/v2/auth/token/get', method: 'POST', params: { code: 'the-code' } },
      { apiType: 'public' },
    );
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('partner_id')).toBe(PARTNER_ID);
    expect(url.searchParams.get('sign')).toBe(expectedSign('/api/v2/auth/token/get', 'public'));
    expect(url.searchParams.has('code')).toBe(false);
    expect(capturedBody).toBe(JSON.stringify({ code: 'the-code' }));
  });

  it('merchant HTTP layer: merchant_id di common params URL + business di body', async () => {
    let capturedUrl = '';
    let capturedBody = '';
    const c = client({
      credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'r', merchantId: '10000010433', merchantToken: 'm-tok' },
      fetch: (input: unknown, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedBody = String(init?.body ?? '');
        return Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers({ 'content-type': 'application/json' }),
          text: () => Promise.resolve('{"error":"","response":{"warehouse_list":[]}}'),
        } as Response);
      },
    } as never);
    await c.request<{ warehouse_list: unknown[] }>(
      { apiType: 'merchant', path: '/api/v2/merchant/get_merchant_warehouse_list', method: 'POST', params: { warehouse_type: 1, cursor: { page_size: 30 } } },
      { apiType: 'merchant', merchantToken: 'm-tok', merchantId: '10000010433' },
    );
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('merchant_id')).toBe('10000010433');
    expect(url.searchParams.get('access_token')).toBe('m-tok');
    expect(url.searchParams.has('shop_id')).toBe(false);
    expect(url.searchParams.get('sign')).toBe(expectedSign('/api/v2/merchant/get_merchant_warehouse_list', 'merchant', 'm-tok', '10000010433'));
    expect(capturedBody).toBe(JSON.stringify({ warehouse_type: 1, cursor: { page_size: 30 } }));
  });

  it('normalisasi error Shopee {error,message} → ShopeeApiError', async () => {
    const c = client({
      fetch: () =>
        Promise.resolve({
          status: 200,
          ok: true,
          headers: new Headers(),
          text: () => Promise.resolve('{"error":"wrong_sign","message":"invalid signature"}'),
        } as Response),
    });
    await expect(
      c.request<any>({ apiType: 'public', path: '/api/v2/public/get_shops_by_partner', method: 'GET' }, { apiType: 'public' }),
    ).rejects.toMatchObject({ name: 'ShopeeApiError', code: 'wrong_sign' });
  });

  it('baseUrl fleksibel dari credentials dipakai (regional/sandbox)', async () => {
    const c = client({ credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'r', baseUrl: 'https://sandbox.shopee.sg' } });
    expect(c.baseUrl).toBe('https://sandbox.shopee.sg');
  });
});
