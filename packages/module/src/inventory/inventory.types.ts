import type { ID } from '@opensellvy/types';

export interface InventoryRecord {
  id: ID;
  productId: ID;
  warehouseId: ID;
  available: number;
  reserved: number;
  incoming: number;
  holding: number;
  updatedAt: Date;
}

export type StockMovementType = 'in' | 'out' | 'adjust' | 'reserve' | 'release';
