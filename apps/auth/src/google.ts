import { createHash } from 'node:crypto';
import { AuthError, randomHex } from '@opensellvy/core';
import { signJwt, verifyJwt } from '@opensellvy/core';
import type { ProviderProfile } from '@opensellvy/core';

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /** injectable fetch (test tanpa network) */
  fetch?: typeof fetch;
}

function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier, 'utf8').digest('base64url').replace(/=+$/, '');
}

/**
 * Buat URL authorize Google (OIDC + PKCE). `state` = JWT HS256 berisi
 * code_verifier + redirect — anti-CSRF, stateless di sisi kita.
 */
export function buildGoogleAuthorizeUrl(cfg: GoogleConfig, secret: string): { url: string; verifier: string } {
  const verifier = randomHex(32);
  const state = signJwt({ sub: 'google-oauth', typ: 'google-oauth-state', verifier, redirect: cfg.redirectUri }, { secret, expiresInSeconds: 600 });
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: 'S256',
    access_type: 'online',
    prompt: 'select_account',
  });
  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, verifier };
}

/** Validasi signature state + ambil code_verifier (PKCE). */
export function resolveGoogleVerifier(state: string, secret: string): string {
  const verified = verifyJwt(state, secret);
  if (!verified.valid || verified.payload?.typ !== 'google-oauth-state') {
    throw new AuthError('CHALLENGE_INVALID', 'State Google tidak valid');
  }
  const verifier = verified.payload.verifier;
  if (typeof verifier !== 'string') throw new AuthError('CHALLENGE_INVALID', 'State Google tidak valid');
  return verifier;
}

/**
 * Tukar authorization code → profile Google. id_token diverifikasi via
 * endpoint tokeninfo Google (server-to-server), bukan parse lokal — tak
 * butuh dependency JWKS lib. `http` dari cfg.fetch supaya bisa di-stub.
 */
export async function exchangeGoogleCode(cfg: GoogleConfig, code: string, verifier: string): Promise<ProviderProfile> {
  const http = cfg.fetch ?? globalThis.fetch;

  const tokenRes = await http('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }).toString(),
  });
  if (!tokenRes.ok) throw new AuthError('PROVIDER_NOT_CONFIGURED', `Google token exchange gagal (${tokenRes.status})`);
  const token = (await tokenRes.json()) as { id_token?: string };
  if (!token.id_token) throw new AuthError('PROVIDER_NOT_CONFIGURED', 'Google tidak mengembalikan id_token');

  const infoRes = await http(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token.id_token)}`);
  const info = (await infoRes.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string;
    name?: string;
    picture?: string;
  };
  if (!infoRes.ok || info.aud !== cfg.clientId || info.sub === undefined) {
    throw new AuthError('PROVIDER_NOT_CONFIGURED', 'id_token Google tidak valid');
  }
  if (info.email_verified !== 'true' || !info.email) {
    throw new AuthError('PROVIDER_NOT_CONFIGURED', 'Email Google tidak terverifikasi');
  }
  return {
    provider: 'google',
    providerUserId: info.sub,
    email: info.email,
    ...(info.name ? { name: info.name } : {}),
    ...(info.picture ? { avatarUrl: info.picture } : {}),
  };
}