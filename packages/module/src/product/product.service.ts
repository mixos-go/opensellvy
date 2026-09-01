import type { UnifiedProduct } from './product.types';

export interface ProductModule {
  create(product: Omit<UnifiedProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<UnifiedProduct>;
  update(id: string, patch: Partial<UnifiedProduct>): Promise<UnifiedProduct>;
  getById(id: string): Promise<UnifiedProduct>;
  list(storeId: string, opts?: { categoryId?: string; query?: string; cursor?: string }): Promise<unknown>;
  delete(id: string): Promise<void>;
  pushToChannel(productId: string, platform: string): Promise<unknown>;
}
