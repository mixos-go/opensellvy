import { describe, expect, it } from 'vitest';
import type { StockLevel, InventoryAdjustment } from '@opensellvy/types';
import { makeHome, makeConnectedStore } from './helpers';

describe('inventory — sync & stok remote via gateway', () => {
  it('getStockLevelsRemote mengambil stok dari gateway', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    const level: StockLevel = { available: 5, reserved: 1, incoming: 2, holding: 0 };
    let skus: string[] = [];
    connectors.get('local').gateway.inventory.getStockLevels = (_c, s) => { skus = s; return Promise.resolve([level]); };
    const result = await h.services.inventory.getStockLevelsRemote(storeId, 'local', ['SKU-A']);
    expect(skus).toEqual(['SKU-A']);
    expect(result).toEqual([level]);
  });

  it('getStockLevelsRemote toleran: tanpa channel → []', async () => {
    const h = makeHome();
    const result = await h.services.inventory.getStockLevelsRemote('store-nochannel', 'local', ['SKU-A']);
    expect(result).toEqual([]);
  });

  it('adjustRemote meneruskan adjustments ke gateway', async () => {
    const h = makeHome();
    const { storeId } = await makeConnectedStore(h);
    const { connectors } = await import('@opensellvy/connector');
    const adjustment: InventoryAdjustment = { productId: 'p1', sku: 'SKU-A', warehouseId: 'wh-1', quantity: 3, reason: 'restock' };
    const calls: InventoryAdjustment[][] = [];
    connectors.get('local').gateway.inventory.adjust = (_c, a) => { calls.push(a); return Promise.resolve(); };
    await h.services.inventory.adjustRemote(storeId, 'local', [adjustment]);
    expect(calls[0]).toEqual([adjustment]);
  });
});
