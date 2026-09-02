import type { OAuthToken, OAuthConfiguration } from '../connector.types';

export interface TokenStore {
  save(storeId: string, platform: string, token: OAuthToken): Promise<void>;
  get(storeId: string, platform: string): Promise<OAuthToken | undefined>;
  delete(storeId: string, platform: string): Promise<void>;
}

export interface OAuthProviderConfig {
  platform: string;
  configuration: OAuthConfiguration;
}

/** TokenStore berbasis Map (utk dev/test/single-process). */
export function createMemoryTokenStore(): TokenStore {
  const map = new Map<string, OAuthToken>();
  return {
    async save(storeId, platform, token) {
      map.set(`${storeId}:${platform}`, token);
    },
    async get(storeId, platform) {
      return map.get(`${storeId}:${platform}`);
    },
    async delete(storeId, platform) {
      map.delete(`${storeId}:${platform}`);
    },
  };
}