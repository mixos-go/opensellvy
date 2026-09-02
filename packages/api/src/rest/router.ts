import { Hono } from 'hono';
import type { ApiContext } from '../context';
import { bindContext } from '../middleware/bind-context';
import { cors } from '../middleware/cors';
import { rateLimit } from '../middleware/rate-limit';
import { errorHandler } from '../middleware/error-handler';
import { bearerAuth } from '../middleware/auth.middleware';
import { healthHandler } from './controllers/health.controller';
import { listStoresHandler, createStoreHandler, getStoreHandler } from './controllers/store.controller';
import { listOrdersHandler, getOrderHandler, syncOrdersHandler } from './controllers/order.controller';
import { webhookReceiverHandler } from './controllers/webhook.controller';

/**
 * Router layer — komposisi Hono app dari route + middleware.
 * Mengikuti layering: Router → Controller → Service (module) → Repository.
 */
export function buildApp(ctx: ApiContext): Hono<{ Variables: { api: ApiContext; user?: { userId: string; scope: string; authenticated: boolean } } }> {
  const app = new Hono<{ Variables: { api: ApiContext; user?: { userId: string; scope: string; authenticated: boolean } } }>();

  // Global middleware pipeline
  app.use(errorHandler);
  app.use(bindContext(ctx));
  app.use(cors({ origin: '*' }));
  app.use('/api/*', rateLimit({ limit: 200, windowSeconds: 60 }));

  // Public
  app.get('/health', healthHandler);

  // Store — CRUD-lite (auth opsional; fail-open bila jwtSecret kosong)
  app.get('/api/stores', bearerAuth, listStoresHandler);
  app.post('/api/stores', bearerAuth, createStoreHandler);
  app.get('/api/stores/:id', bearerAuth, getStoreHandler);

  // Order
  app.get('/api/orders', bearerAuth, listOrdersHandler);
  app.get('/api/orders/:id', bearerAuth, getOrderHandler);
  app.post('/api/orders-sync/:storeId', bearerAuth, syncOrdersHandler);

  // Webhook receiver — per-platform signature di controller
  app.post('/webhooks/:platform', webhookReceiverHandler);

  // 404 fallback
  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: `Route ${c.req.method} ${c.req.path} tidak ditemukan` } }, 404));

  return app;
}
