import type { ID, ISO8601, Money } from '../base';

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'picked_up' | 'received' | 'refunded' | 'cancelled';

export type ReturnReason =
  | 'wrong_item'
  | 'defective'
  | 'not_as_described'
  | 'damaged'
  | 'buyer_remorse'
  | 'other';

export interface ReturnLine {
  orderLineId: ID;
  sku: string;
  quantity: number;
}

export interface ReturnRequest {
  id: ID;
  orderId: ID;
  channelId: ID;
  lines: ReturnLine[];
  reason: ReturnReason;
  note?: string;
  status: ReturnStatus;
  refundAmount?: Money;
  label?: string;
  updatedAt: ISO8601;
  createdAt: ISO8601;
}