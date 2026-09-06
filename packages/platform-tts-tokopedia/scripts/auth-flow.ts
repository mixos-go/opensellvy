/**
 * OAuth flow TikTok Shop (platform tts-tokopedia): generate authorize URL →
 * tukar code → simpan token ke `.local/tokens.json`.
 *
 * Cara pakai:
 *   npx tsx scripts/auth-flow.ts            # pegang URL authorize utk dibuka di browser
 *   npx tsx scripts/auth-flow.ts "<redirect-url-with-code>"   # tukar code → simpan token
 *   npx tsx scripts/auth-flow.ts refresh     # refresh dari refresh_token tersimpan
 *
 * Kredensial diambil dari `.local/credentials.json` (TIDAK di-commit) atau env:
 *   { "appKey": "...", "appSecret": "...", "redirectUri": "..." }
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAuthUrl, exchangeAuthCode, refreshAccessToken, type TokenResponse } from '../src/tts.auth';
import type { OAuthToken } from '@opensellvy/connector';

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
  if (!existsSync(CRED_FILE)) fail(`No credentials. Buat .local/credentials.json {appKey,appSecret} atau set env TTS_APP_KEY/TTS_APP_SECRET.`);
  return JSON.parse(readFileSync(CRED_FILE, 'utf8')) as Credentials;
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

function toOAuthToken(res: TokenResponse, prev?: OAuthToken): OAuthToken & { shopCipher?: string } {
  const d = res?.data ?? {};
  const token: OAuthToken & { shopCipher?: string } = {
    accessToken: String(d.access_token ?? prev?.accessToken ?? ''),
    ...(d.refresh_token !== undefined ? { refreshToken: String(d.refresh_token) } : {}),
    ...(d.access_token_expire_in !== undefined
      ? { expiresAt: Date.now() + Number(d.access_token_expire_in) * 1000 }
      : {}),
  };
  if (d.shop_cipher !== undefined && String(d.shop_cipher)) token.shopCipher = String(d.shop_cipher);
  return token;
}

function report(token: OAuthToken & { shopCipher?: string }, appKey: string): void {
  const expiresInMin = token.expiresAt ? Math.round((token.expiresAt - Date.now()) / 60000) : undefined;
  console.log('\n  ✅ Token OK');
  console.log(`  access_token  (valid ~${expiresInMin !== undefined ? `${expiresInMin} min` : '?'}):`);
  console.log(`    ${token.accessToken}`);
  if (token.refreshToken) {
    console.log('  refresh_token (refresh ~7 hari):');
    console.log(`    ${token.refreshToken}`);
  }
  if (token.shopCipher) console.log(`  shop_cipher: ${token.shopCipher}`);
  console.log(`\n  Tersimpan di ${TOKEN_FILE} (app_key ${appKey})`);
}

function parseCodeInput(arg: string): string {
  const trimmed = arg.trim().replace(/^["']|["']$/g, '');
  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed);
    const code = url.searchParams.get('code');
    if (!code) fail(`No 'code' in the pasted URL: ${trimmed}`);
    return code;
  }
  if (/^[a-zA-Z0-9=_-]+$/.test(trimmed)) return trimmed;
  fail(`Cannot parse input (want full redirect URL or raw code): "${arg.slice(0, 120)}"`);
}

async function main(): Promise<void> {
  const mode = process.argv[2];
  const creds = loadCreds();
  const redirectUri = creds.redirectUri ?? 'https://app.example.com/callback';

  if (!mode || mode === 'auth' || mode === 'url') {
    const url = buildAuthUrl({ app_key: creds.appKey, app_secret: creds.appSecret }, redirectUri, {
      state: 'opensellvy-tts',
    });
    console.log('\n  1. Buka URL berikut di browser, login & authorize akun test seller TikTok Shop:');
    console.log(`     ${url}`);
    console.log('\n  2. Browser akan di-redirect ke (app.example.com tidak live, jadi tampil error — itu normal):');
    console.log(`     ${redirectUri}?code=...`);
    console.log('\n  3. COPY SELURUH URL dari address bar, lalu jalankan:');
    console.log('     npx tsx scripts/auth-flow.ts "<pasted-url>"');
    return;
  }

  if (mode === 'refresh') {
    const stored = loadStored();
    if (!stored?.refreshToken) fail('No saved refresh_token. Jalankan auth-flow (tukar code) dulu.');
    const res = await refreshAccessToken({ app_key: creds.appKey, app_secret: creds.appSecret }, stored.refreshToken);
    const token = toOAuthToken(res);
    if (!token.accessToken) fail(`TikTok refresh gagal: ${JSON.stringify(res).slice(0, 200)}`);
    saveStored({
      appKey: creds.appKey,
      accessToken: token.accessToken,
      ...(token.refreshToken ? { refreshToken: token.refreshToken } : {}),
      ...(token.expiresAt ? { expiresAt: token.expiresAt } : {}),
      ...(token.shopCipher ? { shopCipher: token.shopCipher } : {}),
    });
    report(token, creds.appKey);
    return;
  }

  const code = parseCodeInput(mode);
  const res = await exchangeAuthCode({ app_key: creds.appKey, app_secret: creds.appSecret }, code);
  const token = toOAuthToken(res);
  if (!token.accessToken) fail(`TikTok exchange gagal: ${JSON.stringify(res).slice(0, 300)}`);
  saveStored({
    appKey: creds.appKey,
    accessToken: token.accessToken,
    ...(token.refreshToken ? { refreshToken: token.refreshToken } : {}),
    ...(token.expiresAt ? { expiresAt: token.expiresAt } : {}),
    ...(token.shopCipher ? { shopCipher: token.shopCipher } : {}),
  });
  report(token, creds.appKey);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? (err.message ?? String(err)) : String(err);
  console.error(`  ❌ ${msg}`);
  process.exit(1);
});