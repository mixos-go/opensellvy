import { describe, expect, it } from 'vitest';
import { makeHome, makeConnectedStore } from './helpers';

describe('promotions — validasi kode promosi', () => {
  it('promo fixed aktif memberikan diskon sesuai aturan', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { services } = h;

    const promo = await services.promotions.create({
      storeId,
      name: 'Diskon 10rb',
      type: 'voucher',
      code: 'HEMAT10',
      startAt: new Date(Date.now() - 60_000).toISOString(),
      endAt: new Date(Date.now() + 3_600_000).toISOString(),
      rules: { type: 'fixed', value: 10_000, appliesTo: 'all_items' },
    });
    expect(promo.status).toBe('active');

    const result = await services.promotions.validate(storeId, 'HEMAT10', { amount: 100_000, currency: 'IDR' });
    expect(result.valid).toBe(true);
    expect(result.discountAmount?.amount).toBe(10_000);
  });

  it('persen diskon diaplikasikan dari subtotal & dijepit maxDiscount', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { services } = h;

    await services.promotions.create({
      storeId,
      name: 'Pct 20ratus',
      type: 'voucher',
      code: 'PCT20',
      startAt: new Date(Date.now() - 60_000).toISOString(),
      endAt: new Date(Date.now() + 3_600_000).toISOString(),
      rules: { type: 'percent', value: 20, maxDiscount: { amount: 15_000, currency: 'IDR' }, appliesTo: 'all_items' },
    });
    const result = await services.promotions.validate(storeId, 'PCT20', { amount: 100_000, currency: 'IDR' });
    expect(result.discountAmount?.amount).toBe(15_000);
  });

  it('promo invalid: belum mulai atau min spend', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { services } = h;

    await services.promotions.create({
      storeId,
      name: 'Depan',
      type: 'voucher',
      code: 'NANTI',
      startAt: new Date(Date.now() + 60_000).toISOString(),
      endAt: new Date(Date.now() + 3_600_000).toISOString(),
      rules: { type: 'fixed', value: 5_000, appliesTo: 'all_items' },
    });
    await services.promotions.create({
      storeId,
      name: 'Batas',
      type: 'voucher',
      code: 'MINS50',
      startAt: new Date(Date.now() - 60_000).toISOString(),
      endAt: new Date(Date.now() + 3_600_000).toISOString(),
      rules: { type: 'fixed', value: 5_000, minSpend: { amount: 50_000, currency: 'IDR' }, appliesTo: 'all_items' },
    });

    const notYet = await services.promotions.validate(storeId, 'NANTI', { amount: 100_000, currency: 'IDR' });
    expect(notYet.valid).toBe(false);
    expect(notYet.reasons).toContain('promotion not active');
    expect(notYet.reasons).toContain('outside promotion window');

    const belowMin = await services.promotions.validate(storeId, 'MINS50', { amount: 30_000, currency: 'IDR' });
    expect(belowMin.valid).toBe(false);
    expect(belowMin.reasons).toContain('min spend not met');

    const overMin = await services.promotions.validate(storeId, 'MINS50', { amount: 60_000, currency: 'IDR' });
    expect(overMin.valid).toBe(true);
  });

  it('kode tidak terdaftar → error jelas', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    await expect(h.services.promotions.validate(storeId, 'TIDAKADA', { amount: 10_000, currency: 'IDR' })).rejects.toThrow('not found');
  });
});