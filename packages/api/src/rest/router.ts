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
import { loginHandler, refreshHandler, logoutHandler } from './controllers/auth.controller';
import {
  listProductsHandler,
  createProductHandler,
  getProductHandler,
  listInventoryHandler,
  adjustInventoryHandler,
  listChannelsHandler,
  authorizeChannelHandler,
  oauthCallbackHandler,
} from './controllers/catalog.controller';
import {
  updateProfileHandler,
  refreshTokenHandler,
  listPaymentsForStoreHandler,
  getRemotePaymentHandler,
  refundViaPlatformHandler,
  syncPromotionsHandler,
  pushPromotionHandler,
  setPromotionActiveHandler,
  getShippingRatesHandler,
  trackOrderHandler,
  getRemoteOrderHandler,
  listCategoriesHandler,
  pushProductUpdateHandler,
  getStockLevelsHandler,
  adjustRemoteInventoryHandler,
} from './controllers/platform.controller';
import {
  financeOverviewHandler,
  financeTransactionsHandler,
  financeStatementHandler,
  financePayoutInfoHandler,
} from './controllers/finance.controller';

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

  // Auth (core/auth) — login/refresh/logout publik; bearer verification di bearerAuth
  app.post('/api/auth/login', loginHandler);
  app.post('/api/auth/refresh', refreshHandler);
  app.post('/api/auth/logout', logoutHandler);

  // Store — CRUD-lite (bearer auth, fail-closed kecuali authMode: 'open')
  app.get('/api/stores', bearerAuth, listStoresHandler);
  app.post('/api/stores', bearerAuth, createStoreHandler);
  app.get('/api/stores/:id', bearerAuth, getStoreHandler);

  // Order
  app.get('/api/orders', bearerAuth, listOrdersHandler);
  app.get('/api/orders/:id', bearerAuth, getOrderHandler);
  app.post('/api/orders-sync/:storeId', bearerAuth, syncOrdersHandler);

  // Catalog & inventory
  app.get('/api/stores/:storeId/products', bearerAuth, listProductsHandler);
  app.post('/api/stores/:storeId/products', bearerAuth, createProductHandler);
  app.get('/api/products/:productId', bearerAuth, getProductHandler);
  app.get('/api/stores/:storeId/inventory', bearerAuth, listInventoryHandler);
  app.post('/api/inventory/adjust', bearerAuth, adjustInventoryHandler);

  // Channel & OAuth
  app.get('/api/stores/:storeId/channels', bearerAuth, listChannelsHandler);
  app.get('/api/stores/:storeId/oauth/:platform/authorize', bearerAuth, authorizeChannelHandler);
  app.post('/api/oauth/:platform/callback', oauthCallbackHandler);

  // Platform sync — profile & token
  app.patch('/api/stores/:storeId/platforms/:platform/profile', bearerAuth, updateProfileHandler);
  app.post('/api/stores/:storeId/platforms/:platform/token/refresh', bearerAuth, refreshTokenHandler);

  // Platform payments
  app.get('/api/stores/:storeId/payments', bearerAuth, listPaymentsForStoreHandler);
  app.get('/api/stores/:storeId/platforms/:platform/payments/:paymentId', bearerAuth, getRemotePaymentHandler);
  app.post('/api/stores/:storeId/platforms/:platform/payments/:paymentId/refund', bearerAuth, refundViaPlatformHandler);

  // Platform promotions
  app.post('/api/stores/:storeId/platforms/:platform/promotions/sync', bearerAuth, syncPromotionsHandler);
  app.post('/api/stores/:storeId/platforms/:platform/promotions/:promotionId/push', bearerAuth, pushPromotionHandler);
  app.post('/api/stores/:storeId/platforms/:platform/promotions/:promotionId/active', bearerAuth, setPromotionActiveHandler);

  // Platform shipping rates
  app.post('/api/stores/:storeId/platforms/:platform/shipping/rates', bearerAuth, getShippingRatesHandler);

  // Platform orders
  app.get('/api/stores/:storeId/platforms/:platform/orders/:orderId/tracking', bearerAuth, trackOrderHandler);
  app.get('/api/stores/:storeId/platforms/:platform/orders/remote/:platformOrderId', bearerAuth, getRemoteOrderHandler);

  // Platform product categories
  app.get('/api/stores/:storeId/platforms/:platform/categories', bearerAuth, listCategoriesHandler);
  app.post('/api/stores/:storeId/platforms/:platform/products/:productId/update', bearerAuth, pushProductUpdateHandler);

  // Platform inventory remote
  app.post('/api/stores/:storeId/platforms/:platform/inventory/levels', bearerAuth, getStockLevelsHandler);
  app.post('/api/stores/:storeId/platforms/:platform/inventory/adjust', bearerAuth, adjustRemoteInventoryHandler);

  // Platform finance
  app.get('/api/stores/:storeId/platforms/:platform/finance/overview', bearerAuth, financeOverviewHandler);
  app.get('/api/stores/:storeId/platforms/:platform/finance/transactions', bearerAuth, financeTransactionsHandler);
  app.get('/api/stores/:storeId/platforms/:platform/finance/statement', bearerAuth, financeStatementHandler);
  app.get('/api/stores/:storeId/platforms/:platform/finance/payout-info', bearerAuth, financePayoutInfoHandler);

  // Webhook receiver — per-platform signature di controller
  app.post('/webhooks/:platform', webhookReceiverHandler);

  // 404 fallback
  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: `Route ${c.req.method} ${c.req.path} tidak ditemukan` } }, 404));

  return app;
}
