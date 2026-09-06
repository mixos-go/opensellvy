import type { PlatformCode } from '@opensellvy/types';

export interface OpenSellvyConfig {
  environment?: 'production' | 'sandbox';
  databaseUrl?: string;
  platforms?: Partial<Record<PlatformCode, PlatformConfig>>;
}

export interface PlatformConfig {
  appId: string;
  secret: string;
  sandbox?: boolean;
  redirectUri: string;
  /** base URL eksplisit platform (sandbox/production/region) — lihat PlatformCredentials.baseUrl. */
  baseUrl?: string;
  /** shop id di sisi platform (mis. shop_id Shopee) — lihat PlatformCredentials.shopId. */
  shopId?: string;
  extra?: Record<string, unknown>;
}

export function defineConfig(config: OpenSellvyConfig): OpenSellvyConfig {
  return config;
}
