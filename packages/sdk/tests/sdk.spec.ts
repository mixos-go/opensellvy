import { describe, expect, it } from 'vitest';
import { OpenSellvy, defineConfig, OpenSellvyError } from '../src/index';
import type { PlatformCode } from '../src/index';
import { registerPlatform } from '../src/connector';
import { createServices } from '../src/module';
import { createMemoryRepositories } from '@opensellvy/module';
import type { ModuleDeps } from '@opensellvy/module';

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
