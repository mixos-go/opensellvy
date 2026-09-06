import { describe, expect, it } from 'vitest';
import { mapOrder, mapProduct, mapReturn, type TikTokOrderRaw } from '../src/tts.mapper';

describe('tts.mapper — payload TikTok → domain OpenSellvy', () => {
  it('mapOrder memetakan order + items + payment + recipient', () => {
    const raw: TikTokOrderRaw = {
      id: 'ORD1',
      order_status: 'IN_TRANSIT',
      create_time: 1655714431,
      update_time: 1655714432,
      payment_time: 1655714431,
      buyer_username: 'andi88',
      buyer_user_id: 'u-9',
      buyer_message: 'cepat ya',
      payment: { total_amount: '120000', shipping_fee: '20000', currency: 'IDR' },
      items: [
        {
          id: 'OL1',
          item_id: 'I1',
          product_id: 'P1',
          seller_sku: 'SKU-1',
          item_name: 'Sendal',
          quantity: '2',
          sale_price: '50000',
        },
      ],
      recipient_address: { name: 'Andi', phone_number: '0812', full_address: 'Jl. Merdeka 1', postal_code: '10110' },
      package_list: [{ package_id: 'PK1', tracking_number: 'TRK-1', shipping_provider_name: 'J&T' }],
    };
    const order = mapOrder('s-1', 's-1:tts', 'tts-tokopedia', raw);
    expect(order.platformOrderId).toBe('ORD1');
    expect(order.status).toBe('in_transit');
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0].sku).toBe('SKU-1');
    expect(order.lines[0].quantity).toBe(2);
    expect(order.lines[0].total.amount).toBe(100000);
    expect(order.totals.subtotal.amount).toBe(100000);
    expect(order.totals.shippingFee.amount).toBe(20000);
    expect(order.totals.grandTotal.amount).toBe(120000);
    expect(order.shipping.address.name).toBe('Andi');
    expect(order.shipping.trackingNumber).toBe('TRK-1');
    expect(order.paidAt).toBe(new Date(1655714431 * 1000).toISOString());
    expect(order.customer.customerId).toBe('u-9');
  });

  it('mapOrder toleran field kosong (default aman)', () => {
    const order = mapOrder('s-1', 's-1:tts', 'tts-tokopedia', { id: 'ORD2' });
    expect(order.status).toBe('paid');
    expect(order.lines).toEqual([]);
    expect(order.shipping.courier).toBe('seller');
    expect(order.platformOrderId).toBe('ORD2');
  });

  it('mapProduct memetakan skus, images, category & status', () => {
    const p = mapProduct('s-1', {
      id: 'P1',
      title: 'Baju Batik',
      description: 'Baju batik premium',
      product_status: 'ACTIVATE',
      category_id: '4001',
      main_images: [{ urls: ['https://img/a.jpg', 'https://img/b.jpg'] }],
      skus: [
        { id: 'S1', seller_sku: 'SKU-B1', sku_name: 'Merah - M', price: { sale_price: '150000', currency: 'IDR' } },
      ],
      product_attributes: [{ attribute_id: 'color', value: 'merah' }],
    });
    expect(p.id).toBe('tt-P1');
    expect(p.name).toBe('Baju Batik');
    expect(p.status).toBe('active');
    expect(p.variants[0].sku).toBe('SKU-B1');
    expect(p.variants[0].price.amount).toBe(150000);
    expect(p.images[0].url).toBe('https://img/a.jpg');
    expect(p.categoryIds).toEqual(['4001']);
    expect(p.attributes.color).toBe('merah');
  });

  it('mapReturn memetakan return + refund amount', () => {
    const r = mapReturn('s-1:tts', 'ORD1', {
      return_id: 'R1',
      order_id: 'ORD1',
      return_status: 'RECEIVED',
      return_reason: 'cacat produk',
      refund_amount: { refund_total: '50000', currency: 'IDR' },
      create_time: 1655714431,
    });
    expect(r.id).toBe('ttrn-R1');
    expect(r.orderId).toBe('ORD1');
    expect(r.status).toBe('received');
    expect(r.note).toBe('cacat produk');
    expect(r.refundAmount?.amount).toBe(50000);
  });
});