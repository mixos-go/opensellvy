import type { Store } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export type StoreCreateInput = Pick<Store, 'name' | 'slug'> & Partial<Pick<Store, 'logoUrl' | 'config'>>;

export interface StoreModuleImpl {
  create(input: StoreCreateInput, ownerUserId?: string): Promise<Store>;
  getById(storeId: string): Promise<Store>;
  getBySlug(slug: string): Promise<Store>;
  update(storeId: string, patch: Partial<Store>): Promise<Store>;
  list(): Promise<Store[]>;
  delete(storeId: string): Promise<void>;
}

export function storeModule(deps: ModuleDeps): StoreModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  return {
    async create(input, ownerUserId) {
      const stamp = now();
      const store: Store = {
        id: id(),
        name: input.name,
        slug: input.slug,
        config: input.config ?? { timezone: 'Asia/Jakarta', currency: 'IDR' },
        createdAt: stamp,
        updatedAt: stamp,
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      };
      const saved = await repos.stores.save(store);
      if (ownerUserId) {
        await repos.members.add({ storeId: saved.id, userId: ownerUserId, role: 'owner', status: 'active', createdAt: stamp, updatedAt: stamp });
      }
      await deps.events?.emit('store.created', { storeId: saved.id });
      return saved;
    },

    async getById(storeId) {
      const store = await repos.stores.findById(storeId);
      if (!store) throw new Error(`Store ${storeId} not found`);
      return store;
    },

    async getBySlug(slug) {
      const store = await repos.stores.findBySlug(slug);
      if (!store) throw new Error(`Store "${slug}" not found`);
      return store;
    },

    async update(storeId, patch) {
      await this.getById(storeId);
      return repos.stores.save({ ...(await this.getById(storeId)), ...patch, updatedAt: now() });
    },

    async list() {
      return repos.stores.list();
    },

    async delete(storeId) {
      await repos.stores.delete(storeId);
    },
  };
}