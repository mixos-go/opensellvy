import { describe, expect, it } from 'vitest';
import { OpenSellvy, defineConfig, OpenSellvyError } from '../src/index';
import type { PlatformCode } from '../src/index';
import { registerPlatform } from '../src/connector';
import { createServices } from '../src/module';
import { createMemoryRepositories } from '@opensellvy/module';
import type { ModuleDeps } from '@opensellvy/module';
import { hashPassword } from '../src/core';

type Repos = ModuleDeps['repos'];

describe('OpenSellvy SDK', () => {
  it('builds in-memory services by default (no databaseUrl)', async () => {
    const sdk = new OpenSellvy({ environment: 'sandbox' });
    const modules = await sdk.open();
    const store = await modules.stores.create({ name: 'Toko A', slug: 'toko-a' });
    expect(store.name).toBe('Toko A');
    const found = await modules.stores.getById(store.id);
    expect(found).toBeDefined();
  });

  it('uses an injected repositories provider', async () => {
    const injected = createMemoryRepositories();
    const sdk = new OpenSellvy({ environment: 'sandbox' }, { repositories: injected });
    const modules = await sdk.open();
    await modules.stores.create({ name: 'Toko B', slug: 'toko-b' });
    const stores = await (injected as Repos).stores.list();
    expect(stores.some((s) => s.slug === 'toko-b')).toBe(true);
  });

  it('sdk.auth: login/refresh/verify/logout memakai core/auth + repos memory', async () => {
    const repos = createMemoryRepositories();
    const stamp = new Date().toISOString();
    await repos.users.save({
      id: 'u-auth',
      email: 'admin@example.com',
      name: 'Admin',
      status: 'active',
      createdAt: stamp,
      updatedAt: stamp,
      passwordHash: await hashPassword('rahasia123'),
    });

    const sdk = new OpenSellvy({ auth: { jwtSecret: 'test-secret' } }, { repositories: repos });
    await sdk.open();
    const auth = await sdk.auth;

    const login = await auth.login('admin@example.com', 'rahasia123');
    expect(login.accessToken).toBeTruthy();
    expect(login.refreshToken).toBeTruthy();
    expect(login.sessionId).toBeTruthy();

    const ctx = await auth.verifyToken(login.accessToken);
    expect(ctx.id).toBe('u-auth');
    expect(ctx.role).toBe('owner');

    const refreshed = await auth.refresh(login.refreshToken);
    expect(refreshed.accessToken).not.toBe(login.accessToken);
    expect(refreshed.sessionId).not.toBe(login.sessionId);

    await auth.logout(refreshed.refreshToken);
    await expect(auth.refresh(refreshed.refreshToken)).rejects.toThrow();
  });

  it('sdk.auth error bila config.auth.jwtSecret belum di-set', async () => {
    const sdk = new OpenSellvy({ environment: 'sandbox' });
    await expect(sdk.auth).rejects.toMatchObject({ code: 'AUTH_NOT_CONFIGURED' });
  });
});

describe('@opensellvy/sdk main entry exports', () => {
  it('exports OpenSellvy, defineConfig, OpenSellvyError (runtime) and PlatformCode (type)', () => {
    expect(OpenSellvy).toBeDefined();
    expect(typeof defineConfig).toBe('function');
    expect(OpenSellvyError).toBeDefined();
    // PlatformCode is a type-only export — verify it resolves from the main entry at compile time.
    const code: PlatformCode = 'local';
    expect(code).toBe('local');
  });

  it('exports OpenSellvyOptions type (compile-time check)', () => {
    const opts: import('../src/sdk').OpenSellvyOptions = {};
    expect(opts).toBeDefined();
  });
});

describe('@opensellvy/sdk subpath exports', () => {
  it('connector subpath exports registerPlatform', () => {
    expect(typeof registerPlatform).toBe('function');
  });

  it('module subpath exports createServices', () => {
    expect(typeof createServices).toBe('function');
  });
});
