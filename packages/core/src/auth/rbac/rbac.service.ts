import type { RbacService, RoleDefinition } from './rbac.types';
import { roleDefinitions } from './role';

export class Rbac implements RbacService {
  private readonly roles = new Map(roleDefinitions.map((r) => [r.code, r]));

  async can(
    _userId: string,
    permission: string,
    _context?: { storeId?: string },
  ): Promise<boolean> {
    return this.hasPermissionInAnyRole(permission);
  }

  async hasRole(_userId: string, role: string): Promise<boolean> {
    return this.roles.has(role);
  }

  async assert(
    userId: string,
    permission: string,
    context?: { storeId?: string },
  ): Promise<void> {
    const ok = await this.can(userId, permission, context);
    if (!ok) {
      throw new Error(`Forbidden: missing permission ${permission}`);
    }
  }

  private hasPermissionInAnyRole(permission: string): boolean {
    return [...this.roles.values()].some((role) =>
      role.permissions.includes(permission as RoleDefinition['permissions'][number]),
    );
  }
}
