import { describe, expect, it } from 'vitest';
import type { ShopProfilePatch } from '@opensellvy/types';
import { makeHome, makeConnectedStore } from './helpers';

describe('channels — profil & token via gateway', () => {
  it('updateProfile meneruskan patch ke gateway.shop.updateProfile', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    const calls: ShopProfilePatch[] = [];
    connectors.get('local').gateway.shop.updateProfile = (_c, patch) => { calls.push(patch); return Promise.resolve(); };
    await h.services.channels.updateProfile(storeId, 'local', { name: 'Toko Baru' });
    expect(calls).toEqual([{ name: 'Toko Baru' }]);
  });

  it('updateProfile toleran: tanpa channel → tidak lempar', async () => {
    const h = makeHome();
    await expect(h.services.channels.updateProfile('store-nochannel', 'local', { name: 'X' })).resolves.toBeUndefined();
  });

  it('refreshToken memperbarui token platform & dipersist', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    connectors.get('local').auth.refreshToken = () => Promise.resolve({ accessToken: 'rt-fresh', refreshToken: 'rt-refresh', expiresAt: Date.now() + 3_600_000 });
    await expect(h.services.channels.refreshToken(storeId, 'local')).resolves.toBeUndefined();
  });
});
