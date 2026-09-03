/**
 * Uji live e2e: 2 kategori (Order + Product) lewat JALUR GATEWAY + kontrak
 * PlatformPlugin/PlatformGateway/PlatformAuth (bukan raw ShopeeApi).
 *
 * Cara pakai:
 *   REFRESH_TOKEN=<refresh_token> npx tsx scripts/live-e2e.ts
 *   CODE=<oauth_code>             npx tsx scripts/live-e2e.ts   # alternatif
 *   ACCESS_TOKEN=<token> npx tsx scripts/live-e2e.ts            # quick-start
 *
 * Kredensial diambil dari PATH_CREDENTIALS file (default tidak di-commit):
 *   {"partnerId":"...","secret":"...","shopId":"..."}
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createShopeePlugin } from '../src/shopee.connector';
import { ShopeeClient } from '../src/shopee.client';
import { createShopeeAuth } from '../src/shopee.auth';
import type { TokenStore } from '@opensellvy/connector';
import type { OAuthToken } from '@opensellvy/connector';

const SANDBOX = 'https://openplatform.sandbox.test-stable.shopee.sg';
const PARTNER_ID = process.env.PARTNER_ID ?? '';
const SECRET = process.env.PARTNER_KEY ?? '';
const SHOP_ID = process.env.SHOP_ID ?? '';
const REDIRECT_URI = process.env.REDIRECT_URI ?? 'https://example.com/callback';

if (!PARTNER_ID || !SECRET || !SHOP_ID) {
  console.error('Wajib set env PARTNER_ID, PARTNER_KEY, SHOP_ID (kredensial TIDAK di-commit ke repo).');
  process.exit(1);
}

const refreshedToken: { token?: OAuthToken } = {};

// TokenStore in-memory sederhana utk script (menyimpan hasil refresh).
const store: TokenStore = {
  async save(_s, _p, token) {
    refreshedToken.token = token;
  },
  async get() {
    return refreshedToken.token;
  },
  async delete() {
    refreshedToken.token = undefined;
  },
};

async function main(): Promise<void> {
  const credentials = {
    appId: PARTNER_ID,
    secret: SECRET,
    redirectUri: REDIRECT_URI,
    sandbox: true,
    baseUrl: SANDBOX,
    shopId: SHOP_ID,
  };

  const plugin = createShopeePlugin({
    credentials,
    tokenStore: store,
    // access token opsional di bawah — kalau tak ada, pakai OAuth di bawah.
    ...(process.env.ACCESS_TOKEN ? { accessToken: process.env.ACCESS_TOKEN, shopId: SHOP_ID } : {}),
  });

  const ctx = {
    storeId: 's-live',
    platformAccountId: 's-live:shopee',
    credentials,
    token: {} as OAuthToken,
  } as Parameters<typeof plugin.gateway.shop.getProfile>[0];

  // Dapatkan access token otomatis (tanpa manual dari user):
  // prefer refresh_token → exchangeCode (code) → fallback env ACCESS_TOKEN.
  const refreshToken = process.env.REFRESH_TOKEN;
  const code = process.env.CODE;
  if (refreshToken) {
    // Tukar refresh_token → access token langsung (first connect / manual inject).
    // Jalur refresh token Shopee: POST /api/v2/auth/access_token/get.
    const client = new ShopeeClient({
      credentials,
      now: () => Math.floor(Date.now() / 1000),
    });
    const sa = createShopeeAuth(client);
    const t = await sa.refreshToken(refreshToken, SHOP_ID);
    refreshedToken.token = t;
    console.log('[auth] access token didapat via refreshToken:', (t.accessToken || '(empty)').slice(0, 6) + '…');
    if (!t.accessToken) {
      console.log('[auth] response penuh:', JSON.stringify(t));
      process.exit(1);
    }
  } else if (code) {
    const t = await plugin.auth.exchangeCode(ctx, code);
    console.log('[auth] token didapat via exchangeCode:', t.accessToken.slice(0, 6) + '…');
  } else if (process.env.ACCESS_TOKEN) {
    console.log('[auth] pakai ACCESS_TOKEN dari env (quick-start).');
  } else {
    console.error('Tidak ada refresh_token/code/access_token. Set REFRESH_TOKEN, CODE, atau ACCESS_TOKEN.');
    process.exit(1);
  }

  // --- JALUR GATEWAY + kontrak ---
  console.log('\n[gateway] getShop …');
  const shop = await plugin.gateway.shop.getProfile(ctx);
  console.log('  shop:', shop);

  console.log('\n[gateway] pullOrders (7 hari terakhir) …');
  const orders = await plugin.gateway.order.pull(ctx);
  console.log(`  ${orders.length} order`);
  for (const o of orders.slice(0, 3)) {
    console.log('   -', o.platformOrderId, '|', o.status, '|', o.currency, o.totalAmount?.amount);
  }

  console.log('\n[gateway] pullProducts …');
  const products = await plugin.gateway.product.pull(ctx);
  console.log(`  ${products.length} product`);
  for (const p of products.slice(0, 3)) {
    console.log('   -', p.name, '|', p.sku ?? '', '|', p.variants?.length, 'varian');
  }

  console.log('\n✅ Uji gateway 2 kategori selesai (no contract change).');
}

main().catch((err) => {
  console.error('\n❌ Gagal:', err?.message ?? err);
  if (err?.code) console.error('   code:', err.code);
  if (err?.requestId) console.error('   requestId:', err.requestId);
  process.exit(1);
});
