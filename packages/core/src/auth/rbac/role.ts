import type { RoleDefinition } from './rbac.types';

export const roleDefinitions: RoleDefinition[] = [
  { code: 'owner', permissions: ['order.read', 'order.write', 'order.fulfill', 'product.read', 'product.write', 'inventory.read', 'inventory.write', 'customer.read', 'customer.write', 'analytics.read', 'finance.read', 'channel.manage', 'store.manage', 'user.manage', 'audit.read'] },
  { code: 'admin', permissions: ['order.read', 'order.write', 'order.fulfill', 'product.read', 'product.write', 'inventory.read', 'inventory.write', 'customer.read', 'customer.write', 'analytics.read', 'finance.read', 'channel.manage', 'store.manage', 'audit.read'] },
  { code: 'manager', permissions: ['order.read', 'order.write', 'order.fulfill', 'product.read', 'product.write', 'inventory.read', 'inventory.write', 'customer.read', 'analytics.read', 'audit.read'] },
  { code: 'operator', permissions: ['order.read', 'order.write', 'order.fulfill', 'inventory.read', 'inventory.write'] },
  { code: 'viewer', permissions: ['order.read', 'product.read', 'inventory.read', 'analytics.read'] },
];
