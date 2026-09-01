import type { OrderFilter, UnifiedOrder } from './order.types';

export interface OrderModule {
  list(filter: OrderFilter): Promise<{ items: UnifiedOrder[]; pageInfo: unknown }>;
  getById(orderId: string): Promise<UnifiedOrder>;
  getByPlatformOrderId(platform: string, platformOrderId: string): Promise<UnifiedOrder>;
  updateStatus(orderId: string, status: string): Promise<UnifiedOrder>;
  fulfill(orderId: string, trackingNumber: string, courier: string): Promise<UnifiedOrder>;
}
