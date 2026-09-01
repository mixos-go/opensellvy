import type { PlatformCredentials } from '../connector.types';

export interface CallbackResult {
  platform: string;
  storeId?: string;
  connected: boolean;
}

export interface CallbackHandler {
  handleCallback(
    platform: string,
    params: Record<string, string>,
    credentials: PlatformCredentials,
  ): Promise<CallbackResult>;
}
