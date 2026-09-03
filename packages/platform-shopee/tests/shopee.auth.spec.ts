import { describe, expect, it } from 'vitest';
import { ShopeeClient } from '../src/shopee.client';
import { createShopeeAuth } from '../src/shopee.auth';

const PARTNER_ID = '2001887';
const PARTNER_KEY = 'k';
const TS = 1655714431;

type Call = { url: string; body: string };

function makeClient(respond: (url: URL) => Record<string, unknown>) {
  const calls: Call[] = [];
  const client = new ShopeeClient({
    credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'r' },
    now: () => TS,
    fetch: (input: unknown, init?: RequestInit) => {
      const url = new URL(String(input));
      calls.push({ url: url.href, body: String(init?.body ?? '') });
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(respond(url))),
      } as Response);
    },
  } as never);
  return { client, calls };
}

describe('ShopeeAuth OAuth', () => {
  it('getAuthorizeUrl membentuk URL auth_partner dengan sign public', async () => {
    const { client } = makeClient(() => ({}));
    const auth = createShopeeAuth(client);
    const url = await auth.getAuthorizeUrl('https://cb.test/oauth');
    const u = new URL(url);
    expect(u.pathname).toBe('/api/v2/shop/auth_partner');
    expect(u.searchParams.get('partner_id')).toBe(PARTNER_ID);
    expect(u.searchParams.get('redirect')).toBe('https://cb.test/oauth');
    expect(u.searchParams.get('timestamp')).toBe(String(TS));
    expect(u.searchParams.get('sign')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('exchangeCode memetakan access/refresh token dari respons', async () => {
    const { client, calls } = makeClient(() => ({
      access_token: 'at-1',
      refresh_token: 'rt-1',
      expires_in: 7200,
      shop_id: 744,
    }));
    const auth = createShopeeAuth(client);
    const result = await auth.exchangeCode('code123', '744');
    const call = calls[0];
    const u = new URL(call.url);
    expect(u.pathname).toBe('/api/v2/auth/token/get');
    expect(JSON.parse(call.body)).toMatchObject({ code: 'code123', shop_id: 744, partner_id: Number(PARTNER_ID) });
    expect(result.accessToken).toBe('at-1');
    expect(result.refreshToken).toBe('rt-1');
    expect(result.shopId).toBe('744');
  });

  it('refreshToken memanggil /auth/access_token/get', async () => {
    const { client, calls } = makeClient(() => ({
      access_token: 'at-2',
      refresh_token: 'rt-2',
      expires_in: 7200,
    }));
    const auth = createShopeeAuth(client);
    const result = await auth.refreshToken('rt-old', '744');
    const call = calls[0];
    const u = new URL(call.url);
    expect(u.pathname).toBe('/api/v2/auth/access_token/get');
    expect(JSON.parse(call.body)).toMatchObject({ refresh_token: 'rt-old' });
    expect(result.accessToken).toBe('at-2');
    expect(result.refreshToken).toBe('rt-2');
  });
});
