import { describe, expect, it } from 'vitest';
import { makeHome, makeConnectedStore } from './helpers';

describe('users & audit', () => {
  it('createUser → addMember → listMembers → changeRole', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { services } = h;

    const user = await services.users.createUser({ email: 'budi@mail.test', name: 'Budi' });
    expect(user.status).toBe('active');

    const member = await services.users.addMember(storeId, user.id, 'operator');
    expect(member.role).toBe('operator');
    expect(member.status).toBe('active');

    const list = await services.users.listMembers(storeId);
    expect(list).toHaveLength(1);
    expect(list[0].userId).toBe(user.id);

    const changed = await services.users.changeRole(storeId, user.id, 'manager');
    expect(changed.role).toBe('manager');
  });

  it('satu seller bisa jadi anggota banyak toko — daftar per user', async () => {
    const h = makeHome();
    const { services, repos } = h;
    const storeA = await makeConnectedStore(h, 'Toko A');
    const storeB = await makeConnectedStore(h, 'Toko B');

    const seller = await services.users.createUser({ email: 'seller@mail.test', name: 'Seller' });
    await services.users.addMember(storeA.storeId, seller.id, 'owner');
    await services.users.addMember(storeB.storeId, seller.id, 'admin');

    const perUser = await repos.members.findByUser(seller.id);
    expect(perUser).toHaveLength(2);
    const storeIds = perUser.map((m) => m.storeId).sort();
    expect(storeIds).toEqual([storeA.storeId, storeB.storeId].sort());
    expect(perUser.find((m) => m.storeId === storeA.storeId)?.role).toBe('owner');
    expect(perUser.find((m) => m.storeId === storeB.storeId)?.role).toBe('admin');

    const viaService = await services.users.listStoresForUser(seller.id);
    expect(viaService).toHaveLength(2);

    const other = await services.users.createUser({ email: 'lain@mail.test', name: 'Lain' });
    expect(await services.users.listStoresForUser(other.id)).toHaveLength(0);
  });

  it('getUser untuk id yang tak ada → error', async () => {
    const h = makeHome();
    await expect(h.services.users.getUser('tidak-ada')).rejects.toThrow('not found');
  });

  it('audit log tersimpan & bisa difilter per aksi', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { services } = h;

    await services.audits.log({
      storeId,
      actorId: 'user-1',
      action: 'order.cancel',
      targetType: 'order',
      targetId: 'order-1',
      metadata: { reason: 'buyer batal' },
    });
    await services.audits.log({ actorId: 'user-2', action: 'store.update', targetType: 'store', targetId: storeId });

    const all = await services.audits.list({ storeId });
    expect(all).toHaveLength(1);

    const byAction = await services.audits.list({ action: 'order.cancel' });
    expect(byAction).toHaveLength(1);
    expect(byAction[0].actorId).toBe('user-1');
    expect(byAction[0].metadata?.reason).toBe('buyer batal');
  });
});