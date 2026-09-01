import type { CustomerFilter, Paginated, UnifiedCustomer, UnifiedOrder, PlatformCode } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export type CustomerCreateInput = Pick<UnifiedCustomer, 'storeId' | 'name'> &
  Partial<Pick<UnifiedCustomer, 'email' | 'phone' | 'addresses' | 'tags' | 'notes'>>;

export interface CustomerModuleImpl {
  create(input: CustomerCreateInput): Promise<UnifiedCustomer>;
  getById(customerId: string): Promise<UnifiedCustomer>;
  findByPlatform(storeId: string, platform: PlatformCode, platformUserId: string): Promise<UnifiedCustomer | undefined>;
  /** buat/ambil customer berdasarkan profil platform (upsert) */
  upsertFromProfile(
    storeId: string,
    profile: { platform: PlatformCode; platformUserId: string; username: string; name: string; phone?: string; channelId?: string },
  ): Promise<UnifiedCustomer>;
  list(filter: CustomerFilter): Promise<Paginated<UnifiedCustomer>>;
  orderHistory(storeId: string, customerId: string): Promise<UnifiedOrder[]>;
  update(customerId: string, patch: Partial<UnifiedCustomer>): Promise<UnifiedCustomer>;
}

export function customerModule(deps: ModuleDeps): CustomerModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  return {
    async create(input) {
      const stamp = now();
      const customer: UnifiedCustomer = {
        id: id(),
        storeId: input.storeId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        addresses: input.addresses ?? [],
        platformProfiles: [],
        tags: input.tags ?? [],
        notes: input.notes,
        createdAt: stamp,
        updatedAt: stamp,
      };
      return repos.customers.save(customer);
    },

    async getById(customerId) {
      const customer = await repos.customers.findById(customerId);
      if (!customer) throw new Error(`Customer ${customerId} not found`);
      return customer;
    },

    async findByPlatform(storeId, platform, platformUserId) {
      const customer = await repos.customers.findByPlatformProfile(platform, platformUserId);
      return customer?.storeId === storeId ? customer : undefined;
    },

    async upsertFromProfile(storeId, profile) {
      const existing = await repos.customers.findByPlatformProfile(profile.platform, profile.platformUserId);
      const stamp = now();
      if (existing) {
        const merged = await repos.customers.save({
          ...existing,
          name: profile.name || existing.name,
          phone: profile.phone || existing.phone,
          platformProfiles: [{ platform: profile.platform, platformUserId: profile.platformUserId, username: profile.username, channelId: profile.channelId }, ...existing.platformProfiles.filter((p) => p.platformUserId !== profile.platformUserId)],
          updatedAt: stamp,
        });
        return merged;
      }
      const customer: UnifiedCustomer = {
        id: id(),
        storeId,
        name: profile.name,
        phone: profile.phone,
        addresses: [],
        platformProfiles: [{ platform: profile.platform, platformUserId: profile.platformUserId, username: profile.username, channelId: profile.channelId }],
        tags: [],
        createdAt: stamp,
        updatedAt: stamp,
      };
      return repos.customers.save(customer);
    },

    async list(filter) {
      return repos.customers.find(filter);
    },

    async orderHistory(storeId, customerId) {
      const { items } = await repos.orders.find({ storeId, limit: 10_000 });
      return items.filter((o) => o.customer?.customerId === customerId);
    },

    async update(customerId, patch) {
      await this.getById(customerId);
      return repos.customers.save({ ...(await this.getById(customerId)), ...patch, updatedAt: now() });
    },
  };
}