import type { ID, ISO8601 } from '../base';

export interface StockLevel {
  available: number;
  reserved: number;
  incoming: number;
  holding: number;
}

export type StockMovementType = 'in' | 'out' | 'reserve' | 'release' | 'adjust';

export interface InventoryItem {
  id: ID;
  productId: ID;
  sku: string;
  warehouseId: ID;
  stock: StockLevel;
  updatedAt: ISO8601;
}

export interface StockMovement {
  id: ID;
  inventoryItemId: ID;
  type: StockMovementType;
  quantity: number;
  reason: string;
  referenceId?: ID;
  actorId?: ID;
  occurredAt: ISO8601;
}

export interface InventoryAdjustment {
  productId: ID;
  sku?: string;
  warehouseId: ID;
  quantity: number;
  reason: string;
}