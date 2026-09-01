import type { ID, ISO8601, Money, Address, PlatformCode } from '../base';

export type OrderStatus =
  | 'pending' // menunggu pembayaran
  | 'paid' // sudah dibayar, belum diproses
  | 'awaiting_fulfillment'
  | 'processing'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'failed';

export type OrderSubStatus = string;

export interface OrderLine {
  id: ID;
  productId: ID;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: Money;
  discountAmount?: Money;
  total: Money;
  isGift?: boolean;
  warehouseId?: ID;
  platformItemId?: string;
}

export interface OrderShipping {
  address: Address;
  courier: string;
  service: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedArrival?: ISO8601;
  shippedAt?: ISO8601;
}

export interface OrderTotals {
  subtotal: Money;
  shippingFee: Money;
  insuranceFee?: Money;
  discount: Money; // seller-funded
  platformDiscount?: Money; // platform-funded
  tax: Money;
  grandTotal: Money;
}

export interface OrderRef {
  id: ID;
  customerId?: ID;
  customerName: string;
  message?: string;
}

export interface UnifiedOrder {
  id: ID;
  storeId: ID;
  channelId: ID;
  platform: PlatformCode;
  platformOrderId: string;
  marketplaceOrderId?: string;
  orderNumber: string;
  customer: OrderRef;
  lines: OrderLine[];
  shipping: OrderShipping;
  totals: OrderTotals;
  status: OrderStatus;
  subStatus?: OrderSubStatus;
  /** payload mentah dari platform — hanya utk debugging/adapter, jangan dipakai logic */
  raw?: Record<string, unknown>;
  paidAt?: ISO8601;
  cancelledAt?: ISO8601;
  deliveredAt?: ISO8601;
  createdAt: ISO8601;
  updatedAt: ISO8601;
}

export interface OrderFilter {
  storeId: ID;
  platform?: PlatformCode;
  status?: OrderStatus[];
  orderNumber?: string;
  from?: ISO8601;
  to?: ISO8601;
  cursor?: string;
  limit?: number;
}

export interface OrderStatusUpdate {
  action: 'accept' | 'ship' | 'deliver' | 'cancel' | 'return';
  reason?: string;
  trackingNumber?: string;
  courier?: string;
}