import type { PlatformCode, ID } from '../types';

export interface OAuthConfiguration {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  sandbox?: boolean;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string[];
}

export interface PlatformCredentials {
  appId: string;
  secret: string;
  redirectUri: string;
  sandbox?: boolean;
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
