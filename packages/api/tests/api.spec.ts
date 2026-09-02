import { describe, expect, it, beforeAll } from 'vitest';
import type { PlatformPlugin, TokenStore } from '@opensellvy/connector';
import { connectors, registerPlatform } from '@opensellvy/connector';
import { createServices } from '@opensellvy/module';
import type { Services } from '@opensellvy/module';
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
});