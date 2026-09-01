import type { ID, ISO8601, Money, Address } from '../base';

export type CourierCode =
  | 'jne'
  | 'jnt'
  | 'sicepat'
  | 'anteraja'
  | 'grab'
  | 'gosend'
  | 'j&t'
  | 'ninja'
  | 'custom';

export interface ShippingRateRequest {
  origin: Address;
  destination: Address;
  items: Array<{ lengthCm?: number; widthCm?: number; heightCm?: number; weightGram: number; quantity: number }>;
  couriers?: CourierCode[];
}

export interface ShippingRate {
  courier: CourierCode;
  service: string;
  cost: Money;
  estDaysMin?: number;
  estDaysMax?: number;
  insuranceAvailable?: boolean;
}

export type TrackingStatus = 'pending' | 'in_transit' | 'delivered' | 'failed' | 'returned';

export interface TrackingEvent {
  status: TrackingStatus | string;
  description: string;
  location?: string;
  occurredAt: ISO8601;
}

export interface Shipment {
  id: ID;
  orderId: ID;
  courier: CourierCode;
  service: string;
  trackingNumber: string;
  trackingUrl?: string;
  events: TrackingEvent[];
  status: TrackingStatus;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}