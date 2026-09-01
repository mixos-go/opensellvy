import type { ID, ISO8601, Money } from '../base';

export type PromotionType = 'voucher' | 'flash_sale' | 'bundle' | 'buy_get' | 'free_shipping';

export type PromotionStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';

export type DiscountType = 'percent' | 'fixed' | 'bundle' | 'threshold';

export interface DiscountRule {
  type: DiscountType;
  value: number; // persen (0-100) utk percent | nominal utk fixed
  minSpend?: Money;
  maxDiscount?: Money;
  buyQuantity?: number; // utk buy_get/bundle
  getQuantity?: number;
  appliesTo: 'all_items' | 'specific_items' | 'catalog';
  itemSkus?: string[];
}

export interface Promotion {
  id: ID;
  storeId: ID;
  name: string;
  description?: string;
  type: PromotionType;
  status: PromotionStatus;
  code?: string;
  startAt: ISO8601;
  endAt: ISO8601;
  budget?: Money;
  usageLimit?: number;
  usageCount: number;
  rules: DiscountRule;
  channels?: string[]; // kosong = semua channel
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface PromotionValidation {
  valid: boolean;
  promotion?: Promotion;
  discountAmount?: Money;
  reasons?: string[];
}