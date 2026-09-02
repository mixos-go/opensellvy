import type { OAuthToken, PlatformCredentials } from '@opensellvy/connector';
import { ShopeeClient } from './shopee.client';

export interface ShopeeAuth {
  /** URL authorize — dibuka seller di browser; redirect balik membawa code (+shop_id). */
  getAuthorizeUrl(redirectUri: string): Promise<string>;
  /** Tukar code (dari callback) jadi access/refresh token. Shop level. */
  exchangeCode(code: string, shopId?: string): Promise<OAuthToken & { shopId?: string }>;
  /** Refresh access token dari refreshToken. */
  refreshToken(refreshToken: string, shopId?: string): Promise<OAuthToken>;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  shop_id?: number | string;
  request_id?: string;
  [k: string]: unknown;
}

/**
 * OAuth Shopee (Public API): sign base string = partner_id + path + timestamp.
 * Body membawa business params (code/shop_id/refresh_token).
 */
export function createShopeeAuth(client: ShopeeClient): ShopeeAuth {
  return {
    async getAuthorizeUrl(redirectUri) {
      const path = '/api/v2/shop/auth_partner';
      const timestamp = client.now();
      const sign = client.sign({ apiType: 'public', path }, timestamp);
      const url = new URL(client.baseUrl + path);
      url.searchParams.set('partner_id', client.partnerId);
      url.searchParams.set('timestamp', String(timestamp));
      url.searchParams.set('redirect', redirectUri);
      url.searchParams.set('sign', sign);
      return url.toString();
    },

    async exchangeCode(code, shopId) {
      const path = '/api/v2/auth/token/get';
      const body: Record<string, unknown> = { code, partner_id: client.partnerId };
      if (shopId) body.shop_id = shopId;
      const res = await client.request<TokenResponse>(
        { apiType: 'public', path, method: 'POST', params: body },
        { apiType: 'public' },
      );
      return toToken(res);
    },

    async refreshToken(refreshToken, shopId) {
      const path = '/api/v2/auth/access_token/get';
      const body: Record<string, unknown> = { refresh_token: refreshToken, partner_id: client.partnerId };
      if (shopId) body.shop_id = shopId;
      const res = await client.request<TokenResponse>(
        { apiType: 'public', path, method: 'POST', params: body },
        { apiType: 'public' },
      );
      return toToken(res);
    },
  };
}

function toToken(raw: TokenResponse): OAuthToken & { shopId?: string } {
  const expiresAt = typeof raw.expires_in === 'number' ? Date.now() + raw.expires_in * 1000 : undefined;
  return {
    accessToken: raw.access_token ?? '',
    ...(raw.refresh_token !== undefined ? { refreshToken: raw.refresh_token } : {}),
    ...(expiresAt !== undefined ? { expiresAt } : {}),
    ...(raw.shop_id !== undefined ? { shopId: String(raw.shop_id) } : {}),
  };
}

/** helper stok untuk credentials default (bagian dari factory connector). */
export function defaultShopeeCredentials(base: PlatformCredentials): PlatformCredentials {
  return { ...base };
}
