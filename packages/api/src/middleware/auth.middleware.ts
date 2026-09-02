import type { MiddlewareHandler } from 'hono';
import { hmacSign } from '@opensellvy/core';
import type { ApiEnv } from '../env';

/**
 * Auth middleware — verifikasi bearer token berbasis HMAC (self-contained,
 * tanpa JWT lib). Format: `scope:userId` dipisah '.', di-sign dengan jwtSecret.
 *
 * Token dihasilkan oleh `signApiToken(secret, userId, scope)`:
 *   `${payload}.${hmacSign(secret, payload)}`
 */
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

/**
 * Auth middleware (fail-closed default).
 * - authMode 'open'→ sistem (dev).
 * - default 'closed': tanpa jwtSecret → 401 AUTH_NOT_CONFIGURED;
 *   token invalid → 401; valid → attach user.
 */
export const bearerAuth: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const api = c.get('api');
  if (api.authMode === 'open') {
    c.set('user', { userId: 'system', scope: 'api', authenticated: true });
    return next();
  }
  const secret = api.secrets?.jwtSecret;
  if (!secret) {
    return c.json({ error: { code: 'AUTH_NOT_CONFIGURED', message: 'jwtSecret belum di-set — auth fail-closed' } }, 401);
  }
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const parsed = token ? parseApiToken(secret, token) : undefined;
  if (!parsed) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid bearer token' } }, 401);
  }
  c.set('user', { ...parsed, authenticated: true });
  return next();
};