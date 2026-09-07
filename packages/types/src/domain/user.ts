import type { ID, ISO8601 } from '../base';

export type UserRole = 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';

export type UserStatus = 'active' | 'suspended';

export type MemberStatus = 'active' | 'invited' | 'disabled';

export interface User {
  id: ID;
  email: string;
  name: string;
  status: UserStatus;
  /** scrypt hash (core/auth) — tidak boleh ter-expose ke publik; diisi saat user dibuat. */
  passwordHash?: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface StoreMember {
  storeId: ID;
  userId: ID;
  role: UserRole;
  status: MemberStatus;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface SessionContext {
  userId: ID;
  storeId: ID;
  role: UserRole;
  expiresAt: ISO8601;
}