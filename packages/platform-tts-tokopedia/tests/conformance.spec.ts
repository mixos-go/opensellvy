import { describe, expect, it } from 'vitest';
import { assertNoStubMethods } from '@opensellvy/connector';
import { createTtsPlugin } from '../src/tts.connector';

const APP_KEY = 'tt-app';
const APP_SECRET = 'tt-secret';
const ACCESS = 'tt-at-1';
const SHOP_CIPHER = 'SHOP_CIPHER_1';

function stubFetch(_input: unknown, _init?: RequestInit) {
  return Promise.resolve({
    status: 200,
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: () => Promise.resolve(JSON.stringify({ code: 0, message: '', request_id: '', data: {} })),
  } as Response);
}

function makeContext() {
  return {
    storeId: 's-1',
    platformAccountId: 's-1:tts',
    credentials: { appId: APP_KEY, secret: APP_SECRET, redirectUri: 'r', shopId: SHOP_CIPHER },
    token: { accessToken: ACCESS },
  };
}

describe('TikTok Shop plugin conformance (no NotImplementedError stubs)', () => {
  it('assertNoStubMethods returns empty — all gateway methods are real', async () => {
    const plugin = createTtsPlugin({ fetch: stubFetch });
    const stubs = await assertNoStubMethods(plugin, makeContext);
    expect(stubs).toEqual([]);
  });
});