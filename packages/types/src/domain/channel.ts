import type { ID, ISO8601, PlatformCode } from '../base';

export type ChannelAuthState = 'connected' | 'expired' | 'revoked';

export interface ChannelConnection {
  id: ID;
  storeId: ID;
  platform: PlatformCode;
  platformShopId: string;
  shopName: string;
  marketplace: string;
  scopes: string[];
  auth: {
    state: ChannelAuthState;
    connectedAt: ISO8601;
    lastTokenRefreshAt?: ISO8601;
    expiresAt?: ISO8601;
  };
  settings: ChannelSettings;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface ChannelSettings {
  autoPullOrders?: boolean;
  autoSyncInventory?: boolean;
  defaultWarehouseId?: ID;
  extra?: Record<string, unknown>;
}

export interface ConnectChannelInput {
  storeId: ID;
  platform: PlatformCode;
  oauth: {
    code: string;
    state?: string;
  };
}