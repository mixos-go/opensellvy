import type { ID, ISO8601 } from '../base';

export type FulfillmentStatus =
  | 'pending'
  | 'picked'
  | 'packed'
  | 'handed_over'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface FulfillmentFlow {
  orderId: ID;
  status: FulfillmentStatus;
  warehouseId?: ID;
  pickerId?: ID;
  packedAt?: ISO8601;
  handedOverAt?: ISO8601;
  trackingNumber?: string;
  failureReason?: string;
  updatedAt: ISO8601;
}

export interface PickPayload {
  orderId: ID;
  warehouseId: ID;
  pickerId: ID;
  lineItemIds?: ID[];
}

export interface PackPayload {
  orderId: ID;
  packageWeightGram?: number;
  note?: string;
}

export interface HandoverPayload {
  orderId: ID;
  courier: string;
  service: string;
  trackingNumber: string;
  awbUrl?: string;
}