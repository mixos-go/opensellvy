import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { buildAuthUrl, exchangeAuthCode, refreshAccessToken } from '../src/tts.auth';
import { sign } from '../src/tts.client';

const APP_KEY = 'tt-app';
const APP_SECRET = 'tt-secret';

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

describe('tts.auth — TikTok Shop OAuth (flow current, verified live)', () => {
  it('buildAuthUrl membentuk entry services.tiktokshop.com/open/authorize tanpa sign', () => {
    const url = buildAuthUrl({ app_key: APP_KEY, app_secret: APP_SECRET }, 'https://cb.test/oauth', {
      state: 'st-1',
    });
    const u = new URL(url);
    expect(u.host).toBe('services.tiktokshop.com');
    expect(u.pathname).toBe('/open/authorize');
    expect(u.searchParams.get('app_key')).toBe(APP_KEY);
    expect(u.searchParams.get('path')).toBe('https://cb.test/oauth');
    expect(u.searchParams.get('state')).toBe('st-1');
    expect(u.searchParams.get('sign')).toBeNull();
    expect(u.searchParams.get('timestamp')).toBeNull();
    expect(u.searchParams.get('shop_type')).toBeNull();
  });

  it('buildAuthUrl mengecualikan state kosong', () => {
    const url = buildAuthUrl({ app_key: APP_KEY, app_secret: APP_SECRET }, 'https://cb.test/oauth');
    const u = new URL(url);
    expect(u.searchParams.get('state')).toBeNull();
  });

  it('exchangeAuthCode memanggil auth.tiktok-shops.com/api/v2/token/get via GET dan memetakan data token', async () => {
    let calledUrl: URL | null = null;
    let method = '';
    const res = await exchangeAuthCode(
      { app_key: APP_KEY, app_secret: APP_SECRET },
      'code-1',
      {
        fetch: route((url, init) => {
          calledUrl = url;
          method = init?.method ?? 'GET';
          return {
            code: 0,
            message: 'success',
            request_id: 'req-1',
            data: {
              access_token: 'at-1',
              refresh_token: 'rt-1',
              access_token_expire_in: 604800,
              shop_cipher: 'CIPHER_X',
            },
          };
        }),
      },
    );
    expect(calledUrl?.host).toBe('auth.tiktok-shops.com');
    expect(calledUrl?.pathname).toBe('/api/v2/token/get');
    expect(method).toBe('GET');
    expect(calledUrl?.searchParams.get('app_key')).toBe(APP_KEY);
    expect(calledUrl?.searchParams.get('app_secret')).toBe(APP_SECRET);
    expect(calledUrl?.searchParams.get('auth_code')).toBe('code-1');
    expect(calledUrl?.searchParams.get('grant_type')).toBe('authorized_code');
    expect(res.data?.access_token).toBe('at-1');
    expect(res.data?.refresh_token).toBe('rt-1');
    expect(res.data?.shop_cipher).toBe('CIPHER_X');
  });

  it('refreshAccessToken memanggil auth.tiktok-shops.com/api/v2/token/refresh dengan grant_type=refresh_token', async () => {
    let calledUrl: URL | null = null;
    const res = await refreshAccessToken(
      { app_key: APP_KEY, app_secret: APP_SECRET },
      'rt-old',
      {
        fetch: route((url) => {
          calledUrl = url;
          return { code: 0, data: { access_token: 'at-2', refresh_token: 'rt-2' } };
        }),
      },
    );
    expect(calledUrl?.host).toBe('auth.tiktok-shops.com');
    expect(calledUrl?.pathname).toBe('/api/v2/token/refresh');
    expect(calledUrl?.searchParams.get('refresh_token')).toBe('rt-old');
    expect(calledUrl?.searchParams.get('grant_type')).toBe('refresh_token');
    expect(res.data?.access_token).toBe('at-2');
  });

  it('exchangeAuthCode dan refreshAccessToken tidak menyertakan sign', async () => {
    let sawSign = false;
    const fetchSpy = route((url) => {
      if (url.searchParams.get('sign')) sawSign = true;
      return { code: 0, data: { access_token: 'at' } };
    });
    await exchangeAuthCode({ app_key: APP_KEY, app_secret: APP_SECRET }, 'code-9', { fetch: fetchSpy });
    await refreshAccessToken({ app_key: APP_KEY, app_secret: APP_SECRET }, 'rt', { fetch: fetchSpy });
    expect(sawSign).toBe(false);
  });

  it('sign() deterministic & hex 64 (reference vektor)', () => {
    const s = sign(APP_SECRET, '/product/202309/products/1/inventory/update', {
      app_key: APP_KEY,
      timestamp: '1655714431',
    });
    const expected = createHmac('sha256', APP_SECRET)
      .update(`${APP_SECRET}/product/202309/products/1/inventory/updateapp_key${APP_KEY}timestamp1655714431${APP_SECRET}`)
      .digest('hex');
    expect(s).toBe(expected);
    expect(s).toMatch(/^[0-9a-f]{64}$/);
  });
});