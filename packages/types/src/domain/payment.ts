import type { ID, ISO8601, Money } from '../base';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'partially_refunded'
  | 'refunded'
  | 'failed'
  | 'cancelled';

export type PaymentMethod =
  | 'cod'
  | 'transfer'
  | 'e-wallet'
  | 'virtual_account'
  | 'credit_card'
  | 'qris'
  | 'installment'
  | 'platform_wallet'
  | 'other';

export interface PaymentRefund {
  id: ID;
  amount: Money;
  status: 'processing' | 'succeeded' | 'failed';
  reason?: string;
  createdAt: ISO8601;
}

export interface Payment {
  id: ID;
  orderId: ID;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: Money;
  gateway?: string;
  transactionId?: string;
  paidAt?: ISO8601;
  refunds: PaymentRefund[];
  createdAt: ISO8601;
  updatedAt: ISO8601;
}