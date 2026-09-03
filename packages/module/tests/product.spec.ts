import { describe, expect, it } from 'vitest';
import type { CategoryReference } from '@opensellvy/types';
import { makeHome, makeConnectedStore } from './helpers';

describe('products — sync & kategori via gateway', () => {
  it('listCategories mengambil referensi kategori dari gateway', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    const cats: CategoryReference[] = [{ id: 'cat-1', platform: 'local', name: 'Elektronik', level: 1, hasChildren: true }];
    connectors.get('local').gateway.product.listCategories = () => Promise.resolve(cats);
    const result = await h.services.products.listCategories(storeId, 'local');
    expect(result).toEqual(cats);
  });

  it('listCategories toleran: tanpa channel → []', async () => {
    const h = makeHome();
    const result = await h.services.products.listCategories('store-nochannel', 'local');
    expect(result).toEqual([]);
  });

  it('pushUpdate meneruskan patch ke gateway.product.update dengan id produk', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    const product = await h.services.products.create({
      storeId, name: 'Produk', description: 'x',
      variants: [{ id: 'v1', sku: 'SKU-PU', options: {}, price: { amount: 10_000, currency: 'IDR' } }],
      images: [], categoryIds: [], attributes: {}, status: 'active',
    });
    const calls: Array<{ id: string; patch: Record<string, unknown> }> = [];
    connectors.get('local').gateway.product.update = (_c, id, patch) => { calls.push({ id, patch }); return Promise.resolve(); };
    await h.services.products.pushUpdate(storeId, 'local', product.id, { price: { amount: 12_000, currency: 'IDR' } });
    expect(calls[0].id).toBe(product.id);
  });
});
