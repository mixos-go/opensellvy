export interface CatalogModule {
  getCategories(storeId: string): Promise<unknown[]>;
  createCategory(data: unknown): Promise<unknown>;
  updateCategory(id: string, data: unknown): Promise<unknown>;
  mapPlatformCategory(channel: string, platformCategoryId: string): Promise<unknown>;
}