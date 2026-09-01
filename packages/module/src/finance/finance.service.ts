export interface FinanceModule {
  getInvoice(orderId: string): Promise<unknown>;
  listSettlements(filters: unknown): Promise<unknown[]>;
  reconcile(): Promise<unknown>;
  getSummary(storeId: string, from: Date, to: Date): Promise<unknown>;
}