import { describe, expect, it } from 'vitest';
import { makeHome, makeConnectedStore, makeOrder } from './helpers';

const FROM = '2026-01-01T00:00:00.000Z';
const TO = '2026-01-31T23:59:59.999Z';
const T0 = '2026-01-10T08:00:00.000Z';
const PAYDAY = '2026-01-10T10:00:00.000Z';

describe('analytics — ringkasan penjualan & performa channel', () => {
  it('salesSummary: order batal/return tidak dihitung ke gross, tapi ikut refund', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    await repos.orders.save(makeOrder(storeId, { createdAt: T0, status: 'paid' }));
    await repos.orders.save(makeOrder(storeId, {
      createdAt: '2026-01-11T00:00:00.000Z',
      status: 'returned',
      totals: {
        subtotal: { amount: 50_000, currency: 'IDR' },
        shippingFee: { amount: 0, currency: 'IDR' },
        discount: { amount: 0, currency: 'IDR' },
        tax: { amount: 0, currency: 'IDR' },
        grandTotal: { amount: 50_000, currency: 'IDR' },
      },
    }));
    await repos.orders.save(makeOrder(storeId, {
      createdAt: '2026-01-12T00:00:00.000Z',
      status: 'cancelled',
      totals: {
        subtotal: { amount: 60_000, currency: 'IDR' },
        shippingFee: { amount: 0, currency: 'IDR' },
        discount: { amount: 0, currency: 'IDR' },
        tax: { amount: 0, currency: 'IDR' },
        grandTotal: { amount: 60_000, currency: 'IDR' },
      },
    }));

    const summary = await services.analytics.salesSummary({ storeId, from: FROM, to: TO });
    const fromOrders = await services.analytics.salesSummaryFromOrders({ storeId, from: FROM, to: TO });

    // order returned tetap di gross (sudah ditagih) & masuk refund
    expect(summary.grossRevenue.amount).toBe(162_000);
    expect(summary.refundAmount.amount).toBe(110_000);
    expect(summary.orderCount).toBe(2);

    expect(fromOrders).toEqual(summary);
  });

  it('channelPerformance: avgFulfillmentHours dihitung dari shippedAt - createdAt', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    await repos.orders.save(makeOrder(storeId, {
      createdAt: T0,
      shipping: { address: makeOrder('x').shipping!.address, courier: 'jne', service: 'REG', shippedAt: PAYDAY },
    }));
    await repos.orders.save(makeOrder(storeId, {
      createdAt: '2026-01-11T00:00:00.000Z',
      status: 'cancelled',
      totals: {
        subtotal: { amount: 60_000, currency: 'IDR' },
        shippingFee: { amount: 0, currency: 'IDR' },
        discount: { amount: 0, currency: 'IDR' },
        tax: { amount: 0, currency: 'IDR' },
        grandTotal: { amount: 60_000, currency: 'IDR' },
      },
    }));

    const performance = await services.analytics.channelPerformance({ storeId, from: FROM, to: TO });
    const local = performance.find((p) => p.platform === 'local');

    expect(local?.orderCount).toBe(2); // termasuk cancelled
    expect(local?.grossRevenue.amount).toBe(112_000);
    expect(local?.cancellationRate).toBe(50);
    expect(local?.avgFulfillmentHours).toBe(2); // 2 jam gap
  });

  it('topProducts diurutkan berdasarkan kuantitas terjual', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    await repos.orders.save(makeOrder(storeId, { createdAt: T0, lines: [{ id: 'l1', productId: 'p-sedang', sku: 'SKU-MID', name: 'Sedang', quantity: 2, unitPrice: { amount: 50_000, currency: 'IDR' }, total: { amount: 100_000, currency: 'IDR' } }] }));
    await repos.orders.save(makeOrder(storeId, { createdAt: '2026-01-11T00:00:00.000Z', platformOrderId: 'LOC9999', lines: [{ id: 'l2', productId: 'p-laris', sku: 'SKU-TOP', name: 'Laris', quantity: 5, unitPrice: { amount: 20_000, currency: 'IDR' }, total: { amount: 100_000, currency: 'IDR' } }] }));

    const top = await services.analytics.topProducts({ storeId, from: FROM, to: TO });
    expect(top[0].sku).toBe('SKU-TOP');
    expect(top[0].quantity).toBe(5);
  });
});