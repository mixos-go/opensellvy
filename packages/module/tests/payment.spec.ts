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

  it('listForStore menarik payment remote via gateway + mengumpulkan lokal', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    const order = makeOrder(storeId, { id: 'order-pay-fs', platformOrderId: 'LOC-FS' });
    await repos.orders.save(order);
    const local = await services.payments.capture(order.id, 'qris');

    const { connectors } = await import('@opensellvy/connector');
    const remote = { id: 'pay-remote', orderId: 'ord-x', method: 'transfer' as const, status: 'captured' as const, amount: { amount: 50_000, currency: 'IDR' }, refunds: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
    let called = 0;
    const plugin = connectors.get('local');
    plugin.gateway.payment.list = () => { called += 1; return Promise.resolve([remote]); };

    const result = await services.payments.listForStore(storeId, 'local');
    expect(called).toBe(1);
    expect(result.gateway).toEqual([remote]);
    expect(result.local.map((p) => p.id)).toContain(local.id);
  });

  it('getRemote mengambil payment dari gateway', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    const remote = { id: 'pay-r1', orderId: 'o1', method: 'e-wallet' as const, status: 'captured' as const, amount: { amount: 10_000, currency: 'IDR' }, refunds: [], createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };
    connectors.get('local').gateway.payment.get = () => Promise.resolve(remote);
    const { payment } = await h.services.payments.getRemote(storeId, 'local', 'pay-r1');
    expect(payment?.id).toBe('pay-r1');
  });

  it('refundViaPlatform meneruskan ke gateway', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    const calls: Array<{ id: string; amount: number }> = [];
    connectors.get('local').gateway.payment.refund = (_c, id, amount) => { calls.push({ id, amount }); return Promise.resolve(); };
    await h.services.payments.refundViaPlatform(storeId, 'local', 'pay-rf', 25_000);
    expect(calls).toEqual([{ id: 'pay-rf', amount: 25_000 }]);
  });

  it('tanpa channel terhubung, listForStore/getRemote toleran (gateway tidak dipanggil)', async () => {
    const h = makeHome();
    const { connectors } = await import('@opensellvy/connector');
    let called = 0;
    connectors.get('local').gateway.payment.list = () => { called += 1; return Promise.resolve([]); };
    const result = await h.services.payments.listForStore('store-tanpa-channel');
    expect(called).toBe(0);
    expect(result.gateway).toEqual([]);
  });
});