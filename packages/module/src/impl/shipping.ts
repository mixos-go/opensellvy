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

/** profil courier default (tarif flat dasar + per-gram) — cukup utk lokal/non-aggregator. */
interface CourierProfile {
  base: number;
  perKg: number;
  estMin: number;
  estMax: number;
}

const COURIER_PROFILES: Record<CourierCode, CourierProfile> = {
  jne: { base: 13_000, perKg: 4_000, estMin: 1, estMax: 4 },
  jnt: { base: 12_000, perKg: 3_500, estMin: 1, estMax: 3 },
  sicepat: { base: 12_500, perKg: 3_500, estMin: 1, estMax: 3 },
  anteraja: { base: 11_500, perKg: 3_000, estMin: 1, estMax: 4 },
  grab: { base: 16_000, perKg: 6_000, estMin: 1, estMax: 1 },
  gosend: { base: 16_000, perKg: 6_000, estMin: 1, estMax: 1 },
  'j&t': { base: 12_000, perKg: 3_500, estMin: 1, estMax: 3 },
  ninja: { base: 12_000, perKg: 3_500, estMin: 1, estMax: 3 },
  custom: { base: 15_000, perKg: 5_000, estMin: 2, estMax: 5 },
};

/** Default rate provider — dipakai bila tidak ada provider eksternal di-inject. */
export function createDefaultCourierRateProvider(): CourierRateProvider {
  return {
    async getRates(request) {
      const couriers = request.couriers?.length ? request.couriers : (Object.keys(COURIER_PROFILES) as CourierCode[]);
      const totalWeight = request.items.reduce((sum, i) => sum + i.weightGram * i.quantity, 0);
      const kg = Math.max(1, Math.ceil(totalWeight / 1000));
      return couriers.map((courier) => {
        const profile = COURIER_PROFILES[courier] ?? COURIER_PROFILES.custom;
        return {
          courier,
          service: 'Regular',
          cost: { amount: profile.base + profile.perKg * (kg - 1), currency: 'IDR' },
          estDaysMin: profile.estMin,
          estDaysMax: profile.estMax,
          insuranceAvailable: true,
        };
      });
    },
  };
}

export function shippingModule(deps: ModuleDeps, rates?: CourierRateProvider): ShippingModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);
  const rateProvider = rates ?? createDefaultCourierRateProvider();

  return {
    async getRates(request) {
      return rateProvider.getRates(request);
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