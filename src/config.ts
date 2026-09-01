import type { PlatformCode } from './types';

export interface OpenSellvyConfig {
  appId?: string;
  appSecret?: string;
  apiKey?: string;
  environment?: 'production' | 'sandbox';
  databaseUrl?: string;
  redisUrl?: string;
  jwtSecret?: string;
  platforms?: Partial<Record<PlatformCode, PlatformConfig>>;
}

export interface PlatformConfig {
  appId: string;
  secret: string;
  sandbox?: boolean;
  redirectUri: string;
  extra?: Record<string, unknown>;
}

export function defineConfig(config: OpenSellvyConfig): OpenSellvyConfig {
  return config;
}
