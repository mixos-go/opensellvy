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