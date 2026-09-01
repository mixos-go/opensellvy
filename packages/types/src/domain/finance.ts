import type { ID, ISO8601, Money, PlatformCode } from '../base';

export type SettlementStatus = 'pending' | 'in_transit' | 'settled' | 'disputed' | 'failed';

export interface Invoice {
  id: ID;
  orderId?: ID;
  number: string;
  issuedTo?: string;
  total: Money;
  issuedAt: ISO8601;
}

export interface Settlement {
  id: ID;
  storeId: ID;
  channelId: ID;
  platform: PlatformCode;
  period: { from: ISO8601; to: ISO8601 };
  gross: Money;
  commission: Money;
  shippingFee: Money;
  refundedAmount: Money;
  net: Money;
  status: SettlementStatus;
  reference?: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface ReconciliationReport {
  mismatches: Array<{
    type: 'missing' | 'amount_diff' | 'status_diff';
    platformOrderId?: string;
    detail: string;
  }>;
  checkedCount: number;
}