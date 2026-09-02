import { describe, expect, it } from 'vitest';
import { createOAuthClient } from '../src/oauth/oauth.service';
import { createMemoryTokenStore } from '../src/oauth/token-store';
import type { OAuthConfiguration, OAuthToken } from '../src/connector.types';

const FIXTURE: Record<string, OAuthConfiguration> = {
  demo: {
    authorizeUrl: 'https://auth.demo.test/oauth/authorize',
    tokenUrl: 'https://auth.demo.test/oauth/token',
    scopes: ['products.read', 'orders.read'],
  },
};

function fakeFetch(responses: Array<{ status: number; body: unknown }>): typeof fetch {
  const queue = [...responses];
  return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const next = queue.shift() ?? { status: 500, body: {} };
    return new Response(next.status >= 200 ? JSON.stringify(next.body) : next.body, {
      status: next.status,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
}

describe('createOAuthClient (RFC6749)', () => {
  it('getAuthorizeUrl melampirkan client_id, redirect_uri, response_type, scopes', async () => {
    const oauth = createOAuthClient({ providers: FIXTURE });
    const url = await oauth.getAuthorizeUrl('demo', { appId: 'app-1', redirectUri: 'https://cb.test' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('client_id')).toBe('app-1');
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://cb.test');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toBe('products.read orders.read');
  });

  it('exchangeCode memetakan access_token/expires_in/scope → OAuthToken', async () => {
    const oauth = createOAuthClient({
      providers: FIXTURE,
      fetch: fakeFetch([
        { status: 200, body: { access_token: 'at-123', refresh_token: 'rt-456', expires_in: 3600, scope: 'orders.read' } },
      ]),
    });
    const token = await oauth.exchangeCode('demo', { appId: 'a', secret: 's', redirectUri: 'https://cb' }, 'code-1');
    expect(token.accessToken).toBe('at-123');
    expect(token.refreshToken).toBe('rt-456');
    expect(token.scope).toEqual(['orders.read']);
    expect(token.expiresAt!).toBeGreaterThan(Date.now());
  });

  it('refreshToken menggunakan grant_type=refresh_token', async () => {
    let sentBody = '';
    let sentType = '';
    const oauth = createOAuthClient({
      providers: FIXTURE,
      fetch: (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        sentBody = String(init?.body ?? '');
        sentType = String(init?.headers && 'content-type' in init.headers ? (init.headers as Record<string, string>)['content-type'] : '');
        return new Response(JSON.stringify({ access_token: 'at-new', refresh_token: 'rt-new' }), { status: 200 });
      }) as unknown as typeof fetch,
    });
    const token = await oauth.refreshToken('demo', { appId: 'a', secret: 's', redirectUri: 'https://cb' }, 'rt-old');
    expect(token.accessToken).toBe('at-new');
    expect(token.refreshToken).toBe('rt-new');
    expect(sentBody).toContain('grant_type=refresh_token');
    expect(sentBody).toContain('refresh_token=rt-old');
    expect(sentType).toBe('application/x-www-form-urlencoded');
  });

  it('provider tak terdaftar → menolak dengan pesan jelas', async () => {
    const oauth = createOAuthClient({ providers: {} });
    await expect(oauth.getAuthorizeUrl('unknown', { appId: 'a', redirectUri: 'r' })).rejects.toThrow('OAuth configuration');
  });
});

describe('createMemoryTokenStore', () => {
  it('save → get → delete roundtrip', async () => {
    const store = createMemoryTokenStore();
    const token: OAuthToken = { accessToken: 'at', refreshToken: 'rt', expiresAt: 123 };
    await store.save('s1', 'demo', token);
    await expect(store.get('s1', 'demo')).resolves.toEqual(token);
    await expect(store.get('s1', 'lain')).resolves.toBeUndefined();
    await store.delete('s1', 'demo');
    await expect(store.get('s1', 'demo')).resolves.toBeUndefined();
  });
});