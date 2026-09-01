import type { ID, ISO8601, Address } from '../base';

export type WarehouseStatus = 'active' | 'inactive';

export interface Warehouse {
  id: ID;
  storeId: ID;
  code: string;
  name: string;
  address: Address;
  isDefault: boolean;
  status: WarehouseStatus;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}