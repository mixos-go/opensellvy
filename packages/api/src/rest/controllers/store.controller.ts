import type { Handler } from 'hono';
import type { ApiEnv } from '../../env';

/** GET /stores — daftar store. */
export const listStoresHandler: Handler<ApiEnv> = async (c) => {
  const stores = await c.get('api').services.stores.list();
  return c.json({ items: stores });
};

/** POST /stores — buat store baru. Body: { name, slug, config? } */
export const createStoreHandler: Handler<ApiEnv> = async (c) => {
  const body = await c.req.json<{ name: string; slug: string; config?: Record<string, unknown> }>();
  if (!body.name || !body.slug) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'name dan slug wajib diisi' } }, 400);
  }
  const store = await c.get('api').services.stores.create(
    {
      name: body.name,
      slug: body.slug,
      ...(body.config ? { config: body.config } : {}),
    },
    c.get('user')?.userId,
  );
  return c.json({ item: store }, 201);
};

/** GET /stores/:id — detail store. */
export const getStoreHandler: Handler<ApiEnv> = async (c) => {
  const id = c.req.param('id')!;
  const store = await c.get('api').services.stores.getById(id);
  return c.json({ item: store });
};
