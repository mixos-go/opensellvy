import { describe, expect, it } from 'vitest';
import { mapOrder, mapProduct, mapReturn } from '../src/shopee.mapper';

const ORDER = {
  order_sn: '230603XYZ',
  order_status: 'READY_TO_SHIP',
  currency: 'IDR',
  item_list: [
    {
      item_id: 111,
      item_name: 'Gelas Kaca',
      item_sku: 'SKU-GELAS',
      model_sku: 'GELAS-250',
      model_quantity_purchased: 2,
      model_discounted_price: 10000,
    },
  ],
  recipient_address: {
    name: 'Budi',
    phone: '0812-0000-1111',
    town: 'Kec Gambir',
    district: 'Gambir',
    city: 'Jakarta Pusat',
    state: 'DKI Jakarta',
    zipcode: '10110',
    full_address: 'Jl. Merdeka No 1',
  },
  order_amount: { shipping_fee: 15000, currency: 'IDR' },
  export_amount: { total: 35000 },
  total_amount: { total: 35000 },
  escrow: { shopee_discount: 500 },
  buyer_user_id: 999,
  pay_time: 1680000000,
  create_time: 1679900000,
  update_time: 1680000100,
};

describe('mapOrder', () => {
  it('memetakan pesanan Shopee → UnifiedOrder', () => {
    const o = mapOrder('s-1', 'ch-1', 'shopee', ORDER as never);
    expect(o.platform).toBe('shopee');
    expect(o.status).toBe('awaiting_fulfillment');
    expect(o.platformOrderId).toBe('230603XYZ');
    expect(o.lines).toHaveLength(1);
    expect(o.lines[0].quantity).toBe(2);
    expect(o.lines[0].total.amount).toBe(20000);
    expect(o.customer.id).toBe('so-c-230603XYZ');
    expect(o.customer.customerId).toBe('999');
    expect(o.shipping.address.city).toBe('Jakarta Pusat');
    expect(o.shipping.address.detail).toBe('Jl. Merdeka No 1');
    expect(o.totals.grandTotal.amount).toBe(35000);
    expect(o.totals.platformDiscount?.amount).toBe(500);
    expect(o.paidAt).toBe('2023-03-28T10:40:00.000Z');
  });

  it('status UNPAID → pending, CANCELLED → cancelled', () => {
    expect(mapOrder('s', 'c', 'shopee', { order_sn: 'a', order_status: 'UNPAID' } as never).status).toBe('pending');
    expect(mapOrder('s', 'c', 'shopee', { order_sn: 'b', order_status: 'CANCELLED' } as never).status).toBe('cancelled');
  });

  it('toleran terhadap payload minimal (field wajib ber-default)', () => {
    const o = mapOrder('s', 'c', 'shopee', { order_sn: 'min' } as never);
    expect(o.lines).toHaveLength(0);
    expect(o.totals.grandTotal.amount).toBe(0);
    expect(o.shipping.address.name).toBe('');
    expect(o.status).toBe('paid');
  });
});

describe('mapProduct', () => {
  const ITEM = {
    item_id: 555,
    item_name: 'Sendal Baru',
    item_sku: 'SKU-SENDAL',
    item_status: 'NORMAL',
    currency: 'IDR',
    description: 'Bagus',
    price: 80000,
    category_id: 12345,
    image: [{ url: 'https://img/s1.jpg' }],
    models: [
      { model_id: 1, model_sku: 'SENDAL-BLACK', model_name: 'Black', price: 80000, normal_stock: 5 },
      { model_id: 2, model_sku: 'SENDAL-WHITE', model_name: 'White', price: 80000, normal_stock: 3 },
    ],
  };

  it('memetakan variasi + stok', () => {
    const p = mapProduct('s-1', ITEM as never);
    expect(p.id).toBe('sp-555');
    expect(p.status).toBe('active');
    expect(p.variants).toHaveLength(2);
    expect(p.variants[0].sku).toBe('SENDAL-BLACK');
    expect(p.variants[0].stock).toBe(5);
    expect(p.variants[0].platformVariantId).toBe('1');
    expect(p.images[0].url).toBe('https://img/s1.jpg');
    expect(p.categoryIds).toEqual(['12345']);
  });

  it('status UNLIST → inactive', () => {
    const p = mapProduct('s', { item_id: 1, item_status: 'UNLIST' } as never);
    expect(p.status).toBe('inactive');
  });
});

describe('mapReturn', () => {
  it('memetakan raw return → ReturnRequest', () => {
    const r = mapReturn('ch-1', 'ord-1', { return_sn: 'RET102', status: 'REFUNDED', reason_text: 'rusak', create_time: 1680000000 } as never);
    expect(r.id).toBe('srn-RET102');
    expect(r.status).toBe('refunded');
    expect(r.note).toBe('rusak');
    expect(r.orderId).toBe('ord-1');
    expect(r.channelId).toBe('ch-1');
  });

  it('status tak dikenal → requested', () => {
    const r = mapReturn('ch', 'ord', { return_sn: 'X' } as never);
    expect(r.status).toBe('requested');
  });
});
