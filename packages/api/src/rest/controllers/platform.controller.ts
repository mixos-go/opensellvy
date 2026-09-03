import type { Handler } from 'hono';
import type { PlatformCode } from '@opensellvy/types';
import type { ApiEnv } from '../../env';

/** PATCH /api/stores/:storeId/platforms/:platform/profile body: ShopProfilePatch */
export const updateProfileHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const body = await c.req.json();
  await services.channels.updateProfile(storeId, platform, body);
  return c.json({ ok: true }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/token/refresh */
export const refreshTokenHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  await services.channels.refreshToken(storeId, platform);
  return c.json({ ok: true }, 200);
};

/** GET /api/stores/:storeId/payments?platform= */
export const listPaymentsForStoreHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.query('platform') as PlatformCode | undefined;
  const result = await services.payments.listForStore(storeId, platform);
  return c.json(result, 200);
};

/** GET /api/stores/:storeId/platforms/:platform/payments/:paymentId */
export const getRemotePaymentHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const paymentId = c.req.param('paymentId')!;
  const result = await services.payments.getRemote(storeId, platform, paymentId);
  return c.json({ payment: result.payment ?? null }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/payments/:paymentId/refund body: { amount } */
export const refundViaPlatformHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const paymentId = c.req.param('paymentId')!;
  const body = await c.req.json<{ amount?: number }>();
  if (body.amount === undefined) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'amount wajib diisi' } }, 400);
  }
  await services.payments.refundViaPlatform(storeId, platform, paymentId, body.amount);
  return c.json({ ok: true }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/promotions/sync */
export const syncPromotionsHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const result = await services.promotions.syncFromPlatform(storeId, platform);
  return c.json({ result }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/promotions/:promotionId/push */
export const pushPromotionHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const promotionId = c.req.param('promotionId')!;
  const result = await services.promotions.pushToPlatform(storeId, platform, promotionId);
  return c.json({ result }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/promotions/:promotionId/active body: { active } */
export const setPromotionActiveHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const promotionId = c.req.param('promotionId')!;
  const body = await c.req.json<{ active?: boolean }>();
  if (body.active === undefined) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'active wajib diisi' } }, 400);
  }
  await services.promotions.setActiveRemotely(storeId, platform, promotionId, body.active);
  return c.json({ ok: true }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/shipping/rates body: ShippingRateRequest */
export const getShippingRatesHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const body = await c.req.json();
  const items = await services.shipping.getRatesFromPlatform(storeId, platform, body);
  return c.json({ items }, 200);
};

/** GET /api/stores/:storeId/platforms/:platform/orders/:orderId/tracking */
export const trackOrderHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const orderId = c.req.param('orderId')!;
  const items = await services.orders.trackRemote(storeId, platform, orderId);
  return c.json({ items }, 200);
};

/** GET /api/stores/:storeId/platforms/:platform/orders/remote/:platformOrderId */
export const getRemoteOrderHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const platformOrderId = c.req.param('platformOrderId')!;
  const order = await services.orders.getRemote(storeId, platform, platformOrderId);
  if (!order) return c.json({ error: { code: 'NOT_FOUND', message: 'Remote order tidak ditemukan' } }, 404);
  return c.json({ item: order }, 200);
};

/** GET /api/stores/:storeId/platforms/:platform/categories?parentId= */
export const listCategoriesHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const parentId = c.req.query('parentId');
  const items = await services.products.listCategories(storeId, platform, parentId);
  return c.json({ items }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/products/:productId/update body: Record */
export const pushProductUpdateHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const productId = c.req.param('productId')!;
  const body = await c.req.json();
  await services.products.pushUpdate(storeId, platform, productId, body);
  return c.json({ ok: true }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/inventory/levels body: { skus: string[] } */
export const getStockLevelsHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const body = await c.req.json<{ skus?: string[] }>();
  if (!body.skus?.length) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'skus wajib diisi' } }, 400);
  }
  const items = await services.inventory.getStockLevelsRemote(storeId, platform, body.skus);
  return c.json({ items }, 200);
};

/** POST /api/stores/:storeId/platforms/:platform/inventory/adjust body: { adjustments: InventoryAdjustment[] } */
export const adjustRemoteInventoryHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const body = await c.req.json<{ adjustments?: unknown[] }>();
  if (!body.adjustments?.length) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'adjustments wajib diisi' } }, 400);
  }
  await services.inventory.adjustRemote(storeId, platform, body.adjustments as never);
  return c.json({ ok: true }, 200);
};
