import type { ID, PlatformCode } from '../types';

export type OrderStatus =
  | 'pending_payment'
  | 'awaiting_fulfillment'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface OrderItem {
  id: ID;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  platformItemId?: string;
  variantId?: string;
}

export interface ShippingDetail {
  courier: string;
  service: string;
  trackingNumber?: string;
  trackingUrl?: string;
  address: ShippingAddress;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  detail: string;
}

export interface UnifiedOrder {
  id: ID;
  storeId: ID;
  platform: PlatformCode;
  platformOrderId: string;
  marketplaceOrderId: string;
  orderNumber: string;
  customerId?: ID;
  status: OrderStatus;
  subStatus?: string;
  items: OrderItem[];
  shipping: ShippingDetail;
  totals: {
    subtotal: number;
    shippingFee: number;
    discount: number;
    tax: number;
    grandTotal: number;
  };
  raw: Record<string, unknown>;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFilter {
  storeId: ID;
  status?: OrderStatus;
  platform?: PlatformCode;
  orderNumber?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;
}
