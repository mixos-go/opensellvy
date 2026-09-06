import type { UnifiedOrder, UnifiedProduct, Money, Currency, PlatformCode, ReturnRequest } from '@opensellvy/types';

/**
 * Shape payload TikTok Shop (subset yang dipakai adapter). Field toleran keras
 * karena TikTok bisa tidak mengirim field tertentu / nilai string kosong.
 */

interface TikTokMoney {
  amount?: string;
  currency?: string;
  value?: string;
}

interface TikTokLineItem {
  id?: string;
  item_id?: string;
  product_id?: string;
  item_name?: string;
  sku_name?: string;
  seller_sku?: string;
  quantity?: number | string;
  original_price?: string | TikTokMoney;
  sale_price?: string | TikTokMoney;
  currency?: string;
}

interface TikTokRecipient {
  name?: string;
  phone_number?: string;
  full_address?: string;
  address_detail?: string;
  region_code?: string;
  postal_code?: string;
  post_town?: string;
}

interface TikTokPackage {
  package_id?: string;
  tracking_number?: string;
  shipping_provider_name?: string;
  shipping_provider_id?: string;
  logistics_status?: string;
}

interface TikTokPayment {
  total_amount?: string;
  sub_total?: string;
  original_total_product_price?: string;
  seller_discount?: string;
  platform_discount?: string;
  shipping_fee?: string;
  tax?: string;
  currency?: string;
}

export interface TikTokOrderRaw {
  id?: string;
  order_id?: string;
  order_status?: string;
  create_time?: number;
  update_time?: number;
  payment_time?: number;
  cancel_time?: number;
  buyer_username?: string;
  buyer_user_id?: string;
  buyer_message?: string;
  shipping_type?: string;
  payment?: TikTokPayment;
  items?: TikTokLineItem[];
  line_items?: TikTokLineItem[];
  recipient_address?: TikTokRecipient;
  shipping_address?: TikTokRecipient;
  package_list?: TikTokPackage[];
}

const TIKTOK_STATUS: Record<string, UnifiedOrder['status']> = {
  UNPAID: 'pending',
  ON_HOLD: 'awaiting_fulfillment',
  AWAITING_SHIPMENT: 'awaiting_fulfillment',
  PARTIALLY_SHIPPING: 'shipped',
  AWAITING_COLLECTION: 'shipped',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const TIKTOK_RETURN_STATUS: Record<string, ReturnRequest['status']> = {
  REQUESTED: 'requested',
  SELLER_DISPUTE: 'approved',
  BUYER_DISPUTE: 'approved',
  PICK_UP: 'picked_up',
  RECEIVED: 'received',
  COMPLETED: 'refunded',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  CLOSED: 'cancelled',
};

/** `Currency` domain hanya 'IDR'; label platform asing kita konversi. */
function money(value: unknown, _currency = 'IDR'): Money {
  return { amount: typeof value === 'number' ? value : Number(value ?? 0) || 0, currency: 'IDR' as Currency };
}

function toIso(sec?: number): string {
  return sec ? new Date(sec * 1000).toISOString() : '';
}

function priceValue(p: string | TikTokMoney | undefined): number {
  if (p === undefined) return 0;
  if (typeof p === 'string') return Number(p) || 0;
  const v = p.value ?? p.amount;
  return Number(v ?? 0) || 0;
}

function buildAddress(r: TikTokRecipient | undefined): UnifiedOrder['shipping']['address'] {
  const w = r ?? {};
  return {
    name: w.name ?? '',
    phone: w.phone_number ?? '',
    province: w.region_code ?? '',
    city: '',
    district: w.post_town ?? '',
    subDistrict: '',
    postalCode: w.postal_code ?? '',
    detail: w.full_address ?? w.address_detail ?? '',
  };
}

export function mapOrder(storeId: string, channelId: string, platform: PlatformCode, raw: TikTokOrderRaw): UnifiedOrder {
  const items = raw.items ?? raw.line_items ?? [];
  const currency = raw.payment?.currency ?? 'IDR';
  let subtotal = 0;
  const lines = items.map((it, idx) => {
    const unit = priceValue(it.sale_price) || priceValue(it.original_price);
    const qty = Number(it.quantity ?? 1) || 1;
    const lineTotal = unit * qty;
    subtotal += lineTotal;
    return {
      id: `tt-${raw.id ?? ''}-${it.id ?? idx}`,
      productId: it.product_id ?? it.seller_sku ?? `unknown-${idx}`,
      sku: it.seller_sku ?? it.sku_name ?? it.id ?? '',
      name: it.item_name ?? it.sku_name ?? '',
      quantity: qty,
      unitPrice: money(unit, currency),
      total: money(lineTotal, currency),
      ...(it.item_id !== undefined ? { platformItemId: String(it.item_id) } : {}),
    };
  });

  const shippingFee = Number(raw.payment?.shipping_fee ?? 0) || 0;
  const grandTotal = Number(raw.payment?.total_amount ?? 0) || subtotal + shippingFee;
  const recipient = raw.recipient_address ?? raw.shipping_address;
  const pkg = raw.package_list?.[0];
  const payTime = raw.payment_time;
  const cancelTime = raw.cancel_time;

  return {
    id: `tt-${raw.id ?? raw.order_id ?? ''}`,
    storeId,
    channelId,
    platform,
    platformOrderId: raw.id ?? raw.order_id ?? '',
    orderNumber: raw.id ?? raw.order_id ?? '',
    customer: {
      id: `tt-c-${raw.id ?? ''}`,
      ...(raw.buyer_user_id !== undefined ? { customerId: String(raw.buyer_user_id) } : {}),
      customerName: recipient?.name ?? raw.buyer_username ?? '',
      ...(raw.buyer_message !== undefined ? { message: raw.buyer_message } : {}),
    },
    lines,
    shipping: {
      address: buildAddress(recipient),
      courier: raw.shipping_type === 'TIKTOK' ? 'tiktok-logistics' : pkg?.shipping_provider_name ?? 'seller',
      service: pkg?.shipping_provider_name ?? '',
      ...(pkg?.tracking_number ? { trackingNumber: pkg.tracking_number } : {}),
    },
    totals: {
      subtotal: money(subtotal || raw.payment?.sub_total, currency),
      shippingFee: money(shippingFee, currency),
      discount: money(raw.payment?.seller_discount, currency),
      ...(raw.payment?.platform_discount !== undefined && Number(raw.payment.platform_discount)
        ? { platformDiscount: money(raw.payment.platform_discount, currency) }
        : {}),
      tax: money(raw.payment?.tax ?? 0, currency),
      grandTotal: money(grandTotal, currency),
    },
    status: TIKTOK_STATUS[raw.order_status ?? ''] ?? 'paid',
    ...(raw.order_status !== undefined ? { subStatus: raw.order_status } : {}),
    raw: raw as unknown as Record<string, unknown>,
    ...(payTime ? { paidAt: toIso(Number(payTime)) } : {}),
    ...(cancelTime ? { cancelledAt: toIso(Number(cancelTime)) } : {}),
    createdAt: toIso(raw.create_time),
    updatedAt: toIso(raw.update_time),
  };
}

export function mapProduct(storeId: string, raw: Record<string, unknown>): UnifiedProduct {
  const r = raw;
  const id = r.id !== undefined ? String(r.id) : '';
  const currency = 'IDR';
  const skus = (Array.isArray(r.skus) ? r.skus : []) as Array<Record<string, unknown>>;
  const variants = skus.map((s, i) => {
    const price = (s.price ?? {}) as Record<string, unknown>;
    return {
      id: `ttv-${id}-${i}`,
      sku: String(s.seller_sku ?? s.external_sku ?? ''),
      ...(s.sku_name !== undefined ? { name: String(s.sku_name) } : {}),
      options: {},
      price: money(price.sale_price, currency),
      ...(s.id !== undefined ? { platformVariantId: String(s.id) } : {}),
    };
  });

  const images: UnifiedProduct['images'] = (Array.isArray(r.main_images) ? r.main_images : []).map((img, position) => {
    const m = (img ?? {}) as Record<string, unknown>;
    const urls = Array.isArray(m.urls) ? (m.urls as string[]) : [];
    return { url: urls[0] ?? String(m.url ?? ''), position };
  });

  const attributes: Record<string, unknown> = {};
  const attrs = Array.isArray(r.product_attributes) ? (r.product_attributes as Record<string, unknown>[]) : [];
  for (const a of attrs) {
    if (a.attribute_id !== undefined && a.value !== undefined) {
      attributes[String(a.attribute_id)] = a.value;
    }
  }

  const chip = Array.isArray(r.category_chains) ? (r.category_chains as Record<string, unknown>[]) : [];
  const leaf = chip[chip.length - 1];
  const status = String(r.product_status ?? '');
  const defaultStatus: UnifiedProduct['status'] =
    status === 'DELETE' ? 'deleted' : status === '' ? 'draft' : 'inactive';
  const categoryIds: UnifiedProduct['categoryIds'] =
    r.category_id !== undefined ? [String(r.category_id)] : leaf?.id !== undefined ? [String(leaf.id)] : [];

  return {
    id: `tt-${id}`,
    storeId,
    name: String(r.title ?? ''),
    description: String(r.description ?? ''),
    ...(r.brand !== undefined ? { brand: String((r.brand as Record<string, unknown>)?.name ?? '') } : {}),
    categoryIds,
    images,
    variants,
    attributes,
    status: status === 'ACTIVATE' ? 'active' : defaultStatus,
    raw,
    createdAt: r.create_time !== undefined ? toIso(Number(r.create_time)) : new Date().toISOString(),
    updatedAt: r.update_time !== undefined ? toIso(Number(r.update_time)) : new Date().toISOString(),
  };
}

export function mapReturn(channelId: string, orderId: string, raw: unknown): ReturnRequest {
  const r = (raw ?? {}) as Record<string, unknown>;
  const createdAt = r.create_time !== undefined ? toIso(Number(r.create_time)) : new Date().toISOString();
  const updatedAt = r.update_time !== undefined ? toIso(Number(r.update_time)) : createdAt;
  const refund = (r.refund_amount ?? {}) as Record<string, unknown>;
  return {
    id: `ttrn-${String(r.return_id ?? r.id ?? '')}`,
    orderId: String(r.order_id ?? orderId ?? ''),
    channelId,
    lines: [],
    reason: 'other',
    status: TIKTOK_RETURN_STATUS[String(r.return_status ?? r.status ?? '')] ?? 'requested',
    ...(r.return_reason !== undefined ? { note: String(r.return_reason) } : {}),
    ...(refund.refund_total !== undefined ? { refundAmount: money(refund.refund_total, String(refund.currency)) } : {}),
    createdAt,
    updatedAt,
  };
}