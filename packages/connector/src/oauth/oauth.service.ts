import { HttpClient } from '@opensellvy/core';
import type { OAuthToken, OAuthConfiguration, PlatformCredentials } from '../connector.types';

export interface OAuthService {
  getAuthorizeUrl(
    platform: string,
    credentials: Pick<PlatformCredentials, 'appId' | 'redirectUri'>,
  ): Promise<string>;
  exchangeCode(
    platform: string,
    credentials: PlatformCredentials,
    code: string,
  ): Promise<OAuthToken>;
  refreshToken(
    platform: string,
    credentials: PlatformCredentials,
    refreshToken: string,
  ): Promise<OAuthToken>;
}

interface RawTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string | string[];
  [k: string]: unknown;
}

function toOAuthToken(raw: RawTokenResponse): OAuthToken {
  const scopes: string[] | undefined =
    raw.scope === undefined
      ? undefined
      : Array.isArray(raw.scope)
        ? raw.scope
        : raw.scope.split(/[ ,]+/).filter(Boolean);
  return {
    accessToken: raw.access_token ?? '',
    ...(raw.refresh_token !== undefined ? { refreshToken: raw.refresh_token } : {}),
    ...(typeof raw.expires_in === 'number' ? { expiresAt: Date.now() + raw.expires_in * 1000 } : {}),
    ...(scopes !== undefined ? { scope: scopes } : {}),
  };
}

export interface OAuthClientOptions {
  /** peta platform → konfigurasi OAuth (authorize/token endpoint, scope). */
  providers: Record<string, OAuthConfiguration>;
  /** pengganti fetch global (utk test). */
  fetch?: typeof fetch;
}

/**
 * Client OAuth generic (RFC 6749) — kode tlada-tebak,
 * dipakai adapter platform via konfigurasi endpoint saja.
 */
export function createOAuthClient(options: OAuthClientOptions): OAuthService {
  const { providers } = options;
  const http = new HttpClient({
    baseUrl: '',
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });

  const config = (platform: string): OAuthConfiguration => {
    const provider = providers[platform];
    if (!provider) throw new Error(`OAuth configuration tidak terdaftar untuk platform "${platform}"`);
    return provider;
  };

  const form = (fields: Record<string, string>): string =>
    new URLSearchParams(fields).toString();

  return {
    async getAuthorizeUrl(platform, credentials) {
      const { authorizeUrl, scopes } = config(platform);
      const url = new URL(authorizeUrl);
      url.searchParams.set('client_id', credentials.appId);
      url.searchParams.set('redirect_uri', credentials.redirectUri);
      url.searchParams.set('response_type', 'code');
      if (scopes.length) url.searchParams.set('scope', scopes.join(' '));
      return url.toString();
    },

    async exchangeCode(platform, credentials, code) {
      const { tokenUrl } = config(platform);
      const body = form({
        grant_type: 'authorization_code',
        code,
        client_id: credentials.appId,
        client_secret: credentials.secret,
        redirect_uri: credentials.redirectUri,
      });
      const res = await http.post<RawTokenResponse>(tokenUrl, {
        body,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });
      return toOAuthToken(res.data);
    },

    async refreshToken(platform, credentials, refreshToken) {
      const { tokenUrl } = config(platform);
      const body = form({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: credentials.appId,
        client_secret: credentials.secret,
      });
      const res = await http.post<RawTokenResponse>(tokenUrl, {
        body,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      });
      return toOAuthToken(res.data);
    },
  };
}