import { describe, expect, it } from 'vitest';
import { connectors, registerPlatform } from '@opensellvy/connector';
import { createServices, createMemoryRepositories } from '../src';
import { dummyPlugin, makeHome, makeConnectedStore, makeOrder, makeTokenStore } from './helpers';

const FROM = '2026-01-01T00:00:00.000Z';
const TO = '2026-01-31T23:59:59.999Z';

describe('finance — rekonsiliasi settlement dari order', () => {
  it('reconcile menghitung gross/net/refund & menyimpan settlement', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { repos, services } = h;

    await repos.orders.save(makeOrder(storeId, { platformOrderId: 'LOC1001', orderNumber: 'INV-1001', createdAt: '2026-01-10T00:00:00.000Z' }));
    await repos.orders.save(makeOrder(storeId, { platformOrderId: 'LOC1002', orderNumber: 'INV-1002', createdAt: '2026-01-12T00:00:00.000Z' }));
    await repos.orders.save(makeOrder(storeId, { platformOrderId: 'LOC1003', orderNumber: 'INV-1003', createdAt: '2026-01-15T00:00:00.000Z', status: 'cancelled', totals: { subtotal: { amount: 60_000, currency: 'IDR' }, shippingFee: { amount: 0, currency: 'IDR' }, discount: { amount: 0, currency: 'IDR' }, tax: { amount: 0, currency: 'IDR' }, grandTotal: { amount: 60_000, currency: 'IDR' } } }));
    await repos.orders.save(makeOrder(storeId, { platformOrderId: 'LOC1004', orderNumber: 'INV-1004', createdAt: '2026-01-18T00:00:00.000Z', status: 'returned', totals: { subtotal: { amount: 50_000, currency: 'IDR' }, shippingFee: { amount: 0, currency: 'IDR' }, discount: { amount: 0, currency: 'IDR' }, tax: { amount: 0, currency: 'IDR' }, grandTotal: { amount: 50_000, currency: 'IDR' } } }));
    await repos.orders.save(makeOrder(storeId, { platformOrderId: 'LOC1005', orderNumber: 'INV-1005', createdAt: '2025-12-01T00:00:00.000Z' }));

    const settlement = await services.finance.reconcile(storeId, 'local', { from: FROM, to: TO });

    // order returned tetap masuk gross (revenue sudah ditagih) lalu dikurangi refund
    expect(settlement.gross.amount).toBe(274_000); // 112k + 112k + 50k
    expect(settlement.shippingFee.amount).toBe(24_000);
    expect(settlement.refundedAmount.amount).toBe(110_000); // 60k cancelled + 50k returned
    expect(settlement.net.amount).toBe(164_000);
    expect(settlement.status).toBe('in_transit');

    const stored = await services.finance.list(storeId);
    expect(stored.map((s) => s.id)).toContain(settlement.id);
  });

  it('recordSettlement emit event settlement.recorded', async () => {
    const events: string[] = [];
    registerPlatform(dummyPlugin(), { replace: true });
    const services = createServices({
      deps: {
        registry: connectors,
        tokens: makeTokenStore(),
        credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }),
        events: { emit: async (name) => void events.push(name) },
      },
      repositories: createMemoryRepositories(),
    });
    const store = await services.stores.create({ name: 'Toko', slug: 'toko-fin-2' });

    const s = await services.finance.recordSettlement({
      storeId: store.id,
      channelId: `${store.id}:local`,
      platform: 'local',
      period: { from: FROM, to: TO },
      gross: { amount: 10_000, currency: 'IDR' },
      commission: { amount: 1_000, currency: 'IDR' },
      shippingFee: { amount: 2_000, currency: 'IDR' },
      refundedAmount: { amount: 0, currency: 'IDR' },
      net: { amount: 9_000, currency: 'IDR' },
    });

    expect(s.status).toBe('pending');
    expect(events).toContain('settlement.recorded');
  });
});