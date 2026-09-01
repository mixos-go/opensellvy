import type { Paginated, UnifiedProduct } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import type { InventoryModuleImpl } from './inventory';
import type { ProductModuleImpl } from './product';

export interface CatalogModuleImpl {
  /** katalog = produk + stock, satu pandangan */
  list(storeId: string, opts?: { query?: string; cursor?: string; limit?: number }): Promise<Paginated<UnifiedProduct & { available?: number }>>;
}

export function catalogModule(deps: ModuleDeps, product: ProductModuleImpl, inventory: InventoryModuleImpl): CatalogModuleImpl {
  const { repos } = deps;

  return {
    async list(storeId, opts) {
      const page = await product.list(storeId, opts);
      const stock = new Map<string, number>();
      for (const item of await repos.inventory.list(storeId)) {
        stock.set(item.sku, (stock.get(item.sku) ?? 0) + item.stock.available);
      }
      const items = page.items.map((p) => {
        const available = Math.min(...p.variants.map((v) => stock.get(v.sku) ?? 0));
        return { ...p, available };
      });
      return { items, pageInfo: page.pageInfo };
    },
  };
}