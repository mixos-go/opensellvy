import type { Payment, PaymentMethod, PaymentStatus } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds, withChannel } from './deps';

export interface PaymentModuleImpl {
  capture(orderId: string, method: PaymentMethod, gateway?: string): Promise<Payment>;
  refund(orderId: string, amount: number, reason?: string): Promise<Payment>;
  listByOrder(orderId: string): Promise<Payment[]>;
  /** tarik payment dari channel platform terhubung */
  listForStore(storeId: string, platform?: string): Promise<{ gateway: Payment[]; local: Payment[] }>;
  getRemote(storeId: string, platform: string, paymentId: string): Promise<{ payment?: Payment }>;
  refundViaPlatform(storeId: string, platform: string, paymentId: string, amount: number): Promise<void>;
}

export function paymentModule(deps: ModuleDeps): PaymentModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  const requireOrder = async (orderId: string) => {
    const order = await repos.orders.findById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    return order;
  };

  async function latestPayment(orderId: string): Promise<Payment | undefined> {
    const payments = await repos.payments.findByOrder(orderId);
    return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  return {
    async capture(orderId, method, gateway) {
      const order = await requireOrder(orderId);
      const stamp = now();
      const existing = await latestPayment(orderId);
      if (existing && existing.status !== 'failed' && existing.status !== 'cancelled') {
        throw new Error(`Order ${orderId} already paid`);
      }
      const currency = order.totals.grandTotal.currency;
      const payment: Payment = {
        id: id(),
        orderId,
        method,
        status: 'captured',
        amount: { amount: order.totals.grandTotal.amount, currency },
        paidAt: stamp,
        refunds: [],
        createdAt: stamp,
        updatedAt: stamp,
        ...(gateway !== undefined ? { gateway } : {}),
      };
      await repos.orders.update(orderId, { status: 'paid', paidAt: stamp, updatedAt: stamp });
      await repos.payments.save(payment);
      await deps.events?.emit('payment.captured', { orderId, amount: payment.amount.amount });
      return payment;
    },

    async refund(orderId, amount, reason) {
      const order = await requireOrder(orderId);
      const payment = await latestPayment(orderId);
      if (!payment) throw new Error(`No payment for order ${orderId}`);
      const status: PaymentStatus = amount >= payment.amount.amount ? 'refunded' : 'partially_refunded';
      const refunded = {
        ...payment,
        status,
        refunds: [
          ...payment.refunds,
          {
            id: id(),
            amount: { amount, currency: payment.amount.currency },
            status: 'succeeded' as const,
            createdAt: now(),
            ...(reason !== undefined ? { reason } : {}),
          },
        ],
        updatedAt: now(),
      };
      await repos.payments.save(refunded);
      await repos.orders.update(orderId, { status: status === 'refunded' ? 'returned' : order.status, updatedAt: now() });
      await deps.events?.emit('payment.refunded', { orderId, amount });
      return refunded;
    },

    async listByOrder(orderId) {
      return repos.payments.findByOrder(orderId);
    },

    async listForStore(storeId, platform) {
      const channels = await repos.channels.findByStore(storeId);
      const targets = platform ? channels.filter((c) => c.platform === platform) : channels;
      const local: Payment[] = [];
      for (const channel of targets) {
        const channelOrders = await repos.orders.find({ storeId, platform: channel.platform });
        for (const order of channelOrders.items) {
          local.push(...await repos.payments.findByOrder(order.id));
        }
      }
      const gate = platform ? platform : targets[0]?.platform;
      const pulled = gate
        ? await withChannel(deps, storeId, gate, (ctx) => deps.registry.get(gate as never).gateway.payment.list(ctx))
        : { ran: false as const };
      return { gateway: pulled.ran && pulled.result ? pulled.result : [], local };
    },

    async getRemote(storeId, platform, paymentId) {
      const res = await withChannel(deps, storeId, platform, (ctx) => deps.registry.get(platform as never).gateway.payment.get(ctx, paymentId));
      return { ...(res.ran && res.result !== undefined ? { payment: res.result } : {}) };
    },

    async refundViaPlatform(storeId, platform, paymentId, amount) {
      await withChannel(deps, storeId, platform, (ctx) => deps.registry.get(platform as never).gateway.payment.refund(ctx, paymentId, amount));
    },
  };
}