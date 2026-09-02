import type { AnalyticsFilter, SalesSummary, ChannelPerformance, TopProductRow, PlatformCode } from '@opensellvy/types';
import type { ModuleDeps } from './deps';

export interface AnalyticsModuleImpl {
  salesSummary(filter: AnalyticsFilter): Promise<SalesSummary>;
  /** hitung langsung dari order tersimpan (cross-check platform reports) */
  salesSummaryFromOrders(filter: AnalyticsFilter): Promise<SalesSummary>;
  channelPerformance(filter: AnalyticsFilter): Promise<ChannelPerformance[]>;
  topProducts(filter: AnalyticsFilter, limit?: number): Promise<TopProductRow[]>;
}

const HOUR = 3_600_000;

function avgFulfillmentHours(orders: Array<{ createdAt: string; shipping?: { shippedAt?: string } }>): number {
  const shipped = orders
    .filter((o) => o.shipping?.shippedAt && o.createdAt)
    .map((o) => (new Date(o.shipping!.shippedAt!).getTime() - new Date(o.createdAt).getTime()) / HOUR)
    .filter((h) => Number.isFinite(h) && h >= 0);
  if (!shipped.length) return 0;
  return Math.round((shipped.reduce((a, b) => a + b, 0) / shipped.length) * 10) / 10;
}

export function analyticsModule(deps: ModuleDeps): AnalyticsModuleImpl {
  const { repos } = deps;

  async function collect(filter: { storeId: string; from: string; to: string; platform?: PlatformCode }) {
    const { items } = await repos.orders.find({
      storeId: filter.storeId,
      from: filter.from,
      to: filter.to,
      limit: 100_000,
      ...(filter.platform ? { platform: filter.platform } : {}),
    });
    return items.filter((o) => o.status !== 'cancelled' && o.status !== 'failed');
  }

  return {
    async salesSummary(filter) {
      return repos.analytics.getSalesSummary(filter.storeId, filter.from, filter.to);
    },

    async salesSummaryFromOrders(filter) {
      const orders = await collect(filter);
      const gross = orders.reduce((sum, o) => sum + o.totals.grandTotal.amount, 0);
      const net = orders.reduce((sum, o) => sum + (o.totals.grandTotal.amount - o.totals.discount.amount), 0);
      const { items: all } = await repos.orders.find({
        storeId: filter.storeId,
        from: filter.from,
        to: filter.to,
        limit: 100_000,
        ...(filter.platform ? { platform: filter.platform } : {}),
      });
      const refunded = all
        .filter((o) => o.status === 'returned' || o.status === 'cancelled')
        .reduce((sum, o) => sum + o.totals.grandTotal.amount, 0);
      const sold = orders.reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.quantity, 0), 0);
      return {
        grossRevenue: { amount: gross, currency: 'IDR' },
        netRevenue: { amount: net, currency: 'IDR' },
        orderCount: orders.length,
        soldItemCount: sold,
        refundAmount: { amount: refunded, currency: 'IDR' },
      };
    },

    async channelPerformance(filter) {
      const { items: all } = await repos.orders.find({
        storeId: filter.storeId,
        from: filter.from,
        to: filter.to,
        limit: 100_000,
        ...(filter.platform ? { platform: filter.platform } : {}),
      });
      const kept = all.filter((o) => o.status !== 'cancelled' && o.status !== 'failed');
      const byPlatform = new Map<string, typeof kept>();
      for (const o of kept) {
        const list = byPlatform.get(o.platform) ?? [];
        list.push(o);
        byPlatform.set(o.platform, list);
      }
      const byPlatformAll = new Map<string, typeof all>();
      for (const o of all) {
        const list = byPlatformAll.get(o.platform) ?? [];
        list.push(o);
        byPlatformAll.set(o.platform, list);
      }
      const out: ChannelPerformance[] = [];
      for (const [platform, list] of byPlatform) {
        const gross = list.reduce((sum, o) => sum + o.totals.grandTotal.amount, 0);
        const allList = byPlatformAll.get(platform) ?? [];
        const cancelled = allList.filter((o) => o.status === 'cancelled').length;
        out.push({
          platform: platform as PlatformCode,
          orderCount: allList.length,
          grossRevenue: { amount: gross, currency: 'IDR' },
          cancellationRate: allList.length ? Math.round((cancelled / allList.length) * 100) : 0,
          avgFulfillmentHours: avgFulfillmentHours(list),
        });
      }
      return out;
    },

    async topProducts(filter, limit = 10) {
      const orders = await collect(filter);
      const bySku = new Map<string, TopProductRow>();
      for (const o of orders) {
        for (const line of o.lines) {
          const row = bySku.get(line.sku) ?? { productId: line.productId, sku: line.sku, name: line.name, quantity: 0, revenue: { amount: 0, currency: 'IDR' } };
          row.quantity += line.quantity;
          row.revenue.amount += line.total.amount;
          bySku.set(line.sku, row);
        }
      }
      return [...bySku.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
    },
  };
}