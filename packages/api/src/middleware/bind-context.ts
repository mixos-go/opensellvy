import type { MiddlewareHandler } from 'hono';
import type { ApiContext } from '../context';

/**
 * bindContext — memasang ApiContext (services + registry + config) ke Hono
 * context sebagai `api`, sehingga controller bisa memanggil use case lewat
 * `c.get('api').services.*`.
 */
export function bindContext(ctx: ApiContext): MiddlewareHandler<{ Variables: { api: ApiContext } }> {
  return async (c, next) => {
    c.set('api', ctx);
    await next();
  };
}
