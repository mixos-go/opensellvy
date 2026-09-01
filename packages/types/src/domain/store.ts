import type { ID, ISO8601 } from '../base';

export interface Store {
  id: ID;
  name: string;
  slug: string;
  logoUrl?: string;
  config: Record<string, unknown>;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface StoreConfig {
  timezone: string;
  currency: string;
  orderPrefix?: string;
  defaultWarehouseId?: ID;
}