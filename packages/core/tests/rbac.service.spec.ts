import { describe, expect, it } from 'vitest';
import { Rbac } from '../src/auth/rbac/rbac.service';
import type { RoleResolver } from '../src/auth/rbac/rbac.types';

describe('Rbac identity-aware', () => {
  it('grants permission only for roles the user actually holds in context store', async () => {
    const roles: RoleResolver = async (userId, ctx) => {
      if (userId === 'u-owner') return ['owner'];
      if (userId === 'u-operator' && ctx?.storeId === 's-1') return ['operator'];
      if (userId === 'u-operator' && ctx?.storeId === 's-2') return ['viewer'];
      return undefined;
    };
    const rbac = new Rbac(roles);

    // owner → semua permission
    expect(await rbac.can('u-owner', 'user.manage', { storeId: 's-1' })).toBe(true);
    // operator di s-1 → boleh fulfill order, tapi tidak user.manage / product.read
    expect(await rbac.can('u-operator', 'order.fulfill', { storeId: 's-1' })).toBe(true);
    expect(await rbac.can('u-operator', 'user.manage', { storeId: 's-1' })).toBe(false);
    expect(await rbac.can('u-operator', 'product.read', { storeId: 's-1' })).toBe(false);
    // operator yang sama di store lain → role lebih rendah (viewer)
    expect(await rbac.can('u-operator', 'order.fulfill', { storeId: 's-2' })).toBe(false);
    // user tak dikenal → deny
    expect(await rbac.can('u-unknown', 'order.read', { storeId: 's-1' })).toBe(false);
  });

  it('hasRole checks membership, bukan keberadaan role di definisi', async () => {
    const roles: RoleResolver = async (userId) => (userId === 'u-owner' ? ['owner'] : undefined);
    const rbac = new Rbac(roles);
    expect(await rbac.hasRole('u-owner', 'owner')).toBe(true);
    expect(await rbac.hasRole('u-owner', 'admin')).toBe(false);
    expect(await rbac.hasRole('u-nobody', 'owner')).toBe(false);
  });

  it('assert throws untuk user tanpa permission', async () => {
    const roles: RoleResolver = async () => ['viewer'];
    const rbac = new Rbac(roles);
    await expect(rbac.assert('u-viewer', 'order.read')).resolves.toBeUndefined();
    await expect(rbac.assert('u-viewer', 'user.manage')).rejects.toThrow('Forbidden');
  });

  it('tanpa resolver → deny (fail-closed)', async () => {
    const rbac = new Rbac();
    expect(await rbac.can('u-1', 'order.read')).toBe(false);
    expect(await rbac.hasRole('u-1', 'owner')).toBe(false);
  });
});
