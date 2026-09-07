import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createAuthService, hashPassword } from '@opensellvy/core';
import type { AuthDeps, AuthService, AuthUserRecord, RefreshSession, RefreshSessionStore, RoleCode } from '@opensellvy/core';
import { createPgAuthDeps } from '@opensellvy/db-pg';
import type { Db } from './db';

export interface AuthAppConfig {
  port?: number;
  /** DATABASE_URL Postgres. Bila tidak → mode dev memory (tanpa persist). */
  databaseUrl?: string;
  jwtSecret: string;
  issuer?: string;
  audience?: string;
  accessTokenTtlSeconds?: number;
  refreshTokenTtlSeconds?: number;
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

/** AuthDeps memory (mode dev, tanpa Postgres) — satu user contoh. */
export function memoryAuthDeps(secret: string): AuthDeps & { sessions: RefreshSessionStore } {
  let devHash: string | undefined;
  let ready: Promise<void> | undefined;

  return {
    jwtSecret: secret,
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 30 * 24 * 3600,
    findUserByEmail: async (email: string): Promise<AuthUserRecord | undefined> => {
      if (email !== 'dev@opensellvy.test') return undefined;
      ready ??= hashPassword('admin123').then((h) => {
        devHash = h;
      });
      await ready;
      return {
        id: 'dev-user-1',
        email: 'dev@opensellvy.test',
        name: 'Dev Admin',
        passwordHash: devHash!,
        status: 'active',
      };
    },
    getMemberRole: async (): Promise<RoleCode | undefined> => 'owner',
    sessions: memoryRefreshSessionStore(),
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
          })
        : memoryAuthDeps(config.jwtSecret);
      state.authService = createAuthService(deps);
    }
    return state.authService;
  }

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

function toAuthError(err: unknown): { status: 400 | 401 | 403; code: string; message: string } {
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
      return { status: 403, code: code ?? 'FORBIDDEN', message };
    default:
      return { status: 401, code: 'UNAUTHORIZED', message };
  }
}

// Bootstrap dipindah ke src/run.ts (entry CLI). index.ts murni library.

export type { AuthService };
export { createPgAuthDeps } from '@opensellvy/db-pg';
export { createDatabase } from './db';
export type { Db } from './db';
