import type {
  ISO8601,
  OrderFilter,
  OrderStatus,
  OrderStatusUpdate,
  UnifiedOrder,
  Paginated,
} from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds, channelContext } from './deps';

const ACTION_TO_STATUS: Record<OrderStatusUpdate['action'], OrderStatus> = {
  accept: 'awaiting_fulfillment',
  ship: 'shipped',
  deliver: 'delivered',
  cancel: 'cancelled',
  return: 'returned',
};

function orderChanged(a: UnifiedOrder, b: UnifiedOrder): boolean {
  const pick = (o: UnifiedOrder) =>
    JSON.stringify({
      status: o.status,
      lines: o.lines,
      totals: o.totals,
      courier: o.shipping.courier,
      service: o.shipping.service,
      trackingNumber: o.shipping.trackingNumber,
      raw: o.raw,
    });
  return pick(a) !== pick(b);
}

export interface OrderModuleImpl {
  list(filter: OrderFilter): Promise<Paginated<UnifiedOrder>>;
  getById(orderId: string): Promise<UnifiedOrder>;
  getByPlatformOrderId(platform: string, platformOrderId: string): Promise<UnifiedOrder>;
  updateStatus(orderId: string, update: OrderStatusUpdate, actorId?: string): Promise<UnifiedOrder>;
  fulfill(orderId: string, trackingNumber: string, courier: string): Promise<UnifiedOrder>;
  /** tarik order dari channel/platform terhubung (idempoten by platformOrderId) */
  sync(storeId: string, platform?: string, opts?: { since?: Date }): Promise<{ pulled: number; created: number; updated: number }>;
  getByOrderNumber(storeId: string, orderNumber: string): Promise<UnifiedOrder>;
}

export function orderModule(deps: ModuleDeps): OrderModuleImpl {
  const { repos, registry } = deps;
  const { id, now } = buildIds(deps);

  const requireOrder = async (orderId: string) => {
    const order = await repos.orders.findById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    return order;
  };

  return {
    async list(filter) {
      return repos.orders.find(filter);
    },

    async getById(orderId) {
      return requireOrder(orderId);
    },

    async getByPlatformOrderId(platform, platformOrderId) {
      const order = await repos.orders.findByChannelKey(platform, platformOrderId);
      if (!order) throw new Error(`Order ${platform}:${platformOrderId} not found`);
      return order;
    },

    async getByOrderNumber(storeId, orderNumber) {
      const { items } = await repos.orders.find({ storeId, orderNumber });
      if (!items.length) throw new Error(`Order #${orderNumber} not found`);
      return items[0];
    },

    async updateStatus(orderId, update, actorId) {
      const order = await requireOrder(orderId);
      const status = ACTION_TO_STATUS[update.action];
      const negotiated: Partial<UnifiedOrder> = {
        status,
        subStatus: update.action === 'ship' ? 'fulfilled' : undefined,
        updatedAt: now(),
      };
      if (update.trackingNumber || update.courier) {
        negotiated.shipping = {
          ...order.shipping,
          ...(update.courier ? { courier: update.courier } : {}),
          ...(update.trackingNumber ? { trackingNumber: update.trackingNumber, shippedAt: now() } : {}),
        };
      }
      if (status === 'cancelled') negotiated.cancelledAt = now();
      if (status === 'delivered') negotiated.deliveredAt = now();

      const updated = await repos.orders.update(orderId, negotiated);
      await deps.events?.emit('order.status.updated', { orderId, from: order.status, to: status });

      // satu gate DUA ARAH: status internal dipropagasi balik ke platform
      // (adapter translate ke payload platform masing-masing)
      try {
        const plugin = registry.get(order.platform);
        const context = await channelContext(deps, order.storeId, order.platform);
        await plugin.gateway.updateOrder(context, order.platformOrderId, {
          status,
          ...(update.trackingNumber ? { trackingNumber: update.trackingNumber } : {}),
          ...(update.courier ? { courier: update.courier } : {}),
        });
      } catch (err) {
        deps.logger?.warn('updateOrder push-back gagal (status tetap tersimpan)', err);
      }

      await deps.events?.emit('audit.logged', {
        action: `order.${update.action}`,
        actorId: actorId ?? 'system',
        storeId: order.storeId,
        targetType: 'order',
        targetId: orderId,
        metadata: { from: order.status, to: status, reason: update.reason },
      });
      return updated;
    },

    async fulfill(orderId, trackingNumber, courier) {
      return this.updateStatus(orderId, { action: 'ship', trackingNumber, courier });
    },

    async sync(storeId, platform, opts) {
      let channels = await repos.channels.findByStore(storeId);
      if (platform) channels = channels.filter((c) => c.platform === platform);
      let pulled = 0;
      let created = 0;
      let updated = 0;

      for (const channel of channels) {
        const plugin = registry.get(channel.platform);
        const context = await channelContext(deps, storeId, channel.platform);
        const remote = await plugin.gateway.pullOrders(context, opts);
        pulled += remote.length;

        for (const incoming of remote) {
          const normalized: UnifiedOrder = {
            ...incoming,
            storeId,
            channelId: channel.id,
            updatedAt: now(),
          };
          const existing = await repos.orders.findByChannelKey(normalized.platform, normalized.platformOrderId);
          if (!existing) {
            normalized.createdAt = normalized.createdAt ?? now();
            await repos.orders.save(normalized);
            created += 1;
          } else if (orderChanged(existing, normalized)) {
            await repos.orders.merge({
              ...existing,
              ...normalized,
              id: existing.id,
              createdAt: existing.createdAt,
            });
            updated += 1;
          }
        }
      }
      return { pulled, created, updated };
    },
  };
}

export type OrderTimestamps = ISO8601; // re-export pragmatis