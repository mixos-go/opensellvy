export interface AnalyticsModule {
  getSalesSummary(storeId: string, from: Date, to: Date): Promise<unknown>;
  getDailySales(storeId: string, from: Date, to: Date): Promise<unknown[]>;
  getTopProducts(storeId: string, from: Date, to: Date, limit?: number): Promise<unknown[]>;
  getChannelPerformance(storeId: string, from: Date, to: Date): Promise<unknown[]>;
  getInventoryReport(storeId: string): Promise<unknown[]>;
}