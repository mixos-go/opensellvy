import type { UnifiedOrder, UnifiedProduct, Money, Currency, PlatformCode, ReturnRequest } from '@opensellvy/types';

/**
 * Shape payload Shopee (subset yang kita pakai). Semua field marked optional (?)
 * karena Shopee bisa memutuskan field tertentu tidak dikirim. Adapter wajib
 * toleran terhadap field yang hilang — hanya field wajib domain yang diberi default.
 */

interface ShopeeOrderItem {
  item_id?: number | string;
  item_name?: string;
  item_sku?: string;
  model_id?: number | string;
  model_sku?: string;
  model_quantity_purchased?: number;
  model_original_price?: number;
  model_discounted_price?: number;
  is_wholesale?: boolean;
}

interface ShopeeOrderRecipient {
  name?: string;
  phone?: string;
  town?: string;
  district?: string;
  city?: string;
  state?: string;
  region?: string;
  zipcode?: string;
  full_address?: string;
}

interface ShopeeOrderShipping {
  warehouse_id?: number;
  tracking_number?: string;
  plp_number?: string;
  logistic_channel_id?: number;
  time_slot?: string;
  delivery_option?: string;
  shipment_time?: string | number;
  address?: ShopeeOrderRecipient;
}

interface ShopeeOrderAmounts {
  total?: number;
  shipping_fee?: number;
  currency?: string;
}

interface ShopeeOrderEscrow {
  coin?: number;
  shopee_rebate?: number;
  shopee_discount?: number;
  buyer_custom_fee?: number;
  coupon_code?: string;
  bundle_deal_rule_id?: number;
}

export interface ShopeeOrderDetail {
  order_sn?: string;
  order_status?: string;
  order_cancel_reason?: string;
  currency?: string;
  item_list?: ShopeeOrderItem[];
  recipient_address?: ShopeeOrderRecipient;
  shipping?: ShopeeOrderShipping;
  order_amount?: ShopeeOrderAmounts;
  escrow_amount?: ShopeeOrderAmounts;
  total_amount?: ShopeeOrderAmounts;
  escrow?: ShopeeOrderEscrow;
  create_time?: number;
  update_time?: number;
  pay_time?: number;
  cancel_time?: number;
  ship_by_date?: number;
  estimated_shipping_fee?: number;
  message_to_seller?: string;
  buyer_user_id?: number | string;
  buyer_username?: string;
  seller_phone?: string;
  package_list?: Array<{
    package_number?: string;
    logistics_status?: string;
    shipping_carrier?: string;
    tracking_number?: string;
  }>;
}

export interface ShopeeItemInfo {
  item_id?: number | string;
  item_name?: string;
  item_sku?: string;
  description?: string;
  item_status?: string;
  item_quantity?: number;
  price?: number;
  currency?: string;
  image?: Array<{ url?: string }>;
  attributes?: Array<{ attributes_id?: number; value?: string; original_value?: string }>;
  category_id?: number | string;
  brand?: string;
  ctime?: number;
  update_time?: number;
  tier_variation?: Array<{ name?: string; option_list?: string[]; properties?: Array<{ image?: { url?: string } }> }>;
  models?: Array<{
    model_id?: number | string;
    model_sku?: string;
    model_name?: string;
    price?: number;
    normal_stock?: number;
    tier_index?: number[];
  }>;
}

const SHOPEE_STATUS: Record<string, UnifiedOrder['status']> = {
  UNPAID: 'pending',
  READY_TO_SHIP: 'awaiting_fulfillment',
  PROCESSED: 'processing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  IN_CANCEL: 'cancelled',
  CANCELLED: 'cancelled',
  TO_CONFIRM_RECEIVE: 'in_transit',
  INVOICE_PENDING: 'awaiting_fulfillment',
};

const SHOPEE_RETURN_STATUS: Record<string, ReturnRequest['status']> = {
  REQUEST: 'requested',
  PROCESSING: 'approved',
  JUDGING: 'approved',
  REJECT: 'rejected',
  PICKUP: 'picked_up',
  RECEIVED: 'received',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

/** `Currency` domain hanya 'IDR'; invoice platform asing kita konversi label. */
function money(value: unknown, currency = 'IDR'): Money {
  const c: Currency = currency === 'IDR' || currency === undefined ? 'IDR' : 'IDR';
  return { amount: typeof value === 'number' ? value : 0, currency: c };
}

function toIso(sec?: number): string {
  return sec ? new Date(sec * 1000).toISOString() : '';
}

function buildAddress(r: ShopeeOrderRecipient | undefined): UnifiedOrder['shipping']['address'] {
  const w = r ?? {};
  return {
    name: w.name ?? '',
    phone: w.phone ?? '',
    province: w.state ?? '',
    city: w.city ?? '',
    district: w.town ?? '',
    subDistrict: w.district ?? '',
    postalCode: w.zipcode ?? '',
    detail: w.full_address ?? '',
  };
}

export function mapOrder(storeId: string, channelId: string, platform: PlatformCode, raw: ShopeeOrderDetail): UnifiedOrder {
  const currency = raw.currency ?? 'IDR';
  const items = raw.item_list ?? [];
  let subtotal = 0;
  const lines = items.map((it, idx) => {
    const unitPrice = Number(it.model_discounted_price ?? it.model_original_price ?? 0);
    const qty = it.model_quantity_purchased ?? 1;
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    return {
      id: `so-${raw.order_sn}-${idx}`,
      productId: it.item_sku ?? `unknown-${idx}`,
      sku: it.model_sku ?? it.item_sku ?? '',
      name: it.item_name ?? '',
      quantity: qty,
      unitPrice: money(unitPrice, currency),
      total: money(lineTotal, currency),
      platformItemId: String(it.item_id ?? ''),
    };
  });

  const shippingFee = Number(raw.order_amount?.shipping_fee ?? raw.total_amount?.shipping_fee ?? 0);
  const grandTotal = Number(raw.total_amount?.total ?? raw.escrow_amount?.total ?? subtotal + shippingFee);
  const payTime = raw.pay_time;
  const cancelTime = raw.cancel_time;

  const ship = raw.shipping ?? {};
  const tracking = raw.package_list?.[0]?.tracking_number ?? raw.shipping?.tracking_number;
  const shippedAt = raw.shipping?.shipment_time ? toIso(Number(raw.shipping.shipment_time)) : undefined;

  return {
    id: `so-${raw.order_sn}`,
    storeId,
    channelId,
    platform,
    platformOrderId: raw.order_sn ?? '',
    orderNumber: raw.order_sn ?? '',
    customer: {
      id: `so-c-${raw.order_sn}`,
      ...(raw.buyer_user_id !== undefined ? { customerId: String(raw.buyer_user_id) } : {}),
      customerName: raw.recipient_address?.name ?? raw.buyer_username ?? '',
      ...(raw.message_to_seller !== undefined ? { message: raw.message_to_seller } : {}),
    },
    lines,
    shipping: {
      address: buildAddress(raw.recipient_address),
      courier: raw.package_list?.[0]?.shipping_carrier ?? ship.delivery_option ?? '',
      service: ship.delivery_option ?? '',
      ...(tracking ? { trackingNumber: tracking } : {}),
      ...(shippedAt ? { shippedAt } : {}),
    },
    totals: {
      subtotal: money(subtotal, currency),
      shippingFee: money(shippingFee, currency),
      discount: money(0, currency),
      ...(raw.escrow !== undefined && raw.escrow.shopee_discount !== undefined
        ? { platformDiscount: money(raw.escrow.shopee_discount, currency) }
        : {}),
      tax: money(0, currency),
      grandTotal: money(grandTotal, currency),
    },
    status: SHOPEE_STATUS[raw.order_status ?? ''] ?? 'paid',
    ...(raw.order_status !== undefined ? { subStatus: raw.order_status } : {}),
    raw: raw as unknown as Record<string, unknown>,
    ...(payTime ? { paidAt: toIso(Number(payTime)) } : {}),
    ...(cancelTime ? { cancelledAt: toIso(Number(cancelTime)) } : {}),
    createdAt: toIso(raw.create_time),
    updatedAt: toIso(raw.update_time),
  };
}

export function mapProduct(storeId: string, raw: ShopeeItemInfo): UnifiedProduct {
  const id = `sp-${raw.item_id ?? ''}`;
  const variants =
    raw.models?.map((m) => ({
      id: `sv-${raw.item_id ?? ''}-${m.model_id ?? ''}`,
      sku: m.model_sku ?? raw.item_sku ?? '',
      ...(m.model_name !== undefined ? { name: m.model_name } : {}),
      price: money(m.price ?? raw.price ?? 0, raw.currency ?? 'IDR'),
      stock: m.normal_stock ?? 0,
      ...(m.model_id !== undefined ? { platformVariantId: String(m.model_id) } : {}),
      options: {},
    })) ?? [];

  const images: UnifiedProduct['images'] =
    raw.image?.map((img, i) => ({ url: img.url ?? '', position: i })) ?? [];

  const attributes: Record<string, unknown> = {};
  for (const a of raw.attributes ?? []) {
    if (a.attributes_id !== undefined && a.value !== undefined) {
      attributes[String(a.attributes_id)] = a.value;
    }
  }

  return {
    id,
    storeId,
    name: raw.item_name ?? '',
    description: raw.description ?? '',
    ...(raw.brand !== undefined ? { brand: raw.brand } : {}),
    categoryIds: raw.category_id !== undefined ? [String(raw.category_id)] : [],
    images,
    variants,
    attributes,
    status: raw.item_status === 'NORMAL' ? 'active' : raw.item_status === 'UNLIST' ? 'inactive' : 'draft',
    raw: raw as unknown as Record<string, unknown>,
    createdAt: toIso(raw.ctime),
    updatedAt: toIso(raw.update_time),
  };
}

export function mapReturn(channelId: string, orderId: string, raw: unknown): ReturnRequest {
  const r = (raw ?? {}) as Record<string, unknown>;
  const createdAt = r.create_time !== undefined ? toIso(Number(r.create_time)) : new Date().toISOString();
  const updatedAt = r.update_time !== undefined ? toIso(Number(r.update_time)) : createdAt;
  return {
    id: `srn-${String(r.return_sn ?? '')}`,
    orderId,
    channelId,
    lines: [],
    reason: 'other',
    status: SHOPEE_RETURN_STATUS[String(r.status ?? '')] ?? 'requested',
    ...(r.reason_text !== undefined ? { note: String(r.reason_text) } : {}),
    createdAt,
    updatedAt,
  };
}
