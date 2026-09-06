import { describe, expect, it } from 'vitest';
import { assertNoStubMethods } from '@opensellvy/connector';
import { createShopeePlugin } from '../src/shopee.connector';

const PARTNER_ID = '2001887';
const PARTNER_KEY = 'k';
const ACCESS = 'at-1';
const SHOP = '14701711';

function stubFetch(_input: unknown, _init?: RequestInit) {
  return Promise.resolve({
    status: 200,
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    text: () => Promise.resolve(JSON.stringify({ error: '', message: '', request_id: '', response: {} })),
  } as Response);
}

function makeContext() {
  return {
    storeId: 's-1',
    platformAccountId: 's-1:shopee',
    credentials: { appId: PARTNER_ID, secret: PARTNER_KEY, redirectUri: 'r', shopId: SHOP },
    token: { accessToken: ACCESS },
  };
}

describe('Shopee plugin conformance (no NotImplementedError stubs)', () => {
  it('assertNoStubMethods returns empty — all gateway methods are real', async () => {
    const plugin = createShopeePlugin({ fetch: stubFetch });
    const stubs = await assertNoStubMethods(plugin, makeContext);
    expect(stubs).toEqual([]);
  });
});
