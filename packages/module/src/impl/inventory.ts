import type { ID, InventoryAdjustment, InventoryItem, StockMovement, StockMovementType, UnifiedProduct } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds, channelContext } from './deps';

export interface InventoryModuleImpl {
  /** status stock by sku (+opsional gudang) */
  get(sku: string, warehouseId?: ID): Promise<InventoryItem[]>;
  list(storeId: string): Promise<InventoryItem[]>;
  /** catat pergerakan + update stock level (atomik via port) */
  adjust(input: InventoryAdjustment, actorId?: ID): Promise<InventoryItem>;
  reserve(orderId: ID, sku: string, quantity: number, warehouseId?: ID): Promise<void>;
  release(orderId: ID, sku: string, quantity: number, warehouseId?: ID): Promise<void>;
  /** dorong stock tersedia ke channel terhubung — kunci pending sync */
  syncToChannels(storeId: string, platform?: string): Promise<{ synced: number; items: number }>;
  history(sku: string, limit?: number): Promise<StockMovement[]>;
  /** inisialisasi inventory dari product dan materialisasikan sku lokal */
  ensureFromProduct(product: UnifiedProduct, warehouseId: ID): Promise<InventoryItem[]>;
}

export function inventoryModule(deps: ModuleDeps): InventoryModuleImpl {
  const { repos, registry } = deps;
  const { id, now } = buildIds(deps);

  async function applyMovement(input: InventoryAdjustment, type: StockMovementType, actorId?: ID) {
    const sku = input.sku ?? (await skuOf(deps, input.productId));
    const items = await repos.inventory.findBySku(sku, input.warehouseId);
    let item = items[0];
    if (!item) {
      // create on first movement
      item = {
        id: id(),
        productId: input.productId,
        sku,
        warehouseId: input.warehouseId,
        stock: { available: 0, reserved: 0, incoming: 0, holding: 0 },
        updatedAt: now(),
      };
    }
    const delta = input.quantity;
    if (type === 'in' || type === 'adjust') item.stock.available += delta;
    else if (type === 'out') item.stock.available -= delta;
    else if (type === 'reserve') {
      item.stock.reserved += delta;
      item.stock.available -= delta;
    } else if (type === 'release') {
      item.stock.reserved -= delta;
      item.stock.available += delta;
    }
    if (item.stock.available < 0) {
      throw new Error(`Stock tidak cukup utk sku ${sku} (available ${item.stock.available})`);
    }
    item.updatedAt = now();
    const saved = await repos.inventory.upsert(item);
    const movement: StockMovement = {
      id: id(),
      inventoryItemId: item.id,
      type,
      quantity: delta,
      reason: input.reason,
      referenceId: input.productId,
      ...(actorId !== undefined ? { actorId } : {}),
      occurredAt: now(),
    };
    await repos.inventory.addMovement(movement);
    await deps.events?.emit('inventory.updated', { sku, type, quantity: delta });
    return saved;
  }

  return {
    async get(sku, warehouseId) {
      return repos.inventory.findBySku(sku, warehouseId);
    },

    async list(storeId) {
      return (await repos.inventory.list(storeId)).filter((i) => i.stock.available > 0 || i.stock.reserved > 0);
    },

    async adjust(input, actorId) {
      const sign = input.quantity >= 0 ? 1 : -1;
      return applyMovement({ ...input, quantity: Math.abs(input.quantity) }, sign >= 0 ? 'in' : 'out', actorId);
    },

    async reserve(orderId, sku, quantity, warehouseId) {
      const wid = await resolveWarehouse(deps, sku, warehouseId);
      await applyMovement({ productId: orderId, sku, warehouseId: wid, quantity, reason: `reserve order ${orderId}` }, 'reserve');
    },

    async release(orderId, sku, quantity, warehouseId) {
      const wid = await resolveWarehouse(deps, sku, warehouseId);
      await applyMovement({ productId: orderId, sku, warehouseId: wid, quantity, reason: `release order ${orderId}` }, 'release');
    },

    async syncToChannels(storeId, platform?) {
      const items = await repos.inventory.list(storeId);
      const channels = (await repos.channels.findByStore(storeId)).filter((c) => !platform || c.platform === platform);

      let synced = 0;
      for (const channel of channels) {
        const plugin = registry.get(channel.platform);
        const context = await channelContext(deps, storeId, channel.platform);
        const payload = items.map((i) => ({ sku: i.sku, stock: i.stock.available, warehouseId: i.warehouseId }));
        await plugin.gateway.inventory.sync(context, payload);
        synced += 1;
      }
      await deps.events?.emit('inventory.synced', { storeId, channels: synced, items: items.length });
      return { synced, items: items.length };
    },

    async history(sku, limit) {
      return repos.inventory.listMovements(sku, limit);
    },

    async ensureFromProduct(product, warehouseId) {
      const items: InventoryItem[] = [];
      for (const variant of product.variants) {
        const [existing] = await repos.inventory.findBySku(variant.sku, warehouseId);
        if (existing) {
          items.push(existing);
          continue;
        }
        const item: InventoryItem = {
          id: id(),
          productId: product.id,
          sku: variant.sku,
          warehouseId,
          stock: { available: variant.stock ?? 0, reserved: 0, incoming: 0, holding: 0 },
          updatedAt: now(),
        };
        await repos.inventory.upsert(item);
        items.push(item);
      }
      return items;
    },
  };
}

async function skuOf(deps: ModuleDeps, productId: string): Promise<string> {
  const product = await deps.repos.products.findById(productId);
  if (!product || !product.variants.length) throw new Error(`Product ${productId} has no variant (sku)`);
  return product.variants[0]!.sku;
}

async function resolveWarehouse(deps: ModuleDeps, sku: string, warehouseId?: ID): Promise<ID> {
  if (warehouseId) return warehouseId;
  const [existing] = await deps.repos.inventory.findBySku(sku);
  if (existing) return existing.warehouseId;
  throw new Error(`warehouseId diperlukan utk sku ${sku}`);
}