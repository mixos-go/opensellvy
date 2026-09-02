import type { Handler } from 'hono';
import { AuthError } from '@opensellvy/core';
import type { ApiEnv } from '../../env';

function mapAuthError(err: unknown): { status: 400 | 401 | 403; code: string; message: string } {
  if (err instanceof AuthError) {
    switch (err.code) {
      case 'INVALID_CREDENTIALS':
        return { status: 401, code: 'UNAUTHORIZED', message: err.message };
      case 'ACCOUNT_SUSPENDED':
      case 'NOT_A_MEMBER':
        return { status: 403, code: 'FORBIDDEN', message: err.message };
      case 'TOKEN_INVALID':
      case 'SESSION_INVALID':
        return { status: 401, code: 'TOKEN_INVALID', message: err.message };
      case 'TOKEN_EXPIRED':
      case 'SESSION_EXPIRED':
        return { status: 401, code: 'TOKEN_EXPIRED', message: err.message };
      default:
        return { status: 401, code: 'UNAUTHORIZED', message: err.message };
    }
  }
  throw err;
}

/** POST /api/auth/login — body: { email, password, storeId? } */
export const loginHandler: Handler<ApiEnv> = async (c) => {
  const auth = c.get('api').authService;
  if (!auth) return c.json({ error: { code: 'AUTH_NOT_CONFIGURED', message: 'authService belum di-set' } }, 401);
  const body = await c.req.json<{ email: string; password: string; storeId?: string }>();
  if (!body.email || !body.password) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'email dan password wajib diisi' } }, 400);
  }
  try {
    const result = await auth.login(body.email, body.password, body.storeId ? { storeId: body.storeId } : undefined);
    return c.json(result);
  } catch (err) {
    return c.json({ error: mapAuthError(err) }, mapAuthError(err).status);
  }
};

/** POST /api/auth/refresh — body: { refreshToken } → pasangan token baru (rotation). */
export const refreshHandler: Handler<ApiEnv> = async (c) => {
  const auth = c.get('api').authService;
  if (!auth) return c.json({ error: { code: 'AUTH_NOT_CONFIGURED', message: 'authService belum di-set' } }, 401);
  const body = await c.req.json<{ refreshToken?: string }>();
  if (!body.refreshToken) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'refreshToken wajib diisi' } }, 400);
  }
  try {
    const result = await auth.refresh(body.refreshToken);
    return c.json(result);
  } catch (err) {
    return c.json({ error: mapAuthError(err) }, mapAuthError(err).status);
  }
};

/** POST /api/auth/logout — body: { refreshToken } → mencabut session. */
export const logoutHandler: Handler<ApiEnv> = async (c) => {
  const auth = c.get('api').authService;
  if (!auth) return c.json({ error: { code: 'AUTH_NOT_CONFIGURED', message: 'authService belum di-set' } }, 401);
  const body = await c.req.json<{ refreshToken?: string }>();
  if (!body.refreshToken) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'refreshToken wajib diisi' } }, 400);
  }
  await auth.logout(body.refreshToken);
  return c.body(null, 204);
};