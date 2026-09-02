import type {
  ID,
  ReturnRequest,
  UnifiedOrder,
  UnifiedProduct,
} from '@opensellvy/types';

/** aksi return (selaras ReturnAction di @opensellvy/connector, tanpa import lintas-layer). */
export type LocalReturnAction = 'approve' | 'reject' | 'receive' | 'refund';

export interface LocalShopProfile {
  platformShopId: string;
  shopName: string;
  marketplace: string;
}

export type LocalOrderSeed = Partial<
  Omit<UnifiedOrder, 'storeId' | 'platform'>
>;

/**
 * "Marketplace" in-memory milik adapter local.
 * Mensimulasikan sisi platform: order masuk dari luar, produk/stok didorong keluar.
 * Multi-tenant per storeId, jadi satu plugin bisa melayani banyak store.
 */
export class LocalStore {
  readonly shop: LocalShopProfile = { platformShopId: 'shop-local', shopName: 'Local Shop', marketplace: 'local' };

  private orders = new Map<string, UnifiedOrder>();
  private products = new Map<string, UnifiedProduct>();
  private stock = new Map<string, { stock: number; warehouseId?: string }>();
  private returns = new Map<string, ReturnRequest>();
  private orderSeq = 0;

  private key(storeId: string, id: string): string {
    return `${storeId}:${id}`;
  }

  createOrder(storeId: string, seed: LocalOrderSeed = {}): UnifiedOrder {
    this.orderSeq += 1;
    const stamp = new Date().toISOString();
    const lines = seed.lines ?? [];
    const subtotal = seed.totals?.subtotal ?? { amount: lines.reduce((s, l) => s + l.total.amount, 0), currency: 'IDR' };
    const shippingFee = seed.totals?.shippingFee ?? { amount: 0, currency: 'IDR' };
    const discount = seed.totals?.discount ?? { amount: 0, currency: 'IDR' };
    const tax = seed.totals?.tax ?? { amount: 0, currency: 'IDR' };
    const grandTotal = seed.totals?.grandTotal ?? {
      amount: subtotal.amount + shippingFee.amount - discount.amount + tax.amount,
      currency: 'IDR',
    };
    const order: UnifiedOrder = {
      id: seed.id ?? `local-order-${this.orderSeq}`,
      storeId,
      channelId: seed.channelId ?? `local:${storeId}`,
      platform: 'local',
      platformOrderId: seed.platformOrderId ?? `LOC${String(this.orderSeq).padStart(4, '0')}`,
      orderNumber: seed.orderNumber ?? `LOC-${String(this.orderSeq).padStart(4, '0')}`,
      customer: seed.customer ?? { id: `cust-${this.orderSeq}`, customerName: 'Buyer Lokal' },
      lines,
      shipping: seed.shipping ?? {
        address: {
          name: 'Buyer Lokal',
          phone: '0812-3456-7890',
          province: 'DKI Jakarta',
          city: 'Jakarta Pusat',
          district: 'Gambir',
          subDistrict: 'Gambir',
          postalCode: '10110',
          detail: 'Jl. Contoh No. 1',
        },
        courier: 'jne',
        service: 'REG',
      },
      totals: { subtotal, shippingFee, discount, tax, grandTotal },
      status: seed.status ?? 'paid',
      subStatus: seed.subStatus,
      raw: seed.raw,
      paidAt: seed.paidAt ?? stamp,
      createdAt: seed.createdAt ?? stamp,
      updatedAt: seed.updatedAt ?? stamp,
    };
    this.orders.set(this.key(storeId, order.platformOrderId), order);
    return order;
  }

  listOrders(storeId: string): UnifiedOrder[] {
    return [...this.orders.values()].filter((o) => o.storeId === storeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getOrder(storeId: string, platformOrderId: string): UnifiedOrder | undefined {
    return this.orders.get(this.key(storeId, platformOrderId));
  }

  /** cari order by id internal ATAU platformOrderId — dipakai flow return. */
  getOrderById(storeId: string, orderId: ID): UnifiedOrder | undefined {
    return this.listOrders(storeId).find((o) => o.id === orderId || o.platformOrderId === orderId);
  }

  saveOrder(order: UnifiedOrder): void {
    this.orders.set(this.key(order.storeId, order.platformOrderId), order);
  }

  applyOrderPatch(storeId: string, platformOrderId: string, patch: Partial<UnifiedOrder>): void {
    const current = this.getOrder(storeId, platformOrderId);
    if (!current) throw new Error(`local order ${platformOrderId} not found`);
    this.orders.set(this.key(storeId, platformOrderId), { ...current, ...patch, updatedAt: new Date().toISOString() });
  }

  upsertProduct(storeId: string, product: UnifiedProduct): void {
    const sku = product.variants[0]?.sku ?? product.id;
    this.products.set(this.key(storeId, sku), { ...product, storeId });
  }

  listProducts(storeId: string): UnifiedProduct[] {
    return [...this.products.values()].filter((p) => p.storeId === storeId);
  }

  getProductBySku(storeId: string, sku: string): UnifiedProduct | undefined {
    return this.products.get(this.key(storeId, sku));
  }

  setStock(storeId: string, sku: string, stock: number, warehouseId?: string): void {
    this.stock.set(this.key(storeId, sku), { stock, warehouseId });
  }

  getStock(storeId: string, sku: string): number {
    return this.stock.get(this.key(storeId, sku))?.stock ?? 0;
  }

  setReturn(request: ReturnRequest): void {
    this.returns.set(request.id, request);
  }

  /** terapkan aksi return (approve/reject/receive/refund) → simpan status + dampak ke order. */
  applyReturnAction(storeId: string, request: ReturnRequest, action: LocalReturnAction): ReturnRequest {
    const statusByAction: Record<LocalReturnAction, ReturnRequest['status']> = {
      approve: 'approved',
      reject: 'rejected',
      receive: 'received',
      refund: 'refunded',
    };
    const updated: ReturnRequest = { ...request, status: statusByAction[action], updatedAt: new Date().toISOString() };
    this.setReturn(updated);
    if (action === 'receive' || action === 'refund') {
      const order = this.getOrderById(storeId, request.orderId);
      if (order) {
        this.applyOrderPatch(order.storeId, order.platformOrderId, { status: 'returned' });
      }
    }
    return updated;
  }

  getReturn(id: string): ReturnRequest | undefined {
    return this.returns.get(id);
  }

  listReturns(): ReturnRequest[] {
    return [...this.returns.values()];
  }

  reset(): void {
    this.orders.clear();
    this.products.clear();
    this.stock.clear();
    this.returns.clear();
    this.orderSeq = 0;
  }
}

export function createLocalStore(): LocalStore {
  return new LocalStore();
}