import { describe, expect, it, beforeAll } from 'vitest';
import type { PlatformPlugin, TokenStore } from '@opensellvy/connector';
import { connectors, registerPlatform } from '@opensellvy/connector';
import { createServices } from '@opensellvy/module';
import type { Services } from '@opensellvy/module';
import { createAuthService, hashPassword } from '@opensellvy/core';
import type { AuthService, RefreshSession, RefreshSessionStore } from '@opensellvy/core';
import { createServer, buildApp, signApiToken } from '../src';
import type { ApiContext } from '../src';

function memoryTokenStore(): TokenStore {
  const map = new Map<string, unknown>();
  return {
    save: (storeId, platform, token) => Promise.resolve(void map.set(`${storeId}:${platform}`, token)),
    get: (storeId, platform) => Promise.resolve(map.get(`${storeId}:${platform}`) as never),
    delete: (storeId, platform) => Promise.resolve(void map.delete(`${storeId}:${platform}`)),
  };
}

function memorySessionStore(): RefreshSessionStore {
  const byHash = new Map<string, RefreshSession>();
  const byUser = new Map<string, RefreshSession[]>();
  return {
    save: async (s) => {
      byHash.set(s.tokenHash, s);
      byUser.set(s.userId, [...(byUser.get(s.userId) ?? []), s]);
    },
    findByTokenHash: async (tokenHash) => byHash.get(tokenHash),
    deleteById: async (id) => {
      const found = [...byHash.values()].find((s) => s.id === id);
      if (found) {
        byHash.delete(found.tokenHash);
        byUser.set(found.userId, (byUser.get(found.userId) ?? []).filter((s) => s.id !== id));
      }
    },
    revokeAllForUser: async (userId) => {
      for (const s of byUser.get(userId) ?? []) byHash.delete(s.tokenHash);
      byUser.delete(userId);
    },
  };
}

const JWT = 'test-secret';

function authHeaders(): Record<string, string> {
  return { authorization: `Bearer ${signApiToken(JWT, 'user-1')}` };
}

const dummy: PlatformPlugin = {
  platform: 'local',
  name: 'Local',
  baseUrl: 'memory://local',
  capabilities: ['order.pull', 'order.push', 'product.pull', 'product.push', 'inventory.sync', 'webhook.receive'],
  auth: {
    getAuthorizeUrl: () => Promise.resolve('memory://local/authorize'),
    exchangeCode: () => Promise.resolve({ accessToken: 't', refreshToken: 'r', expiresAt: Date.now() + 60_000 }),
    refreshToken: () => Promise.resolve({ accessToken: 't2', refreshToken: 'r2', expiresAt: Date.now() + 60_000 }),
  },
  gateway: {
    getShop: () => Promise.resolve({ platformShopId: 'shop-1', shopName: 'Local Shop', marketplace: 'local' }),
    pullOrders: () => Promise.resolve([]),
    getOrder: () => Promise.reject(new Error('not implemented')),
    pushOrder: () => Promise.resolve(),
    updateOrder: () => Promise.resolve(),
    pullProducts: () => Promise.resolve([]),
    pushProduct: () => Promise.resolve(),
    pushProducts: () => Promise.resolve(),
    syncInventory: () => Promise.resolve(),
    manageReturn: () => Promise.resolve(),
  },
  webhook: {
    verify: (payload, sig) => Promise.resolve(sig === 'valid-sig'),
    map: (event, data) => Promise.resolve({ type: event, data }),
  },
};

describe('@opensellvy/api — Hono REST server', () => {
  let services: Services;

  beforeAll(async () => {
    registerPlatform(dummy, { replace: true });
    services = createServices({
      deps: {
        registry: connectors,
        tokens: memoryTokenStore(),
        credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }),
      },
    });
  });

  function app(extra?: Partial<ApiContext>): ReturnType<typeof buildApp> {
    return buildApp({
      services,
      registry: connectors,
      tokens: memoryTokenStore(),
      secrets: { jwtSecret: JWT },
      ...extra,
    });
  }

  it('health endpoint returns ok', async () => {
    const server = createServer({}, { services, registry: connectors });
    const res = await server.app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('auth fail-closed: tanpa jwtSecret semua /api → 401', async () => {
    const open = buildApp({ services, registry: connectors, tokens: memoryTokenStore() });
    const res = await open.request('/api/stores');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('AUTH_NOT_CONFIGURED');
  });

  it('authMode open = mode dev tanpa token', async () => {
    const open = buildApp({ services, registry: connectors, tokens: memoryTokenStore(), authMode: 'open' });
    const res = await open.request('/api/stores');
    expect(res.status).toBe(200);
  });

  it('store CRUD via REST (POST then GET)', async () => {
    const createRes = await app().request('/api/stores', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name: 'Toko REST', slug: 'toko-rest' }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.item.slug).toBe('toko-rest');

    const getRes = await app().request(`/api/stores/${created.item.id}`, { headers: authHeaders() });
    expect(getRes.status).toBe(200);
    const got = await getRes.json();
    expect(got.item.name).toBe('Toko REST');
  });

  it('webhook receiver verifies signature then dispatches via onWebhook', async () => {
    const dispatched: string[] = [];
    const apiApp = app({ onWebhook: (input) => void dispatched.push(input.type) });
    const ok = await apiApp.request('/webhooks/local', {
      method: 'POST',
      headers: { 'x-signature': 'valid-sig', 'x-hook-event': 'order.created' },
      body: '{"id":1}',
    });
    expect(ok.status).toBe(200);
    const okBody = await ok.json();
    expect(okBody.type).toBe('order.created');
    expect(dispatched).toEqual(['order.created']);

    const bad = await apiApp.request('/webhooks/local', {
      method: 'POST',
      headers: { 'x-signature': 'wrong', 'x-hook-event': 'order.created' },
      body: '{"id":1}',
    });
    expect(bad.status).toBe(401);
    expect(dispatched).toEqual(['order.created']);
  });

  it('unknown platform webhook → 404', async () => {
    const res = await app().request('/webhooks/nonexistent', { method: 'POST', body: '{}' });
    expect(res.status).toBe(404);
  });

  it('products: create + list per store', async () => {
    const storeRes = await app().request('/api/stores', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name: 'Toko Produk', slug: 'toko-produk' }),
    });
    const { item: store } = await storeRes.json();

    const productBody = {
      name: 'Tumbler',
      description: 'botol',
      variants: [{ id: 'v1', sku: 'SKU-P1', options: {}, price: { amount: 85_000, currency: 'IDR' }, stock: 1 }],
      images: [],
      categoryIds: [],
      attributes: {},
      status: 'active',
    };
    const createRes = await app().request(`/api/stores/${store.id}/products`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify(productBody),
    });
    expect(createRes.status).toBe(201);
    const product = await createRes.json();
    expect(product.sku ?? product.variants[0].sku).toBe('SKU-P1');

    const listRes = await app().request(`/api/stores/${store.id}/products`, { headers: authHeaders() });
    expect(listRes.status).toBe(200);
    const li = await listRes.json();
    expect(li.items.length).toBe(1);
  });

  it('channels: authorize URL + oauth callback connect', async () => {
    const storeRes = await app().request('/api/stores', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name: 'Toko OAuth', slug: 'toko-oauth' }),
    });
    const { item: store } = await storeRes.json();

    const authz = await app().request(`/api/stores/${store.id}/oauth/local/authorize`, { headers: authHeaders() });
    expect(authz.status).toBe(200);
    expect((await authz.json()).authorizeUrl).toContain('memory://');

    const cb = await app().request('/api/oauth/local/callback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ storeId: store.id, code: 'auth-code' }),
    });
    expect(cb.status).toBe(201);
    const connection = await cb.json();
    expect(connection.platform).toBe('local');
    expect(connection.auth.state).toBe('connected');

    const listRes = await app().request(`/api/stores/${store.id}/channels`, { headers: authHeaders() });
    expect((await listRes.json()).items.length).toBe(1);
  });

  it('oauth callback tanpa code → 400', async () => {
    const res = await app().request('/api/oauth/local/callback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ storeId: 'x', code: undefined }),
    });
    expect(res.status).toBe(400);
  });

  it('auth JWT via core/auth: login → bearer verify → refresh rotation → logout revoke', async () => {
    let auth: AuthService | undefined;
    const apiAuth = async (): Promise<AuthService> => {
      if (auth) return auth;
      const passwordHash = await hashPassword('rahasia-api');
      auth = createAuthService({
        jwtSecret: JWT,
        issuer: 'opensellvy',
        audience: 'panel',
        findUserByEmail: async (email) =>
          email === 'seller@api.id'
            ? { id: 'api-user-1', email, name: 'Seller', passwordHash, status: 'active' }
            : undefined,
        getMemberRole: async (storeId, userId) => (storeId === 'api-store-1' && userId === 'api-user-1' ? 'manager' : undefined),
        sessions: memorySessionStore(),
      });
      return auth;
    };
    const apiAuthCtx = async (): Promise<Partial<ApiContext>> => ({ authService: await apiAuth() });

    // login → 200 + token
    const login = await app(await apiAuthCtx()).request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'seller@api.id', password: 'rahasia-api' }),
    });
    expect(login.status).toBe(200);
    const tokens = await login.json();
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    // access token JWT diverifikasi oleh bearerAuth
    const storesRes = await app(await apiAuthCtx()).request('/api/stores', {
      headers: { authorization: `Bearer ${tokens.accessToken}` },
    });
    expect(storesRes.status).toBe(200);

    // password salah → 401 anti-lockout
    const badLogin = await app(await apiAuthCtx()).request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'seller@api.id', password: 'salah' }),
    });
    expect(badLogin.status).toBe(401);
    expect((await badLogin.json()).error.code).toBe('UNAUTHORIZED');

    // refresh rotation: token baru, refresh lama tak bisa dipakai lagi
    const refreshed = await app(await apiAuthCtx()).request('/api/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    expect(refreshed.status).toBe(200);
    const rotated = await refreshed.json();
    expect(rotated.refreshToken).not.toBe(tokens.refreshToken);
    const reuse = await app(await apiAuthCtx()).request('/api/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    expect(reuse.status).toBe(401);
    expect((await reuse.json()).error.code).toBe('TOKEN_INVALID');

    // logout mencabut session aktif
    const logout = await app(await apiAuthCtx()).request('/api/auth/logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: rotated.refreshToken }),
    });
    expect(logout.status).toBe(204);
    const afterLogout = await app(await apiAuthCtx()).request('/api/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: rotated.refreshToken }),
    });
    expect(afterLogout.status).toBe(401);

    // authService belum diset → AUTH_NOT_CONFIGURED
    const noAuth = await app().request('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.id', password: 'x' }),
    });
    expect(noAuth.status).toBe(401);
    expect((await noAuth.json()).error.code).toBe('AUTH_NOT_CONFIGURED');
  });
});