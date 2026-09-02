import type { StoreMember, User, UserRole } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export interface UserModuleImpl {
  createUser(input: { email: string; name: string }): Promise<User>;
  getUser(userId: string): Promise<User>;
  addMember(storeId: string, userId: string, role: UserRole): Promise<StoreMember>;
  listMembers(storeId: string): Promise<StoreMember[]>;
  changeRole(storeId: string, userId: string, role: UserRole): Promise<StoreMember>;
}

export function userModule(deps: ModuleDeps): UserModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  return {
    async createUser(input) {
      const stamp = now();
      const user: User = { id: id(), email: input.email, name: input.name, status: 'active', createdAt: stamp, updatedAt: stamp };
      return repos.users.save(user);
    },

    async getUser(userId) {
      const user = await repos.users.findById(userId);
      if (!user) throw new Error(`User ${userId} not found`);
      return user;
    },

    async addMember(storeId, userId, role) {
      const stamp = now();
      const member: StoreMember = { storeId, userId, role, status: 'active', createdAt: stamp, updatedAt: stamp };
      await repos.members.add(member);
      return member;
    },

    async listMembers(storeId) {
      return repos.members.findByStore(storeId);
    },

    async changeRole(storeId, userId, role) {
      return repos.members.update(storeId, userId, { role, updatedAt: now() });
    },
  };
}

export type { UserRole };