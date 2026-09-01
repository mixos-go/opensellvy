import type { ID, ISO8601, Money } from '../base';

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'deleted';

export type ListingStatus = 'active' | 'inactive' | 'deleted' | 'unlisted';

export interface ProductImage {
  url: string;
  position: number;
  alt?: string;
}

export interface ProductVariant {
  id: ID;
  sku: string;
  name?: string;
  options: Record<string, string>;
  price: Money;
  compareAtPrice?: Money;
  barcode?: string;
  stock?: number;
  platformVariantId?: string;
}

export interface UnifiedProduct {
  id: ID;
  storeId: ID;
  name: string;
  description: string;
  brand?: string;
  categoryIds: ID[];
  images: ProductImage[];
  variants: ProductVariant[];
  attributes: Record<string, unknown>;
  status: ProductStatus;
  raw?: Record<string, unknown>;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface ChannelListing {
  id: ID;
  productId: ID;
  channelId: ID;
  platform: string;
  platformProductId?: string;
  platformVariantId?: string;
  url?: string;
  status: ListingStatus;
  syncedAt: ISO8601;
}

export interface ProductStockSku {
  sku: string;
  stock: number;
  warehouseId?: ID;
}