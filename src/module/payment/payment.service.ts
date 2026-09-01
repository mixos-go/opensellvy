export interface PaymentModule {
  capture(orderId: string, method: string): Promise<unknown>;
  refund(paymentId: string, amount?: number): Promise<unknown>;
  getStatus(paymentId: string): Promise<unknown>;
}