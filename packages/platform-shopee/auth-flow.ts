import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ShopeeClient } from './src/shopee.client';
import { createShopeeAuth } from './src/shopee.auth';
import type { OAuthToken } from '@opensellvy/connector';

const PARTNER_ID = process.env.SHOPEE_PARTNER_ID ?? '1241483';
const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY ?? '';
const SHOP_ID = process.env.SHOPEE_SHOP_ID ?? '227844766';
const REDIRECT_URI = process.env.SHOPEE_REDIRECT_URI ?? 'https://app.example.com/callback';
const SANDBOX_BASE = 'https://openplatform.sandbox.test-stable.shopee.sg';

const TOKEN_FILE = fileURLToPath(new URL('.local/tokens.json', import.meta.url));

interface StoredTokens {
  partnerId?: string;
  shopId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

function fail(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

function loadStored(): StoredTokens | null {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, 'utf8')) as StoredTokens;
  } catch {
    return null;
  }
}

function saveStored(t: StoredTokens): void {
  mkdirSync(dirname(TOKEN_FILE), { recursive: true });
  writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2) + '\n', 'utf8');
}

function makeAuth() {
  if (!PARTNER_KEY) fail('SHOPEE_PARTNER_KEY env not set.');
  const credentials = {
    appId: PARTNER_ID,
    secret: PARTNER_KEY,
    baseUrl: SANDBOX_BASE,
    ...(SHOP_ID ? { shopId: SHOP_ID } : {}),
  };
  const client = new ShopeeClient({ credentials });
  return { client, auth: createShopeeAuth(client) };
}

function parseCodeInput(arg: string): { code: string; shopId?: string } {
  const trimmed = arg.trim().replace(/^["']|["']$/g, '');
  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    const code = url.searchParams.get('code');
    if (!code) fail(`No 'code' in the pasted URL: ${trimmed}`);
    const shopId = url.searchParams.get('shop_id') ?? undefined;
    return { code, ...(shopId ? { shopId } : {}) };
  }
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) return { code: trimmed };
  fail(`Cannot parse input (want full redirect URL or raw code): "${arg.slice(0, 120)}"`);
}

function report(token: OAuthToken & { shopId?: string }): void {
  const expiresInMin = token.expiresAt ? Math.round((token.expiresAt - Date.now()) / 60000) : undefined;
  console.log('\n  ✅ Token OK');
  console.log(`  access_token  (valid ~${expiresInMin !== undefined ? `${expiresInMin} min` : '?'}):`);
  console.log(`    ${token.accessToken}`);
  if (token.refreshToken) {
    console.log('  refresh_token (valid 30 hari, bisa refresh):');
    console.log(`    ${token.refreshToken}`);
  }
  if (token.shopId) console.log(`  shop_id: ${token.shopId}`);
  console.log(`\n  Tersimpan di ${TOKEN_FILE}`);
}

async function main(): Promise<void> {
  const mode = process.argv[2];

  if (!mode || mode === 'auth' || mode === 'url') {
    const { client, auth } = makeAuth();
    const url = await auth.getAuthorizeUrl(REDIRECT_URI);
    console.log('\n  1. Buka URL berikut di browser, login & authorize akun test seller sandbox:');
    console.log(`     ${url}`);
    console.log('\n  2. Browser akan di-redirect ke (app.example.com tidak live, jadi tampil error — itu normal):');
    console.log(`     ${REDIRECT_URI}?code=...&shop_id=...`);
    console.log('\n  3. COPY SELURUH URL dari address bar (mulai https://app.example.com/callback?code=...), lalu:');
    console.log('     npx tsx auth-flow.ts "<pasted-url>"');
    return;
  }

  if (mode === 'refresh') {
    const { auth } = makeAuth();
    const stored = loadStored();
    if (!stored?.refreshToken) fail('No saved refresh_token. Run: npx tsx auth-flow.ts (get code) first.');
    const token = await auth.refreshToken(stored.refreshToken, stored.shopId ?? process.env.SHOPEE_SHOP_ID);
    saveStored({
      partnerId: PARTNER_ID,
      accessToken: token.accessToken,
      ...(token.refreshToken ? { refreshToken: token.refreshToken } : {}),
      ...(token.expiresAt ? { expiresAt: token.expiresAt } : {}),
      shopId: token.shopId ?? stored.shopId ?? SHOP_ID,
    });
    report(token);
    return;
  }

  const { auth } = makeAuth();
  const { code, shopId } = parseCodeInput(mode);
  if (!code) fail('Empty code.');
  const token = await auth.exchangeCode(code, shopId);
  if (!token.accessToken) fail('No access_token returned from Shopee (check code/expiry).');
  saveStored({
    partnerId: PARTNER_ID,
    accessToken: token.accessToken,
    ...(token.refreshToken ? { refreshToken: token.refreshToken } : {}),
    ...(token.expiresAt ? { expiresAt: token.expiresAt } : {}),
    shopId: token.shopId ?? shopId ?? SHOP_ID,
  });
  report(token);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? (err.message ?? String(err)) : String(err);
  console.error(`  ❌ ${msg}`);
  process.exit(1);
});