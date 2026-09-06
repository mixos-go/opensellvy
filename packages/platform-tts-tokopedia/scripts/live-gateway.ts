/**
 * Uji live gateway TikTok Shop (platform tts-tokopedia) lewat JALUR GATEWAY +
 * kontrak PlatformPlugin/PlatformGateway/PlatformAuth.
 *
 * Kredensial: `.local/credentials.json` (TIDAK di-commit) atau env.
 * Token: `.local/tokens.json` (hasil scripts/auth-flow.ts); opsi env ACCESS_TOKEN.
 *
 *   npx tsx scripts/live-gateway.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createTtsPlugin } from '../src/tts.connector';
import { refreshAccessToken } from '../src/tts.auth';
import type { TokenStore, OAuthToken } from '@opensellvy/connector';

const CRED_FILE = fileURLToPath(new URL('../.local/credentials.json', import.meta.url));
const TOKEN_FILE = fileURLToPath(new URL('../.local/tokens.json', import.meta.url));

interface Credentials {
  appKey: string;
  appSecret: string;
  redirectUri?: string;
}

interface StoredTokens {
  appKey: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  shopCipher?: string;
}

function fail(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function loadCreds(): Credentials {
  const envCreds: Credentials = {
    appKey: process.env.TTS_APP_KEY ?? '',
    appSecret: process.env.TTS_APP_SECRET ?? '',
    ...(process.env.TTS_REDIRECT_URI ? { redirectUri: process.env.TTS_REDIRECT_URI } : {}),
  };
  if (envCreds.appKey && envCreds.appSecret) return envCreds;
  if (!existsSync(CRED_FILE)) fail('Tidak ada .local/credentials.json (atau env TTS_APP_KEY/TTS_APP_SECRET).');
  return JSON.parse(readFileSync(CRED_FILE, 'utf8')) as Credentials;
}

function loadStored(): StoredTokens | null {
  if (!existsSync(TOKEN_FILE)) return null;
  return JSON.parse(readFileSync(TOKEN_FILE, 'utf8')) as StoredTokens;
}

const refreshed: { token?: OAuthToken } = {};

const store: TokenStore = {
  async save(_s, _p, token) {
    refreshed.token = token;
  },
  async get() {
    return refreshed.token;
  },
  async delete() {
    refreshed.token = undefined;
  },
};

function short(s: string): string {
  return s ? `${s.slice(0, 6)}…` : '(empty)';
}

async function main(): Promise<void> {
  const creds = loadCreds();
  const stored = loadStored();

  const credentials = {
    appId: creds.appKey,
    secret: creds.appSecret,
    ...(creds.redirectUri ? { redirectUri: creds.redirectUri } : {}),
  };

  let accessToken = stored?.accessToken ?? process.env.ACCESS_TOKEN ?? '';
  if ((!accessToken || (stored?.expiresAt ?? 0) <= Date.now()) && stored?.refreshToken) {
    const res = await refreshAccessToken({ app_key: creds.appKey, app_secret: creds.appSecret }, stored.refreshToken);
    accessToken = String(res?.data?.access_token ?? '');
    if (accessToken) {
      refreshed.token = {
        accessToken,
        ...(res.data?.access_token_expire_in !== undefined
          ? { expiresAt: Date.now() + Number(res.data.access_token_expire_in) * 1000 }
          : {}),
      };
      console.log(`[auth] token di-refresh dari refresh_token → ${short(accessToken)}`);
    }
  }
  if (!accessToken) fail('Tidak ada access token valid. Jalankan: npx tsx scripts/auth-flow.ts (tukar code).');

  const contextToken: OAuthToken & { shopCipher?: string } = {
    accessToken,
    ...(stored?.expiresAt ? { expiresAt: stored.expiresAt } : {}),
    ...(stored?.shopCipher ? { shopCipher: stored.shopCipher } : {}),
  };

  const plugin = createTtsPlugin({
    tokenStore: store,
    ...(stored?.shopCipher ? { shopCipher: stored.shopCipher } : {}),
  });

  const ctx = {
    storeId: 's-live',
    platformAccountId: 's-live:tts',
    credentials,
    token: contextToken,
  } as Parameters<typeof plugin.gateway.shop.getProfile>[0];

  console.log('[gateway] getProfile …');
  const shop = await plugin.gateway.shop.getProfile(ctx);
  console.log('  shop:', JSON.stringify(shop));

  console.log('\n[gateway] pullOrders (7 hari terakhir) …');
  const orders = await plugin.gateway.order.pull(ctx);
  console.log(`  ${orders.length} order`);
  for (const o of orders.slice(0, 5)) {
    console.log('   -', o.platformOrderId, '|', o.status, '|', o.createdAt, '|', o.totals.grandTotal?.amount);
  }

  console.log('\n[gateway] pullProducts …');
  const products = await plugin.gateway.product.pull(ctx, { limit: 10 });
  console.log(`  ${products.length} product`);
  for (const p of products.slice(0, 5)) {
    console.log('   -', p.name, '|', p.variants?.length, 'varian', '|', p.status);
  }

  console.log('\n[gateway] inventory.getStockLevels …');
  const skuList = products[0]?.variants.map((v) => v.platformVariantId ?? v.sku).filter(Boolean) as string[];
  if (skuList?.length) {
    const levels = await plugin.gateway.inventory.getStockLevels(ctx, skuList.slice(0, 5));
    console.log('  levels:', JSON.stringify(levels));
  } else {
    console.log('  (tidak ada produk — dilewati)');
  }

  console.log('\n[gateway] returns.list …');
  const returns = await plugin.gateway.returns.list(ctx);
  console.log(`  ${returns.length} return`, JSON.stringify(returns.slice(0, 2)));

  console.log('\n[gateway] payment.list …');
  const payments = await plugin.gateway.payment.list(ctx);
  console.log(`  ${payments.length} payment`, JSON.stringify(payments.slice(0, 2)));

  console.log('\n[gateway] shipping.getRates …');
  try {
    const rates = await plugin.gateway.shipping.getRates(ctx, { toAddress: {} as never });
    console.log(`  ${rates.length} rate`, JSON.stringify(rates.slice(0, 3)));
  } catch (e) {
    console.log('  (skip/kosong):', e instanceof Error ? e.message : String(e));
  }

  console.log('\n✅ Uji gateway TikTok Shop selesai.');
}

main().catch((err: unknown) => {
  const e = err as { message?: string; code?: string; requestId?: string };
  console.error('\n❌ Gagal:', e?.message ?? String(err));
  if (e?.code) console.error('   code:', e.code);
  if (e?.requestId) console.error('   requestId:', e.requestId);
  process.exit(1);
});