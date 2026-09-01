import type { ID, ISO8601, Money, PlatformCode } from '../base';

export interface SalesSummary {
  grossRevenue: Money;
  netRevenue: Money;
  orderCount: number;
  soldItemCount: number;
  refundAmount: Money;
}

export interface DailySales {
  date: ISO8601;
  grossRevenue: Money;
  orderCount: number;
  avgOrderValue: Money;
}

export interface ChannelPerformance {
  platform: PlatformCode;
  orderCount: number;
  grossRevenue: Money;
  cancellationRate: number; // 0-100
  avgFulfillmentHours: number;
}

export interface TopProductRow {
  productId: ID;
  sku: string;
  name: string;
  quantity: number;
  revenue: Money;
}

export interface InventoryReportRow {
  sku: string;
  name: string;
  warehouseId: ID;
  available: number;
  reserved: number;
  unhealthy: boolean; // low stock / oversold
}

export interface AnalyticsFilter {
  storeId: ID;
  from: ISO8601;
  to: ISO8601;
  platform?: PlatformCode;
}