import type { ID } from '@opensellvy/types';

export interface OAuthConfiguration {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  sandbox?: boolean;
  /** base URL token/authorize endpoint eksplisit (regional/sandbox). */
  baseUrl?: string;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string[];
}

export interface PlatformCredentials {
  appId: string;
  /** partner_key (secret) untuk platform yang pakai HMAC signing (mis. Shopee). */
  secret: string;
  redirectUri: string;
  sandbox?: boolean;
  /**
   * Base URL eksplisit platform — FLEXIBLE karena tiap platform punya banyak
   * endpoint (sandbox vs production, dan bervariasi per region/kredensial).
   * Contoh Shopee: https://partner.shopeemobile.com (live SG),
   * https://openplatform.sandbox.test-stable.shopee.sg (sandbox), dst.
   * Jika tidak diisi, adapter memakai default-nya sendiri.
   */
  baseUrl?: string;
  /**
   * Shop/platform identifier di sisi platform (mis. shop_id Shopee) —
   * dipakai untuk signing & param shop-level API. Berbeda dari
   * `ConnectorContext.platformAccountId` (ID internal kita).
   */
  shopId?: string;
}

export interface ConnectorContext {
  storeId: ID;
  platformAccountId: ID;
  credentials: PlatformCredentials;
  token: OAuthToken;
}

export type ConnectorMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

export interface ConnectorHttpRequest {
  method: ConnectorMethod;
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface ConnectorHttpResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}
