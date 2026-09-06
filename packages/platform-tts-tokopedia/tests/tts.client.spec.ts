import { describe, expect, it } from 'vitest';
import { TikTokClient, type ApiCallSpec } from '../src/tts.client';
import { TikTokError } from '../src/tts.types';

const APP_KEY = 'tt-app';
const APP_SECRET = 'tt-secret';
const ACCESS = 'tt-at-1';
const SHOP_CIPHER = 'SHOP_CIPHER_1';

type Call = { url: URL; body: string; headers: Headers };

function makeClient(respond: (call: Call) => Record<string, unknown>, opts: Record<string, unknown> = {}) {
  const calls: Call[] = [];
  const client = new TikTokClient({
    credentials: { app_key: APP_KEY, app_secret: APP_SECRET },
    fetch: (input: unknown, init?: RequestInit) => {
      const call: Call = {
        url: new URL(String(input)),
        body: String(init?.body ?? ''),
        headers: new Headers(init?.headers),
      };
      calls.push(call);
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(respond(call))),
      } as Response);
    },
    ...opts,
  } as never);
  return { client, calls };
}

describe('TikTokClient — HMAC-SHA256 signing & HTTP layer', () => {
  it('request menaruh common params + shop_cipher + sign di URL GET, tanpa body', async () => {
    const { client, calls } = makeClient(() => ({ code: 0, data: { id: 'p1' } }));
    const spec: ApiCallSpec = {
      method: 'GET',
      path: '/product/202309/products/{product_id}',
      baseUrl: 'https://open-api.tiktokglobalshop.com',
      query: ['shop_cipher'],
      headers: [],
      pathParams: ['product_id'],
      body: [],
    };
    const res = await client.request(spec, { product_id: 'p1' }, { access_token: ACCESS, shop_cipher: SHOP_CIPHER });
    const url = calls[0].url;
    expect(url.origin + url.pathname).toBe('https://open-api.tiktokglobalshop.com/product/202309/products/p1');
    expect(url.searchParams.get('app_key')).toBe(APP_KEY);
    expect(url.searchParams.get('timestamp')).toBeTruthy();
    expect(url.searchParams.get('shop_cipher')).toBe(SHOP_CIPHER);
    expect(url.searchParams.get('sign')).toMatch(/^[0-9a-f]{64}$/);
    expect(url.searchParams.has('product_id')).toBe(false);
    expect(calls[0].headers.get('x-tts-access-token')).toBe(ACCESS);
    expect(calls[0].body).toBe('');
    expect((res as { data: { id: string } }).data.id).toBe('p1');
  });

  it('POST menaruh business params di body JSON; sign mencakup body', async () => {
    const { client, calls } = makeClient((call) => {
      const body = JSON.parse(call.body);
      expect(body.skus).toHaveLength(1);
      expect(call.url.searchParams.has('skus')).toBe(false);
      return { code: 0, data: {} };
    });
    const spec: ApiCallSpec = {
      method: 'POST',
      path: '/product/202309/products/{product_id}/inventory/update',
      baseUrl: 'https://open-api.tiktokglobalshop.com',
      query: ['shop_cipher'],
      headers: [],
      pathParams: ['product_id'],
      body: ['skus'],
    };
    await client.request(
      spec,
      { product_id: 'p1', skus: [{ sku_id: 's1', stock_info: { available_stock_quantity: 5 } }] },
      { access_token: ACCESS, shop_cipher: SHOP_CIPHER },
    );
    const url = calls[0].url;
    expect(url.pathname).toContain('/product/202309/products/p1/inventory/update');
    // sign mendukung komponen body: mengubah body mengubah signature
    const first = url.searchParams.get('sign');
    await client.request(spec, { product_id: 'p1', skus: [{ sku_id: 's1', stock_info: { available_stock_quantity: 9 } }] }, { access_token: ACCESS, shop_cipher: SHOP_CIPHER });
    expect(calls[1].url.searchParams.get('sign')).not.toBe(first);
  });

  it('envelope error (code !== 0) dinormalisasi menjadi TikTokError', async () => {
    const { client } = makeClient(() => ({ code: 71001, message: 'bad token', request_id: 'req-1' }));
    const spec: ApiCallSpec = {
      method: 'GET',
      path: '/seller/202405/shops',
      baseUrl: 'https://open-api.tiktokglobalshop.com',
      query: [],
      headers: [],
      pathParams: [],
      body: [],
    };
    await expect(client.request(spec, {} as never, {})).rejects.toMatchObject({
      name: 'TikTokError',
      code: 71001,
      requestId: 'req-1',
    });
    expect(TikTokError).toBeTypeOf('function');
  });

  it('beforeRequest hook dijalankan sebelum request', async () => {
    let ran = false;
    const { client } = makeClient(() => ({ code: 0, data: {} }), { beforeRequest: async () => { ran = true; } } as never);
    const spec: ApiCallSpec = {
      method: 'GET',
      path: '/x',
      baseUrl: 'https://open-api.tiktokglobalshop.com',
      query: [],
      headers: [],
      pathParams: [],
      body: [],
    };
    await client.request(spec, {} as never, {});
    expect(ran).toBe(true);
  });
});