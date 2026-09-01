import type { PlatformCode, ID } from '../types';

export interface ChannelModule {
  connect(storeId: ID, platform: PlatformCode, params: unknown): Promise<unknown>;
  disconnect(channelId: ID): Promise<void>;
  refreshToken(channelId: ID): Promise<void>;
  listChannels(storeId: ID): Promise<unknown[]>;
  syncAll(storeId: ID): Promise<void>;
}