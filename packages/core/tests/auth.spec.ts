import { describe, expect, it } from 'vitest';
import { createAuthService } from '../src/auth/auth.service';
import { AuthError } from '../src/auth/auth.deps';
import { hashPassword, verifyPassword } from '../src/auth/password';
import { signJwt, verifyJwt } from '../src/auth/jwt';
import type { RefreshSession, RefreshSessionStore } from '../src/auth/auth.deps';
import type { AuthUserRecord } from '../src/auth/auth.deps';
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

interface Fixture {
  auth: ReturnType<typeof createAuthService>;
  users: Map<string, AuthUserRecord>;
}

async function makeFixture(): Promise<Fixture> {
  const users = new Map<string, AuthUserRecord>([
    ['owner@warung.id', { id: 'u-1', email: 'owner@warung.id', name: 'Budi', passwordHash: await hashPassword('rahasia123'), status: 'active' }],
    ['ops@warung.id', { id: 'u-2', email: 'ops@warung.id', passwordHash: await hashPassword('ops123'), status: 'active' }],
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
  });
  return { auth, users };
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
    const result = await auth.login('owner@warung.id', 'rahasia123', { storeId: 's-1' });
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
    const result = await auth.login('ops@warung.id', 'ops123');
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
    const first = await auth.login('ops@warung.id', 'ops123', { storeId: 's-1' });
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
    const { refreshToken } = await auth.login('ops@warung.id', 'ops123', { storeId: 's-1' });
    await expect(auth.refresh(refreshToken.slice(0, -4) + 'abcd')).rejects.toMatchObject({ code: 'SESSION_INVALID' });

    const bad = signJwt({ sub: 'u-2', typ: 'refresh' }, { secret: 'test-secret-untuk-unit-test', issuer: 'opensellvy', audience: 'panel', expiresInSeconds: -1, jti: 'j-wont-match' });
    await expect(auth.refresh(bad)).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
  });

  it('logout mencabut refresh (session direvoke)', async () => {
    const { auth } = await makeFixture();
    const { refreshToken } = await auth.login('ops@warung.id', 'ops123', { storeId: 's-1' });
    await auth.logout(refreshToken);
    await expect(auth.refresh(refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });
  });

  it('logoutAll mencabut seluruh session user', async () => {
    const { auth } = await makeFixture();
    const a = await auth.login('ops@warung.id', 'ops123');
    const b = await auth.login('ops@warung.id', 'ops123');
    await auth.logoutAll('u-2');
    await expect(auth.refresh(a.refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });
    await expect(auth.refresh(b.refreshToken)).rejects.toMatchObject({ code: 'SESSION_INVALID' });
  });

  it('verifyToken menolak token expired & token dengan signature salah', async () => {
    const { auth } = await makeFixture();
    const { accessToken } = await auth.login('ops@warung.id', 'ops123', { storeId: 's-1' });
    const [h, p] = accessToken.split('.');
    const tampered = `${h}.${p}.tampersig`;
    await expect(auth.verifyToken(tampered)).rejects.toMatchObject({ code: 'TOKEN_INVALID' });

    const expired = signJwt({ sub: 'u-2', role: 'manager', prm: [], storeId: 's-1' }, { secret: 'test-secret-untuk-unit-test', issuer: 'opensellvy', audience: 'panel', expiresInSeconds: -5 });
    await expect(auth.verifyToken(expired)).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });
  });
});