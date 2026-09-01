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

export interface RbacService {
  can(userId: ID, permission: PermissionCode, context?: { storeId?: ID }): Promise<boolean>;
  hasRole(userId: ID, role: string): Promise<boolean>;
  assert(userId: ID, permission: PermissionCode, context?: { storeId?: ID }): Promise<void>;
}
