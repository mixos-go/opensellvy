export interface InventoryModule {
  getStock(productId: string, warehouseId?: string): Promise<unknown>;
  adjust(productId: string, quantity: number, reason: string): Promise<unknown>;
  reserve(orderId: string): Promise<void>;
  syncToChannels(productId: string): Promise<void>;
}
