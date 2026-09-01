import type { ID, PlatformCode, ISO8601, Money } from '../types';

export interface TenantTable {
  id: ID;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface StoreRow extends TenantTable {
  name: string;
  slug: string;
  logoUrl?: string;
  config: Record<string, unknown>;
}

export interface PlatformAccountRow extends TenantTable {
  storeId: ID;
  platform: PlatformCode;
  shopId: string;
  shopName: string;
  authState: 'connected' | 'expired' | 'revoked';
  scopes: string[];
  marketplace: string;
}

export interface UserRow extends TenantTable {
  email: string;
  name: string;
  passwordHash: string;
  storeId: ID;
  role: string;
}

export interface OrderRow extends TenantTable {
  storeId: ID;
  platform: PlatformCode;
  platformOrderId: string;
  marketplaceOrderId: string;
  orderNumber: string;
  customerId?: ID;
  status: string;
  subStatus: string;
  total: Money;
  items: unknown;
  raw: Record<string, unknown>;
  syncedAt: ISO8601;
}
