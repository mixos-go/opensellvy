import type { ID, ISO8601, Money } from '../base';

/** Reference data kategori/atribut dari platform (read-only, lintas marketplace). */
export interface CategoryReference {
  id: ID;
  platform: string;
  parentId?: ID;
  name: string;
  level: number;
  hasChildren: boolean;
  children?: CategoryReference[];
  attributes?: Array<{
    id: ID;
    name: string;
    isMandatory: boolean;
    inputType?: 'text' | 'number' | 'select' | 'multiselect' | 'radio';
    options?: Array<{ id: ID; name: string }>;
  }>;
}

export interface ShopProfilePatch {
  name?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  phone?: string;
  address?: string;
  website?: string;
  [key: string]: unknown;
}

/** Aset media (gambar/video/dokumen) yang di-hosting platform. */
export interface MediaAsset {
  id: ID;
  platform: string;
  region?: string;
  type: 'image' | 'video' | 'file';
  url: string;
  fileSizeBytes?: number;
  widthPx?: number;
  heightPx?: number;
  durationSec?: number;
  createdAt: ISO8601;
}

/** Profil merchant/brand level platform (di luar shop). */
export interface MerchantProfile {
  id: ID;
  platform: string;
  name: string;
  region?: string;
  contactEmail?: string;
  status: string;
  mainAccountId?: string;
  shops: string[];
}

export type VoucherStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'deleted';

export interface Voucher {
  id: ID;
  storeId: ID;
  name: string;
  code: string;
  status: VoucherStatus;
  type: 'shop' | 'platform' | 'coins';
  discountType: 'percent' | 'fixed';
  value: number;
  minSpend?: Money;
  maxDiscount?: Money;
  startAt: ISO8601;
  endAt: ISO8601;
  usageLimit?: number;
  usageCount: number;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface Discount {
  id: ID;
  storeId: ID;
  name: string;
  status: PromotionStatus;
  kind: 'order' | 'item' | 'free_shipping' | 'bundle' | 'threshold';
  discountType: 'percent' | 'fixed';
  value: number;
  startAt: ISO8601;
  endAt: ISO8601;
  itemSkus?: string[];
  createdAt: ISO8601;
}

export type FlashSaleStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

export interface FlashSale {
  id: ID;
  storeId: ID;
  name: string;
  status: FlashSaleStatus;
  startAt: ISO8601;
  endAt: ISO8601;
  items: Array<{
    platformItemId?: string;
    sku: string;
    stock: number;
    priceBefore: Money;
    priceDuring: Money;
  }>;
  createdAt: ISO8601;
}

/** Tipe PromotionStatus dirujuk ulang (sudah didefinisikan di promotion.ts). */
type PromotionStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';
