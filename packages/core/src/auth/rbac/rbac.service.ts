import type { RbacService, RoleDefinition, RoleResolver } from './rbac.types';
import { roleDefinitions } from './role';

export class Rbac implements RbacService {
  private readonly roles = new Map(roleDefinitions.map((r) => [r.code, r]));

  constructor(private readonly resolveRoles?: RoleResolver) {}

  async can(
    userId: string,
    permission: string,
    context?: { storeId?: string },
  ): Promise<boolean> {
    const roles = await this.rolesFor(userId, context);
    if (!roles) return false;
    return roles.some((role) =>
      this.roles.get(role)?.permissions.includes(permission as RoleDefinition['permissions'][number]) ?? false,
    );
  }

  async hasRole(
    userId: string,
    role: string,
    context?: { storeId?: string },
  ): Promise<boolean> {
    const roles = await this.rolesFor(userId, context);
    return roles?.includes(role) ?? false;
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

  private async rolesFor(userId: string, context?: { storeId?: string }): Promise<string[] | undefined> {
    if (this.resolveRoles) return this.resolveRoles(userId, context as never);
    // Tanpa resolver: hanya grant bila user diasosiasikan dengan setidaknya satu role
    // yang memiliki permission — tidak bisa diverifikasi → deny.
    return undefined;
  }
}
