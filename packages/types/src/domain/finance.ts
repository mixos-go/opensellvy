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

/** Ringkasan finansial toko (income/payout) dari platform. */
export interface FinanceOverview {
  lastPayoutAt?: ISO8601;
}

export interface WalletTransaction {
  id: ID;
  storeId?: ID;
  orderId?: string;
  /** Jenis transaksi: 'income' | 'refund' | 'payout' | 'adjustment' | 'other'. */
  type: string;
  direction: 'in' | 'out';
  amount: Money;
  balance?: Money;
  status: string;
  createdAt: ISO8601;
}

/** Laporan keuangan ter-generate sebagai file (income report/statement). */
export interface FinanceStatement {
  id: ID;
  fileName: string;
  status: 'generating' | 'ready' | 'failed';
  generatedAt?: ISO8601;
  fileUrl?: string;
  error?: string;
}

export interface Payout {
  id: ID;
  amount: Money;
  status: string;
  method: string;
  paidTo?: string;
  requestedAt: ISO8601;
  paidAt?: ISO8601;
}

export interface PayoutInfo {
  payouts: Payout[];
}

/** Filter kueri domain finance (gateway). */
export interface FinanceQuery {
  from?: ISO8601;
  to?: ISO8601;
  cursor?: string;
  limit?: number;
}