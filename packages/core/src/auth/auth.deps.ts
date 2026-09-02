import type { ID, ISO8601 } from '@opensellvy/types';
import type { RoleCode } from './auth.types';

export interface AuthUserRecord {
  id: ID;
  email: string;
  name?: string;
  /** hash dari core/auth password (scrypt), bukan plaintext */
  passwordHash: string;
  status?: 'active' | 'suspended';
}

/**
 * Session refresh untuk revocation & rotation.
 * `tokenHash` = sha256(refresh token raw) sebagai referensi lookup (tidak simpan raw).
 */
export interface RefreshSession {
  id: ID;
  userId: ID;
  email: string;
  storeId?: ID;
  role: RoleCode;
  createdAt: ISO8601;
  expiresAt: ISO8601;
  tokenHash: string;
}

export interface RefreshSessionStore {
  save(session: RefreshSession): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshSession | undefined>;
  deleteById(sessionId: ID): Promise<void>;
  revokeAllForUser(userId: ID): Promise<void>;
}

export interface AuthDeps {
  jwtSecret: string;
  issuer?: string;
  audience?: string;
  /** umur access token (default 15 menit) */
  accessTokenTtlSeconds?: number;
  /** umur refresh token (default 30 hari) */
  refreshTokenTtlSeconds?: number;
  findUserByEmail(email: string): Promise<AuthUserRecord | undefined>;
  /** role user di sebuah store; wajib untuk login store-scoped */
  getMemberRole(storeId: ID, userId: ID): Promise<RoleCode | undefined>;
  sessions: RefreshSessionStore;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: ID;
  user: { id: ID; email: string; name?: string };
}

export interface LoginOptions {
  storeId?: ID;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_SUSPENDED'
  | 'NOT_A_MEMBER'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'SESSION_INVALID'
  | 'SESSION_EXPIRED';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}