import { sha256Hex } from '../crypto/crypto';
import { verifyJwt, signJwt, randomJwtId } from './jwt';
import { verifyPassword } from './password';
import { roleDefinitions } from './rbac/role';
import type { UserContext, RoleCode } from './auth.types';
import type { AuthDeps, AuthErrorCode, LoginOptions, LoginResult, RefreshSession } from './auth.deps';
import { AuthError } from './auth.deps';

export interface AuthService {
  login(email: string, password: string, opts?: LoginOptions): Promise<LoginResult>;
  refresh(refreshToken: string): Promise<LoginResult>;
  logout(refreshToken: string): Promise<void>;
  logoutAll(userId: string): Promise<void>;
  verifyToken(token: string): Promise<UserContext>;
}

const ROLE_PERMISSIONS = new Map(roleDefinitions.map((r) => [r.code, r.permissions]));

function fail(code: AuthErrorCode, message: string): never {
  throw new AuthError(code, message);
}

export function createAuthService(deps: AuthDeps): AuthService {
  const {
    jwtSecret,
    issuer,
    audience,
    accessTokenTtlSeconds = 900,
    refreshTokenTtlSeconds = 30 * 24 * 3600,
  } = deps;

  async function requireUser(email: string, password: string) {
    const user = await deps.findUserByEmail(email);
    if (!user) fail('INVALID_CREDENTIALS', 'Email atau password salah');
    if (!(await verifyPassword(password, user.passwordHash))) {
      fail('INVALID_CREDENTIALS', 'Email atau password salah');
    }
    if (user.status === 'suspended') fail('ACCOUNT_SUSPENDED', 'Akun dinonaktifkan');
    return user;
  }

  /**
   * Role pada konteks store. Login tanpa storeId (issuer scope) menggunakan role
   * platform-wide; hingga ada konsep platform admin, default `owner`.
   */
  async function resolveRole(userId: string, storeId?: string): Promise<RoleCode> {
    if (!storeId) return 'owner';
    const role = await deps.getMemberRole(storeId, userId);
    if (!role) fail('NOT_A_MEMBER', `Bukan anggota store ${storeId}`);
    return role;
  }

  async function issue(user: { id: string; email: string; name?: string }, role: RoleCode, storeId?: string): Promise<LoginResult> {
    const now = new Date();
    const sessionId = randomJwtId();

    const accessToken = signJwt(
      {
        sub: user.id,
        role,
        ...(storeId ? { storeId } : {}),
        prm: ROLE_PERMISSIONS.get(role),
      },
      { secret: jwtSecret, issuer, audience, expiresInSeconds: accessTokenTtlSeconds, jti: sessionId },
    );

    const refreshToken = signJwt(
      { sub: user.id, typ: 'refresh' },
      { secret: jwtSecret, issuer, audience, expiresInSeconds: refreshTokenTtlSeconds, jti: sessionId },
    );

    const session: RefreshSession = {
      id: sessionId,
      userId: user.id,
      email: user.email,
      storeId,
      role,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + refreshTokenTtlSeconds * 1000).toISOString(),
      tokenHash: sha256Hex(refreshToken),
    };
    await deps.sessions.save(session);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenTtlSeconds,
      sessionId,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  return {
    async login(email, password, opts) {
      const user = await requireUser(email, password);
      const role = await resolveRole(user.id, opts?.storeId);
      return issue(user, role, opts?.storeId);
    },

    async refresh(refreshToken) {
      const verified = verifyJwt(refreshToken, jwtSecret, { audience, issuer });
      if (!verified.valid) {
        fail(verified.reason === 'expired' ? 'SESSION_EXPIRED' : 'SESSION_INVALID', 'Refresh token tidak valid');
      }
      const tokenHash = sha256Hex(refreshToken);
      const session = await deps.sessions.findByTokenHash(tokenHash);
      if (!session) fail('SESSION_INVALID', 'Session tidak ditemukan atau sudah di-revoke');
      if (new Date(session.expiresAt).getTime() <= Date.now()) {
        await deps.sessions.deleteById(session.id);
        fail('SESSION_EXPIRED', 'Session kedaluwarsa');
      }

      // rotation: revoke session lama, terbitkan pasangan token baru
      await deps.sessions.deleteById(session.id);
      const user = { id: session.userId, email: session.email };
      return issue(user, session.role, session.storeId);
    },

    async logout(refreshToken) {
      const tokenHash = sha256Hex(refreshToken);
      const session = await deps.sessions.findByTokenHash(tokenHash);
      if (session) await deps.sessions.deleteById(session.id);
    },

    async logoutAll(userId) {
      await deps.sessions.revokeAllForUser(userId);
    },

    async verifyToken(token) {
      const verified = verifyJwt(token, jwtSecret, { audience, issuer });
      if (!verified.valid) {
        fail(verified.reason === 'expired' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID', 'Access token tidak valid');
      }
      const payload = verified.payload!;
      const role = (payload.role as RoleCode) ?? 'viewer';
      const context: UserContext = {
        id: payload.sub,
        storeId: typeof payload.storeId === 'string' ? payload.storeId : undefined,
        role,
        permissions: Array.isArray(payload.prm) ? (payload.prm as string[]) : (ROLE_PERMISSIONS.get(role) ?? []),
        expiresAt: new Date(payload.exp! * 1000).toISOString(),
      };
      return context;
    },
  };
}

export { verifyJwt, signJwt, randomJwtId } from './jwt';
export type { JwtPayload, JwtSignOptions, JwtVerifyResult } from './jwt';
export { hashPassword, verifyPassword, createPasswordHasher } from './password';
export type { PasswordHasher } from './password';
export { AuthError } from './auth.deps';
export type { AuthDeps, AuthUserRecord, RefreshSession, RefreshSessionStore, LoginResult, LoginOptions, AuthErrorCode } from './auth.deps';