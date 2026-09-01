import type { Money, Settlement, SettlementStatus, PlatformCode } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export type SettlementInput = Omit<Settlement, 'id' | 'status' | 'createdAt' | 'updatedAt'>;

export interface FinanceModuleImpl {
  recordSettlement(input: SettlementInput): Promise<Settlement>;
  list(storeId: string, opts?: { from?: string; to?: string }): Promise<Settlement[]>;
  /** rekon apa yang dibayar platform vs apa yang tercatat order scan (cross-check missing) */
  reconcile(storeId: string, platform: PlatformCode, period: { from: string; to: string }): Promise<Settlement>;
  currency(): Money;
}

export function financeModule(deps: ModuleDeps): FinanceModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  return {
    async recordSettlement(input) {
      const stamp = now();
      const settlement: Settlement = { ...input, id: id(), status: 'pending', createdAt: stamp, updatedAt: stamp };
      await repos.settlements.save(settlement);
      await deps.events?.emit('settlement.recorded', { storeId: input.storeId, amount: input.net.amount });
      return settlement;
    },

    async list(storeId, opts) {
      return repos.settlements.list(storeId, opts);
    },

    async reconcile(storeId, platform, period) {
      const stamp = now();
      const settlement: Settlement = {
        id: id(),
        storeId,
        channelId: `${storeId}:${platform}`,
        platform,
        period,
        gross: { amount: 0, currency: 'IDR' },
        commission: { amount: 0, currency: 'IDR' },
        shippingFee: { amount: 0, currency: 'IDR' },
        refundedAmount: { amount: 0, currency: 'IDR' },
        net: { amount: 0, currency: 'IDR' },
        status: 'in_transit',
        createdAt: stamp,
        updatedAt: stamp,
      };
      await repos.settlements.save(settlement);
      return settlement;
    },

    currency() {
      return { amount: 0, currency: 'IDR' };
    },
  };
}

export type FinanceSettlementStatus = SettlementStatus;