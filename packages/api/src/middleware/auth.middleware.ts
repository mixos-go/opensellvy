import type { MiddlewareHandler } from 'hono';
import { hmacSign, AuthError } from '@opensellvy/core';
import type { ApiEnv } from '../env';

/**
 * Auth middleware — memakai core/auth bila tersedia:
 * 1. `authService` ada → verifikasi access token JWT (verifyToken).
 * 2. Fallback legacy: bearer HMAC self-contained `scope:userId` (signApiToken).
 * Auth tetap fail-closed: tanpa secret & tanpa authService → 401.
 */

/** Legacy: token HMAC self-contained `scope:userId.signature`. */
export function parseApiToken(
  secret: string,
  token: string,
): { userId: string; scope: string } | undefined {
  const sep = token.lastIndexOf('.');
  if (sep < 0) return undefined;
  const payload = token.slice(0, sep);
  const sig = token.slice(sep + 1);
  const expected = hmacSign(secret, payload);
  if (sig.length !== expected.length || !timingSafeEqualHex(sig, expected)) return undefined;
  const [scope, userId] = payload.split(':');
  if (!scope || !userId) return undefined;
  return { userId, scope };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function signApiToken(secret: string, userId: string, scope = 'api'): string {
  const payload = `${scope}:${userId}`;
  return `${payload}.${hmacSign(secret, payload)}`;
}

function readBearer(c: Parameters<MiddlewareHandler<ApiEnv>>[0]): string {
  const header = c.req.header('Authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

export const bearerAuth: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const api = c.get('api');
  if (api.authMode === 'open') {
    c.set('user', { userId: 'system', scope: 'api', authenticated: true });
    return next();
  }

  const authService = api.authService;
  const secret = api.secrets?.jwtSecret;
  const token = readBearer(c);

  // 1) JWT via core/auth
  if (authService && token) {
    try {
      const ctx = await authService.verifyToken(token);
      c.set('user', {
        userId: ctx.id,
        scope: 'api',
        authenticated: true,
        storeId: ctx.storeId,
        role: ctx.role,
        permissions: ctx.permissions,
        expiresAt: ctx.expiresAt,
      });
      return next();
    } catch (err) {
      // token JWT invalid → tidak langsung 401: coba fallback HMAC legacy di bawah (jika secret ada)
      if (!(err instanceof AuthError) || !secret) {
        return unauthorized(c, err instanceof AuthError && err.code === 'TOKEN_EXPIRED' ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED');
      }
    }
  }

  // 2) Legacy HMAC (internal/system token)
  if (secret) {
    const parsed = token ? parseApiToken(secret, token) : undefined;
    if (parsed) {
      c.set('user', { ...parsed, authenticated: true });
      return next();
    }
  }

  // 3) Fail-closed
  if (!authService && !secret) {
    return c.json({ error: { code: 'AUTH_NOT_CONFIGURED', message: 'Tidak ada authService atau jwtSecret — auth fail-closed' } }, 401);
  }
  return unauthorized(c);
};

function unauthorized(c: Parameters<MiddlewareHandler<ApiEnv>>[0], code = 'UNAUTHORIZED'): Response {
  return c.json({ error: { code, message: 'Missing or invalid bearer token' } }, 401);
}