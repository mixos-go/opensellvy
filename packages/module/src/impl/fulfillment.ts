import type { CourierCode, FulfillmentFlow, HandoverPayload, PackPayload, PickPayload, OrderStatus, Shipment } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds, channelContext } from './deps';
import type { InventoryModuleImpl } from './inventory';
import type { OrderModuleImpl } from './order';

const STATUS_MAP: Record<OrderStatus, FulfillmentFlow['status']> = {
  pending: 'pending',
  paid: 'pending',
  awaiting_fulfillment: 'pending',
  processing: 'picked',
  shipped: 'handed_over',
  in_transit: 'in_transit',
  delivered: 'delivered',
  completed: 'delivered',
  cancelled: 'cancelled',
  returned: 'delivered',
  failed: 'failed',
};

export interface FulfillmentModuleImpl {
  pick(payload: PickPayload): Promise<FulfillmentFlow>;
  pack(payload: PackPayload): Promise<FulfillmentFlow>;
  handover(payload: HandoverPayload, inventory: InventoryModuleImpl, orders: OrderModuleImpl): Promise<FulfillmentFlow>;
  getByOrder(orderId: string): Promise<FulfillmentFlow>;
}

/** fulfillment flow disimpan di dalam status order+inventory (in-memory MVP);
 *  state terpusat akan pindah ke DB Postgres di step 5. */
export function fulfillmentModule(deps: ModuleDeps): FulfillmentModuleImpl {
  const { repos } = deps;
  const { now } = buildIds(deps);

  const requireOrder = async (orderId: string) => {
    const order = await repos.orders.findById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    return order;
  };

  return {
    async pick(payload) {
      await requireOrder(payload.orderId);
      await repos.orders.update(payload.orderId, { status: 'processing', subStatus: 'picking', updatedAt: now() });
      return { orderId: payload.orderId, status: 'picked', warehouseId: payload.warehouseId, pickerId: payload.pickerId, updatedAt: now() };
    },

    async pack(payload) {
      await requireOrder(payload.orderId);
      await repos.orders.update(payload.orderId, { status: 'processing', subStatus: 'packed', updatedAt: now() });
      return { orderId: payload.orderId, status: 'packed', packedAt: now(), updatedAt: now() };
    },

    async handover(payload, inventory, orders) {
      await requireOrder(payload.orderId);
      // kurangi stock saat handover (keluar gudang) utk tiap line produk
      const order = await requireOrder(payload.orderId);
      for (const line of order.lines) {
        if (line.warehouseId) {
          await inventory.adjust({
            productId: line.productId,
            sku: line.sku,
            warehouseId: line.warehouseId,
            quantity: -line.quantity,
            reason: `handover order ${payload.orderId}`,
          });
        }
      }
      await orders.updateStatus(payload.orderId, {
        action: 'ship',
        trackingNumber: payload.trackingNumber,
        courier: payload.courier,
      });
      // dorong pengiriman ke platform via contrak gateway fulfillment (kalau terhubung)
      try {
        const plugin = deps.registry.get(order.platform);
        const context = await channelContext(deps, order.storeId, order.platform);
        await plugin.gateway.fulfillment.ship(context, order.platformOrderId, {
          courier: payload.courier,
          ...(payload.service !== undefined ? { service: payload.service } : {}),
          ...(payload.trackingNumber !== undefined ? { trackingNumber: payload.trackingNumber } : {}),
        });
      } catch (err) {
        deps.logger?.warn('fulfillment.ship push-back gagal (status lokal tetap tersimpan)', err);
      }
const shipment: Shipment = {
        id: `ship-${payload.orderId}`,
        orderId: payload.orderId,
        courier: payload.courier as CourierCode,
        service: payload.service,
        trackingNumber: payload.trackingNumber,
        events: [{ status: 'pending', description: 'Dikirim', occurredAt: now() }],
        status: 'pending',
        createdAt: now(),
        updatedAt: now(),
      };
      await repos.shipments.save(shipment);
      await deps.events?.emit('shipment.created', { orderId: payload.orderId, trackingNumber: payload.trackingNumber });
      return { orderId: payload.orderId, status: 'handed_over', handedOverAt: now(), trackingNumber: payload.trackingNumber, updatedAt: now() };
    },

    async getByOrder(orderId) {
      const order = await requireOrder(orderId);
      return { orderId, status: STATUS_MAP[order.status], updatedAt: order.updatedAt };
    },
  };
}