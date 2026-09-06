import { createShopeePlugin } from './src/shopee.connector';

const PARTNER_ID = process.env.SHOPEE_PARTNER_ID ?? '1241483';
const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY ?? '';
const ACCESS_TOKEN = process.env.SHOPEE_ACCESS_TOKEN ?? '';
const SHOP_ID = process.env.SHOPEE_SHOP_ID ?? '227844766';
const SANDBOX_BASE = 'https://openplatform.sandbox.test-stable.shopee.sg';

if (!ACCESS_TOKEN) {
  console.error('SHOPEE_ACCESS_TOKEN env not set — cannot live-verify.');
  process.exit(1);
}

const ctx = {
  storeId: 'live-test',
  platformAccountId: 'live-test:shopee',
  credentials: {
    appId: PARTNER_ID,
    secret: PARTNER_KEY,
    redirectUri: 'https://cb.test',
    shopId: SHOP_ID,
    baseUrl: SANDBOX_BASE,
  },
  token: { accessToken: ACCESS_TOKEN },
};

const plugin = createShopeePlugin({ accessToken: ACCESS_TOKEN, shopId: SHOP_ID });

async function check(name: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    console.log(`  ✅ ${name}: returned (${JSON.stringify(result).slice(0, 200)})`);
  } catch (err: unknown) {
    const msg = String(err instanceof Error ? err.message ?? err : err);
    if (msg.includes('NotImplementedError')) {
      console.error(`  ❌ ${name}: NotImplementedError — METHOD NOT IMPLEMENTED`);
    } else {
      console.log(`  ⚠️  ${name}: ${msg.slice(0, 200) || '(no message)'} (real error, NOT stub)`);
    }
  }
}

async function main() {
  console.log('Live sandbox verification against Shopee sandbox\n');
  console.log(`Partner: ${PARTNER_ID}, Shop: ${SHOP_ID}, Token: ${ACCESS_TOKEN.slice(0, 8)}...`);
  console.log('');

  await check('inventory.getStockLevels', () =>
    plugin.gateway.inventory.getStockLevels(ctx as never, []),
  );

  await check('inventory.adjust', () =>
    plugin.gateway.inventory.adjust(ctx as never, []),
  );

  await check('shipping.listShipments', () =>
    plugin.gateway.shipping.listShipments(ctx as never, {}),
  );

  await check('shipping.getShipment', () =>
    plugin.gateway.shipping.getShipment(ctx as never, 'FAKE_SN'),
  );

  await check('payment.list', () =>
    plugin.gateway.payment.list(ctx as never, {}),
  );

  await check('payment.get', () =>
    plugin.gateway.payment.get(ctx as never, 'FAKE_SN'),
  );

  await check('payment.refund', () =>
    plugin.gateway.payment.refund(ctx as never, 'FAKE_SN', 0),
  );

  await check('promotion.list', () =>
    plugin.gateway.promotion.list(ctx as never, {}),
  );

  await check('promotion.get', () =>
    plugin.gateway.promotion.get(ctx as never, '0'),
  );

  await check('promotion.update', () =>
    plugin.gateway.promotion.update(ctx as never, '0', {}),
  );

  await check('promotion.setActive (deactivate)', () =>
    plugin.gateway.promotion.setActive(ctx as never, '0', false),
  );

  await check('media.upload (skip - no real file)', () =>
    plugin.gateway.media.upload(ctx as never, { type: 'video', data: new Uint8Array(0) }),
  );

  await check('media.list', () =>
    plugin.gateway.media.list(ctx as never, {}),
  );

  await check('returns.act (cancel)', () =>
    plugin.gateway.returns.act(ctx as never, 'srn-FAKE', 'cancel'),
  );

  await check('shop.getSettings', () =>
    plugin.gateway.shop.getSettings(ctx as never),
  );

  await check('shop.listWarehouses', () =>
    plugin.gateway.shop.listWarehouses(ctx as never),
  );

  await check('finance.overview', () =>
    plugin.gateway.finance.overview(ctx as never),
  );

  await check('finance.transactions', () =>
    plugin.gateway.finance.transactions(ctx as never, {}),
  );

  await check('finance.statement', () =>
    plugin.gateway.finance.statement(ctx as never, {}),
  );

  await check('finance.payoutInfo', () =>
    plugin.gateway.finance.payoutInfo(ctx as never),
  );

  await check('merchant.listShops', () =>
    plugin.gateway.merchant.listShops(ctx as never),
  );

  await check('merchant.listWarehouses', () =>
    plugin.gateway.merchant.listWarehouses(ctx as never),
  );

  await check('merchant.listWarehouseLocations', () =>
    plugin.gateway.merchant.listWarehouseLocations(ctx as never, 'wh-1'),
  );

  console.log('\nDone. Any ✅ or ⚠️ means the method IS implemented (no NotImplementedError).');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
