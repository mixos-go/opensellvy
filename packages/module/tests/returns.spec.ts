import { describe, expect, it } from 'vitest';
import { makeHome, makeConnectedStore, makeOrder } from './helpers';

describe('returns — siklus proses return order', () => {
  it('create → transition → notifyPlatform (adapter menerima aksi)', async () => {
    const actions: Array<{ returnId: string; action: string }> = [];
    const h = makeHome();
    h.register({
      orders: [],
      afterManageReturn: (x) => {
        actions.push(x);
        return undefined;
      },
    });
    const { storeId, channelId } = await makeConnectedStore(h);
    const { repos, services } = h;

    const order = makeOrder(storeId, { channelId, id: 'order-return-1', platformOrderId: 'LOC-R1', createdAt: '2026-01-10T00:00:00.000Z' });
    await repos.orders.save(order);
    await services.orders.updateStatus(order.id, { action: 'ship', trackingNumber: 'JNE001', courier: 'jne' });

    const created = await services.returns.create({
      orderId: order.id,
      channelId,
      lines: [{ orderLineId: order.lines[0].id, sku: order.lines[0].sku, quantity: 1 }],
      reason: 'defective',
      note: 'screening retak',
    });
    expect(created.status).toBe('requested');

    const approved = await services.returns.transition(created.id, 'approved');
    expect(approved.status).toBe('approved');

    await services.returns.notifyPlatform(created.id, storeId, 'receive');
    expect(actions).toEqual([{ returnId: created.id, action: 'receive' }]);

    const byOrder = await services.returns.listByOrder(order.id);
    expect(byOrder.map((r) => r.id)).toContain(created.id);
  });

  it('notifyPlatform menolak jika channel return tidak terhubung', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { services } = h;

    const created = await services.returns.create({
      orderId: 'order-x',
      channelId: 'chan-yang-tidak-ada',
      lines: [],
      reason: 'other',
    });
    await expect(services.returns.notifyPlatform(created.id, storeId, 'approve')).rejects.toThrow('Channel');
  });
});