import { describe, expect, it } from 'vitest';
import type { OrderFilter } from '../src/order/order.types';

describe('order module contract', () => {
  it('order filter shape is valid', () => {
    const filter: OrderFilter = {
      storeId: 'store_1',
      platform: 'shopee',
      limit: 10,
    };
    expect(filter.storeId).toBe('store_1');
    expect(filter.limit).toBe(10);
  });
});