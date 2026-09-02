import type { Handler } from 'hono';
import type { InventoryAdjustment } from '@opensellvy/types';
import type { ApiEnv } from '../../env';

/** GET /api/stores/:storeId/products */
export const listProductsHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const cursor = c.req.query('cursor');
  const limit = Number(c.req.query('limit') ?? 50);
  const list = await services.products.list(storeId, { limit, ...(cursor !== undefined ? { cursor } : {}) });
  return c.json(list, 200);
};

/** POST /api/stores/:storeId/products */
export const createProductHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const body = await c.req.json<Record<string, unknown>>();
  const product = await services.products.create({ ...body, storeId } as never);
  return c.json(product, 201);
};

/** GET /api/products/:productId */
export const getProductHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const product = await services.products.getById(c.req.param('productId')!);
  if (!product) return c.json({ error: { code: 'NOT_FOUND', message: 'Product tidak ditemukan' } }, 404);
  return c.json(product, 200);
};

/** GET /api/stores/:storeId/inventory */
export const listInventoryHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const inventory = await services.inventory.list(c.req.param('storeId')!);
  return c.json({ items: inventory }, 200);
};

/** POST /api/inventory/adjust body: { productId, sku, warehouseId, quantity, reason, actorId? } */
export const adjustInventoryHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const body = await c.req.json<{ input?: unknown; actorId?: string }>();
  const input = (body.input ?? body) as InventoryAdjustment;
  const item = await services.inventory.adjust(input, body.actorId ?? c.get('user')?.userId);
  return c.json(item, 200);
};

/** GET /api/stores/:storeId/channels */
export const listChannelsHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const channels = await services.channels.list(c.req.param('storeId')!);
  return c.json({ items: channels }, 200);
};

/** GET /api/stores/:storeId/oauth/:platform/authorize → redirect URL */
export const authorizeChannelHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const url = await services.channels.getAuthorizeUrl(c.req.param('storeId')!, c.req.param('platform') as never);
  return c.json({ authorizeUrl: url }, 200);
};

/** POST /api/oauth/:platform/callback body: { storeId, code?, state? } */
export const oauthCallbackHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const platform = c.req.param('platform')! as never;
  const body = await c.req.json<{ storeId: string; code?: string; state?: string }>();
  if (!body.storeId || !body.code) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'storeId dan code wajib diisi' } }, 400);
  }
  const connection = await services.channels.connect({ storeId: body.storeId, platform, oauth: { code: body.code, ...(body.state !== undefined ? { state: body.state } : {}) } });
  return c.json(connection, 201);
};