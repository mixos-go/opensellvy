import { describe, expect, it } from 'vitest';
import { makeHome, makeConnectedStore, makeOrder } from './helpers';

describe('fulfillment — pick → pack → handover', () => {
  async function setup() {
    const h = makeHome();
    h.register({ orders: [] });
    const { storeId } = await makeConnectedStore(h);
    const { services } = h;

    const warehouse = await services.warehouses.create({
      storeId,
      code: 'WH-1',
      name: 'Gudang A',
      address: {
        name: 'Gudang A',
        phone: '0812-0000-0000',
        province: 'DKI Jakarta',
        city: 'Jakarta',
        district: 'Gambir',
        subDistrict: 'Gambir',
        postalCode: '10110',
        detail: 'Jl. Gudang No. 1',
      },
    });
    await services.warehouses.setDefault(warehouse.id);

    const product = await services.products.create({
      storeId,
      name: 'Tumbler',
      description: '',
      variants: [{ id: 'v1', sku: 'SKU-F1', options: {}, price: { amount: 85_000, currency: 'IDR' }, stock: 5 }],
      images: [],
      categoryIds: [],
      attributes: {},
      status: 'active',
    });
    await services.inventory.ensureFromProduct(product, warehouse.id);
    await services.inventory.adjust({ productId: product.id, sku: 'SKU-F1', warehouseId: warehouse.id, quantity: 10, reason: 'seed' });

    return { h, storeId, warehouseId: warehouse.id, product };
  }

  it('handover mengubah status order → shipped, mengurangi stok, menyimpan shipment', async () => {
    const { h, storeId, warehouseId, product } = await setup();
    const { repos, services } = h;

    const order = makeOrder(storeId, {
      id: 'order-ful-1',
      platformOrderId: 'LOC-F1',
      status: 'processing',
      lines: [{ id: 'l-f1', productId: product.id, sku: 'SKU-F1', name: 'Tumbler', quantity: 2, warehouseId, unitPrice: { amount: 85_000, currency: 'IDR' }, total: { amount: 170_000, currency: 'IDR' } }],
    });
    await repos.orders.save(order);

    const picked = await services.fulfillment.pick({ orderId: order.id, warehouseId, pickerId: 'user-1' });
    expect(picked.status).toBe('picked');

    const packed = await services.fulfillment.pack({ orderId: order.id, packageWeightGram: 600 });
    expect(packed.status).toBe('packed');

    const handed = await services.fulfillment.handover(
      { orderId: order.id, courier: 'jne', service: 'REG', trackingNumber: 'JNE-F1', awbUrl: 'https://t.jne/awb' },
      services.inventory,
      services.orders,
    );
    expect(handed.status).toBe('handed_over');

    const stored = await services.orders.getById(order.id);
    expect(stored.status).toBe('shipped');
    expect(stored.shipping.trackingNumber).toBe('JNE-F1');
    expect(stored.shipping.shippedAt).toBeTruthy();

    const item = (await services.inventory.list(storeId)).find((i) => i.sku === 'SKU-F1');
    expect(item?.stock.available).toBe(13); // 5 (variant) + 10 (seed) - 2 (handover)

    const flow = await services.fulfillment.getByOrder(order.id);
    expect(flow.status).toBe('handed_over');
  });

  it('pick/pack pada order yang tak ada → error jelas', async () => {
    const { h } = await setup();
    await expect(h.services.fulfillment.pick({ orderId: 'none', warehouseId: 'w', pickerId: 'u' })).rejects.toThrow('not found');
  });
});