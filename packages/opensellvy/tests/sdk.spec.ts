import { describe, expect, it } from 'vitest';
import { OpenSellvy } from '../src/sdk';
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
    // verify storage terpakai: objek repo yang sama menerima data
    const stores = await (injected as Repos).stores.list();
    expect(stores.some((s) => s.slug === 'toko-b')).toBe(true);
  });
});
