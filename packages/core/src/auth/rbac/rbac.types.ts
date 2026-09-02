import type { ID } from '@opensellvy/types';

export type PermissionCode =
  | 'order.read'
  | 'order.write'
  | 'order.fulfill'
  | 'product.read'
  | 'product.write'
  | 'inventory.read'
  | 'inventory.write'
  | 'customer.read'
  | 'customer.write'
  | 'analytics.read'
  | 'finance.read'
  | 'channel.manage'
  | 'store.manage'
  | 'user.manage'
  | 'audit.read';

export interface RoleDefinition {
  code: string;
  permissions: PermissionCode[];
}

/**
 * Resolve daftar role yang dimiliki seorang user dalam konteks store.
 * Return undefined bila user tidak terdefinisi → dianggap tanpa akses.
 */
export type RoleResolver = (
  userId: ID,
  context?: { storeId?: ID },
) => Promise<string[] | undefined>;

export interface RbacService {
  can(userId: ID, permission: PermissionCode, context?: { storeId?: ID }): Promise<boolean>;
  hasRole(userId: ID, role: string, context?: { storeId?: ID }): Promise<boolean>;
  assert(userId: ID, permission: PermissionCode, context?: { storeId?: ID }): Promise<void>;
}
