# OpenSellvy — AGENTS.md (Memory Penyambung Konteks)

> **Tujuan dokumen ini:** memberi AI/agen baru konteks penuh & instan tentang project
> sehingga bisa lanjut tanpa conversation lama. Baca dokumen ini SEPENUHNYA sebelum
> menulis SATU baris kode. Jangan mengedit tanpa memahami pola yang sudah ada.
>
> Dokumen kedua yang WAJIB dibaca: **`docs/SKILLS.md`** (workflow + checklist teknis).

---

## 1. Apa project ini

**OpenSellvy** = Omnichannel OMS SDK untuk ecommerce Indonesia
(Shopee, TikTok Shop/Tokopedia, Lazada, Blibli). Monorepo **pnpm** di repo ini.

Arsitektur = **plugin monorepo**, **domain-first (hexagonal)**, **satu-gate registry**:

- **Domain/types di tengah** (di `@opensellvy/types`) — bebaz platform, `'local'` masuk `PlatformCode`.
- **Module OMS** (di `@opensellvy/module`) — reuse utk semua platform, TIDAK pernah
  mem-import `@opensellvy/platform-*` langsung. Semua resolve lewat registry.
- **Adapter platform** = plugin external di `@opensellvy/platform-*`, didaftarkan ke registry.
- **Satu gate:** module/sdk/api hanya tahu `registry.get(platform).gateway` /
  `connectors.get(platform)` dari `@opensellvy/connector`. **DILARANG** import `platform-*` di selain package adapter itu sendiri + registry registration.

---

## 2. Struktur monorepo

```
packages/
  types/            @opensellvy/types          Base + 18 domain types (order, product, inventory, ...)
  core/             @opensellvy/core           config, http, crypto, logger, event, auth, cache, queue
  connector/        @opensellvy/connector      Contract PlatformPlugin + registry + OAuthService (RFC6749)
  module/           @opensellvy/module         18 module services (impl/) + ports + memory (default repo)
  api/              @opensellvy/api            Hono REST API (auth, oauth, webhook, orders, products, ...)
  db/               @opensellvy/db             (legacy) Drizzle schema + migrations + seed
  db-pg/            @opensellvy/db-pg          Repos nyata di Postgres (Drizzle) + battle tests
  platform-local/   @opensellvy/platform-local Adapter bukti one-gate (in-memory)
  platform-shopee/  @opensellvy/platform-shopee Adapter REFERENSI nyata (full Open Platform v2) ★
  platform-tts-tokopedia/  @opensellvy/platform-tts-tokopedia Adapter TikTok Shop (SDK user di-vendor) ●
  platform-lazada/         stub (belum diimplementasi)
  platform-blibli/         stub (belum diimplementasi)
  sdk/              @opensellvy/sdk            Umbrella SDK instalable (OpenSellvy, defineConfig, + subpath export semua package non-platform: /connector /module /api /core /db /db-pg)
  ui/               @opensellvy/ui             Aktif: shadcn/ui 60 primitives + komponen platform (lazada/blibli "Soon")
```

- Root scripts: `pnpm check` (typecheck+lint+build+test), `build` (serial), `demo:local`.
- `pnpm-workspace.yaml` mencakup `packages/*`.

## 3. Pola & rules PER-PACKAGE (detail — wajib dipatuhi)

Setiap package self-contained, exports `dist/index.{js,d.ts}` via `tsup`, test dengan `vitest`.
Package **hanya** boleh depend pada package yang dideklarasikan di `dependencies`-nya.
Arah dependency (memori): `types ← core ← connector ← module ← api ← sdk`, dan
platform adapters `↔ registry (connector)` via register (bukan di-import balik).

### 3.1 `@opensellvy/types` — bezaz platform, pusat domain
- File: `src/base.ts` (Currency 'IDR', Address, ID, ISO8601, dll) + `src/domain/*.ts` (18 domain).
- Rules: **jangan pernah import package lain** (types tak punya dependency). Murni `interface`/`type`.
- `'local'` masuk `PlatformCode` (adapter lokal). Semua unified type (UnifiedOrder/Product) di sini.
- Perubahan type berdampak ke SEMUA package → build types dulu lalu typecheck dependen.

### 3.2 `@opensellvy/core` — utilitas standalone (tanpa connector/module)
- `deps`: `@opensellvy/types`. Subfolder: `config` (env), `http` (fetch client + hooks/retry),
  `crypto` (AES-256-GCM, HMAC-SHA256), `logger`, `event` (in-process bus), `auth`
  (JWT HS256, scrypt, AuthService, RBAC), `cache` (memory + Redis/ioredis), `queue`
  (memory + BullMQ).
- Rules: **tidak boleh import connector/module/api/platform**. Ada subpath export `./auth`.
- Memory impl adalah default & diganti infra nyata (Redis/BullMQ/Postgres) di lapisan pemanggil.

### 3.3 `@opensellvy/connector` — kontrak + registry SATU-GATE (lihat §4 dulu)
- `deps`: `@opensellvy/types`, `@opensellvy/core`.
- Files: `base.connector.ts` (PlatformPlugin/Auth/Gateway/Webhook), `connector.types.ts`
  (ConnectorContext, OAuthToken, PlatformCredentials, OAuthConfiguration),
  `register.ts` (registri + RegisterError), `oauth/` (createOAuthClient RFC6749 + TokenStore + callback).
- Rules: **satu gate** — module/sdk/api hanya tahu `registry.get(platform).gateway` / `connectors.get(platform)`
  dari sini. DILARANG import `@opensellvy/platform-*` di mana pun di luar adapter itu sendiri.
- Ubah kontrak = breaking → update semua implementer (stub + test + api/module/db-pg) + build connector dulu.

### 3.4 `@opensellvy/module` — domain OMS, reuse semua platform
- `deps`: `@opensellvy/types`, `@opensellvy/connector`.
- `src/ports/repositories.ts` = storage contracts (17 repo, domain-pure, DB-agnostic).
  `src/impl/` = 18 module service: `order, product, catalog, inventory, channel, customer, store,
  fulfillment, return, payment, warehouse, shipping, promotion, finance, notification, user, analytics, audit`.
  `src/impl/deps.ts` = `ModuleDeps` (repos, registry, tokens?, credentials?, logger?, events?, newId?, now?).
  `src/impl/memory/` = default in-memory repo.
- Entry: `createServices(deps) → Services`. **TIDAK PERNAH import `@opensellvy/platform-*`** di sini — semua via registry.
- Rules: tiap module = fungsi/objek pure (inject deps), idempoten utk sync (by platformOrderId), deep-equal
  canonical utk `orderChanged` (backend-agnostic, agar konsisten memory vs JSONB).

### 3.5 `@opensellvy/api` — Hono REST
- `deps`: types, connector, module, core, hono, @hono/node-server.
- Layering ketat: `Router → Controller → Service (module) → Repository`. Controller **tak pernah akses repo langsung**.
- Files: `context.ts` (build ctx/serve), `env.ts`, `errors.ts`, `middleware/`
  (auth bearer fail-closed, bind-context, cors, error-handler, rate-limit), `rest/controllers/`
  (auth, catalog, health, order, store, webhook) + `rest/router.ts`.
- Auth policy: **fail-closed default** (`authMode:'open'` hanya utk dev eksplisit). OAuth callback + webhook dispatch di sini.

### 3.6 `@opensellvy/db` — schema & migrasi (legacy base)
- `deps`: types, drizzle-orm, pg. `src/schema.ts` (Drizzle 21 tabel), `src/migrations.ts` (runner),
  `migrations/*.sql` (urut + transaksi), `scripts/{migrate,seed}.ts`.
- Rules: DDL = raw SQL (clean-room, tanpa drizzle-kit). Migrasi baru: increment nomor `0000X_*.sql`,
  taruh di `migrations/`, runner urut berdasarkan urutan file.

### 3.7 `@opensellvy/db-pg` — repo nyata Postgres (implementasi port module)
- `deps`: types, module, db, core, drizzle-orm, pg.
- `createPostgresRepositories(db)` → implements ke-17 port module. Pola: kolom queryable + `payload` JSONB
  = aggregate domain utuh (source of truth). Battle tests butuh **Postgres nyata** (ENV `DATABASE_URL`,
  drizzle migrate dulu) — jangan jalankan tanpa DB.

### 3.8 `@opensellvy/platform-local` — adapter bukti satu-gate (in-memory)
- `deps`: types, connector. Files: `local.store.ts` (in-memory multi-tenant), `local.connector.ts`,
  `index.ts`. Implementasi penuh PlatformPlugin tanpa API eksternal. `demo:local` memakainya.

### 3.9 `@opensellvy/platform-shopee` — adapter RUJUKAN nyata (pola wajib semua platform)
- `deps`: connector, core, types. Pola file + aturan: lihat §5 (reference implementation) & §6 (fakta Shopee).
- **Generator 444 API:** `scripts/generate-api.ts` (jalankan: `pnpm --filter @opensellvy/platform-shopee
  generate` = `tsx scripts/generate-api.ts`) mem-parse `docs/skills/shopee/references/api/**` dan emit
  typed client **per kategori** ke `src/generated/<category>.ts` (`ShopeeApi<Category>` + `Req_*`/`Res_*`),
  `src/generated/_shared.ts`, dan `src/generated/index.ts` (`createShopeeApi(client, opts)` → facade
  29 kategori). Response dibangun pakai **boundary rule + dedup nama** (doc flat tanpa sinyal depth).
  JANGAN edit file di `src/generated/` langsung — ubah generator lalu `generate`.

### 3.10 `@opensellvy/sdk` — umbrella SDK instalable (bundle SEMUA package non-platform)
- `deps`: types, core, db, db-pg, connector, module, api. `src/sdk.ts` (`OpenSellvy` → `await sdk.open()`,
  inject repos via `config.databaseUrl`, fallback memory), `src/config.ts` (`defineConfig`, `PlatformConfig`,
  `defaultCredentials`), `src/errors.ts`.
- **Auth (core/auth) ter-wire:** `config.auth.jwtSecret` → getter **`sdk.auth`** (lazy) membangun AuthService
  dari repos (`findUserByEmail`/`getMemberRole` dari port users/members, DB-agnostic) + session store
  (option `authSessions` → Postgres bila `databaseUrl` → memory). Pass `authService: await sdk.auth` ke
  `createServer`. `User.passwordHash` optional (domain) — db-pg persiste ke kolom `password_hash`.
- **Bundle semua non-platform:** main entry `src/index.ts` re-export `@opensellvy/types` + `OpenSellvy`/`defineConfig`/errors;
  **subpath export** `@opensellvy/sdk/{connector,module,api,core,db,db-pg}` (collision-free) via `src/<sub>.ts`
  (masing-masing `export * from '@opensellvy/<pkg>'`). Platform adapter TIDAK masuk bundle — plugin eksternal.
- Rules: wiring `repos`/`repositories`; **tidak boleh import platform-* langsung** — platform didaftarkan
  lewat registry oleh pemakai.

### 3.11 Stubs platform (`platform-lazada`, `platform-blibli`) & `ui`
- `platform-tts-tokopedia`: **DIIMPLEMENTASI** (bukan stub) — pola SDK user di-vendor; lihat §5 pola adapter &
  dok SKILLS TTS bila perlu. Struktur: `tts.client`/`tts.auth`/`tts.types`/`tts.mapper`/`tts.webhook`/
  `tts.connector` (createTtsPlugin + TtsApi 25 kategori + gateway lengkap) + `generated/**` (25 kategori,
  JANGAN edit — berasal dari SDK user) + 32 test (conformance/connector/client/auth/mapper/webhook).
- `lazada`/`blibli`: stub hanya `index.ts` (belum diimplementasi). Jika diisi, ikuti pola
  `platform-shopee` (client/auth/mapper/webhook/connector/index) + daftarkan via registry.
- `ui`: **AKTIF (2026-09-06)** — shadcn/ui via CLI (Tailwind v4, React 18/19, tsup esm+dts). 60 primitives
  di `src/components/ui/` (campuran radix untuk komponen klasik + `@base-ui/react`+`@shadcn/react`+package
  `cn` utk komponen baru), theme `src/styles/globals.css` (di-copy ke `dist/globals.css`, subpath
  `@opensellvy/ui/styles.css`). **Import alias `@/` sdh direwrite ke relatif** — kalau re-generate shadcn,
  masih ada `@/` → rewrite lagi (script per-file rel ke `src/`). Komponen fuksin: `PlatformsSection`
  (lazada & blibli status "Soon"). Stub kosong lama (DataTable/OrderStatusBadge/PlatformIcon/useOrder/
  useProduct/AuthProvider/ThemeProvider) masih 0-byte. Stack detail + jebakan CLI (`add --all` gagal utk
  5 item yang 404 di registry new-york-v4; fix `exactOptionalPropertyTypes` di 5 file) → **TODO STATE TRACKER #4**.

---

## 4. Kontrak inti (connector) — JANGAN ubah seenaknya

File: `packages/connector/src/base.connector.ts` + `connector.types.ts` + `register.ts`.

### PlatformPlugin
```ts
interface PlatformPlugin {
  platform: PlatformCode;      // 'shopee' | 'tts-tokopedia' | 'lazada' | 'blibli' | 'local'
  name: string;
  baseUrl: string;
  capabilities: Capability[];  // order.pull/push/fulfill/tracking, product.pull/push,
                               // inventory.sync, promotion.sync, return.manage, webhook.receive
  auth: PlatformAuth;
  gateway: PlatformGateway;
  webhook: PlatformWebhookHandler;
}
```

### PlatformAuth — SEMUA method terima `context: ConnectorContext`
```ts
interface PlatformAuth {
  getAuthorizeUrl(context: ConnectorContext): Promise<string>;
  exchangeCode(context: ConnectorContext, code: string): Promise<OAuthToken>;
  refreshToken(context: ConnectorContext): Promise<OAuthToken>;
}
```
> **Catatan penting:** ini kontrak yang DISENGAJA terima `context`, karena adapter nyata butuh
> `redirectUri` & `shopId` dari `context.credentials`. Stub/test ikut disesuaikan.

### ConnectorContext
```ts
interface ConnectorContext {
  storeId: ID;
  platformAccountId: ID;
  credentials: PlatformCredentials;  // appId, secret, redirectUri, sandbox?, baseUrl?, shopId?
  token: OAuthToken;
}
```

### PlatformGateway — semua method berbicara DALAM domain types (bukan payload platform)
```ts
getShop(ctx) → PlatformShopProfile
pullOrders(ctx, {since?}) → UnifiedOrder[]
getOrder(ctx, platformOrderId) → UnifiedOrder
pushOrder(ctx, order): void
updateOrder(ctx, orderId, patch): void
pullProducts(ctx) → UnifiedProduct[]
pushProduct(ctx, product): void / pushProducts(ctx, products): void
syncInventory(ctx, items: ProductStockSku[]): void
manageReturn(ctx, request: ReturnRequest, action: 'approve'|'reject'|'receive'|'refund'): void
```

### Registry satu-gate (register.ts)
- `registerPlatform(plugin, { replace? })` — duplicate tanpa `replace:true` → lempar `RegisterError`.
- `getPlatform(code)` / `connectors.get(code)` — lempar error kalau belum terdaftar.

---

## 5. Pola implementasi adapter (WAJIB ikuti) — lihat `platform-shopee` sebagai referensi

Adapter `platform-shopee` adalah **pattern rujukan** (reference implementation). Struktur filenya:

```
packages/platform-shopee/src/
  shopee.client.ts     HTTP + HMAC-SHA256 signing (low-level, normalisasi ShopeeApiError)
  shopee.auth.ts       OAuth: authorize URL, exchangeCode, refreshToken
  shopee.mapper.ts     payload platform ↔ domain (order/product/return) — toleran field hilang
  shopee.webhook.ts    verify (HMAC timing-safe) + map event → domain
  shopee.connector.ts  createShopeePlugin(...) → PlatformPlugin penuh + registerShopee()
  index.ts             export semua
tests/                 *.spec.ts (vitest, stub fetch)
```

Pola yang harus dipertahankan di adapter lain:
1. **`options.fetch` + `options.now` injectable** di `createPlugin(options)` → mudah di-test
   dengan stub fetch tanpa kredensial nyata.
2. **Mapper toleran**: field `?` (optional), fallback default utk field wajib domain.
3. **Client** menangani: signing, common params (URL utk GET & POST), body utk POST,
   normalisasi error platform → error custom (`ShopeeApiError`).
4. `registerX()` memanggil `registerPlatform(plugin)`.

---

## 6. Shopee — fakta teknis yang sudah terverifikasi (sangat penting)

Base URL sandbox default (region ID/global): `https://openplatform.sandbox.test-stable.shopee.sg`
Production global: `https://partner.shopeemobile.com` (flexible via `credentials.baseUrl`).

### Signing HMAC-SHA256 (hex, lowercase)
- **Public API** base string = `partner_id + path + timestamp`
- **Shop API** base string = `partner_id + path + timestamp + access_token + shop_id`
- **Merchant API** base string = `partner_id + path + timestamp + access_token + merchant_id`
  (butuh **merchant-level access token** + `merchant_id` di common params URL — credential
  `credentials.merchantToken`; BUKAN shop token, lihat fakta verified di bawah).
- Panjang pasangan: 64 hex chars. Timestamp detik, valid 5 menit.

### Param & body
- **GET**: common params (partner_id, timestamp, access_token, shop_id/sign) DI URL + business params di URL.
- **POST**: common params (partner_id, timestamp, access_token, shop_id/merchant_id, sign) DI URL, business params DI BODY JSON.
- Response `{ error, message, response, request_id }` — `error` kosong = sukses.

### VERIFIED terhadap sandbox nyata (partner_id `1241483`) — jangan diubah tanpa validasi
- `get_shops_by_partner` (public) ✅ — kembali `authed_shop_list`, shop `227844766` region ID.
- `get_shop_info` (shop) ✅
- `get_item_list` (shop) ✅ — butuh `item_status` param.
- `get_order_list` (shop) ✅ — **WAJIB `time_from` + `time_to`, rentang ≤ 15 hari**.
- `get_order_detail` (shop) ✅ — respons pakai **`order_list`** (BUKAN `order`/`orders`).
- `product/update_stock` (POST) ✅ — item model-level butuh `model_id` yang benar.
- `auth/token/get` (POST public) ✅ — body WAJIB `partner_id`+`shop_id` sebagai **ANGKA (int)**.
- `auth/access_token/get` (POST public) ✅ — body WAJIB `partner_id`+`shop_id` int + `refresh_token`.
- Merchant API (`/api/v2/merchant/*`, mis. `get_merchant_warehouse_list`, `get_shop_list_by_merchant`) —
  **HANYA bisa dengan merchant-level access token + merchant_sign** (base = `...+access_token+merchant_id`,
  `merchant_id` di common params URL). Mode yang GAGAL live (verified): shop-sign + merchant_id di query →
  `error_sign`; merchant-sign + shop token → `invalid_access_token`; merchant_id cuma di body → `error_param`
  "no merchant_id in query". Token shop kita (exchange `auth/token/get`) punya `merchant_id_list: []` → belum
  punya merchant token untuk fully verify. Adapter sudah support: `credentials.merchantId` + `credentials.merchantToken`.

### Status saat ini
> Detail state LIVE (perubahan belum di-commit, jumlah test, posisi kerja saat ini) WALIB ada
> di **`TODO.md` → STATE TRACKER** (dengan timestamp). AGENTS.md TIDAK menyimpan state yang
> berubah — selalu cek STATE TRACKER untuk posisi terkini, lalu `git status -s`.
>
> Jika STATE TRACKER mencatat perubahan Shopee auth (partner_id/shop_id int di body) belum di-commit,
> verify + commit sesuai instruksi verify di sana sebelum lanjut.

> ⚠️ Kredensial sisa uji: access token berlaku ~4 jam; cek `expire_time` sebelum mengandalkan.
> JANGAN commit kredensial nyata ke repo.

---

## 6b. TikTok Shop (platform `tts-tokopedia`) — fakta teknis terverifikasi dari SDK user

- Base URL: `https://open-api.tiktokglobalshop.com`. `TTS_BASE_URL` diekspor connector.
- **Signing HMAC-SHA256** (`tts.client.ts:sign`): query params (common + business, TANPA `sign`/`access_token`)
  di-sort ASC → `signString = apiPath + concat(k+v)` → tambahkan compact JSON body bila ada →
  `input = app_secret + signString + app_secret` → hex. Timestamp detik. Access token dikirim via
  header **`x-tts-access-token`** (BUKAN di URL).
- **Common params URL:** `app_key`, `timestamp`, `sign`, opsional `shop_cipher` (cross-border/multi-shop).
  GET business params di URL; POST business params di BODY JSON.
- **OAuth (VERIFIED live 2026-09, app key `6kr44ku4st6in`):** entry authorize = halaman browser
  `https://services.tiktokshop.com/open/authorize?app_key=...&path=<redirect>&state=...` (TANPA sign —
  HTTP 200 terverifikasi). Token API host TERPISAH: `GET https://auth.tiktok-shops.com/api/v2/token/get`
  (query `app_key`, `app_secret`, `auth_code`, `grant_type=authorized_code` — persis, bukan
  `authorization_code`) & refresh `GET .../api/v2/token/refresh` (`refresh_token`,
  `grant_type=refresh_token`). **PENTING:** path lama `/authorization/202309/{authorize,token,...}` di
  `open-api.tiktokglobalshop.com` SUDAH TIDAK VALID → `36009009 Invalid path` (verified). `open-api`
  hanya untk API bisnis (mis. `/authorization/202309/shops` valid, butuh sign). Respons token:
  `data.access_token/refresh_token/access_token_expire_in/...`. Access token ~7 hari; OAuthToken
  adapter menyimpan `shop_cipher` ekstra (bila ada; resolusi: option → credentials ext → token store).
- **Envelope sukses:** `{ code: 0, message, request_id, data }`; `code !== 0` = error → `TikTokError`.
- **Webhook:** payload JSON `{ event_type, timestamp, sign, data }`, header `X-TTK-SIGN` =
  `hex(HMAC-SHA256(app_secret, payload.timestamp + payload.sign))` — verify timing-safe (tts.webhook.ts).
  Event topik: ORDER_STATUS_CHANGE, PRODUCT_STATUS_CHANGE, RETURN_STATUS_CHANGE,
  CANCELLATION_STATUS_CHANGE, PACKAGE_UPDATE, RECIPIENT_ADDRESS_UPDATE.
- **Endpoint penting gateway:** order list POST `/order/202309/orders/search` (default window 7 hari),
  detail GET `/order/202507/orders?ids=`, produk: search `/product/202502/products/search` + detail
  `/product/202309/products/{product_id}`, inventory search `/product/202309/inventory/search` +
  update `/product/202309/products/{product_id}/inventory/update`, ship `/fulfillment/202309/orders/
  {order_id}/packages`, tracking `/fulfillment/202309/orders/{order_id}/tracking`, returns
  `/return_refund/202309/returns/search` + `/returns/{return_id}/approve|reject`, cancel
  `/return_refund/202309/cancellations`, finance `/finance/202309/payments`, promosi
  `/promotion/202309/activities/search`.
- `generated/**` (25 kategori `TikTok<Category>Api`) = hasil generate SDK user — **JANGAN edit langsung**;
  import-nya relatif `../../tts.client`/`../../tts.types`. ESLint meng-ignore `**/generated/**` (root config).
- Open/belum live-verify: butuh sandbox credentials TikTok (akses token ~7 hari) — belum tersedia.

---

## 7. Aturan TS yang ketat (harus dijaga)

`tsconfig.base.json` mengaktifkan:
- `strict`, `noUncheckedIndexedAccess` (akses array/index → `T | undefined`, wajib handle),
- `exactOptionalPropertyTypes`:
  - JANGAN assign `undefined` ke properti `optional` (`?: T`). Gunakan conditional spread:
    `...(x !== undefined ? { field: x } : {})`.
  - Param optional tetap boleh menerima `undefined` saat dipanggil.
- `moduleResolution: bundler`, target ES2022, `jsx: react-jsx`.

**Pola wajib utk `exactOptionalPropertyTypes`:** setiap field domain optional harus di-set
via conditional spread, TIDAK lewat `field: maybeUndefined`.

---

## 8. Build / typecheck / test — alur & jebakan

- Build root **serial**: `pnpm build` = `pnpm -r --workspace-concurrency=1 --sort build`
  (penting utk urutan DTS antar paket dependen — jangan ubah ke paralel).
- **Paket dependen wajib di-build dulu** sebelum typecheck paket yang bergantung padanya
  (declaration `dist/*.d.ts` dipakai). Setelah ubah kontrak di `connector`/`types`/`core`,
  build paket itu dulu:
  `pnpm --filter @opensellvy/connector build` lalu typecheck dependen.
- `pnpm -r typecheck` berhenti di paket pertama yang gagal → gunakan `pnpm -r run typecheck`
  (jangan `pnpm -r typecheck`, beda perilaku berhenti).
- `pnpm check` = typecheck + lint + build + test (semua harus 0 / hijau).
- Test paket: `vitest` (sudah di devDeps root). `pnpm --filter @opensellvy/<pkg> test`.
- `db-pg` battle tests butuh **Postgres nyata** berjalan (drizzle migrate dulu).

---

## 9. Convention commit & pelaporan kerja

Pola commit per-area: `feat(<area>): ...`, `fix(<area>): ...`, `chore(<area>)`, `docs(...)`, `refactor(...)`.

> **State terakhir (commit terbaru, jumlah test, posisi kerja):** lihat **`TODO.md` → STATE TRACKER**
> (dengan timestamp). AGENTS.md TIDAK menyimpan state yang berubah. Jangan copy-paste status
> sementara dari AGENTS/SKILLS ke tempat lain — source of truth hanya STATE TRACKER di TODO.

Roadmap & keputusan lengkap: **`TODO.md`** (WAJIB dibaca; update setelah tiap area selesai).

---

## 10. Rules kerja untuk AI/agen

1. **Eksplorasi dulu, menulis kode belakangan.** Pahami file terdampak + pola yang ada
   (baca file tetangga, cek package.json / tsconfig) sebelum edit apa pun.
2. **Ikuti pola yang ada** — jangan perkenalkan library/pola baru tanpa mengecek
   apakah sudah dipakai di repo.
3. **Jangan menambah komentar kode** kecuali diminta (kode self-documenting; docblock
   pada fungsi/interface publik diperbolehkan sesuai gaya yang ada).
4. **Selalu update `TODO.md`** setelah area selesai (status checklist, jumlah test, dll).
5. **Verifikasi setelah selesai:** jalankan `pnpm check` (atau minimal typecheck+lint+test utk area)
   sebelum dianggap selesai. Wajib typecheck paket dependen setelah ubah kontrak.
6. **Komit hanya saat diminta** — pakai pola `feat(<area>)` dst, jangan commit kredensial.
7. **Jangan buat file dokumentasi baru** (*.md) kecuali diminta; gunakan TODO.md / AGENTS.md.
8. **Satu gate dijaga**: jangan pernah import `@opensellvy/platform-*` dari module/sdk/api.
9. **Klarifikasi ambiguitas** daripada menebak — tapi usahakan temukan jawaban dari
   kode/TODO/docs dulu sebelum bertanya.
10. `TODO.md` dan `docs/` adalah sumber kebenaran keputusan; baca sebelum mengubah arah.

---

## 11. Langkah cepat menyalakan koneksi (fresh AI)

```bash
cat AGENTS.md docs/SKILLS.md TODO.md     # baca konteks penuh
git log --oneline -15                     # tahu posisi terakhir
git status -s                             # tahu file yang belum di-commit
pnpm check                                # tahu kalau baseline hijau/merah
```

Kemudian ikuti 10 — Rule 1: eksplorasi target area dulu.
