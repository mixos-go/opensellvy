import { describe, expect, it } from 'vitest';
import { makeHome, makeConnectedStore, makeOrder } from './helpers';

describe('order.updateStatus — status machine & efek samping', () => {
  it('cancel → cancelledAt & propagasi balik ke adapter', async () => {
    const patches: Array<{ platformOrderId: string; patch: unknown }> = [];
    const h = makeHome();
    h.register({ orders: [], afterUpdateOrder: (x) => void patches.push(x) });
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    const order = makeOrder(storeId, { id: 'order-ed-1', platformOrderId: 'LOC-ED1', status: 'paid' });
    await repos.orders.save(order);

    const cancelled = await services.orders.updateStatus(order.id, { action: 'cancel', reason: 'buyer batal' }, 'admin-1');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).toBeTruthy();
    expect(patches).toEqual([
      { platformOrderId: 'LOC-ED1', patch: { status: 'cancelled' } },
    ]);
  });

  it('ship + deliver menyimpan shippedAt/deliveredAt dan tracking', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    const order = makeOrder(storeId, { id: 'order-ed-2', platformOrderId: 'LOC-ED2', status: 'paid' });
    await repos.orders.save(order);

    const shipped = await services.orders.updateStatus(order.id, { action: 'ship', trackingNumber: 'JNE-ED2', courier: 'jne' });
    expect(shipped.status).toBe('shipped');
    expect(shipped.shipping.trackingNumber).toBe('JNE-ED2');
    expect(shipped.shipping.shippedAt).toBeTruthy();

    const delivered = await services.orders.updateStatus(order.id, { action: 'deliver' });
    expect(delivered.status).toBe('delivered');
    expect(delivered.deliveredAt).toBeTruthy();
  });

  it('return memindahkan order → returned', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;
    const order = makeOrder(storeId, { id: 'order-ed-3', platformOrderId: 'LOC-ED3', status: 'shipped' });
    await repos.orders.save(order);
    const returned = await services.orders.updateStatus(order.id, { action: 'return', reason: 'rusak' });
    expect(returned.status).toBe('returned');
  });

  it('accept memindahkan paid → awaiting_fulfillment', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;
    const order = makeOrder(storeId, { id: 'order-ed-4', platformOrderId: 'LOC-ED4', status: 'paid' });
    await repos.orders.save(order);
    const accepted = await services.orders.updateStatus(order.id, { action: 'accept' });
    expect(accepted.status).toBe('awaiting_fulfillment');
  });

  it('order tak ditemukan → error jelas', async () => {
    const h = makeHome();
    await expect(h.services.orders.updateStatus('none', { action: 'cancel' })).rejects.toThrow('not found');
  });
});