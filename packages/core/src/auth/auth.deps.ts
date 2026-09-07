import type { ID, ISO8601 } from '@opensellvy/types';
import type { RoleCode } from './auth.types';

export interface AuthUserRecord {
  id: ID;
  email: string;
  name?: string;
  /** hash dari core/auth password (scrypt), bukan plaintext */
  passwordHash: string;
  status?: 'active' | 'suspended';
  /** saat email diverifikasi (ISO8601). tidak ada = belum verified */
  emailVerifiedAt?: ISO8601;
  /** akun mewajibkan OTP lapisan kedua (2FA) saat login */
  twoFactorEnabled?: boolean;
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
  /** wajibkan email verified sebelum login (default false — backward-compat) */
  requireEmailVerification?: boolean;
  /** injectable clock (unix ms) utk test */
  now?: () => number;
  /** injectable generator kode OTP (default 6 digit acak) */
  otpCodeGenerator?: () => string;
  findUserByEmail(email: string): Promise<AuthUserRecord | undefined>;
  /** role user di sebuah store; wajib untuk login store-scoped */
  getMemberRole(storeId: ID, userId: ID): Promise<RoleCode | undefined>;
  sessions: RefreshSessionStore;
  /** store OTP — wajib utk method OTP (generateOtp/verifyOtp) */
  otps?: OtpStore;
  /** identitas provider eksternal — wajib utk loginWithProvider */
  identities?: IdentityStore;
  createUser?(input: CreateUserInput): Promise<AuthUserRecord>;
  markEmailVerified?(email: string): Promise<void>;
  setTwoFactor?(userId: ID, enabled: boolean): Promise<void>;
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

/* ---- OTP (passwordless / verifikasi email / 2FA) ---- */

export type OtpPurpose = 'login' | 'verify_email' | '2fa';

export interface OtpCode {
  email: string;
  purpose: OtpPurpose;
  /** sha256Hex(kode asli) — jangan simpan plaintext */
  codeHash: string;
  expiresAt: ISO8601;
  attempts: number;
  /** jumlah permintaan dalam window rate-limit */
  requestCount: number;
  createdAt: ISO8601;
  consumedAt?: ISO8601;
}

export interface OtpStore {
  save(code: OtpCode): Promise<void>;
  findByKey(email: string, purpose: OtpPurpose): Promise<OtpCode | undefined>;
  incrementAttempts(email: string, purpose: OtpPurpose): Promise<number>;
  consume(email: string, purpose: OtpPurpose): Promise<void>;
}

export interface OtpRequestInput {
  email: string;
  purpose: OtpPurpose;
}

export interface OtpRequestOptions {
  storeId?: ID;
}

/** verifyOtp — union diskriminan oleh purpose */
export type OtpVerifyInput =
  | { purpose: 'login' | 'verify_email'; email: string; code: string }
  | { purpose: '2fa'; email: string; code: string; challengeToken: string };

/* ---- Identitas eksternal (Google, dll) ---- */

export type ProviderName = 'google';

export interface ProviderProfile {
  provider: ProviderName;
  providerUserId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface IdentityStore {
  findUserByProvider(provider: ProviderName, providerUserId: string): Promise<AuthUserRecord | undefined>;
  linkProvider(userId: ID, profile: ProviderProfile): Promise<void>;
}

export interface CreateUserInput {
  id: ID;
  email: string;
  name?: string;
  emailVerifiedAt?: ISO8601;
}

/* ---- 2FA challenge ---- */

export interface TwoFactorChallenge {
  requiresOtp: true;
  userId: ID;
  email: string;
  /** JWT singkat (typ 'challenge') — bukti password/email sudah terverifikasi */
  challengeToken: string;
  expiresIn: number;
}

export type LoginResultOrChallenge = LoginResult | TwoFactorChallenge;

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_SUSPENDED'
  | 'NOT_A_MEMBER'
  | 'EMAIL_NOT_VERIFIED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'SESSION_INVALID'
  | 'SESSION_EXPIRED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_MAX_ATTEMPTS'
  | 'OTP_REQUEST_TOO_FREQUENT'
  | 'OTP_NOT_ALLOWED'
  | 'CHALLENGE_INVALID'
  | 'PROVIDER_NOT_CONFIGURED';

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}