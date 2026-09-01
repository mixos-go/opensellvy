import type { ID } from '../types';

export interface Warehouse {
  id: ID;
  storeId: ID;
  name: string;
  address: Record<string, unknown>;
  isDefault: boolean;
}

export interface WarehouseModule {
  list(storeId: string): Promise<Warehouse[]>;
  create(data: Omit<Warehouse, 'id'>): Promise<Warehouse>;
  update(id: string, patch: Partial<Warehouse>): Promise<Warehouse>;
  setDefault(id: string): Promise<void>;
}