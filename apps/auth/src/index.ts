import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { AuthError, createAuthService, hashPassword, memoryMailer } from '@opensellvy/core';
import type { AuthDeps, AuthService, AuthUserRecord, Mailer, OtpCode, OtpStore, IdentityStore, RefreshSession, RefreshSessionStore, RoleCode } from '@opensellvy/core';
import { createPgAuthDeps } from '@opensellvy/db-pg';
import type { Db } from './db';
import { buildGoogleAuthorizeUrl, resolveGoogleVerifier, exchangeGoogleCode } from './google';
import type { GoogleConfig } from './google';
import { renderOtpEmail } from './email';

export interface AuthAppConfig {
  port?: number;
  /** DATABASE_URL Postgres. Bila tidak → mode dev memory (tanpa persist). */
  databaseUrl?: string;
  jwtSecret: string;
  issuer?: string;
  audience?: string;
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
  /** wajibkan email verified sebelum login (default false) */
  requireEmailVerification?: boolean;
  /** pengirim email OTP. Default memoryMailer (dev, tidak kirim sungguhan). */
  mailer?: Mailer;
  /** login Google (OIDC + PKCE). Bila ada → aktifkan route /auth/google. */
  google?: GoogleConfig;
}

export interface AuthApp {
  app: Hono;
  authService: AuthService;
  useDb(db: Db): AuthApp;
  start(): Promise<{ port: number }>;
  stop(): Promise<void>;
}

/** Session store in-memory (implementasi penuh RefreshSessionStore). */
export function memoryRefreshSessionStore(): RefreshSessionStore {
  const byHash = new Map<string, RefreshSession>();
  const byUser = new Map<string, RefreshSession[]>();
  return {
    async save(session) {
      byHash.set(session.tokenHash, session);
      byUser.set(session.userId, [...(byUser.get(session.userId) ?? []), session]);
    },
    async findByTokenHash(tokenHash) {
      return byHash.get(tokenHash);
    },
    async deleteById(sessionId) {
      const found = [...byHash.values()].find((s) => s.id === sessionId);
      if (found) {
        byHash.delete(found.tokenHash);
        byUser.set(found.userId, (byUser.get(found.userId) ?? []).filter((s) => s.id !== sessionId));
      }
    },
    async revokeAllForUser(userId) {
      for (const s of byUser.get(userId) ?? []) byHash.delete(s.tokenHash);
      byUser.delete(userId);
    },
  };
}

/** OTP store in-memory (mode dev). */
export function memoryOtpStore(): OtpStore {
  const codes = new Map<string, OtpCode>();
  const key = (email: string, purpose: string) => `${email.toLowerCase()}|${purpose}`;
  return {
    async save(code) {
      codes.set(key(code.email, code.purpose), code);
    },
    async findByKey(email, purpose) {
      return codes.get(key(email, purpose));
    },
    async incrementAttempts(email, purpose) {
      const code = codes.get(key(email, purpose));
      if (!code) throw new Error('otp tidak ditemukan');
      code.attempts += 1;
      return code.attempts;
    },
    async consume(email, purpose) {
      const code = codes.get(key(email, purpose));
      if (code) code.consumedAt = new Date().toISOString();
    },
  };
}

/** Identity store in-memory (mode dev) — peta provider → user. */
export function memoryIdentityStore(users: Map<string, AuthUserRecord>): IdentityStore {
  const links = new Map<string, string>();
  return {
    async findUserByProvider(provider, providerUserId) {
      const userId = links.get(`${provider}|${providerUserId}`);
      if (!userId) return undefined;
      for (const u of users.values()) if (u.id === userId) return u;
      return undefined;
    },
    async linkProvider(userId, profile) {
      links.set(`${profile.provider}|${profile.providerUserId}`, userId);
    },
  };
}

export interface MemoryAuthOptions {
  issuer?: string;
  audience?: string;
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
  requireEmailVerification?: boolean;
  /** seed kode OTP deterministik utk dev/test */
  otpCodeGenerator?: () => string;
}

/** AuthDeps memory (mode dev, tanpa Postgres) — user dev + store lengkap. */
export function memoryAuthDeps(secret: string, opts: MemoryAuthOptions = {}): AuthDeps & { sessions: RefreshSessionStore } {
  const users = new Map<string, AuthUserRecord>();
  const sessions = memoryRefreshSessionStore();
  let devReady: Promise<void> | undefined;
  let devHash: string | undefined;

  const doResolve = (email: string) => (email === 'dev@opensellvy.test' ? 'dev@opensellvy.test' : email.toLowerCase());

  function seedDev(): Promise<void> {
    if (!users.has('dev@opensellvy.test')) {
      devReady ??= hashPassword('admin123').then((h) => {
        devHash = h;
        users.set('dev@opensellvy.test', {
          id: 'dev-user-1',
          email: 'dev@opensellvy.test',
          name: 'Dev Admin',
          passwordHash: devHash!,
          status: 'active',
          emailVerifiedAt: new Date().toISOString(),
        });
      });
    }
    return devReady ?? Promise.resolve();
  }

  return {
    jwtSecret: secret,
    ...(opts.issuer !== undefined ? { issuer: opts.issuer } : {}),
    ...(opts.audience !== undefined ? { audience: opts.audience } : {}),
    ...(opts.accessTokenTtlSeconds !== undefined ? { accessTokenTtlSeconds: opts.accessTokenTtlSeconds } : {}),
    ...(opts.refreshTokenTtlSeconds !== undefined ? { refreshTokenTtlSeconds: opts.refreshTokenTtlSeconds } : {}),
    ...(opts.requireEmailVerification !== undefined ? { requireEmailVerification: opts.requireEmailVerification } : {}),
    ...(opts.otpCodeGenerator !== undefined ? { otpCodeGenerator: opts.otpCodeGenerator } : {}),
    findUserByEmail: async (email: string): Promise<AuthUserRecord | undefined> => {
      if (email === 'dev@opensellvy.test') await seedDev();
      return users.get(doResolve(email));
    },
    getMemberRole: async (): Promise<RoleCode | undefined> => 'owner',
    sessions,
    otps: memoryOtpStore(),
    identities: memoryIdentityStore(users),
    createUser: async (input) => {
      const user: AuthUserRecord = {
        id: input.id,
        email: input.email,
        ...(input.name ? { name: input.name } : {}),
        passwordHash: '',
        status: 'active',
        ...(input.emailVerifiedAt !== undefined ? { emailVerifiedAt: input.emailVerifiedAt } : {}),
      };
      users.set(doResolve(input.email), user);
      return user;
    },
    markEmailVerified: async (email) => {
      const user = users.get(doResolve(email));
      if (user) user.emailVerifiedAt = user.emailVerifiedAt ?? new Date().toISOString();
    },
    setTwoFactor: async (userId, enabled) => {
      for (const u of users.values()) if (u.id === userId) u.twoFactorEnabled = enabled;
    },
  };
}

export function createAuthApp(config: AuthAppConfig): AuthApp {
  const state: { db?: Db; authService: AuthService | null } = { authService: null };

  function build(): AuthService {
    if (!state.authService) {
      const deps = state.db
        ? createPgAuthDeps(state.db, config.jwtSecret, {
            ...(config.issuer !== undefined ? { issuer: config.issuer } : {}),
            ...(config.audience !== undefined ? { audience: config.audience } : {}),
            ...(config.accessTokenTtlSeconds !== undefined ? { accessTokenTtlSeconds: config.accessTokenTtlSeconds } : {}),
            ...(config.refreshTokenTtlSeconds !== undefined ? { refreshTokenTtlSeconds: config.refreshTokenTtlSeconds } : {}),
            ...(config.requireEmailVerification !== undefined ? { requireEmailVerification: config.requireEmailVerification } : {}),
          })
        : memoryAuthDeps(config.jwtSecret, {
            ...(config.issuer !== undefined ? { issuer: config.issuer } : {}),
            ...(config.audience !== undefined ? { audience: config.audience } : {}),
            ...(config.accessTokenTtlSeconds !== undefined ? { accessTokenTtlSeconds: config.accessTokenTtlSeconds } : {}),
            ...(config.refreshTokenTtlSeconds !== undefined ? { refreshTokenTtlSeconds: config.refreshTokenTtlSeconds } : {}),
            ...(config.requireEmailVerification !== undefined ? { requireEmailVerification: config.requireEmailVerification } : {}),
          });
      state.authService = createAuthService(deps);
    }
    return state.authService;
  }

  const mailer = config.mailer ?? memoryMailer();

  const app = new Hono();
  const JWT_RE = /^Bearer (.+)$/;

  app.get('/health', (c) => c.json({ status: 'ok', service: 'auth' }));

  // POST /auth/login  { email, password, storeId? }
  app.post('/auth/login', async (c) => {
    const body = await c.req.json<{ email?: string; password?: string; storeId?: string }>();
    if (!body.email || !body.password) return c.json({ error: { code: 'VALIDATION_ERROR', message: 'email dan password wajib diisi' } }, 400);
    const auth = build();
    try {
      const result = await auth.login(body.email, body.password, body.storeId ? { storeId: body.storeId } : undefined);
      return c.json(result);
    } catch (err) {
      return c.json({ error: toAuthError(err) }, toAuthError(err).status);
    }
  });

  // POST /auth/refresh { refreshToken }
  app.post('/auth/refresh', async (c) => {
    const body = await c.req.json<{ refreshToken?: string }>();
    if (!body.refreshToken) return c.json({ error: { code: 'VALIDATION_ERROR', message: 'refreshToken wajib diisi' } }, 400);
    try {
      return c.json(await build().refresh(body.refreshToken));
    } catch (err) {
      return c.json({ error: toAuthError(err) }, toAuthError(err).status);
    }
  });

  // POST /auth/logout { refreshToken }
  app.post('/auth/logout', async (c) => {
    const body = await c.req.json<{ refreshToken?: string }>();
    if (!body.refreshToken) return c.json({ error: { code: 'VALIDATION_ERROR', message: 'refreshToken wajib diisi' } }, 400);
    await build().logout(body.refreshToken);
    return c.body(null, 204);
  });

  // GET /auth/me — verifikasi access token → konteks user
  app.get('/auth/me', async (c) => {
    const header = c.req.header('authorization') ?? '';
    const match = JWT_RE.exec(header);
    if (!match) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } }, 401);
    try {
      return c.json({ user: await build().verifyToken(match[1]!) });
    } catch (err) {
      const e = toAuthError(err);
      return c.json({ error: e }, e.status);
    }
  });

  async function currentUser(c: Context) {
    const header = c.req.header('authorization') ?? '';
    const match = JWT_RE.exec(header);
    if (!match) throw new AuthError('TOKEN_INVALID', 'Missing bearer token');
    return build().verifyToken(match[1]!);
  }

  // POST /auth/otp/request { email, purpose, storeId? } — kirim kode via mailer
  app.post('/auth/otp/request', async (c) => {
    const body = await c.req.json<{ email?: string; purpose?: string; storeId?: string }>();
    if (!body.email || !body.purpose) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'email dan purpose wajib diisi' } }, 400);
    }
    if (body.purpose !== 'login' && body.purpose !== 'verify_email' && body.purpose !== '2fa') {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'purpose harus login | verify_email | 2fa' } }, 400);
    }
    try {
      const code = await build().generateOtp(
        { email: body.email, purpose: body.purpose },
        body.storeId ? { storeId: body.storeId } : undefined,
      );
      await mailer.send(renderOtpEmail(body.email, code, body.purpose));
      return c.json({ ok: true });
    } catch (err) {
      const e = toAuthError(err);
      return c.json({ error: e }, e.status);
    }
  });

  // POST /auth/otp/verify
  app.post('/auth/otp/verify', async (c) => {
    const body = await c.req.json<{ email?: string; purpose?: string; code?: string; challengeToken?: string; storeId?: string }>();
    if (!body.code || !body.purpose) {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'code dan purpose wajib diisi' } }, 400);
    }
    if (!body.email && body.purpose !== '2fa') {
      return c.json({ error: { code: 'VALIDATION_ERROR', message: 'email wajib diisi' } }, 400);
    }
    try {
      let input: { purpose: '2fa'; email: string; code: string; challengeToken: string } | { purpose: 'login' | 'verify_email'; email: string; code: string } | undefined;
      if (body.purpose === '2fa') {
        input = { purpose: '2fa', email: body.email ?? '', code: body.code, challengeToken: body.challengeToken ?? '' };
      } else if (body.purpose === 'login' || body.purpose === 'verify_email') {
        input = { purpose: body.purpose, email: body.email ?? '', code: body.code };
      } else {
        return c.json({ error: { code: 'VALIDATION_ERROR', message: 'purpose harus login | verify_email | 2fa' } }, 400);
      }
      const result = await build().verifyOtp(input, body.storeId ? { storeId: body.storeId } : undefined);
      return c.json(result);
    } catch (err) {
      const e = toAuthError(err);
      return c.json({ error: e }, e.status);
    }
  });

  // 2FA toggle (perlu access token)
  app.post('/auth/two-factor/enable', async (c) => {
    try {
      const context = await currentUser(c);
      await build().enableTwoFactor(context.id);
      return c.json({ ok: true });
    } catch (err) {
      const e = toAuthError(err);
      return c.json({ error: e }, e.status);
    }
  });

  app.post('/auth/two-factor/disable', async (c) => {
    try {
      const context = await currentUser(c);
      await build().disableTwoFactor(context.id);
      return c.json({ ok: true });
    } catch (err) {
      const e = toAuthError(err);
      return c.json({ error: e }, e.status);
    }
  });

  // Google (OIDC + PKCE). Hanya aktif bila config.google diset.
  if (config.google) {
    app.get('/auth/google/authorize', (c) => {
      const { url } = buildGoogleAuthorizeUrl(config.google!, config.jwtSecret);
      return c.json({ url });
    });

    app.get('/auth/google/callback', async (c) => {
      const code = c.req.query('code');
      const state = c.req.query('state');
      if (!code || !state) return c.json({ error: { code: 'VALIDATION_ERROR', message: 'code & state wajib ada' } }, 400);
      try {
        const verifier = resolveGoogleVerifier(state, config.jwtSecret);
        const profile = await exchangeGoogleCode(config.google!, code, verifier);
        const result = await build().loginWithProvider(profile);
        if ('requiresOtp' in result) {
          return c.json({ requiresOtp: true, userId: result.userId, email: result.email, challengeToken: result.challengeToken, expiresIn: result.expiresIn });
        }
        return c.json(result);
      } catch (err) {
        const e = toAuthError(err);
        return c.json({ error: e }, e.status);
      }
    });
  }

  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Route tidak ditemukan' } }, 404));

  let server: ReturnType<typeof serve> | undefined;

  return {
    app,
    get authService() {
      return build();
    },
    useDb(db) {
      state.db = db;
      state.authService = null; // rebuild dgn db saat dibutuhkan
      return this;
    },
    async start() {
      if (server) return { port: config.port ?? 4100 };
      return new Promise((resolve, reject) => {
        try {
          server = serve({ fetch: app.fetch, port: config.port ?? 4100, hostname: '0.0.0.0' }, (info) => resolve({ port: info.port }));
        } catch (err) {
          reject(err);
        }
      });
    },
    async stop() {
      if (!server) return;
      await new Promise<void>((resolve) => server?.close(() => resolve()));
      server = undefined;
    },
  };
}

function toAuthError(err: unknown): { status: 400 | 401 | 403 | 429; code: string; message: string } {
  const code = (err as { code?: string })?.code;
  const message = (err as Error)?.message ?? 'Terjadi kesalahan';
  switch (code) {
    case 'INVALID_CREDENTIALS':
    case 'TOKEN_INVALID':
    case 'SESSION_INVALID':
    case 'TOKEN_EXPIRED':
    case 'SESSION_EXPIRED':
      return { status: 401, code: code ?? 'UNAUTHORIZED', message };
    case 'ACCOUNT_SUSPENDED':
    case 'NOT_A_MEMBER':
    case 'EMAIL_NOT_VERIFIED':
    case 'OTP_NOT_ALLOWED':
    case 'PROVIDER_NOT_CONFIGURED':
      return { status: 403, code: code ?? 'FORBIDDEN', message };
    case 'OTP_INVALID':
    case 'OTP_EXPIRED':
    case 'CHALLENGE_INVALID':
      return { status: 400, code: code ?? 'BAD_REQUEST', message };
    case 'OTP_REQUEST_TOO_FREQUENT':
    case 'OTP_MAX_ATTEMPTS':
      return { status: 429, code: code ?? 'TOO_MANY_REQUESTS', message };
    default:
      return { status: 401, code: 'UNAUTHORIZED', message };
  }
}

// Bootstrap dipindah ke src/run.ts (entry CLI). index.ts murni library.

export type { AuthService };
export { memoryMailer } from '@opensellvy/core';
export type { Mailer, MailMessage, MemoryMailer } from '@opensellvy/core';
export { createPgAuthDeps } from '@opensellvy/db-pg';
export { createDatabase } from './db';
export type { Db } from './db';
