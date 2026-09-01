import type { ID, PlatformCode } from '@opensellvy/types';

export interface ProductVariant {
  id: ID;
  sku: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  platformVariantId?: string;
}

export interface UnifiedProduct {
  id: ID;
  storeId: ID;
  name: string;
  description: string;
  categoryId?: ID;
  brand?: string;
  images: string[];
  variants: ProductVariant[];
  attributes: Record<string, unknown>;
  raw: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelListing {
  productId: ID;
  platform: PlatformCode;
  platformProductId: string;
  status: 'active' | 'inactive' | 'deleted';
  url?: string;
  syncedAt: Date;
}
