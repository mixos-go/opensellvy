import { describe, it, expect } from 'vitest';
import { createAuthApp } from '../src/index';
import type { MemoryMailer, Mailer } from '../src/index';

function post(sso: ReturnType<typeof createAuthApp>, path: string, body: unknown, headersInit?: Record<string, string>) {
  return sso.app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(headersInit ?? {}) },
    body: JSON.stringify(body),
  });
}

describe('apps/auth — SSO (memory mode)', () => {
  it('login → verify access token → refresh → logout', async () => {
    const sso = createAuthApp({ jwtSecret: 'test-secret' });

    const loginRes = await post(sso, '/auth/login', { email: 'dev@opensellvy.test', password: 'admin123' });
    expect(loginRes.status).toBe(200);
    const login = (await loginRes.json()) as { accessToken: string; refreshToken: string; user: { id: string; email: string } };
    expect(login.user.email).toBe('dev@opensellvy.test');

    const meRes = (await sso.app.request('/auth/me', { headers: { authorization: `Bearer ${login.accessToken}` } })) as Response;
    expect(meRes.status).toBe(200);
    const me = (await meRes.json()) as { user: { id: string; role: string } };
    expect(me.user.id).toBe(login.user.id);
    expect(me.user.role).toBe('owner');

    const refreshRes = await post(sso, '/auth/refresh', { refreshToken: login.refreshToken });
    expect(refreshRes.status).toBe(200);

    const logoutRes = await post(sso, '/auth/logout', { refreshToken: login.refreshToken });
    expect(logoutRes.status).toBe(204);
  });

  it('login salah password → 401', async () => {
    const sso = createAuthApp({ jwtSecret: 'test-secret' });
    const res = await post(sso, '/auth/login', { email: 'dev@opensellvy.test', password: 'salah' });
    expect(res.status).toBe(401);
  });

  it('OTP request utk ini rahasia dipakai di blok OTP', async () => {
    // dev user punya password → OTP login harus ditolak
    const sso = createAuthApp({ jwtSecret: 'test-secret' });
    const res = await post(sso, '/auth/otp/request', { email: 'dev@opensellvy.test', purpose: 'login' });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('OTP_NOT_ALLOWED');
  });
});

function googleApp(mailer: MemoryMailer, fakeFetch = googleStubFetch()) {
  return createAuthApp({
    jwtSecret: 'test-secret',
    mailer: mailer as Mailer,
    google: { clientId: 'google-client', clientSecret: 's', redirectUri: 'http://localhost:4200/auth/google/callback', fetch: fakeFetch },
  });
}

function googleStubFetch() {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const u = String(url);
    if (u.startsWith('https://oauth2.googleapis.com/tokeninfo')) {
      return new Response(
        JSON.stringify({ aud: 'google-client', sub: 'google-user-1', email: 'budi@gmail.com', email_verified: 'true', name: 'Budi G' }),
        { status: 200 },
      );
    }
    if (u.startsWith('https://oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ id_token: 'fake-id-token' }), { status: 200 });
    }
    return new Response('nf', { status: 404 });
  };
}

async function googleLogin(sso: ReturnType<typeof createAuthApp>) {
  const authRes = (await sso.app.request('/auth/google/authorize')) as Response;
  expect(authRes.status).toBe(200);
  const { url } = (await authRes.json()) as { url: string };
  const params = new URL(url).searchParams;
  const cb = (await sso.app.request(`/auth/google/callback?code=abc&state=${encodeURIComponent(params.get('state')!)}`)) as Response;
  expect(cb.status).toBe(200);
  return (await cb.json()) as { accessToken: string; user: { id: string; email: string } };
}

describe('apps/auth — OTP login (passwordless, akun via Google)', () => {
  it('request kode → mailer dapat email → verify → token', async () => {
    const mailer = createMemoryMailer();
    const sso = googleApp(mailer);
    const created = await googleLogin(sso);
    expect(created.user.email).toBe('budi@gmail.com');

    const req = await post(sso, '/auth/otp/request', { email: 'budi@gmail.com', purpose: 'login' });
    expect(req.status).toBe(200);

    const mail = mailer.messages.find((m) => m.to === 'budi@gmail.com' && m.subject.includes('Kode masuk'));
    expect(mail).toBeTruthy();
    const code = /(\d{6})/.exec(mail!.text)![1];

    const verify = await post(sso, '/auth/otp/verify', { email: 'budi@gmail.com', purpose: 'login', code });
    expect(verify.status).toBe(200);
    const login = (await verify.json()) as { accessToken: string; user: { email: string } };
    expect(login.accessToken).toBeTruthy();
    expect(login.user.email).toBe('budi@gmail.com');
  });

  it('kode salah → 400 OTP_INVALID', async () => {
    const mailer = createMemoryMailer();
    const sso = googleApp(mailer);
    await googleLogin(sso);
    await post(sso, '/auth/otp/request', { email: 'budi@gmail.com', purpose: 'login' });
    const verify = await post(sso, '/auth/otp/verify', { email: 'budi@gmail.com', purpose: 'login', code: '000000' });
    expect(verify.status).toBe(400);
    expect(((await verify.json()) as { error: { code: string } }).error.code).toBe('OTP_INVALID');
  });
});

describe('apps/auth — Google login (OIDC + PKCE)', () => {
  it('authorize → URL berisi code_challenge; callback → login; auto-link utk email sama', async () => {
    const sso = googleApp(createMemoryMailer());

    const authRes = (await sso.app.request('/auth/google/authorize')) as Response;
    expect(authRes.status).toBe(200);
    const { url } = (await authRes.json()) as { url: string };
    expect(url).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('code_challenge_method=S256');
    expect(url).toMatch(/code_challenge=[A-Za-z0-9_-]+/);

    const first = await googleLogin(sso);
    expect(first.user.email).toBe('budi@gmail.com');

    // login ulang → user yang sama (tanpa duplikat)
    const again = await googleLogin(sso);
    expect(again.user.id).toBe(first.user.id);
  });

  it('callback tanpa code/state → 400', async () => {
    const sso = createAuthApp({
      jwtSecret: 'test-secret',
      google: { clientId: 'g', clientSecret: 's', redirectUri: 'http://x/cb' },
    });
    const res = (await sso.app.request('/auth/google/callback')) as Response;
    expect(res.status).toBe(400);
  });

  it('token exchange gagal → 403 PROVIDER_NOT_CONFIGURED', async () => {
    const badFetch = (async (): Promise<Response> => new Response('bad', { status: 400 })) as typeof fetch;
    const sso = googleApp(createMemoryMailer(), badFetch);
    const authRes = (await sso.app.request('/auth/google/authorize')) as Response;
    const { url } = (await authRes.json()) as { url: string };
    const params = new URL(url).searchParams;
    const cb = (await sso.app.request(`/auth/google/callback?code=abc&state=${encodeURIComponent(params.get('state')!)}`)) as Response;
    expect(cb.status).toBe(403);
    expect(((await cb.json()) as { error: { code: string } }).error.code).toBe('PROVIDER_NOT_CONFIGURED');
  });
});

describe('apps/auth — 2FA', () => {
  it('enable 2FA → login kembalikan challenge → kode 2FA via mailer → verify → token', async () => {
    const mailer = createMemoryMailer();
    const sso = createAuthApp({ jwtSecret: 'test-secret', mailer: mailer as Mailer });

    const login1 = await post(sso, '/auth/login', { email: 'dev@opensellvy.test', password: 'admin123' });
    const tokens = (await login1.json()) as { accessToken: string };

    const enRes = await post(sso, '/auth/two-factor/enable', {}, { authorization: `Bearer ${tokens.accessToken}` });
    expect(enRes.status).toBe(200);

    const loginRes = await post(sso, '/auth/login', { email: 'dev@opensellvy.test', password: 'admin123' });
    expect(loginRes.status).toBe(200);
    const challenge = (await loginRes.json()) as { requiresOtp: true; challengeToken: string; userId: string };
    expect(challenge.requiresOtp).toBe(true);
    expect(challenge.challengeToken).toBeTruthy();

    const reqRes = await post(sso, '/auth/otp/request', { email: 'dev@opensellvy.test', purpose: '2fa' });
    expect(reqRes.status).toBe(200);
    const mail = mailer.messages.find((m) => m.to === 'dev@opensellvy.test' && m.subject.includes('dua langkah'));
    expect(mail).toBeTruthy();
    const code = /(\d{6})/.exec(mail!.text)![1];

    const verifyRes = await post(sso, '/auth/otp/verify', {
      purpose: '2fa', email: 'dev@opensellvy.test', code, challengeToken: challenge.challengeToken,
    });
    expect(verifyRes.status).toBe(200);
    const done = (await verifyRes.json()) as { accessToken: string; user: { id: string } };
    expect(done.accessToken).toBeTruthy();

    // disable 2FA (akses token baru)
    const meRes = (await sso.app.request('/auth/me', { headers: { authorization: `Bearer ${done.accessToken}` } })) as Response;
    const me = (await meRes.json()) as { user: { id: string } };
    const disRes = await post(sso, '/auth/two-factor/disable', {}, { authorization: `Bearer ${done.accessToken}` });
    expect(disRes.status).toBe(200);
    expect(me.user.id).toBeTruthy();
  });
});

function createMemoryMailer(): MemoryMailer {
  const messages: { to: string; subject: string; text: string; html?: string }[] = [];
  return {
    messages,
    async send(message) {
      messages.push(message);
    },
    reset() {
      messages.length = 0;
    },
  };
}