import { describe, expect, it } from 'vitest';
import { makeHome, makeConnectedStore } from './helpers';

describe('catalog — satu pandangan produk + stok tersedia', () => {
  it('list katalog melampirkan available per varian', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { services } = h;

    const warehouse = await services.warehouses.create({
      storeId,
      code: 'WH-C1',
      name: 'Gudang Pusat',
      address: {
        name: 'Gudang Pusat',
        phone: '0812-0000-0000',
        province: 'DKI Jakarta',
        city: 'Jakarta',
        district: 'Gambir',
        subDistrict: 'Gambir',
        postalCode: '10110',
        detail: 'Jl. Gudang No. 1',
      },
    });

    const product = await services.products.create({
      storeId,
      name: 'Tumbler Stainless',
      description: '',
      variants: [
        { id: 'v1', sku: 'SKU-C1', options: { size: '500ml' }, price: { amount: 85_000, currency: 'IDR' }, stock: 0 },
        { id: 'v2', sku: 'SKU-C2', options: { size: '1L' }, price: { amount: 125_000, currency: 'IDR' }, stock: 0 },
      ],
      images: [],
      categoryIds: [],
      attributes: {},
      status: 'active',
    });
    await services.inventory.ensureFromProduct(product, warehouse.id);
    await services.inventory.adjust({ productId: product.id, sku: 'SKU-C1', warehouseId: warehouse.id, quantity: 7, reason: 'seed' });

    const page = await services.catalog.list(storeId);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].available).toBe(0); // SKU-C2 stok 0 → min = 0
  });
});