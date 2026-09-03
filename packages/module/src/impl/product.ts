import type { CategoryReference, Paginated, PlatformCode, UnifiedProduct } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds, channelContext, withChannel } from './deps';

export type ProductCreateInput = Omit<UnifiedProduct, 'id' | 'createdAt' | 'updatedAt'>;

export interface ProductModuleImpl {
  create(input: ProductCreateInput): Promise<UnifiedProduct>;
  update(id: string, patch: Partial<UnifiedProduct>): Promise<UnifiedProduct>;
  getById(id: string): Promise<UnifiedProduct>;
  getBySku(sku: string): Promise<UnifiedProduct>;
  list(storeId: string, opts?: { query?: string; cursor?: string; limit?: number }): Promise<Paginated<UnifiedProduct>>;
  delete(id: string): Promise<void>;
  /** dorong produk ke satu channel (adapter translate ke payload platform) */
  pushToChannel(productId: string, storeId: string, platform: PlatformCode): Promise<void>;
  /** dorong SEMUA produk store ke SEMUA channel terhubung */
  pushAll(storeId: string, platform?: PlatformCode): Promise<{ pushed: number }>;
  /** tarik produk dari channel & simpan (upsert by sku) */
  pull(storeId: string, platform: PlatformCode): Promise<{ pulled: number; created: number; updated: number }>;
  listCategories(storeId: string, platform: PlatformCode, parentId?: string): Promise<CategoryReference[]>;
  pushUpdate(storeId: string, platform: PlatformCode, productId: string, patch: Record<string, unknown>): Promise<void>;
}

export function productModule(deps: ModuleDeps): ProductModuleImpl {
  const { repos, registry } = deps;
  const { id, now } = buildIds(deps);

  const requireProduct = async (productId: string) => {
    const product = await repos.products.findById(productId);
    if (!product) throw new Error(`Product ${productId} not found`);
    return product;
  };

  return {
    async create(input) {
      const stamp = now();
      const product: UnifiedProduct = { ...input, id: id(), createdAt: stamp, updatedAt: stamp };
      return repos.products.save(product);
    },

    async update(productId, patch) {
      await requireProduct(productId);
      return repos.products.update(productId, { ...patch, updatedAt: now() });
    },

    async getById(productId) {
      return requireProduct(productId);
    },

    async getBySku(sku) {
      const product = await repos.products.findBySku(sku);
      if (!product) throw new Error(`Product with sku ${sku} not found`);
      return product;
    },

    async list(storeId, opts) {
      return repos.products.list(storeId, opts);
    },

    async delete(productId) {
      await repos.products.delete(productId);
    },

    async pushToChannel(productId, storeId, platform) {
      const product = await requireProduct(productId);
      const channels = await repos.channels.findByStore(storeId);
      const channel = channels.find((c) => c.platform === platform);
      if (!channel) throw new Error(`Channel ${platform} not connected for store ${storeId}`);
      const plugin = registry.get(channel.platform);
      const context = await channelContext(deps, storeId, platform);
      await plugin.gateway.product.push(context, product);
      await deps.events?.emit('product.pushed', { productId, platform, storeId });
    },

    async pushAll(storeId, platform) {
      const { items } = await repos.products.list(storeId, { limit: 10_000 });
      const channels = (await repos.channels.findByStore(storeId)).filter((c) => !platform || c.platform === platform);
      for (const channel of channels) {
        const plugin = registry.get(channel.platform);
        const context = await channelContext(deps, storeId, channel.platform);
        await plugin.gateway.product.push(context, items);
      }
      await deps.events?.emit('products.pushed', { storeId, count: items.length });
      return { pushed: items.length };
    },

    async pull(storeId, platform) {
      const plugin = registry.get(platform);
      const context = await channelContext(deps, storeId, platform);
      const remote = await plugin.gateway.product.pull(context);

      let created = 0;
      let updated = 0;
      for (const incoming of remote) {
        const existing = await repos.products.findBySku(incoming.variants[0]?.sku ?? '');
        if (!existing) {
          const stamped = { ...incoming, storeId, id: id(), createdAt: now(), updatedAt: now() };
          await repos.products.save(stamped);
          created += 1;
        } else {
          await repos.products.update(existing.id, { ...incoming, storeId, updatedAt: now() });
          updated += 1;
        }
      }
      return { pulled: remote.length, created, updated };
    },

    async listCategories(storeId, platform, parentId) {
      const res = await withChannel(deps, storeId, platform, (ctx) => deps.registry.get(platform as never).gateway.product.listCategories(ctx, parentId));
      return res.ran && res.result ? res.result : [];
    },

    async pushUpdate(storeId, platform, productId, patch) {
      const product = await requireProduct(productId);
      await withChannel(deps, storeId, platform, (ctx) => deps.registry.get(platform as never).gateway.product.update(ctx, product.id, patch));
    },
  };
}