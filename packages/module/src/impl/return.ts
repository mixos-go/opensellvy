import type { ReturnRequest, ReturnStatus } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds, channelContext } from './deps';

export interface ReturnModuleImpl {
  create(input: Omit<ReturnRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ReturnRequest>;
  getById(returnId: string): Promise<ReturnRequest>;
  listByOrder(orderId: string): Promise<ReturnRequest[]>;
  transition(returnId: string, status: ReturnStatus): Promise<ReturnRequest>;
  /** kirim keputusan ke channel (adapter manageReturn) */
  notifyPlatform(returnId: string, storeId: string, action: 'approve' | 'reject' | 'receive' | 'refund'): Promise<void>;
}

export function returnModule(deps: ModuleDeps): ReturnModuleImpl {
  const { repos, registry } = deps;
  const { id, now } = buildIds(deps);

  const require = async (returnId: string) => {
    const r = await repos.returns.findById(returnId);
    if (!r) throw new Error(`Return ${returnId} not found`);
    return r;
  };

  return {
    async create(input) {
      const stamp = now();
      const request: ReturnRequest = { ...input, id: id(), status: 'requested', createdAt: stamp, updatedAt: stamp };
      return repos.returns.save(request);
    },

    async getById(returnId) {
      return require(returnId);
    },

    async listByOrder(orderId) {
      return repos.returns.findByOrder(orderId);
    },

    async transition(returnId, status) {
      const updated = { ...(await require(returnId)), status, updatedAt: now() };
      await repos.returns.save(updated);
      await deps.events?.emit('return.status', { returnId, status });
      return updated;
    },

    async notifyPlatform(returnId, storeId, action) {
      const request = await require(returnId);
      const channels = await repos.channels.findByStore(storeId);
      const channel = channels.find((c) => c.id === request.channelId);
      if (!channel) throw new Error(`Channel for return ${returnId} not found`);
      const plugin = registry.get(channel.platform);
      const context = await channelContext(deps, storeId, channel.platform);
      await plugin.gateway.manageReturn(context, request, action);
    },
  };
}