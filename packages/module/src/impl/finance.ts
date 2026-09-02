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
      const { items: orders } = await repos.orders.find({ storeId, platform, from: period.from, to: period.to, limit: 100_000 });
      const kept = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'failed');
      const refundedOrders = orders.filter((o) => o.status === 'returned' || o.status === 'cancelled');

      const gross = kept.reduce((sum, o) => sum + o.totals.grandTotal.amount, 0);
      const shippingFee = kept.reduce((sum, o) => sum + o.totals.shippingFee.amount, 0);
      const refunded = refundedOrders.reduce((sum, o) => sum + o.totals.grandTotal.amount, 0);
      // Komisi/platform-fee tidak ada di data order (dilaporkan platform); net = expectation kita.
      const net = gross - refunded;

      const settlement: Settlement = {
        id: id(),
        storeId,
        channelId: `${storeId}:${platform}`,
        platform,
        period,
        gross: { amount: gross, currency: 'IDR' },
        commission: { amount: 0, currency: 'IDR' },
        shippingFee: { amount: shippingFee, currency: 'IDR' },
        refundedAmount: { amount: refunded, currency: 'IDR' },
        net: { amount: net, currency: 'IDR' },
        status: 'in_transit',
        createdAt: stamp,
        updatedAt: stamp,
      };
      await repos.settlements.save(settlement);
      await deps.events?.emit('settlement.recorded', { storeId, platform, amount: net });
      return settlement;
    },

    currency() {
      return { amount: 0, currency: 'IDR' };
    },
  };
}

export type FinanceSettlementStatus = SettlementStatus;