import { createAuthService } from '@opensellvy/core';
import type { AuthDeps } from '@opensellvy/core';
import type { AuthService, RefreshSession, RefreshSessionStore, AuthUserRecord } from '@opensellvy/core';
import type { User } from '@opensellvy/types';
import type { Repositories } from '@opensellvy/module';
import type { AuthConfig } from './config';

function toAuthUserRecord(u: User): AuthUserRecord {
  return {
    id: u.id,
    email: u.email,
    ...(u.name ? { name: u.name } : {}),
    passwordHash: u.passwordHash ?? '',
    status: u.status,
  };
}

/**
 * Bangun core/auth AuthService dari repos (users/members) + session store.
 * `findUserByEmail`/`getMemberRole` di-adapt dari port storage (DB-agnostic).
 */
export function buildAuthService(
  config: AuthConfig,
  repos: Repositories,
  sessions: RefreshSessionStore,
): AuthService {
  const deps: AuthDeps = {
    jwtSecret: config.jwtSecret,
    ...(config.issuer !== undefined ? { issuer: config.issuer } : {}),
    ...(config.audience !== undefined ? { audience: config.audience } : {}),
    ...(config.accessTokenTtlSeconds !== undefined ? { accessTokenTtlSeconds: config.accessTokenTtlSeconds } : {}),
    ...(config.refreshTokenTtlSeconds !== undefined ? { refreshTokenTtlSeconds: config.refreshTokenTtlSeconds } : {}),
    findUserByEmail: async (email) => {
      const user = await repos.users.findByEmail(email);
      return user !== undefined ? toAuthUserRecord(user) : undefined;
    },
    getMemberRole: async (storeId, userId) => {
      const member = await repos.members.find(storeId, userId);
      return member?.role;
    },
    sessions,
  };
  return createAuthService(deps);
}

/** Session refresh store default in-memory (rotasi + revoke). */
export function createMemorySessionStore(): RefreshSessionStore {
  const sessions = new Map<string, RefreshSession>();
  return {
    async save(session) {
      sessions.set(session.tokenHash, session);
    },
    async findByTokenHash(tokenHash) {
      return sessions.get(tokenHash);
    },
    async deleteById(sessionId) {
      for (const [hash, session] of sessions) {
        if (session.id === sessionId) sessions.delete(hash);
      }
    },
    async revokeAllForUser(userId) {
      for (const [hash, session] of sessions) {
        if (session.userId === userId) sessions.delete(hash);
      }
    },
  };
}