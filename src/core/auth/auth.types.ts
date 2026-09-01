import type { ID, ISO8601 } from '../../types';

export type RoleCode = 'owner' | 'admin' | 'manager' | 'operator' | 'viewer';

export interface UserContext {
  id: ID;
  storeId?: ID;
  role: RoleCode;
  permissions: string[];
  expiresAt: ISO8601;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Session {
  id: ID;
  userId: ID;
  role: RoleCode;
  createdAt: ISO8601;
  expiresAt: ISO8601;
}
