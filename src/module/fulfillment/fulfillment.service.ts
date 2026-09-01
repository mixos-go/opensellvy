export type FulfillmentStatus =
  | 'pending'
  | 'picked'
  | 'packed'
  | 'handed_over'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface FulfillmentOrder {
  orderId: string;
  status: FulfillmentStatus;
  warehouseId?: string;
  pickerId?: string;
  packagedAt?: Date;
  shippedAt?: Date;
}

export interface FulfillmentModule {
  create(orderId: string, warehouseId: string): Promise<FulfillmentOrder>;
  markPicked(orderId: string, pickerId: string): Promise<FulfillmentOrder>;
  markPacked(orderId: string): Promise<FulfillmentOrder>;
  ship(orderId: string, courier: string, trackingNumber: string): Promise<void>;
  getStatus(orderId: string): Promise<FulfillmentStatus>;
}
