import { describe, expect, it } from 'vitest';
import type { CourierRateProvider } from '../src';
import type { ShippingRate, ShippingRateRequest } from '@opensellvy/types';
import { makeHome, makeConnectedStore } from './helpers';
const REQUEST = {
  origin: {
    name: 'Gudang A',
    phone: '0812-0000-0000',
    province: 'Jawa Barat',
    city: 'Bandung',
    district: 'Coblong',
    subDistrict: 'Dago',
    postalCode: '40135',
    detail: 'Jl. Dago No. 1',
  },
  destination: {
    name: 'Buyer',
    phone: '0812-1111-2222',
    province: 'DKI Jakarta',
    city: 'Jakarta',
    district: 'Gambir',
    subDistrict: 'Gambir',
    postalCode: '10110',
    detail: 'Jl. Contoh No. 1',
  },
  items: [{ sku: 'SKU-S1', name: 'Botol', quantity: 2, weightGram: 400 }],
  couriers: ['jne', 'jnt'] as const,
};

describe('shipping — ongkir', () => {
  it('tanpa provider eksternal, getRates memakai tarif default (flat + per-kg)', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    void storeId;
    const rates = await h.services.shipping.getRates(REQUEST);

    expect(rates).toHaveLength(2);
    const jne = rates.find((r) => r.courier === 'jne');
    expect(jne?.cost.amount).toBe(13_000); // 800g → 1 kg → base saja
    expect(jne?.estDaysMin).toBeGreaterThan(0);
  });

  it('provider kustom di-inject dipakai, bukan default', async () => {
    const custom: CourierRateProvider = {
      getRates: async () => [{ courier: 'jnt', service: 'Express', cost: { amount: 25_000, currency: 'IDR' }, estDaysMin: 1, estDaysMax: 2, insuranceAvailable: true }],
    };
    const { connectors } = await import('@opensellvy/connector');
    const { createServices, createMemoryRepositories } = await import('../src');
    const { makeTokenStore, dummyPlugin } = await import('./helpers');
    connectors.register(dummyPlugin(), { replace: true });
    const services = createServices({
      deps: {
        registry: connectors,
        tokens: makeTokenStore(),
        credentials: async () => ({ appId: 'a', secret: 's', redirectUri: 'http://cb' }),
      },
      repositories: createMemoryRepositories(),
      courierRates: custom,
    });
    const rates = await services.shipping.getRates(REQUEST);
    expect(rates).toHaveLength(1);
    expect(rates[0].cost.amount).toBe(25_000);
  });

  it('getRatesFromPlatform mengambil ongkir dari gateway platform', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    const remote: ShippingRate = { courier: 'sicepat', service: 'Express', cost: { amount: 30_000, currency: 'IDR' }, estDaysMin: 1, estDaysMax: 2, insuranceAvailable: true };
    let received: ShippingRateRequest | undefined;
    connectors.get('local').gateway.shipping.getRates = (_c, req) => { received = req; return Promise.resolve([remote]); };
    const rates = await h.services.shipping.getRatesFromPlatform(storeId, 'local', REQUEST);
    expect(received?.destination.city).toBe('Jakarta');
    expect(rates).toEqual([remote]);
  });

  it('getRatesFromPlatform toleran: tanpa channel → []', async () => {
    const h = makeHome();
    const rates = await h.services.shipping.getRatesFromPlatform('store-nochannel', 'local', REQUEST);
    expect(rates).toEqual([]);
  });
});