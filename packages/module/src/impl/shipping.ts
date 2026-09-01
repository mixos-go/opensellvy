import type { CourierCode, ShippingRate, ShippingRateRequest, Shipment, TrackingEvent } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

/** port ke aggregator ongkir (biteship/raxio) — impl nyata di layer application. */
export interface CourierRateProvider {
  getRates(request: ShippingRateRequest): Promise<ShippingRate[]>;
}

export interface ShippingModuleImpl {
  getRates(request: ShippingRateRequest): Promise<ShippingRate[]>;
  addTrackingEvent(orderId: string, event: Omit<TrackingEvent, 'occurredAt'>): Promise<Shipment>;
  track(trackingNumber: string): Promise<Shipment>;
}

export function shippingModule(deps: ModuleDeps, rates?: CourierRateProvider): ShippingModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  return {
    async getRates(request) {
      if (!rates) throw new Error('CourierRateProvider belum dikonfigurasi');
      return rates.getRates(request);
    },

    async addTrackingEvent(orderId, event) {
      const shipments = await repos.shipments.findByOrder(orderId);
      if (!shipments.length) throw new Error(`No shipment for order ${orderId}`);
      const current = shipments[0];
      const updated: Shipment = {
        ...current,
        status: event.status as unknown as Shipment['status'],
        events: [...current.events, { ...event, occurredAt: now() }],
        updatedAt: now(),
      };
      await repos.shipments.save(updated);
      await deps.events?.emit('tracking.updated', { orderId, trackingNumber: updated.trackingNumber, status: updated.status });
      return updated;
    },

    async track(trackingNumber) {
      const shipment = await repos.shipments.findByTracking(trackingNumber);
      if (!shipment) throw new Error(`Shipment ${trackingNumber} not found`);
      return shipment;
    },
  };
}

export const COURIERS: CourierCode[] = ['jne', 'jnt', 'sicepat', 'anteraja', 'grab', 'gosend', 'ninja', 'custom'];