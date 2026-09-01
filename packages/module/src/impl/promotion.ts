import type { Promotion, PromotionStatus, PromotionValidation, Money } from '@opensellvy/types';
import type { ModuleDeps } from './deps';
import { buildIds } from './deps';

export type PromotionCreateInput = Omit<Promotion, 'id' | 'status' | 'usageCount' | 'createdAt' | 'updatedAt'>;

export interface PromotionModuleImpl {
  create(input: PromotionCreateInput): Promise<Promotion>;
  activate(storeId: string, code: string): Promise<Promotion>;
  validate(storeId: string, code: string, subtotal: Money): Promise<PromotionValidation>;
  list(storeId: string): Promise<Promotion[]>;
}

export function promotionModule(deps: ModuleDeps): PromotionModuleImpl {
  const { repos } = deps;
  const { id, now } = buildIds(deps);

  async function resolve(storeId: string, code: string): Promise<Promotion> {
    const promo = await repos.promotions.findByCode(storeId, code);
    if (!promo) throw new Error(`Promotion "${code}" not found`);
    return promo;
  }

  return {
    async create(input) {
      const stamp = now();
      const promotion: Promotion = { ...input, id: id(), status: input.startAt <= stamp ? 'active' : 'scheduled', usageCount: 0, createdAt: stamp, updatedAt: stamp };
      return repos.promotions.save(promotion);
    },

    async activate(storeId, code) {
      const promo = await resolve(storeId, code);
      const updated = { ...promo, status: 'active' as PromotionStatus, updatedAt: now() };
      return repos.promotions.save(updated);
    },

    async validate(storeId, code, subtotal) {
      const promo = await resolve(storeId, code);
      const reasons: string[] = [];
      const nowStamp = now();
      if (promo.status !== 'active') reasons.push('promotion not active');
      if (nowStamp < promo.startAt || nowStamp > promo.endAt) reasons.push('outside promotion window');
      if (promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit) reasons.push('usage limit reached');
      if (promo.rules.minSpend && subtotal.amount < promo.rules.minSpend.amount) reasons.push('min spend not met');

      if (reasons.length) {
        return { valid: false, promotion: promo, reasons };
      }
      const discountAmount: Money = { amount: promo.rules.type === 'percent' ? Math.round((subtotal.amount * promo.rules.value) / 100) : Math.min(promo.rules.value, subtotal.amount), currency: subtotal.currency };
      if (promo.rules.maxDiscount) discountAmount.amount = Math.min(discountAmount.amount, promo.rules.maxDiscount.amount);
      return { valid: true, promotion: promo, discountAmount };
    },

    async list(storeId) {
      return repos.promotions.list(storeId);
    },
  };
}