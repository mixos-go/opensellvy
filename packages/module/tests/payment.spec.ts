import { describe, expect, it } from 'vitest';
import { makeHome, makeConnectedStore, makeOrder } from './helpers';

describe('payments — capture & refund', () => {
  it('capture mengunci order → paid; capture kedua ditolak', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    const order = makeOrder(storeId, { id: 'order-pay-1', platformOrderId: 'LOC-P1', status: 'pending' });
    await repos.orders.save(order);

    const payment = await services.payments.capture(order.id, 'transfer', 'midtrans');
    expect(payment.status).toBe('captured');
    expect(payment.amount.amount).toBe(112_000);

    const stored = await services.orders.getById(order.id);
    expect(stored.status).toBe('paid');

    await expect(services.payments.capture(order.id, 'e-wallet')).rejects.toThrow('already paid');
  });

  it('refund sebagian → partially_refunded; refund penuh → order returned', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    const order = makeOrder(storeId, { id: 'order-pay-2', platformOrderId: 'LOC-P2' });
    await repos.orders.save(order);
    await services.payments.capture(order.id, 'qris');

    const partial = await services.payments.refund(order.id, 40_000, 'kelebihan bayar');
    expect(partial.status).toBe('partially_refunded');
    expect(partial.refunds).toHaveLength(1);
    expect((await services.orders.getById(order.id)).status).toBe('paid');

    const full = await services.payments.refund(order.id, 112_000, 'batal semua');
    expect(full.status).toBe('refunded');
    expect((await services.orders.getById(order.id)).status).toBe('returned');
  });

  it('refund tanpa payment → error', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;
    const order = makeOrder(storeId, { id: 'order-pay-3', platformOrderId: 'LOC-P3' });
    await repos.orders.save(order);
    await expect(services.payments.refund(order.id, 10_000)).rejects.toThrow('No payment');
  });
});