import { describe, expect, it } from 'vitest';
import { createAuthService } from '../src/auth/auth.service';
import { AuthError } from '../src/auth/auth.deps';
import { hashPassword, verifyPassword } from '../src/auth/password';
import { signJwt, verifyJwt } from '../src/auth/jwt';
import type { RefreshSession, RefreshSessionStore, AuthUserRecord, LoginResult, LoginResultOrChallenge, OtpCode, OtpStore, IdentityStore } from '../src/auth/auth.deps';
import type { RoleCode } from '../src/auth/auth.types';

function memorySessionStore(): RefreshSessionStore {
  const byHash = new Map<string, RefreshSession>();
  const byUser = new Map<string, RefreshSession[]>();
  return {
    async save(session) {
      byHash.set(session.tokenHash, session);
      byUser.set(session.userId, [...(byUser.get(session.userId) ?? []), session]);
    },
    async findByTokenHash(tokenHash) {
      return byHash.get(tokenHash);
    },
    async deleteById(id) {
      const found = [...byHash.values()].find((s) => s.id === id);
      if (found) {
        byHash.delete(found.tokenHash);
        byUser.set(found.userId, (byUser.get(found.userId) ?? []).filter((s) => s.id !== id));
      }
    },
    async revokeAllForUser(userId) {
      for (const s of byUser.get(userId) ?? []) byHash.delete(s.tokenHash);
      byUser.delete(userId);
    },
  };
}

function memoryOtpStore(): OtpStore {
  const codes = new Map<string, OtpCode>();
  const key = (email: string, purpose: string) => `${email.toLowerCase()}|${purpose}`;
  return {
    async save(code) {
      codes.set(key(code.email, code.purpose), code);
    },
    async findByKey(email, purpose) {
      return codes.get(key(email, purpose));
    },
    async incrementAttempts(email, purpose) {
      const code = codes.get(key(email, purpose));
      if (!code) throw new Error('otp not found');
      code.attempts += 1;
      return code.attempts;
    },
    async consume(email, purpose) {
      const code = codes.get(key(email, purpose));
      if (code) code.consumedAt = new Date().toISOString();
    },
  };
}

function memoryIdentityStore(users: Map<string, AuthUserRecord>): IdentityStore {
  const links = new Map<string, string>();
  return {
    async findUserByProvider(provider, providerUserId) {
      const userId = links.get(`${provider}|${providerUserId}`);
      if (!userId) return undefined;
      for (const u of users.values()) if (u.id === userId) return u;
      return undefined;
    },
    async linkProvider(userId, profile) {
      links.set(`${profile.provider}|${profile.providerUserId}`, userId);
    },
  };
}

interface Fixture {
  auth: ReturnType<typeof createAuthService>;
  users: Map<string, AuthUserRecord>;
}

async function makeFixture(): Promise<Fixture> {
  const users = new Map<string, AuthUserRecord>([
    ['owner@warung.id', { id: 'u-1', email: 'owner@warung.id', name: 'Budi', passwordHash: await hashPassword('rahasia123'), status: 'active', emailVerifiedAt: new Date().toISOString() }],
    ['ops@warung.id', { id: 'u-2', email: 'ops@warung.id', passwordHash: await hashPassword('ops123'), status: 'active', emailVerifiedAt: new Date().toISOString() }],
    ['sus@warung.id', { id: 'u-3', email: 'sus@warung.id', passwordHash: await hashPassword('sus123'), status: 'suspended' }],
  ]);
  const members = new Map<string, RoleCode>([
    ['s-1|u-1', 'owner'],
    ['s-1|u-2', 'manager'],
    ['s-2|u-2', 'viewer'],
  ]);
  const auth = createAuthService({
    jwtSecret: 'test-secret-untuk-unit-test',
    issuer: 'opensellvy',
    audience: 'panel',
    findUserByEmail: async (email) => users.get(email),
    getMemberRole: async (storeId, userId) => members.get(`${storeId}|${userId}`),
    sessions: memorySessionStore(),
    otps: memoryOtpStore(),
    identities: memoryIdentityStore(users),
    createUser: async (input) => {
      const user: AuthUserRecord = {
        id: input.id,
        email: input.email,
        ...(input.name ? { name: input.name } : {}),
        passwordHash: '',
        status: 'active',
        ...(input.emailVerifiedAt ? { emailVerifiedAt: input.emailVerifiedAt } : {}),
      };
      users.set(input.email, user);
      return user;
    },
    markEmailVerified: async (email) => {
      const user = users.get(email);
      if (user) user.emailVerifiedAt = user.emailVerifiedAt ?? new Date().toISOString();
    },
    setTwoFactor: async (userId, enabled) => {
      for (const u of users.values()) if (u.id === userId) u.twoFactorEnabled = enabled;
    },
    otpCodeGenerator: () => '123456',
    now: () => Date.now(),
  });
  return { auth, users };
}

async function fullLogin(auth: ReturnType<typeof createAuthService>, email: string, password: string, opts?: { storeId?: string }): Promise<LoginResult> {
  const result = await auth.login(email, password, opts);
  if ('requiresOtp' in result) throw new Error('unexpected 2fa challenge');
  return result;
}

function isChallenge(r: LoginResultOrChallenge): r is { requiresOtp: true; userId: string; email: string; challengeToken: string } {
  return 'requiresOtp' in r;
}

describe('password (scrypt)', () => {
  it('hash/verify roundtrip + menolak password salah & hash rusak', async () => {
    const hash = await hashPassword('rahasia123');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword('rahasia123', hash)).toBe(true);
    expect(await verifyPassword('salah', hash)).toBe(false);
    expect(await verifyPassword('x', 'bukan-hash')).toBe(false);
  });
});

describe('jwt HS256', () => {
  it('sign → verify valid; payload benar', () => {
    const token = signJwt({ sub: 'u-1' }, { secret: 's', issuer: 'iss', expiresInSeconds: 60 });
    const result = verifyJwt(token, 's', { issuer: 'iss' });
    expect(result.valid).toBe(true);
    expect(result.payload?.sub).toBe('u-1');
    expect(result.payload?.iat).toBeTypeOf('number');
  });

  it('tamper body/secret → bad-signature', () => {
    const token = signJwt({ sub: 'u-1' }, { secret: 's1', expiresInSeconds: 60 });
    const [a, b, c] = token.split('.');
    expect(verifyJwt(`${a}.${Buffer.from(JSON.stringify({ sub: 'u-2', iat: Date.now() / 1000, exp: 9999999999 })).toString('base64url')}.${c}`, 's1').valid).toBe(false);
    expect(verifyJwt(token, 's2').reason).toBe('bad-signature');
  });

  it('expired → reason expired; maxAge dilanggar → expired', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signJwt({ sub: 'u-1', iat: now - 100, exp: now - 50 }, { secret: 's' });
    expect(verifyJwt(token, 's').reason).toBe('expired');
  });
});

describe('AuthService login/verify/refresh/logout', () => {
  it('login store-scoped berhasil → context role+permissions sesuai membership', async () => {
    const { auth } = await makeFixture();
    const result = await fullLogin(auth, 'owner@warung.id', 'rahasia123', { storeId: 's-1' });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.id).toBe('u-1');

    const ctx = await auth.verifyToken(result.accessToken);
    expect(ctx.id).toBe('u-1');
    expect(ctx.storeId).toBe('s-1');
    expect(ctx.role).toBe('owner');
    expect(ctx.permissions).toContain('user.manage');
    expect(ctx.expiresAt).toBeTruthy();
  });

  it('login tanpa storeId (issuer scope) → role owner', async () => {
    const { auth } = await makeFixture();
    const result = await fullLogin(auth, 'ops@warung.id', 'ops123');
    const ctx = await auth.verifyToken(result.accessToken);
    expect(ctx.storeId).toBeUndefined();
    expect(ctx.role).toBe('owner');
  });

  it('login gagal: password salah & email tak dikenal → INVALID_CREDENTIALS (tanpa bocorkan mana yang salah)', async () => {
    const { auth } = await makeFixture();
    await expect(auth.login('owner@warung.id', 'salah')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(auth.login('nope@warung.id', 'x')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(auth.login('owner@warung.id', 'salah')).rejects.toBeInstanceOf(AuthError);
  });

  it('akun suspended & non-member store ditolak', async () => {
    const { auth } = await makeFixture();
    await expect(auth.login('sus@warung.id', 'sus123')).rejects.toMatchObject({ code: 'ACCOUNT_SUSPENDED' });
    // u-2 di s-1 → manager (benar), di s-9 → bukan anggota
    await expect(auth.login('ops@warung.id', 'ops123', { storeId: 's-9' })).rejects.toMatchObject({ code: 'NOT_A_MEMBER' });
  });

  it('refresh: rotate — refresh lama jadi invalid, token baru jalan', async () => {
    const { auth } = await makeFixture();
    const first = await fullLogin(auth, 'ops@warung.id', 'ops123', { storeId: 's-1' });
    const second = await auth.refresh(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(second.user.id).toBe('u-2');

    const ctx = await auth.verifyToken(second.accessToken);
    expect(ctx.role).toBe('manager');
    expect(ctx.storeId).toBe('s-1');

    // refresh lama sudah di-revoke
    await expect(auth.refresh(first.refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });
  });

  it('refresh dengan token rusak → SESSION_INVALID; token expired → SESSION_EXPIRED', async () => {
    const { auth } = await makeFixture();
    const { refreshToken } = await fullLogin(auth, 'ops@warung.id', 'ops123', { storeId: 's-1' });
    await expect(auth.refresh(refreshToken.slice(0, -4) + 'abcd')).rejects.toMatchObject({ code: 'SESSION_INVALID' });

    const bad = signJwt({ sub: 'u-2', typ: 'refresh' }, { secret: 'test-secret-untuk-unit-test', issuer: 'opensellvy', audience: 'panel', expiresInSeconds: -1, jti: 'j-wont-match' });
    await expect(auth.refresh(bad)).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
  });

  it('logout mencabut refresh (session direvoke)', async () => {
    const { auth } = await makeFixture();
    const { refreshToken } = await fullLogin(auth, 'ops@warung.id', 'ops123', { storeId: 's-1' });
    await auth.logout(refreshToken);
    await expect(auth.refresh(refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });
  });

  it('logoutAll mencabut seluruh session user', async () => {
    const { auth } = await makeFixture();
    const a = await fullLogin(auth, 'ops@warung.id', 'ops123');
    const b = await fullLogin(auth, 'ops@warung.id', 'ops123');
    await auth.logoutAll('u-2');
    await expect(auth.refresh(a.refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });
    await expect(auth.refresh(b.refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });
  });

  it('verifyToken menolak token expired & token dengan signature salah', async () => {
    const { auth } = await makeFixture();
    const { accessToken } = await fullLogin(auth, 'ops@warung.id', 'ops123', { storeId: 's-1' });
    const [h, p] = accessToken.split('.');
    const tampered = `${h}.${p}.tampersig`;
    await expect(auth.verifyToken(tampered)).rejects.toMatchObject({ code: 'TOKEN_INVALID' });

    const expired = signJwt({ sub: 'u-2', role: 'manager', prm: [], storeId: 's-1' }, { secret: 'test-secret-untuk-unit-test', issuer: 'opensellvy', audience: 'panel', expiresInSeconds: -5 });
    await expect(auth.verifyToken(expired)).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
  });
});

describe('OTP: generateOtp/verifyOtp', () => {
  it('akun tanpa password: login OTP → kode 1x pakai', async () => {
    const { auth, users } = await makeFixture();
    users.set('otp@warung.id', { id: 'u-otp', email: 'otp@warung.id', name: 'Sari', passwordHash: '', status: 'active' });

    const code = await auth.generateOtp({ email: 'otp@warung.id', purpose: 'login' });
    expect(code).toBe('123456'); // deterministik via deps.otpCodeGenerator

    const result = await auth.verifyOtp({ purpose: 'login', email: 'otp@warung.id', code });
    expect(result.accessToken).toBeTruthy();
    expect((await auth.verifyToken(result.accessToken)).id).toBe('u-otp');

    // 1x pakai — dimanipulasi ulang ditolak
    await expect(auth.verifyOtp({ purpose: 'login', email: 'otp@warung.id', code })).rejects.toMatchObject({ code: 'OTP_INVALID' });
  });

  it('akun ber-password TIDAK boleh login OTP (harus password + 2FA)', async () => {
    const { auth } = await makeFixture();
    await expect(auth.generateOtp({ email: 'ops@warung.id', purpose: 'login' })).rejects.toMatchObject({ code: 'OTP_NOT_ALLOWED' });
  });

  it('kode salah → OTP_INVALID; terlalu banyak → terkunci (OTP_MAX_ATTEMPTS)', async () => {
    const { auth, users } = await makeFixture();
    users.set('x@warung.id', { id: 'u-x', email: 'x@warung.id', passwordHash: '', status: 'active' });
    await auth.generateOtp({ email: 'x@warung.id', purpose: 'login' });
    for (let i = 0; i < 4; i += 1) {
      await expect(auth.verifyOtp({ purpose: 'login', email: 'x@warung.id', code: '000001' })).rejects.toMatchObject({ code: 'OTP_INVALID' });
    }
    // percobaan ke-5 menembus cap → terkunci
    await expect(auth.verifyOtp({ purpose: 'login', email: 'x@warung.id', code: '000001' })).rejects.toMatchObject({ code: 'OTP_MAX_ATTEMPTS' });
    // kode benar pun tak berguna lagi (sudah dikonsumsi saat terkunci)
    await expect(auth.verifyOtp({ purpose: 'login', email: 'x@warung.id', code: '123456' })).rejects.toMatchObject({ code: 'OTP_INVALID' });
  });

  it('verify_email: tandai verified lalu login langsung', async () => {
    const { auth, users } = await makeFixture();
    users.set('baru@warung.id', { id: 'u-v', email: 'baru@warung.id', name: 'Baru', passwordHash: '', status: 'active' });

    const code = await auth.generateOtp({ email: 'baru@warung.id', purpose: 'verify_email' });
    const result = await auth.verifyOtp({ purpose: 'verify_email', email: 'baru@warung.id', code });
    expect(result.accessToken).toBeTruthy();
    expect(users.get('baru@warung.id')?.emailVerifiedAt).toBeTruthy();
  });
});

describe('2FA: challenge password → OTP', () => {
  it('login password → challenge; verifyOtp(2fa) → token', async () => {
    const { auth } = await makeFixture();
    await auth.enableTwoFactor('u-2'); // ops@warung.id

    const challenge = await auth.login('ops@warung.id', 'ops123', { storeId: 's-1' });
    expect(isChallenge(challenge)).toBe(true);
    if (!isChallenge(challenge)) throw new Error('harus challenge');

    // tanpa challenge → kode tetap tidak berguna
    await expect(auth.verifyOtp({ purpose: '2fa', email: 'ops@warung.id', code: '123456' })).rejects.toMatchObject({ code: 'CHALLENGE_INVALID' });

    await auth.generateOtp({ email: 'ops@warung.id', purpose: '2fa' });
    const result = await auth.verifyOtp({ purpose: '2fa', email: 'ops@warung.id', code: '123456', challengeToken: challenge.challengeToken });
    const ctx = await auth.verifyToken(result.accessToken);
    expect(ctx.id).toBe('u-2');
    expect(ctx.storeId).toBe('s-1');
  });
});

describe('external identity (google)', () => {
  it('provider baru → buat user + link; login ulang via provider → user sama', async () => {
    const { auth } = await makeFixture();
    const profile = { provider: 'google', providerUserId: 'google-1', email: 'budi@gmail.com', name: 'Budi G' };
    const result = await auth.loginWithProvider(profile);
    expect(result.accessToken).toBeTruthy();

    const again = await auth.loginWithProvider(profile);
    if ('requiresOtp' in again) throw new Error('tidak boleh challenge');
    expect(again.user.email).toBe('budi@gmail.com');
  });

  it('email cocok user password → auto-link tanpa buat user baru', async () => {
    const { auth, users } = await makeFixture();
    const profile = { provider: 'google', providerUserId: 'google-2', email: 'ops@warung.id', name: 'Ops Google' };
    const result = await auth.loginWithProvider(profile);
    if ('requiresOtp' in result) throw new Error('tidak boleh challenge');
    expect(result.user.id).toBe('u-2');
    expect(users.size).toBe(3); // tidak menambah user baru
  });

  it('akun Google yg 2FA aktif → challenge 2fa', async () => {
    const { auth } = await makeFixture();
    await auth.enableTwoFactor('u-2');
    const profile = { provider: 'google', providerUserId: 'google-3', email: 'ops@warung.id' };
    const challenge = await auth.loginWithProvider(profile);
    expect(isChallenge(challenge)).toBe(true);
  });
});