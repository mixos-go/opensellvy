export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'picked_up' | 'received' | 'refunded';

export interface ReturnModule {
  request(orderId: string, items: unknown[], reason: string): Promise<unknown>;
  approve(returnId: string): Promise<unknown>;
  reject(returnId: string, reason: string): Promise<unknown>;
  receive(returnId: string): Promise<unknown>;
  refund(returnId: string): Promise<unknown>;
}