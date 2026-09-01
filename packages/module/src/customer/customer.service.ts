export interface CustomerModule {
  getById(id: string): Promise<unknown>;
  findByPlatformId(platform: string, platformCustomerId: string): Promise<unknown>;
  merge(primaryId: string, duplicateId: string): Promise<void>;
  getOrderHistory(customerId: string): Promise<unknown[]>;
}
