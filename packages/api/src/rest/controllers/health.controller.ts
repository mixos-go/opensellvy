import type { Handler } from 'hono';
import type { ApiEnv } from '../../env';

/** GET /health — liveness probe, tidak butuh auth. */
export const healthHandler: Handler<ApiEnv> = (c) => {
  return c.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
};
