import type { Payment, PaymentMethod, PaymentStatus } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export interface PaymentModuleImpl {
  capture(orderId: string, method: PaymentMethod, gateway?: string): Promise<Payment>;
  refund(orderId: string, amount: number, reason?: string): Promise<Payment>;
  listByOrder(orderId: string): Promise<Payment[]>;
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
  };
}