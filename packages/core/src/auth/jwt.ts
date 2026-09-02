import { randomBytes } from 'node:crypto';
import { hmacSign } from '../crypto/crypto';

export interface JwtPayload {
  /** subject — userId */
  sub: string;
  /** issuer (default dari args saat sign) */
  iss?: string;
  /** audience */
  aud?: string;
  /** issued at (unix detik) */
  iat?: number;
  /** expiry (unix detik) */
  exp?: number;
  /** session id (refresh rotation) */
  jti?: string;
  [k: string]: unknown;
}

export interface JwtSignOptions {
  secret: string;
  issuer?: string;
  audience?: string;
  expiresInSeconds?: number;
  jti?: string;
}

export interface JwtVerifyResult {
  valid: boolean;
  reason?: 'expired' | 'bad-signature' | 'malformed' | 'not-yet-issued';
  payload?: JwtPayload;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

const HEADER = { alg: 'HS256', typ: 'JWT' };

/**
 * Sign JWT (HS256). Kompak, tanpa dependency luar; signature = HMAC-SHA256.
 * Format: base64url(header).base64url(payload).base64url(signature)
 */
export function signJwt(payload: JwtPayload, options: JwtSignOptions): string {
  const header = base64url(JSON.stringify(HEADER));
  const body = base64url(
    JSON.stringify({
      ...payload,
      iss: payload.iss ?? options.issuer,
      aud: payload.aud ?? options.audience,
      iat: payload.iat ?? Math.floor(Date.now() / 1000),
      exp: payload.exp ?? Math.floor(Date.now() / 1000) + (options.expiresInSeconds ?? 3600),
      ...(options.jti ? { jti: options.jti } : {}),
    }),
  );
  const signingInput = `${header}.${body}`;
  const signature = Buffer.from(hmacSign(options.secret, signingInput), 'hex');
  return `${signingInput}.${base64url(signature)}`;
}


/**
 * Verify JWT: signature timing-safe + expiry. Return reason bila tidak valid.
 */
export function verifyJwt(token: string, secret: string, opts?: { audience?: string; issuer?: string; maxAgeSeconds?: number }): JwtVerifyResult {
  const parts = token.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'malformed' };

  const header = parts[0]!;
  const body = parts[1]!;
  const sig = parts[2]!;
  const signingInput = `${header}.${body}`;
  const expected = hmacSign(secret, signingInput);
  const actual = fromBase64url(sig).toString('hex');
  if (actual.length !== expected.length || !timingSafeEqualHex(actual, expected)) {
    return { valid: false, reason: 'bad-signature' };
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(fromBase64url(body).toString('utf8')) as JwtPayload;
  } catch {
    return { valid: false, reason: 'malformed' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    return { valid: false, reason: 'expired', payload };
  }
  if (typeof payload.iat === 'number' && payload.iat > nowSec) {
    return { valid: false, reason: 'not-yet-issued', payload };
  }
  if (opts?.issuer && payload.iss !== opts.issuer) return { valid: false, reason: 'malformed', payload };
  if (opts?.audience && payload.aud !== opts.audience) return { valid: false, reason: 'malformed', payload };
  if (opts?.maxAgeSeconds && typeof payload.iat === 'number' && nowSec - payload.iat > opts.maxAgeSeconds) {
    return { valid: false, reason: 'expired', payload };
  }
  return { valid: true, payload };
}

export function randomJwtId(): string {
  return randomBytes(16).toString('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}