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
