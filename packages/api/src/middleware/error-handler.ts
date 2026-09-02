import { createMiddleware } from 'hono/factory';
import { ApiError } from '../errors';

/**
 * Error handler terpusat.
 * - ApiError → status + body JSON terstruktur
 * - OpenSellvyError (module) → status 400 (Validation/Client) atau 404
 * - lainnya → 500 generic (tanpa bocorkan detail internal)
 */
export const errorHandler = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (err) {
    const apiError = ApiError.from(err);
    return c.json(
      {
        error: {
          code: apiError.code,
          message: apiError.message,
          ...(apiError.details ? { details: apiError.details } : {}),
        },
      } as never,
      apiError.status as 400,
    );
  }
});
