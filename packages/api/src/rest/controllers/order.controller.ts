import type { Handler } from 'hono';
import type { PlatformCode, OrderStatus } from '@opensellvy/types';
import type { ApiEnv } from '../../env';

/** GET /orders?storeId=&platform=&status=a,b,c&limit= — list order. */
export const listOrdersHandler: Handler<ApiEnv> = async (c) => {
  const { storeId, platform, status, limit, cursor } = c.req.query();
  if (!storeId) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'storeId wajib diisi' } }, 400);
  }
  const result = await c.get('api').services.orders.list({
    storeId,
    ...(platform ? { platform: platform as PlatformCode } : {}),
    ...(status ? { status: status.split(',') as OrderStatus[] } : {}),
    ...(cursor ? { cursor } : {}),
    ...(limit ? { limit: Number(limit) } : {}),
  });
  return c.json(result);
};

/** GET /orders/:id — detail order. */
export const getOrderHandler: Handler<ApiEnv> = async (c) => {
  const id = c.req.param('id')!;
  const order = await c.get('api').services.orders.getById(id);
  return c.json({ item: order });
};

/** POST /orders-sync/:storeId — tarik order dari channel. Body: { platform? } */
export const syncOrdersHandler: Handler<ApiEnv> = async (c) => {
  const storeId = c.req.param('storeId')!;
  let platform: string | undefined;
  try {
    const body = (await c.req.json()) as { platform?: string } | undefined;
    platform = body?.platform;
  } catch {
    // body kosong / bukan JSON → platform undefined
  }
  const result = await c.get('api').services.orders.sync(storeId, platform);
  return c.json({ result });
};
