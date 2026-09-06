import type { Handler } from 'hono';
import type { PlatformCode } from '@opensellvy/types';
import type { ApiEnv } from '../../env';

/** GET /api/stores/:storeId/platforms/:platform/finance/overview */
export const financeOverviewHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const result = await services.finance.overview(storeId, platform);
  return c.json(result, 200);
};

/** GET /api/stores/:storeId/platforms/:platform/finance/transactions?from=&to=&limit= */
export const financeTransactionsHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const from = c.req.query('from');
  const to = c.req.query('to');
  const limit = c.req.query('limit');
  const query = {
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
    ...(limit !== undefined ? { limit: Number(limit) } : {}),
  };
  const result = await services.finance.transactions(storeId, platform, Object.keys(query).length > 0 ? query : undefined);
  return c.json(result, 200);
};

/** GET /api/stores/:storeId/platforms/:platform/finance/statement?from=&to= */
export const financeStatementHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const from = c.req.query('from');
  const to = c.req.query('to');
  const opts = {
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
  };
  const result = await services.finance.statement(storeId, platform, Object.keys(opts).length > 0 ? opts : undefined);
  return c.json(result, 200);
};

/** GET /api/stores/:storeId/platforms/:platform/finance/payout-info */
export const financePayoutInfoHandler: Handler<ApiEnv> = async (c) => {
  const { services } = c.get('api');
  const storeId = c.req.param('storeId')!;
  const platform = c.req.param('platform')! as PlatformCode;
  const result = await services.finance.payoutInfo(storeId, platform);
  return c.json(result, 200);
};
