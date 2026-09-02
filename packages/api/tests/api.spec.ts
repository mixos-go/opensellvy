import { describe, expect, it, beforeAll } from 'vitest';
import type { PlatformPlugin, TokenStore } from '@opensellvy/connector';
import { connectors, registerPlatform } from '@opensellvy/connector';
import { createServices } from '@opensellvy/module';
import type { Services } from '@opensellvy/module';
import { createServer, buildApp } from '../src';

function memoryTokenStore(): TokenStore {
  const map = new Map<string, unknown>();
  return {
    save: (storeId, platform, token) => Promise.resolve(void map.set(`${storeId}:${platform}`, token)),
    get: (storeId, platform) => Promise.resolve(map.get(`${storeId}:${platform}`) as never),
    delete: (storeId, platform) => Promise.resolve(void map.delete(`${storeId}:${platform}`)),
  };
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

  it('health endpoint returns ok', async () => {
    const server = createServer({}, { services, registry: connectors });
    const res = await server.app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('store CRUD via REST (POST then GET)', async () => {
    const app = buildApp({ services, registry: connectors, tokens: memoryTokenStore() });
    const createRes = await app.request('/api/stores', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Toko REST', slug: 'toko-rest' }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.item.slug).toBe('toko-rest');

    const getRes = await app.request(`/api/stores/${created.item.id}`);
    expect(getRes.status).toBe(200);
    const got = await getRes.json();
    expect(got.item.name).toBe('Toko REST');
  });

  it('list orders requires storeId', async () => {
    const app = buildApp({ services, registry: connectors, tokens: memoryTokenStore() });
    const res = await app.request('/api/orders');
    expect(res.status).toBe(400);
  });

  it('webhook receiver verifies signature then maps', async () => {
    const app = buildApp({ services, registry: connectors, tokens: memoryTokenStore() });
    const ok = await app.request('/webhooks/local', {
      method: 'POST',
      headers: { 'x-signature': 'valid-sig', 'x-hook-event': 'order.created' },
      body: '{"id":1}',
    });
    expect(ok.status).toBe(200);
    const okBody = await ok.json();
    expect(okBody.type).toBe('order.created');

    const bad = await app.request('/webhooks/local', {
      method: 'POST',
      headers: { 'x-signature': 'wrong', 'x-hook-event': 'order.created' },
      body: '{"id":1}',
    });
    expect(bad.status).toBe(401);
  });

  it('unknown platform webhook → 404', async () => {
    const app = buildApp({ services, registry: connectors, tokens: memoryTokenStore() });
    const res = await app.request('/webhooks/nonexistent', { method: 'POST', body: '{}' });
    expect(res.status).toBe(404);
  });

  it('auth: dengan jwtSecret, token invalid → 401, token sah → 200', async () => {
    const { signApiToken } = await import('../src/middleware/auth.middleware');
    const jwtSecret = 'test-secret';
    const app = buildApp({ services, registry: connectors, tokens: memoryTokenStore(), secrets: { jwtSecret } });

    const noAuth = await app.request('/api/stores');
    expect(noAuth.status).toBe(401);

    const token = signApiToken(jwtSecret, 'user-1');
    const good = await app.request('/api/stores', { headers: { authorization: `Bearer ${token}` } });
    expect(good.status).toBe(200);
  });
});
