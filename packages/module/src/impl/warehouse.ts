import type { Warehouse, WarehouseStatus } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export type WarehouseCreateInput = Omit<Warehouse, 'id' | 'isDefault' | 'status' | 'createdAt' | 'updatedAt'>;

export interface WarehouseModuleImpl {
  create(input: WarehouseCreateInput): Promise<Warehouse>;
  setDefault(warehouseId: string): Promise<void>;
  update(warehouseId: string, patch: Partial<Warehouse>): Promise<Warehouse>;
  list(storeId: string): Promise<Warehouse[]>;
  deactivate(warehouseId: string): Promise<Warehouse>;
}

export function warehouseModule(deps: ModuleDeps): WarehouseModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  const require = async (warehouseId: string) => {
    const w = await repos.warehouses.findById(warehouseId);
    if (!w) throw new Error(`Warehouse ${warehouseId} not found`);
    return w;
  };

  return {
    async create(input) {
      const stamp = now();
      const others = await repos.warehouses.list(input.storeId);
      const warehouse: Warehouse = { ...input, id: id(), isDefault: others.length === 0, status: 'active', createdAt: stamp, updatedAt: stamp };
      return repos.warehouses.save(warehouse);
    },

    async setDefault(warehouseId) {
      const target = await require(warehouseId);
      const all = await repos.warehouses.list(target.storeId);
      for (const w of all) await repos.warehouses.save({ ...w, isDefault: w.id === warehouseId, updatedAt: now() });
    },

    async update(warehouseId, patch) {
      await require(warehouseId);
      return repos.warehouses.save({ ...(await require(warehouseId)), ...patch, updatedAt: now() });
    },

    async list(storeId) {
      return repos.warehouses.list(storeId);
    },

    async deactivate(warehouseId) {
      return this.update(warehouseId, { status: 'inactive' });
    },
  };
}

export type WarehouseToggle = WarehouseStatus;