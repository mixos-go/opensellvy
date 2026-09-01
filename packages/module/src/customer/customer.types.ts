import type { ID, PlatformCode } from '@opensellvy/types';

export interface UnifiedCustomer {
  id: ID;
  storeId: ID;
  name: string;
  email?: string;
  phone?: string;
  platformProfiles: Array<{
    platform: PlatformCode;
    platformCustomerId: string;
    username: string;
  }>;
  addresses: Array<Record<string, unknown>>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
