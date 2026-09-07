import { randomBytes } from 'node:crypto';
import { sha256Hex } from '../crypto/crypto';
import { verifyJwt, signJwt, randomJwtId } from './jwt';
import { verifyPassword } from './password';
import { roleDefinitions } from './rbac/role';
import type { UserContext, RoleCode } from './auth.types';
import type {
  AuthDeps,
  AuthErrorCode,
  LoginOptions,
  LoginResult,
  LoginResultOrChallenge,
  OtpStore,
  OtpRequestInput,
  OtpRequestOptions,
  OtpVerifyInput,
  ProviderProfile,
  RefreshSession,
} from './auth.deps';
import { AuthError } from './auth.deps';

export interface AuthService {
  login(email: string, password: string, opts?: LoginOptions): Promise<LoginResultOrChallenge>;
  refresh(refreshToken: string): Promise<LoginResult>;
  logout(refreshToken: string): Promise<void>;
  logoutAll(userId: string): Promise<void>;
  verifyToken(token: string): Promise<UserContext>;
  /** generate kode OTP; return kode asli utk dikirim (email/SMS) oleh pemanggil. */
  generateOtp(input: OtpRequestInput, opts?: OtpRequestOptions): Promise<string>;
  verifyOtp(input: OtpVerifyInput, opts?: OtpRequestOptions): Promise<LoginResult>;
  enableTwoFactor(userId: string): Promise<void>;
  disableTwoFactor(userId: string): Promise<void>;
  loginWithProvider(profile: ProviderProfile, opts?: LoginOptions): Promise<LoginResultOrChallenge>;
}

const ROLE_PERMISSIONS = new Map(roleDefinitions.map((r) => [r.code, r.permissions]));

const OTP_TTL_SECONDS = 600;
const OTP_WINDOW_SECONDS = 300;
const OTP_MAX_REQUESTS = 3;
const OTP_MAX_ATTEMPTS = 5;
const CHALLENGE_TTL_SECONDS = 300;

function fail(code: AuthErrorCode, message: string): never {
  throw new AuthError(code, message);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function defaultOtpCode(): string {
  const n = randomBytes(3).readUIntBE(0, 3);
  return String(n % 1000000).padStart(6, '0');
}

export function createAuthService(deps: AuthDeps): AuthService {
  const {
    jwtSecret,
    issuer,
    audience,
    accessTokenTtlSeconds = 900,
    refreshTokenTtlSeconds = 30 * 24 * 3600,
  } = deps;

  const now = deps.now ?? Date.now;
  const newCode = deps.otpCodeGenerator ?? defaultOtpCode;

  async function requireUser(email: string, password: string) {
    const user = await deps.findUserByEmail(email);
    if (!user) fail('INVALID_CREDENTIALS', 'Email atau password salah');
    if (!(await verifyPassword(password, user.passwordHash))) {
      fail('INVALID_CREDENTIALS', 'Email atau password salah');
    }
    if (user.status === 'suspended') fail('ACCOUNT_SUSPENDED', 'Akun dinonaktifkan');
    return user;
  }

  function requireOtpStore(): OtpStore {
    if (!deps.otps) fail('PROVIDER_NOT_CONFIGURED', 'OTP belum dikonfigurasi');
    return deps.otps;
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
    const current = new Date(now());
    const sessionId = randomJwtId();
    const signOpts = {
      secret: jwtSecret,
      expiresInSeconds: accessTokenTtlSeconds,
      jti: sessionId,
      ...(issuer ? { issuer } : {}),
      ...(audience ? { audience } : {}),
    };

    const accessToken = signJwt(
      {
        sub: user.id,
        role,
        ...(storeId ? { storeId } : {}),
        prm: ROLE_PERMISSIONS.get(role),
      },
      signOpts,
    );

    const refreshToken = signJwt(
      { sub: user.id, typ: 'refresh' },
      { ...signOpts, expiresInSeconds: refreshTokenTtlSeconds },
    );

    const session: RefreshSession = {
      id: sessionId,
      userId: user.id,
      email: user.email,
      ...(storeId ? { storeId } : {}),
      role,
      createdAt: current.toISOString(),
      expiresAt: new Date(current.getTime() + refreshTokenTtlSeconds * 1000).toISOString(),
      tokenHash: sha256Hex(refreshToken),
    };
    await deps.sessions.save(session);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenTtlSeconds,
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        ...(user.name ? { name: user.name } : {}),
      },
    };
  }

  function issueChallenge(user: { id: string; email: string }, storeId?: string): LoginResultOrChallenge {
    const challengeToken = signJwt(
      {
        sub: user.id,
        email: user.email,
        typ: 'challenge',
        ...(storeId ? { storeId } : {}),
      },
      {
        secret: jwtSecret,
        ...(issuer ? { issuer } : {}),
        ...(audience ? { audience } : {}),
        expiresInSeconds: CHALLENGE_TTL_SECONDS,
      },
    );
    return {
      requiresOtp: true,
      userId: user.id,
      email: user.email,
      challengeToken,
      expiresIn: CHALLENGE_TTL_SECONDS,
    };
  }

  async function requireActiveUser(email: string): Promise<NonNullable<Awaited<ReturnType<AuthDeps['findUserByEmail']>>>> {
    const user = await deps.findUserByEmail(email);
    if (!user || user.status === 'suspended') fail('OTP_NOT_ALLOWED', 'Akun tidak ditemukan atau dinonaktifkan');
    return user;
  }

  async function verifySingleUse(input: OtpVerifyInput, storeId?: string): Promise<LoginResult> {
    const otps = requireOtpStore();
    const current = now();
    let email = input.email;

    if (input.purpose === '2fa') {
      if (!input.challengeToken) fail('CHALLENGE_INVALID', 'Challenge token diperlukan');
      const verified = verifyJwt(input.challengeToken, jwtSecret, {
        ...(audience ? { audience } : {}),
        ...(issuer ? { issuer } : {}),
      });
      if (!verified.valid || verified.payload?.typ !== 'challenge') fail('CHALLENGE_INVALID', 'Challenge token tidak valid');
      email = typeof verified.payload.email === 'string' ? verified.payload.email : email;
      if (email !== input.email) fail('CHALLENGE_INVALID', 'Email tidak cocok dengan challenge');
      storeId = typeof verified.payload.storeId === 'string' ? verified.payload.storeId : storeId;
    }

    const otp = await otps.findByKey(email, input.purpose);
    if (!otp || otp.consumedAt) fail('OTP_INVALID', 'Kode salah atau sudah dipakai');
    if (Date.parse(otp.expiresAt) <= current) fail('OTP_EXPIRED', 'Kode kedaluwarsa');
    if (otp.attempts >= OTP_MAX_ATTEMPTS) fail('OTP_MAX_ATTEMPTS', 'Terlalu banyak percobaan, minta kode baru');
    if (!timingSafeEqual(sha256Hex(input.code), otp.codeHash)) {
      const attempts = await otps.incrementAttempts(email, input.purpose);
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await otps.consume(email, input.purpose);
        fail('OTP_MAX_ATTEMPTS', 'Terlalu banyak percobaan, minta kode baru');
      }
      fail('OTP_INVALID', 'Kode salah');
    }
    await otps.consume(email, input.purpose);

    const user = await requireActiveUser(email);
    if (input.purpose === 'verify_email' && !user.emailVerifiedAt) {
      await deps.markEmailVerified?.(email);
    }
    const role = await resolveRole(user.id, storeId);
    return issue(user, role, storeId);
  }

  return {
    async login(email, password, opts) {
      const user = await requireUser(email, password);
      if (deps.requireEmailVerification && !user.emailVerifiedAt) {
        fail('EMAIL_NOT_VERIFIED', 'Email belum diverifikasi');
      }
      if (user.twoFactorEnabled) return issueChallenge(user, opts?.storeId);
      const role = await resolveRole(user.id, opts?.storeId);
      return issue(user, role, opts?.storeId);
    },

    async refresh(refreshToken) {
      const verified = verifyJwt(refreshToken, jwtSecret, {
        ...(audience ? { audience } : {}),
        ...(issuer ? { issuer } : {}),
      });
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
      const verified = verifyJwt(token, jwtSecret, {
        ...(audience ? { audience } : {}),
        ...(issuer ? { issuer } : {}),
      });
      if (!verified.valid) {
        fail(verified.reason === 'expired' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID', 'Access token tidak valid');
      }
      const payload = verified.payload!;
      const role = (payload.role as RoleCode) ?? 'viewer';
      const context: UserContext = {
        id: payload.sub,
        ...(typeof payload.storeId === 'string' ? { storeId: payload.storeId } : {}),
        role,
        permissions: Array.isArray(payload.prm) ? (payload.prm as string[]) : (ROLE_PERMISSIONS.get(role) ?? []),
        expiresAt: new Date(payload.exp! * 1000).toISOString(),
      };
      return context;
    },

    async generateOtp(input: OtpRequestInput, _opts?: OtpRequestOptions) {
      const otps = requireOtpStore();
      const current = now();

      const user = await deps.findUserByEmail(input.email);
      if (!user || user.status === 'suspended') fail('OTP_NOT_ALLOWED', 'Akun tidak ditemukan atau dinonaktifkan');
      if (input.purpose === 'login' && user.passwordHash) {
        fail('OTP_NOT_ALLOWED', 'Akun memakai password — gunakan password + 2FA');
      }
      if (input.purpose === '2fa' && !user.twoFactorEnabled) {
        fail('OTP_NOT_ALLOWED', 'OTP 2FA tidak tersedia untuk akun ini');
      }

      const existing = await otps.findByKey(input.email, input.purpose);
      const withinWindow = existing !== undefined && current - Date.parse(existing.createdAt) < OTP_WINDOW_SECONDS * 1000;
      if (withinWindow && existing!.requestCount >= OTP_MAX_REQUESTS) {
        fail('OTP_REQUEST_TOO_FREQUENT', 'Terlalu banyak permintaan kode, coba lagi nanti');
      }
      const requestCount = withinWindow ? existing!.requestCount + 1 : 1;

      const code = newCode();
      await otps.save({
        email: input.email,
        purpose: input.purpose,
        codeHash: sha256Hex(code),
        expiresAt: new Date(current + OTP_TTL_SECONDS * 1000).toISOString(),
        attempts: 0,
        requestCount,
        createdAt: new Date(current).toISOString(),
      });
      return code;
    },

    async verifyOtp(input: OtpVerifyInput, opts?: OtpRequestOptions) {
      return verifySingleUse(input, opts?.storeId);
    },

    async enableTwoFactor(userId) {
      if (!deps.setTwoFactor) fail('PROVIDER_NOT_CONFIGURED', '2FA belum dikonfigurasi');
      await deps.setTwoFactor(userId, true);
    },

    async disableTwoFactor(userId) {
      if (!deps.setTwoFactor) fail('PROVIDER_NOT_CONFIGURED', '2FA belum dikonfigurasi');
      await deps.setTwoFactor(userId, false);
    },

    async loginWithProvider(profile: ProviderProfile, opts?: LoginOptions) {
      if (!deps.identities) fail('PROVIDER_NOT_CONFIGURED', 'Login eksternal belum dikonfigurasi');
      let user = await deps.identities.findUserByProvider(profile.provider, profile.providerUserId);

      if (!user) {
        user = await deps.findUserByEmail(profile.email);
        if (user) {
          if (user.status === 'suspended') fail('ACCOUNT_SUSPENDED', 'Akun dinonaktifkan');
          await deps.identities.linkProvider(user.id, profile);
          if (!user.emailVerifiedAt) await deps.markEmailVerified?.(user.email);
        } else {
          if (!deps.createUser) fail('PROVIDER_NOT_CONFIGURED', 'Registrasi via eksternal belum dikonfigurasi');
          const emailVerifiedAt = new Date(now()).toISOString();
          user = await deps.createUser({
            id: randomJwtId(),
            email: profile.email,
            ...(profile.name ? { name: profile.name } : {}),
            emailVerifiedAt,
          });
          await deps.identities.linkProvider(user.id, profile);
        }
      }

      if (user.status === 'suspended') fail('ACCOUNT_SUSPENDED', 'Akun dinonaktifkan');
      if (deps.requireEmailVerification && !user.emailVerifiedAt) {
        fail('EMAIL_NOT_VERIFIED', 'Email belum diverifikasi');
      }
      if (user.twoFactorEnabled) return issueChallenge(user, opts?.storeId);
      const role = await resolveRole(user.id, opts?.storeId);
      return issue(user, role, opts?.storeId);
    },
  };
}

export { verifyJwt, signJwt, randomJwtId } from './jwt';
export type { JwtPayload, JwtSignOptions, JwtVerifyResult } from './jwt';
export { hashPassword, verifyPassword, createPasswordHasher } from './password';
export type { PasswordHasher } from './password';
export { AuthError } from './auth.deps';
export type {
  AuthDeps,
  AuthUserRecord,
  RefreshSession,
  RefreshSessionStore,
  LoginResult,
  LoginOptions,
  AuthErrorCode,
  OtpPurpose,
  OtpCode,
  OtpStore,
  OtpVerifyInput,
  ProviderName,
  ProviderProfile,
  IdentityStore,
  CreateUserInput,
  TwoFactorChallenge,
  LoginResultOrChallenge,
} from './auth.deps';