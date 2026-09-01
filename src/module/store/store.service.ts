export interface StoreModule {
  create(data: unknown): Promise<unknown>;
  getStore(storeId: string): Promise<unknown>;
  update(storeId: string, patch: unknown): Promise<unknown>;
  delete(storeId: string): Promise<void>;
  list(): Promise<unknown[]>;
}