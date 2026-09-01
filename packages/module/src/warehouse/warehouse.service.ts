import type { Warehouse } from '@opensellvy/types';

export type { Warehouse } from '@opensellvy/types';

export interface WarehouseModule {
  list(storeId: string): Promise<Warehouse[]>;
  create(data: Omit<Warehouse, 'id'>): Promise<Warehouse>;
  update(id: string, patch: Partial<Warehouse>): Promise<Warehouse>;
  setDefault(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}