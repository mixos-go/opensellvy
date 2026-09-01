export interface ShippingModule {
  getRates(payload: unknown): Promise<unknown[]>;
  createShipment(orderId: string, courier: string, service: string): Promise<unknown>;
  track(trackingNumber: string, courier: string): Promise<unknown>;
}