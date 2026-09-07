import { describe, it, expect } from 'vitest';
import { createAuthApp } from '../src/index';

describe('apps/auth — SSO (memory mode)', () => {
  it('login → verify access token → refresh → logout', async () => {
    const sso = createAuthApp({ jwtSecret: 'test-secret' });

    const loginRes = (await sso.app.request('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'dev@opensellvy.test', password: 'admin123' }),
    })) as Response;

    expect(loginRes.status).toBe(200);
    const login = (await loginRes.json()) as { accessToken: string; refreshToken: string; user: { id: string; email: string } };
    expect(login.user.email).toBe('dev@opensellvy.test');

    const meRes = (await sso.app.request('/auth/me', {
      headers: { authorization: `Bearer ${login.accessToken}` },
    })) as Response;
    expect(meRes.status).toBe(200);
    const me = (await meRes.json()) as { user: { id: string; role: string } };
    expect(me.user.id).toBe(login.user.id);
    expect(me.user.role).toBe('owner');

    const refreshRes = (await sso.app.request('/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: login.refreshToken }),
    })) as Response;
    expect(refreshRes.status).toBe(200);

    const logoutRes = (await sso.app.request('/auth/logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken: login.refreshToken }),
    })) as Response;
    expect(logoutRes.status).toBe(204);
  });

  it('login salah password → 401', async () => {
    const sso = createAuthApp({ jwtSecret: 'test-secret' });
    const res = (await sso.app.request('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'dev@opensellvy.test', password: 'salah' }),
    })) as Response;
    expect(res.status).toBe(401);
  });
});
