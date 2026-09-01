export type PromotionType = 'voucher' | 'flash_sale' | 'bundle' | 'buy_get';

export interface PromotionModule {
  create(data: unknown): Promise<unknown>;
  activate(promotionId: string): Promise<unknown>;
  deactivate(promotionId: string): Promise<unknown>;
  list(storeId: string, type?: PromotionType): Promise<unknown[]>;
  validate(code: string, orderId: string): Promise<unknown>;
}