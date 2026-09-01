import type { PlatformCode } from '../types';

export type ApiMode = 'sdk' | 'api' | 'both';

export interface ApiConfig {
  port?: number;
  host?: string;
  path?: string;
  cors?: boolean | Record<string, unknown>;
  graphql?: boolean;
}

export interface PlatformWebhookPayload {
  platform: PlatformCode;
  storeId?: string;
  event: string;
  body: unknown;
  timestamp: string;
  signature: string;
}