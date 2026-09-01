import type { ID, ISO8601, Address, PlatformCode } from '../base';

export interface CustomerPlatformProfile {
  platform: PlatformCode;
  platformUserId: string;
  username: string;
  channelId?: ID;
}

export interface UnifiedCustomer {
  id: ID;
  storeId: ID;
  name: string;
  email?: string;
  phone?: string;
  addresses: Address[];
  platformProfiles: CustomerPlatformProfile[];
  tags: string[];
  notes?: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface CustomerFilter {
  storeId: ID;
  query?: string; // name / email / phone partial
  tag?: string;
  cursor?: string;
  limit?: number;
}