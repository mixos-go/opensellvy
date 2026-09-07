# OpenSellvy - Development Roadmap

> Omnichannel OMS SDK untuk platform ecommerce Indonesia (Shopee, TikTok Shop/Tokopedia, Lazada, Blibli).

## Status Legend

- `[ ]` Not started
- `[x]` Done
- `[~]` In progress
- `[!]` Blocked / needs decision

---

## STATE TRACKER (sumber status LIVE — update tiap akhir sesi kerja dengan timestamp)

> Bagian ini adalah satu-satunya tempat state/status yang berubah-ubah. AGENTS.md & SKILLS.md
> TIDAK menyimpan state — keduanya selalu menunjuk ke sini. Update blok paling atas + timestamp.

### `[2026-09-07 #6]` Pos: mana mana apps/auth (SSO) & apps/server (backend OMS) — "pembuatan penuh disini dulu" ✅

- **Keputusan:** iterasi full app DI MONOREPO dulu (`apps/*`); pisah ke SaaS terpisah setelah stabil (SDK
  `@opensellvy/*` sdh siap di-publish karena `"type":"module"` + `moduleResolution: bundler` + dist d.ts bersih).
- **Arsitektur (3 jenis):** `apps/auth` (SSO/RBAC shared, satu pintu) + `apps/server` (backend OMS, consume auth)
  + `apps/web` (frontend, nanti). Dibangun server & auth DULU, web menyusul (sesuai permintaan user).
- **`apps/auth`** (`@opensellvy/app-auth`, port 4100): service Hono SSO/RBAC.
  - `createAuthApp(config)` + `run.ts` (CLI). Routes `/health`, `POST /auth/{login,refresh,logout}`, `GET /auth/me`.
  - Auth service: `createAuthService(createPgAuthDeps(db, jwtSecret))` bila `databaseUrl`; fallback memory mode
    (user dev `dev@opensellvy.test`/`admin123`) tanpa DB — di-test.
  - Re-export helper: `memoryRefreshSessionStore`, `memoryAuthDeps`, `createAuthApp`, `createDatabase`.
- **`apps/server`** (`@opensellvy/app-server`, port 4200): backend OMS kompos `@opensellvy/api`.
  - `buildServerApp(config)` → `createServer(...)` dgn `sdk.open()` (repos Postgres) + `authService` dari
    `createPgAuthDeps` (JWT interoperable dgn apps/auth — SSO satu pintu via shared jwtSecret + DB sama).
  - `registerLocal()` (platform adapter) didaftarkan; `run.ts` CLI start.
- **Workspace:** `pnpm-workspace.yaml` + `apps/*`. **`pnpm check` HIJAU: test 244** (sebelumnya 242; apps/auth +2).
- **Catatan penting — versi dep:** apps/auth & apps/server wajib `drizzle-orm@^0.43.1` + `pg@^8.13.1` + `@types/pg`
  (SAMA dgn db/db-pg); versi lain (mis. 0.36) → type mismatch `ExtractTablesWithRelations` antar-paket.
- **Belum:** `apps/web` (frontend) — sesuai rencana dibuat setelah server & auth. Boot index.ts murni library;
  bootstrap lewat `run.ts`. CORS `buildApp` masih hardcode `'*'` (ApiConfig.corsOrigin belum diteruskan ke
  middleware — open item).

### `[2026-09-07 #5b]` Pos: query "toko milik seller" — `members.findByUser` + `users.listStoresForUser` ✅

- Lanjutan #5 (multi-store seller): `MemberRepository` port + `findByUser(userId)` — semua toko tempat seorang
  user menjadi anggota beserta role per toko (query sebaliknya dari `findByStore`).
- Impl di memory (`membersRepo.findByUser`) & db-pg (`membersRepo.findByUser` — query `store_members` by `user_id`).
- Service `users.listStoresForUser(userId)` di `@opensellvy/module` diexpose.
- Test: `user-audit.spec.ts` — seller anggota 2 toko (owner + admin), `findByUser` & `listStoresForUser` benar;
  user tanpa toko → `[]`. **`pnpm check` HIJAU, test 242** (module 54 +1).
- Notes: data relasi M:N sudah tersimpan sebelumnya di `store_members` (schema.ts) — hanya kini lookup by-user
  di-expose end-to-end (port → memory → db-pg → service).

### `[2026-09-07 #5]` Pos: auth internal (core/auth) ter-wire ke SDK (`sdk.auth`) — "auth, db kita" ✅

- **TTS + UI commit DONE:** `26ec291` (TTS) & `997c019` (ui shadcn) sudah di-push ke `main`.
- **Domain `User`** (`@opensellvy/types/domain/user.ts`): + `passwordHash?: string` (optional; scrypt hash,
  jangan di-expose publik). Non-breaking (optional field).
- **`@opensellvy/db-pg`:** `usersRepo.save` sekarang persist `password_hash` kolom (insert `?? ''`, conflict-update
  hanya bila hash di-set); `mapUser` mengembalikan `passwordHash` (conditional spread) → `findByEmail/findById`
  hasil karya core/auth.
- **`@opensellvy/sdk` wiring auth:**
  - `config.ts`: `AuthConfig` baru (`jwtSecret` + issuer/audience/TTL optional) di `OpenSellvyConfig.auth`.
  - `sdk.ts`: `OpenSellvyOptions.authSessions?: RefreshSessionStore`; **`sdk.auth`** (getter, lazy, cache) →
    `buildAuthService(config.auth, repos, sessions)`. repos default: `createMemoryRepositories()` bila tanpa
    provider (SDK kini memegang instance — sebelumnya repos memory dibuat internal di module). Session store:
    option → Postgres (`createPgRefreshSessionStore`, lazy import) bila `databaseUrl` → memory.
  - `auth.ts` (baru): `buildAuthService` adapter `findUserByEmail`/`getMemberRole` dari port repositories
    (DB-agnostic) + `createMemorySessionStore`; diexport via `@opensellvy/sdk` main entry.
  - Error tanpa jwtSecret: `AUTH_NOT_CONFIGURED`.
- **Intregasi API (pemakai):** `createServer({ jwtSecret }, { services: sdk.modules, registry: sdk.connectors,
  authService: await sdk.auth })` → endpoint `POST /api/auth/{login,refresh,logout}` + verifikasi bearer JWT.
- **Test:** sdk 8 (tambah 2: login/refresh/verify/logout owner via memory repos + error AUTH_NOT_CONFIGURED).
  **`pnpm check` PENUH HIJAU (EXIT=0): test 241** (core 50 · connector 10 · module 53 · api 21 · db-pg 15 ·
  sdk 8 · local 4 · shopee 46 · TTS 34).
- **Belum/terbuka:** domain `User` tanpa hash tapi di-simpan via module `users.createUser` (tidak set hash —
  untuk saat ini user login dibuat via repos/seed langsung yang set `passwordHash`); belum ada seed auth;
  blok scrypt N=2^14 (bisa naik); `users.ts` service belum terima passwordHash sebagai input.

### `[2026-09-06 #4]` Pos: `@opensellvy/ui` aktif dengan shadcn (60 primitives) + daftar platform (lazada/blibli "Soon") ✅

- **TTS commit + push DONE:** `26ec291` `feat(platform-tts-tokopedia): ...` (47 file, 18110+) — push
  `ed1788a..26ec291 → main`. Blok #3 di bawah sdh valid (state "Belum di-commit" sudah teratasi).
- **UI package diaktifkan** (sebelumnya kosong/stub 14 file 0-byte). Stack: **shadcn/ui via CLI**,
  Tailwind v4, React 19 (dev) / peer `^18.2 || ^19`, tsup (esm+dts).
  - `components.json` (style new-york-v4, baseColor neutral, css-variables, lucide).
  - **60 primitives shadcn** di-`add` via CLI (`pnpm dlx shadcn@latest add <60 n> --yes`).
    Catatan: `add --all` GAGAL — style registry new-york-v4 TIDAK punya `questionnaire`, `data-table`,
    `date-picker`, `toast`, `typography` (404 di registry; `toast` diganti `sonner`). List diambil dari
    sitemap, dicross-check HTTP 200 per-item → 60 yang ada di-add.
  - **Campuran radix + base-ui:** komponen klasik (button, card, ...) radix (`radix-ui`); komponen baru
    (item, field, bubble, combobox, ...) dari `@base-ui/react` + `@shadcn/react` + package `cn`.
  - Import alias `@/` DI-REWRITE ke relatif (`rs` per-file → rel ke `src/`) agar dist d.ts bersih utk
    consumer. `tsup.config.ts` = esbuild alias `@: srcDir` (safety); external react/react-dom.
  - **Fix shadcn utk strict TS (`exactOptionalPropertyTypes`):** context-menu/dropdown-menu/menubar
    `checked` → conditional spread `{...(checked !== undefined ? { checked } : {})}`; slider
    `value/defaultValue` → conditional spread; sonner `NonNullable<ToasterProps["theme"]>`. Lint: combobox
    `children` unused → dihapus dari destructure (jangan diulang kalau regenerate).
  - `src/styles/globals.css` = theme shadcn v4 (oklch, neutral); di-copy ke `dist/globals.css`;
    subpath export `@opensellvy/ui/styles.css`.
- **Komponen baru:** `src/components/platforms/PlatformsSection.tsx` → `PlatformsSection` + `PLATFORMS`
  (meta 5 platform dari `PlatformCode`; **lazada & blibli status `soon` → badge "Soon"** (card dashed,
  opacity), shopee/tts-tokopedia/local → badge "Ready"). Data display-name di UI (types hanya punya
  PlatformCode). Export barel: `src/index.ts` → components/ui + platforms + hooks + `cn`.
- **`pnpm check` PENUH HIJAU:** typecheck 14 paket · lint 0 · build serial · test 239 (core 50 ·
  connector 10 · module 53 · api 21 · db-pg 15 · sdk 6 · local 4 · shopee 46 · TTS 34). UI belum ada test
  (`--passWithNoTests`).
- **Belum dilakukan:** `init` CLI tidak bisa di package library (butuh framework Next/Vite) → komponen + theme
  dibuat via `add` + file infra manual. Preview app (vite) utk lihat UI belum ada. Stub kosong lama
  (DataTable/OrderStatusBadge/PlatformIcon/hooks/useOrder/useProduct/providers) dibiarkan 0-byte.
- **TODO berikutnya:** commit UI (`feat(ui): ...`); lanjut fill stub komponen (DataTable, OrderStatusBadge,
  PlatformIcon, providers/Auth+Theme); demo/vite preview bila diminta; implement lazada/blibli adapter.

### `[2026-09-06 #3]` Pos: TTS adapter LIVE-VERIFIED terhadap sandbox TikTok Shop nyata (app key `6kr44ku4st6in`) ✅

- **TERVERIFIKASI LIVE (2026-09-06):** OAuth + gateway pemakai sandbox TikTok Shop nyata. Shop sandbox:
  id `7494761533788751648`, cipher `ROW_Uq7ryQAAAADpBClD_WS8ZR3BUK2LSSiv`, region ID, seller_type LOCAL,
  nama `SANDBOX_ID7650204809157461780`. Access+refresh token tersimpan di
  `packages/platform-tts-tokopedia/.local/tokens.json` (gitignored, jangan di-commit).
- **PENEMUAN PENTING — flow OAuth generasi lama MATI:** `/authorization/202309/{authorize,token,token/refresh}`
  di `open-api.tiktokglobalshop.com` → **`36009009 Invalid path`** (verified). Flow SAAT INI (verified live):
  - Authorize page (browser, TANPA sign, HTTP 200 utk app_key nyata):
    `https://services.tiktokshop.com/open/authorize?app_key=...&path=<redirect>&state=...`
  - Token exchange: `GET https://auth.tiktok-shops.com/api/v2/token/get`
    (`app_key`, `app_secret`, `auth_code`, `grant_type=authorized_code` — persis, bukan authorization_code).
    Verified: `36004004 invalid auth code` (endpoint valid).
  - Refresh: `GET https://auth.tiktok-shops.com/api/v2/token/refresh`
    (`refresh_token`, `grant_type=refresh_token`). Verified: `36004005` (endpoint valid).
  - `open-api` HANYA utk API bisnis (mis. `GET /authorization/202309/shops` valid, butuh sign;
    dipakai utk enumerate shop + resolve `shop_cipher`).
- **Perubahan kode:** `tts.auth.ts` ditulis ulang ke flow baru (no sign di authorize/token); **auto-resolve
  `shop_cipher`** ditambahkan — `shopCipherOf`: option → credentials ext → token store → fallback
  `authorization.getAuthorizedShops` (token-level, tanpa cipher) lalu persist ke token store;
  `shop.getProfile` pindah dari `seller.getActiveShops` (butuh cipher) ke `authorization.getAuthorizedShops`
  (token-level, tanpa cipher) — sebelumnya gagal `36009004 shop_cipher not required`.
- **Live gateway result:** getProfile ✅ data nyata; order.pull 0; product.pull 0; returns 0; payment 0
  (sandbox KOSONG — bukan error); shipping.getRates skip (script butuh `service_id` param). Semua call
  shop-scoped dieksekusi benar (tandanya cipher auto-resolve jalan).
- **Test TTS: 34** (tts.connector 14 — getProfile pakai bentuk respons nyata + test auto-resolve cipher
  sekali-fetch; tts.auth 6 — alamat baru + no-sign + GET; total bertambah dari 32). **`pnpm check` PENUH
  HIJAU (EXIT=0): typecheck 14 paket · lint 0 · build serial · test 239 total**
  (core 50 · connector 10 · module 53 · api 21 · db-pg 15 · sdk 6 · local 4 · shopee 46 · TTS 34).
- Script debug `scripts/fetch-shops.ts` (meng-embed app_secret) DIHAPUS. `scripts/auth-flow.ts` &
  `live-gateway.ts` tetap (baca kredensial dari `.local/`).
- **Open item:** sandbox kosong → belum ada data order/product utk uji mapper kaya; aktifkan/lakukan loop
  tester utk data real bila perlu. `media.list` no-op best-effort. `shipping.getRates` butuh `service_id`.
  Perlu refresh token ~7 hari (expire_time cek sebelum pakai). Belum di-commit.
- **TODO berikutnya:** commit area TTS (`feat(platform-tts-tokopedia): OAuth flow terbaru + live-verify
  sandbox`); lanjut lazada/blibli stub; re-verify merchant Shopee (token expired).

### `[2026-09-06 #2]` Pos: platform TTS-Tokopedia (TikTok Shop) adapter SELESAI — `pnpm check` penuh hijau 237 test ✅

- **Adapter `@opensellvy/platform-tts-tokopedia` IMPLEMENTASI LENGKAP** dari SDK user
  (repo `mixos-go/tiktok-shop`, vendor ke repo). `tts-tokopedia` = TikTok Shop, `'tts-tokopedia'` masuk `PlatformCode`.
- **Struktur baru `packages/platform-tts-tokopedia/src/`:** `tts.client.ts` (HMAC-SHA256 signing +
  common params + `x-tts-access-token` header + envelope normalisasi `TikTokError`, dari SDK user),
  `tts.auth.ts` (`buildAuthUrl`/`exchangeAuthCode`/`refreshAccessToken`, token access ~7 hari),
  `tts.types.ts` (kredensial/error/envelope), `tts.mapper.ts` (`mapOrder`/`mapProduct`/`mapReturn`
  toleran), `tts.webhook.ts` (verify HMAC `X-TTK-SIGN` atas `timestamp+sign` body, timing-safe + map
  normalisasi), `tts.connector.ts` (createTtsPlugin + TtsApi facade 25 kategori + gateway lengkap:
  shop/order/product/inventory/fulfillment/returns/shipping/payment/promotion/finance/media/merchant +
  OAuth+tokenStore+auto-refresh + registerTts + `ttsPlugin`), `generated/**` (25 kategori dari SDK user,
  import disesuaikan `../../tts.client`/`../../tts.types`), `index.ts` export semua. `package.json`
  description → "TikTok Shop connector plugin".
- **Fix penting:** `updateInventoryBySku` sebelumnya no-op → kini closure `updateInventory` real
  (inventorySearch resolve product_id/warehouse → `product.updateInventory`). `TikTokClient`
  dirapikan utk `exactOptionalPropertyTypes` (conditional spread). `tts.mapper` signature `money`
  diperbaiki cast currency. Dead code `clientForPlatform`/`updateInventoryBySku` lama dihapus.
- **ESLint:** root `eslint.config.js` + ignore `**/generated/**` (kode generated/vendored tidak di-lint) —
  semua paket lain tidak terpengaruh (shopee/tsx generated tetap plain-lint).
- **Test baru TTS: 32 test** (6 file): `conformance.spec.ts` (assertNoStubMethods kosong),
  `tts.connector.spec.ts` (13: getProfile/pullOrders/since-filter/pullProducts/inventory.sync 2-calls/
  getStockLevels/returns.list/promotion.list/payment.list/getRates/fulfillment.ship/order.track/
  api-facade 25 kategori+header), `tts.client.spec.ts` (4: sign query GET/POST body+sign/error
  envelope/beforeRequest), `tts.auth.spec.ts` (5: authorize URL+sign/token exchange/refresh/sign vektor),
  `tts.mapper.spec.ts` (4), `tts.webhook.spec.ts` (5: verify HMAC true/false/object payload + map).
- **`pnpm check` PENUH HIJAU (exit 0):** typecheck 14 paket 0 · lint 0 · build serial sukses ·
  test **237 total**: core 50 · connector 10 · module 53 · api 21 · db-pg 15 (Postgres nyata) ·
  sdk 6 · platform-local 4 · platform-shopee 46 · **platform-tts-tokopedia 32**.
- **Open item:** live-verify TikTok Shop butuh sandbox/partner credentials user (BELUM diberikan).
  `media.list` return `[]` (no-op best-effort, TTS tidak sediakan media list). `shipping.getRates`
  pakai `getShippingProviders` yang butuh `delivery_option_id` path param — best-effort.
- **TODO berikutnya:** live-verify TTS saat kredensial tersedia; implementasi lazada/blibli stub
  mengikuti pola shopee+TTS; re-verify merchant Shopee butuh token baru (expired).

### `[2026-09-06]` Pos: SDK+enforcement+expand domain COMPLETED & COMMIT `4ea9d39` — Shopee referensi selesai, `pnpm check` penuh hijau 203 test ✅

- **COMMIT `4ea9d39`** telah dibuat (44 files, +1816/−144): `feat(sdk,connector,platform-shopee)` — berisi
  transform `opensellvy` → `@opensellvy/sdk`, enforcement capability-driven, expand gateway domain universal
  (finance/merchant/shop), gateway Shopee lengkap, docs. Semua yang sebelumnya "belum commit" kini ter-commit.
- **Expansi kontrak (dari sesi lalu, kini ter-commit):** `@opensellvy/types` + `FinanceOverview/WalletTransaction/
  FinanceStatement/Payout/PayoutInfo/FinanceQuery` & `MerchantWarehouse/MerchantShop/ShopSettings`; `PlatformGateway`
  + domain `finance` (overview/transactions/statement/payoutInfo), `shop` + getSettings/setHolidayMode/listWarehouses,
  `merchant` + listShops/listWarehouses/listWarehouseLocations; capability `finance.read`/`merchant.read`/`shop.settings`
  + `CAPABILITY_METHODS`. Module: `finance` service via `withChannel`. API: `finance.controller.ts` + 4 route.
- **Shopee sebagai referensi — unit test domain baru SELESAI:** `shopee.connector.spec.ts` +11 test
  (shop.getSettings/setHolidayMode/listWarehouses, finance.overview/transactions/statement/payoutInfo,
  merchant.listShops/listWarehouses/listWarehouseLocations) → **44 test shopee hijau** (sebelumnya 33).
  `live-gateway.ts` diperluas +10 check utk domain baru.
- **Live-verify sandbox:** sesi lalu token `6d7357…` valid → `get_escrow_list`/`promotion.list`/`listShipments` dll
  200 `[]`, finance/merchant endpoint sukses. **Sekarang token dah EXPIRED** (valid ~4 jam): SEMUA shop-API konsisten
  HTTP 403 (yang tampak ✅ hanya yg punya fallback try/catch). **Butuh token BARU dari Test Tool console** utk
  re-verify `finance.overview`, `finance.transactions`, `shop.getSettings` (satu-satunya yg belum terbukti 200).
- **`pnpm check` PENUH HIJAU (exit 0):** typecheck 14 paket 0 · lint 0 · build serial sukses · test **203 total**:
  core 50 · connector 10 · module 53 · api 21 · **db-pg 15 (Postgres nyata, migrate otomatis)** · sdk 6 ·
  platform-local 4 · platform-shopee 44. (db & ui tanpa test file.)
- **OAuth flow + live-verify TUNTAS (tambahan session):**
  - **`auth-flow.ts` BARU (script di root package shopee):** generate URL authorize (`redirect=app.example.com/
    callback`) → tukar code yang di-paste (`auth/token/get`) → simpan token ke `.local/tokens.json` · mode `refresh`
    (pakai refresh_token). `.local/` masuk `.gitignore` (aman commit). Script npm: `pnpm --filter @opensellvy/
    platform-shopee auth`.
  - **`live-gateway.ts` kini auto-load token dari `.local/tokens.json`** + auto-refresh bila expired (tanpa paste token lagi).
  - **BUG FIX nyata di `shopee.client.ts`:** POST sebelumnya meng-copy `params` ke query string (DAN body) →
    Shopee balas `error_sign`/`Invalid timestamp` utk `auth/token/get` (verified via raw fetch: body-only = 200,
    dup-query = error_sign). Kini POST = params HANYA di body JSON (sesuai AGENTS §6), GET tetap di query. Test
    POST diperkuat (`code` tidak boleh ada di query). **44 test shopee tetap hijau.**
  - **Live-verify 23/23 tuntas** dgn token valid (sebelumnya 3 pending → kini 200): `shop.getSettings` ✅
    `{holidayMode:false,...}`, `finance.overview` ✅ `{}`, `finance.transactions` ✅ `[]`. ✅ lain yg sukses: getStockLevels,
    listShipments, payment.list, promotion.list, media.list, finance.statement/payoutInfo, merchant.*. ⚠️ legitimate
    (fake ID utk detail): getShipment/tracking, payment.get/refund, promotion.get/update/setActive, returns.act.
    `shop.listWarehouses` masih `error_param` (butuh `merchant_id` di query) — open item kecil. `inventory.adjust`
    `.slice` = artefak diagnostic script (repro isolasi `adjust([])` = OK, conformance PASS).
- **Merchant API + OAuth round-trip (tambahan session):**
  - **`auth-flow.ts`** (script `auth` pakai `npx tsx auth-flow.ts`): generate URL authorize (`redirect=
    app.example.com/callback`, TTD 5 menit — generate sesaat sebelum buka) → tukar code → simpan token di
    `.local/tokens.json` (gitignored, `.local/`). `live-gateway.ts` auto-load + auto-refresh dari refresh_token.
    ✅ Terbukti live: `auth/token/get` berhasil (access+refresh token dari code).
  - **BUG FIX `shopee.client.ts`:** POST sebelumnya meng-copy params ke query (DAN body) → Shopee balas
    `error_sign`. Kini POST = params HANYA di body JSON (AGENTS §6), GET tetap di query. Test POST diperkuat.
  - **Merchant endpoints (`/api/v2/merchant/*`) perlu merchant-level access token** — verified live: shop-sign
    + merchant_id di query = `error_sign`; merchant-sign + shop token = `invalid_access_token`; merchant_id di
    body = `error_param`. Token kita hasil shop-auth punya `merchant_id_list: []`. Solusi ter-implementasi:
    `PlatformCredentials` + `merchantId` + `merchantToken` (additive), client + apiType `merchant` (base sign
    `pid+path+ts+access_token+merchant_id`, common params + `merchant_id`), gateway merchant/shop.listWarehouses
    pakai merchant signing saat kredensial merchant ada, graceful `[]` bila tidak. **46 test shopee** (+2 sign),
    **`pnpm check` PENUH exit 0, 205 test**.
  - **Open item:** full live-verify merchant endpoints butuh merchant-level access token (dari app/authorization
    merchant) — belum tersedia di sandbox test akun ini.
- **TODO berikutnya:** implementasi platform berikutnya (tts-tokopedia/lazada/blibli) MENGIKUTI pattern shopee
  (client body-only POST + merchant apiType + mapper + conformance + auth-flow + live-gateway).

### `[2026-09-03]` Pos: `@opensellvy/sdk` + enforcement capability-driven + gateway Shopee LENGKAP + docs universal ✅ (belum commit)

- **Keputusan user (session ini):**
  1. Transformasi umbrella `opensellvy` → **`@opensellvy/sdk`** (bundle SEMUA package non-platform) ✓.
  2. Wajibkan SEMUA method gateway terimplementasi → **capability-driven enforcement** ✓.
  3. Complete-kan impl gateway Shopee yg belum (payment/promotion/media/inventory/shipping/returns:cancel),
     **implementasi nyata + siap live-verify sandbox** ✓.
  4. **Checklist universal per-platform** + **dokumentasi pattern** ✓.
- **`@opensellvy/sdk` (BARU, example: dir `packages/opensellvy` → `packages/sdk`):** main entry `src/index.ts`
  re-export `@opensellvy/types` + `OpenSellvy`/`defineConfig`/errors; **subpath export** `./connector ./module
  ./api ./core ./db ./db-pg` (collision-free, masing-masing `export *`). `dependencies`: types/core/connector/
  module/api/db/db-pg (workspace:*). Salah satu `@ts-expect-error` di `sdk.ts` dihapus (db-pg kini dep keras).
  Referensi diupdate: root `package.json` (`"@opensellvy/sdk": "workspace:*"`), `examples/local-gate.mts`,
  `README.md`, `AGENTS.md` (struktur + §3.10 + arah dependency), `docs/architecture.md`.
- **Enforcement capability-driven (`@opensellvy/connector` — additive, bukan breaking utk ada adapter):**
  - `src/capabilities.ts` BARU: `NotImplementedError` (sentinel), `CAPABILITY_METHODS` (capability→domain
    gateway) = checklist universal, `collectRequiredMethods`, `assertCapabilitiesImplementable`,
    `assertNoStubMethods` (helper conformance utk dipanggil tiap adapter test).
  - `registerPlatform()` kini memvalidasi: capability terdeklarasi wajib punya domain gateway non-kosong
    (lempar `RegisterError` bila tidak). Index `connector` mengekspor capabilities.
- **Gateway Shopee LENGKAP (`platform-shopee`):** semua 14 method yg tadinya `notImplemented` kini real
  via `client.request`: inventory getStockLevels (`get_item_list`+`get_model_list`)/adjust (`update_stock`),
  shipping listShipments (`get_order_list`) / getShipment (`get_tracking_info`), payment list/get/refund
  (escrow), promotion list/get/update/setActive (discount), media upload (`upload_image`)/list(`[]`),
  returns.act:cancel (`cancel_dispute`). Helper `notImplemented` kini throw `NotImplementedError`.
  `capabilities` ditambah `promotion.sync` + `media.manage`. `tests/conformance.spec.ts` BARU
  (`assertNoStubMethods` PASS). **33 test hijau.**
  - **Live-verify:** `live-gateway.ts` siap (`SHOPEE_ACCESS_TOKEN` env-only, jangan commit). Token env TIDAK
    tersedia di env ini → live verify BELUM dijalankan; jalankan saat token ada.
- **Docs:** `docs/connectors/_UNIVERSAL.md` (pattern + checklist universal per capability + enforcement +
  aturan maintenance) + `docs/connectors/shopee.md` (pemetaan capability→endpoint referensi). Fix `*/` di
  docblock capabilities.ts (premature comment close).
- **Test & build (non-db-pg hijau):** core 50 · connector 10 · module 53 · api 21 · sdk 6 · platform-local 4 ·
  platform-shopee **33** = **177** (db-pg 15 butuh Postgres). Full monorepo **typecheck 0** (14 paket) & **build
  serial sukses** (exit 0). Lint paket yg diubah hijau.
- **Belum commit** (user belum minta). TODO berikutnya: live-verify shopee dgn token (jalankan `live-gateway.ts`),
  lalu `pnpm check` penuh (termasuk db-pg dgn Postgres), lalu commit sekali bila diinginkan.

### `[2026-09-03]` Pos: API internal di-scale penuh — module platform-sync + REST expose grouped `PlatformGateway` ✅ (belum commit)

- **Konteks (keputusan user):** kontrak gate sudah di-scale (grouped-by-domain). Sekarang API internal (module + REST)
  dibuat memakai SEMUA method grouped `PlatformGateway`, sehingga (a) kontrak terverifikasi ter-exercise & (b) menjadi
  **pattern implementasi platform berikutnya** (TikTok/Lazada/Blibli) yang tinggal generate client → mapping → isi gateway.
- **Module OMS (`@opensellvy/module`, additive, semua push/pull via helper toleran `withChannel`):**
  - `payment`: `listForStore(storeId, platform?)`, `getRemote(storeId, platform, paymentId)`, `refundViaPlatform(storeId, platform, paymentId, amount)`
  - `promotion`: `syncFromPlatform(storeId, platform)` → `{pulled}`, `pushToPlatform(storeId, platform, promotionId)`, `setActiveRemotely(storeId, platform, promotionId, active)`
  - `shipping`: `getRatesFromPlatform(storeId, platform, request)`
  - `order`: `trackRemote(storeId, platform, orderId)`, `getRemote(storeId, platform, platformOrderId)`
  - `product`: `listCategories(storeId, platform, parentId?)`, `pushUpdate(storeId, platform, productId, patch)`
  - `inventory`: `getStockLevelsRemote(storeId, platform, skus)`, `adjustRemote(storeId, platform, adjustments)`
  - `channel`: `updateProfile(storeId, platform, patch)`, `refreshToken(storeId, platform)`
  - `fulfillment`: `handover` kini juga dorong `gateway.fulfillment.ship` (ship ke platform, toleran)
- **REST API (`@opensellvy/api`)** — controller baru `platform.controller.ts` (15 handler) + 15 route
  (`/api/stores/:storeId/platforms/:platform/...`): profile PATCH, token refresh, payments list/get/refund,
  promotions sync/push/setActive, shipping rates, order tracking + get remote, categories, product update,
  inventory levels + adjust. Semua `bearerAuth`, pola Router→Controller→service.
- **Keputusan yang di-resolve:** `UnifiedProduct` TIDAK punya `platformProductId` → `product.pushUpdate` pakai id lokal.
  `repos.promotions` TIDAK punya `findById` → `syncFromPlatform` cek via `list(storeId)`. `trackRemote` butuh order lokal
  (throw 500 bila tak ada); `getRemote` pakai `withChannel` (404 bila tak terhubung).
- **FIX bug:** `module/src/impl/deps.ts` — deklarasi `refreshAndPersist` ketinggalan saat insert `withChannel` → dipulihkan.
- **Test hijau (jaket non-db-pg):** core 50 · connector 10 · module **53** · platform-local 4 · platform-shopee 32 ·
  api **21** · opensellvy 2 = **172** (db-pg 15 butuh Postgres real). Typecheck 0 semua 14 paket, lint 0, build serial sukses.
- **Belum commit** (user belum minta).

### `[2026-09-03]` Pos: RESTRUKTURISASI `PlatformGateway` → grouped-by-domain (breaking) — semua hijau ✅ (belum commit)

- **Keputusan user (final):** scale sisi gate ✓ → perluas jadi **platform-agnostic** (bisa dipakai banyak platform, bukan hanya Shopee) ✓ → tambah **semua method sekaligus** (jangan bolak-balik) ✓ → **grouped-by-domain**, masukkan method penuh & detail + yang Shopee-spesifik sekalipun ✓.
- **Baseline test saat ini:** core 50 · connector 10 · platform-shopee 32 · module 33 ·
  platform-local 4 · api 10 · opensellvy 2 = **141 test** hijau (db-pg 15 butuh Postgres real — tidak dijalankan).
  Semua typecheck 0, lint 0, build serial sukses.
- **KONTAK `@opensellvy/connector` DIUBAH (breaking, sengaja) — `PlatformGateway` tidak lagi flat, sekarang grouped-by-domain:**
  - `packages/connector/src/base.connector.ts` → **11 domain**: `shop`, `order`, `product`, `inventory`,
    `fulfillment`, `returns`, `shipping`, `payment`, `promotion`, `media`, `merchant` (method detail,
    platform-agnostic). `Capability` diperluas (`payment.read`, `shipping.rate`, `category.read`, `media.manage`).
    Tipe lama (`UnknownOrderPatch`, `ReturnAction` → kini `'approve'|'reject'|'receive'|'refund'|'cancel'`,
    `PlatformShopProfile`) dipertahankan dalam file. `connector/tests/register.spec.ts` helper `dummyGateway`
    diupdate ke shape grouped.
  - Kategori Shopee-spesifik (ads/ams/media/video/dsb) TIDAK masuk kontrak umum — tetap eksklusif via
    `plugin.api(ctx)` (facade 444). Kategori universal (order/product/logistics/payment/returns/discount/voucher/shop)
    masuk kontrak generik. **Scale puluhan platform = kontrak bersih + kategori spesifik tetap via api accessor.**
- **types (`packages/types/src/domain/platform.ts` BARU):** `CategoryReference`, `ShopProfilePatch`, `MediaAsset`,
  `MerchantProfile`, `Voucher`, `Discount`, `FlashSale`; terdaftar di index.ts.
- **Pemindahan SEMUA implementer ke grouped:**
  - `platform-shopee/src/shopee.connector.ts` — gateway grouped penuh (shop/order/product/inventory/fulfillment/
    returns/shipping real via client.request; payment/promotion/media/merchant → notImplemented/empty),
    `capabilities` diperluas, `notImplemented(name)` + helper `shopAcc(context)`/`clientFor`. **Typecheck 0.**
  - `platform-local/src/local.connector.ts` — grouped, perilaku store-backed dipertahankan (4 test hijau).
  - 3 stub (`platform-{tts-tokopedia,lazada,blibli}`) — grouped gateway not-implemented/empty (typecheck hijau).
  - `module` — 5 file impl (`channel/product/order/inventory/return.ts`) + tests helper pindah ke grouped (33 test hijau).
  - `api/tests/api.spec.ts` — `dummy` plugin dipindah ke shape grouped (10 test hijau).
- **Catatan migrasi:** test/live-e2e/api dummy pakai skema `plugin.gateway.shop.getProfile`, `gateway.order.pull`,
  `gateway.product.pull`, `gateway.inventory.sync` (BUKAN flat `getShop`/`pullOrders`/`pullProducts`/`syncInventory`).
  **PENTING:** `module` dan adapter harus di-`build` dulu sebelum test paket dependen (api/module) yang meng-import dari `dist` —
  `dist` stale memunculkan `Cannot read properties of undefined (reading 'getProfile')`.
- **Fix lint (unused args):** `inventory.getStockLevels(_context,_skus)`, `inventory.adjust(_context,_adjustments)`,
  `shipping.getRates(context,_request)`.
- **Belum commit** (user belum minta). Bukan hanya skala 29 kategori — sekarang kontrak siap scale BANYAK platform.
- **TODO berikutnya:** verifikasi live ulang via `scripts/live-e2e.ts` (perlu update ke grouped call — sudah dilakukan,
  `plugin.gateway.shop.getProfile`/`order.pull`/`product.pull`; jalankan dengan env creds + `ACCESS_TOKEN=...624567`),
  lalu `pnpm check` penuh (termasuk db-pg dgn Postgres real), lalu commit sekali.

Previous entry (still valid, prior state):

### `[2026-09-03]` Pos: OAuth+TokenStore+auto-refresh + PILOT LIVE GATEWAY Order+Product ✅ (belum commit)

- **Baseline test saat ini:** core 50 · connector 10 · platform-shopee **32** · module 33 ·
  platform-local 4 · api 10 · db-pg 15 · opensellvy 2 = **156 test** hijau. platform-shopee typecheck 0, build sukses.
- **DIBANGUN (UNCOMMITTED) — OAuth connect utuh + TokenStore + auto-refresh, TANPA ubah kontrak `@opensellvy/connector`:**
  - `packages/platform-shopee/src/shopee.connector.ts`:
    - `ShopeePluginOptions` baru: `tokenStore?` (default `createMemoryTokenStore()` dari connector),
      `autoRefresh?` (default true), `refreshBeforeMs?` (default 5 menit), `accessToken?`/`shopId?` (dev quick-start).
    - `validToken(context)` — muat token dari TokenStore → bila autoRefresh & token punya refreshToken
      & (expiresAt lewat/tinggal < refreshBeforeMs) → `auth.refreshToken()` → persist token fresh ke store.
    - `auth.exchangeCode(context, code)` persist token (access+refresh) ke TokenStore per seller
      (`storeId` + platform) → desain produksi "otorisasi sekali, refresh otomatis".
  - `packages/platform-shopee/src/shopee.mapper.ts` — `mapProduct` kini toleran format `get_item_base_info`
    (`item_list[].image.image_url_list`, `price_info`, tanpa `models`) + tetap dukung shape lama (`image:Array<{url}>`,
    `models`, `price`). `ShopeeItemInfo.image` diperluas jadi union object|array.
  - **SCALE KE SEMUA KATEGORI:** `shopee.connector.ts` + `index.ts` tambah tipe `ShopeePlugin = PlatformPlugin & ShopeeApiAccessor`
    dan accessor `plugin.api(context): Promise<ShopeeApi>` → facade **29 kategori / 444 API** ter-bind (client + accessToken valid
    + auto-refresh + shopId dari context) & `plugin.client(context)`. Konsumen dapat memanggil SEMUA API Shopee (bukan hanya
    ~10 method gateway). Kontrak `PlatformPlugin` tetap utuh (additive extension).
  - `packages/platform-shopee/scripts/live-e2e.ts` — script uji live via JALUR GATEWAY
    (`getShop`/`pullOrders`/`pullProducts`); input `REFRESH_TOKEN` | `CODE` | `ACCESS_TOKEN`.
  - `packages/platform-shopee/tests/shopee.connector.spec.ts` — +4 test (OAuth persist: exchangeCode simpan token,
    auto-refresh saat kadaluarsa+persist, dev quick-start; api accessor: facade 29 kategori). **32 hijau.**
- **PILOT LIVE SANDBOX (access token `...E624567`, shop `227844766`, OpenSANDBOX1132...):**
  - `getShop` ✅ → platformShopId `227844766`, shopName `OpenSANDBOX1132559f068d6259ec8`, region `ID`.
  - `pullOrders` ✅ → 1 order `2609021H4790MP`, status `completed`.
  - `pullProducts` ✅ → 1 product `TEST PRODUK` (0 varian — base_info tanpa models; model-level via get_model_list).
  - **Catatan fix saat live:** `get_item_list` WAJIB `item_status` (Required) → `error_unknown` tanpa itu;
    endpoint detail item = **`get_item_base_info`** (BUKAN `get_item_detail` — 404), `item_id_list` pakai **koma** (bukan `[a b]`).
- **Verifikasi:** 31 test hijau · typecheck 0 · build sukses · **kontrak `@opensellvy/connector` TIDAK tersentuh**
  (git diff connector kosong — satu gate dijaga, syarat "work tanpa ubah gate/kontrak" TERPENUHI).
- **Belum di-commit** (user belum minta). Kontrak inti tidak berubah; hanya opsi internal plugin + mapper + script + test.
- **TODO berikutnya:** scale semua kategori (29) via jalur gateway (Order/Product sudah teruji live);
  prioritas berikut sesuai §4.1.1 hardening (syncInventory, pullOrders multi-order+pagination, updateOrder logistics channel).

### `[2026-09-03]` Pos: generator Shopee API (444) — pilot Order+Product hijau (belum commit)

- **Baseline test saat ini:** core 50 · connector 10 · platform-shopee 27 · module 33 ·
  platform-local 4 · api 10 · db-pg 15 · opensellvy 2 = **151 test** (dari baseline 149;
  +3 generated.spec, tapi 1 test auth masih merah — lihat catatan).
- **DIBANGUN (UNCOMMITTED) — generator typed client 444 API Shopee:**
  - `packages/platform-shopee/scripts/generate-api.ts` — generator TS (parse 444 doc → emit).
    Output per-kategori: `src/generated/<category>.ts` (class `ShopeeApi<Category>` + `Req_*`/`Res_*`)
    + `src/generated/index.ts` (interface `ShopeeApi` + `createShopeeApi(client, opts)` facade,
    29 kategori) + `src/generated/_shared.ts` (ShopeeApiType/ShopeeApiOptions/ShopeeResp).
  - **Keputusan bentuk (user):** class per kategori + factory `createShopeeApi`.
  - **Nested response** dibangun pakai **boundary rule** (object/object[] membuka scope anak
    sampai object/object[] berikutnya) + **dedup nama** di scope yg sama (doc flat TIDAK punya
    sinyal depth: tanpa indentasi/sedikit depth → reconstruction penuh tak mungkin; user pilih
    boundary+dedup). Method return `Promise<Res_*>` (ShopeeClient.request sudah unwrap `response`,
    jadi tipe data langsung, bukan wrapper).
  - `package.json` → script `generate: tsx scripts/generate-api.ts` + devDep `tsx`.
  - `src/index.ts` → ekspor `createShopeeApi`, `type ShopeeApi`, `ShopeeResp`, `ShopeeApiOptions`.
  - `tests/generated.spec.ts` — pilot Order+Product (stub fetch): path/sign/param + facade. **3 hijau.**
- **Verifikasi:** `pnpm --filter @opensellvy/platform-shopee typecheck` 0 · `build` sukses
  (dist 218KB) · kontrak `@opensellvy/connector` **TIDAK tersentuh** (satu gate dijaga).
- **MASIH MERAH (pre-existing, bukan dari generator):** `shopee.auth.spec.ts:55` — ekspektasi
  `partner_id` mismatch (`2001887` fixture vs sumber `1241483`) pada perubahan auth int-body
  yg BELUM commit dari sesi sebelumnya. Perlu diselaraskan saat commit auth.
- **TODO berikutnya:** scale ke 29 kategori sudah dilakukan (semua dihasilkan); next = selaraskan
  test auth (fix baris 55), lalu hardening §4.1.1 (sebelumnya prioritas ① syncInventory, ② pullOrders).

### `[2026-09-02]` Pos: validasi live sandbox Shopee — POST body int (belum commit)

- **Baseline test:** core 50 · connector 10 · platform-shopee 25 · module 33 · platform-local 4 ·
  api 10 · db-pg 15 · opensellvy 2 = **149 test hijau**; `pnpm check` 0.
- **PERUBAHAN BELUM DI-COMMIT:**
  - `packages/platform-shopee/src/shopee.auth.ts` — endpoint `auth/token/get` &
    `auth/access_token/get` kini kirim `partner_id`/`shop_id` sebagai **int** di body (public API).
  - `packages/platform-shopee/tests/shopee.auth.spec.ts` — assertion disesuaikan ke angka.
  - Validasi live sandbox: POST tembus hingga `error_shop_refresh_token` (bukan error shape/signing)
    → konfirmasi body `partner_id` int + `shop_id` int benar.
- **TODO berikutnya (baru, hasil inspeksi kode 2026-09-02):** Shopee adapter masih dasar di beberapa
  titik → daftar lengkap di **`§4.1.1 Shopee HARDENING`** (syncInventory id mapping, pullOrders
  multi-order+pagination, updateOrder logistics channel, manageReturn action, webhook, pushProduct).
  Rencanakan urutan prioritas + breakdown sebelum mulai kode.
- **Catatan:** access token sandbox berlaku ±4 jam; `get_item_detail` item `845652561` gagal
  `error_not_found` (quirk sandbox); jangan commit kredensial nyata.

---

## 1. Foundation

`[x]` Scaffolding monorepo (pnpm workspaces, packages/)

`[x]` Sokongan architecture decision: **plugin monorepo** — connector = plugin external, core/module
hanya tahu registry (`@opensellvy/connector`). Satu gate, tanpa hardcode per-platform.

`[ ]` Decide core stack: DB ORM (Drizzle vs Prisma), HTTP server (Hono vs Fastify vs Express), API (GraphQL Yoga vs Apollo)

`[ ]` Decide API design: GraphQL-first vs REST-first vs hybrid (GraphQL main + REST webhooks)

`[ ]` Build & publish pipeline (tsup, npm publishing, CI)

---

## 1b. Build Order — DOMAIN-FIRST (hexagonal: domain di tengah, platform adapter di edge)

`[x]` DECIDED: bangun DOMAIN OMS penuh dulu (bebas platform), platform jadi adapter external.
Kita resolve satu gate (registry) bukan hardcode per-platform — API platform kapanpun berubah,
cukup update adapter ybs, internal OMS aman. Bonus: adapter `local` membuktikan one-gate tanpa platform.

1. `[~]` Walking skeleton (primitif core)
   `[x]` core/config (env loader, namespace resolution)
   `[x]` core/http (fetch client, retry, request hooks utk signing)
   `[x]` core/crypto (HMAC-SHA256, AES-256-GCM token encryption)
   `[x]` core/logger (console logger, zero-dep)
   `[x]` core/event (in-process event bus)
   `[ ]` db connection helper — DEFERRED (ORM decision open)
2. `[x]` **Domain contract penuh**: types order/product/inventory/customer/fulfillment/shipping/
   payment/return/warehouse/finance/promotion/notification/analytics/user/store/channel/audit —
   di `@opensellvy/types` (dari domain OMS, bukan tebakan platform; `'local'` masuk PlatformCode utk adapter lokal).
   Plugin gateway (connector) sudah kembali DOMAIN types (bukan payload/unknown), satu-gate resolve.
3. `[x]` **Implementasi module penuh** berdasarkan domain types (tanpa dependency platform) —
   module jadi reusable, dipanggil semua platform.
   `impl/` = 18 module service: order/product/inventory/channel (satu gate via registry, sync
   idempoten by platformOrderId), customer, store, fulfillment, return, payment, warehouse,
   shipping (port courier), promotion, finance/settlement, notification, user, analytics, audit.
   `ports/repositories.ts` = storage contracts (domain-pure, DB-agnostic); default adapter
   `impl/memory` (in-memory) supaya berjalan tanpa DB — diganti Postgres di step 5.
   Entry: `createServices(deps)` → `Services`. Umbrella `OpenSellvy` wiring `@opensellvy/module` +
   registry. Tests: order gate e2e (connect→sync→status), inventory adjust/oversell guard,
   push product (5 passed). typecheck all green.
4. `[x]` **Adapter `local` store** → buktikan one-gate end-to-end tanpa platform.
   `@opensellvy/platform-local` (marketed store in-memory, multi-tenant by storeId):
   OAuth connect → sync order (idempoten) → fulfill (status push-back DUA ARAH via
   gateway.updateOrder) → product push → inventory sync → stok terlihat platform.
   Buat SDK tidak berbeda dengan adapter nyata — order/webhook/token sama.
   Demo: `pnpm demo:local` (examples/local-gate.mts) — module OMS tak pernah tahu adapter mana.
 5. `[x]` **Adapt schema DB ke domain** (bukan ke payload platform).
   - ORM diputuskan: **Drizzle** sebagai query-layer tipis + **raw SQL** untuk DDL
     (clean-room: drizzle-orm tanpa drizzle-kit/codegen; migration tetap *.sql),
     runtime pool `pg`. ENV `DATABASE_URL`.
   - `@opensellvy/db`: schema Drizzle (21 tabel) + `runMigrations()` (folder `migrations/`,
     tabel `schema_migrations`, urut + transaksi per file). SQL runner: `pnpm --filter @opensellvy/db db:migrate`.
   - Migrasi baru: `00005_domain_tables.sql` (channels/products/inventory+customer/warehouse/
     return/payment/settlement/promotion/shipment/notification/audit),
     `00006_order_payload.sql` (orders += channel_id, payload, paid_at).
   - `@opensellvy/db-pg` (BARU): `createPostgresRepositories(db)` → mengimplementasikan
     ke-17 repository port `@opensellvy/module`. Pola: kolom queryable + `payload` JSONB =
     aggregate domain utuh (source of truth). FK via colom → solusi multi-tenant/analitik.
   - Lifecycle nyata di Postgres 18 (instal lokal): 2 integration test → `pnpm --filter @opensellvy/db-pg test`
     (store→connect→sync idempoten→fulfill→analytics ; product+inventory→guard stok negatif).
- Fix `orderChanged` di module: deep-equal canonical (urutan kunci JSON tak relevan
     lagi antar backend memory vs JSONB) — idempotensi konsisten backend-agnostic.
   - Catatan runtime: test butuh `opensellvy` role CREATEDB + `opensellvy_pg_test` DB dibikin otomatis.
   - Seed nyata: `db:seed` (tsx scripts/seed.ts) → bootstrap merchant lokal di Postgres
     (store → warehouse default → 4 produk + stok → customer → connect channel local →
     orders sync). Perlu `DATABASE_URL`. Jalan: 2 order sync.
  6. `[x]` **Battle-test package utk local seller** (sebelum platform) — implementasi stub → nyata:
     - Hapus 16 facade dead (interface duplikat unreachable) + 18 file 0-byte; `module/src` = impl/ports.
     - finance.reconcile: hitung gross/net/refund dari `orders.find` → settlement `in_transit` + event.
     - analytics: `getSalesSummary` (memory) & `avgFulfillmentHours` (shippedAt - createdAt) nyata;
       refunded/cancellation konsisten (returned tetap gross, dikurangi refund).
     - shipping: default `CourierRateProvider` (tarif flat base + per-kg per courier) tanpa inject.
     - connector: `createOAuthClient` (RFC6749 authorize/exchange/refresh via core HttpClient)
       + `createMemoryTokenStore`; + tests 5.
     - platform-local: `manageReturn` handle action (`applyReturnAction`: approve/reject/receive/refund
       → status return + order `returned` saat receive/refund).
     - API (Hono): auth **fail-closed default** (`authMode:'open'` utk dev eksplisit),
       webhook dispatch via `onWebhook`, route products/inventory/channels + OAuth callback;
       + tests 9.
     - API auth (core/auth): `bearerAuth` verifikasi JWT via `authService` (fallback HMAC legacy
       utk internal token), route `POST /api/auth/{login,refresh,logout}` — login/rotate/logout
       end-to-end, mapping AuthError → HTTP (401/403); + tests 1 (api 10).
- Tests battle: finance/analytics/returns/fulfillment/promotion/payment/user+audit/
shipping/catalog/updateStatus-edges (module 33), connector 10, api 10, platform-local 4,
       db-pg 3, opensellvy 2, core 42 = **104 test hijau**, typecheck & build 14/14, demo:local jalan.
       - **Status kini**: core 50, connector 10, platform-shopee 25, module 33, platform-local 4,
         api 10, db-pg 15, opensellvy 2 = **149 test hijau**; typecheck/lint/build 14/14; `pnpm check` 0.
      - core/auth: JWT HS256 (sign/verify, issuer/audience/maxAge), password scrypt, AuthService
        login/refresh(rotation)/logout/logoutAll/verifyToken, session store (hash token, revoke),
        fail-closed & anti-lockout (INVALID_CREDENTIALS tak bocorkan email/password); + tests 13.
      - core cache/queue: `createMemoryCache` (TTL lazy + sweep + invalidate prefix/glob) &
        `createMemoryQueue` (delay, retry attempts, remove) — pengganti nyata Redis/BullMQ nanti; + tests 10.
      - db-pg: `createPgRefreshSessionStore` + `createPgAuthDeps` (findAuthUserByEmail + getMemberRole +
        sessions) → `createAuthService` e2e di Postgres nyata (login/verify/rotation/logout, hash token
        tak tersimpan raw); migration 00007; + tests 1 (db-pg 3).
   7. `[x]` **Shopee adapter (full)**: clean-room implementasi Open Platform v2 — HMAC-SHA256 sign
      (Public: partner_id+path+timestamp; Shop: +access_token+shop_id), baseUrl fleksibel per region
      (default partner.shopeemobile.com), OAuth authorize/exchange/refresh, pull order/product,
      ship/update status, inventory sync (update_stock), return manage, webhook verify+map, mapper
      payload↔domain. Evolusi contract: `PlatformAuth` kini terima `context` (getAuthorizeUrl/exchangeCode
      butuh credentials utk redirectUri/shopId). + tests 25 (signing, HTTP layer, auth, mapper, gateway
      via stub fetch).
  8. `[ ]` Replikasi adapter ke TTS/Tokopedia → Lazada → Blibli

---

## 2. Core

- `[x]` Auth (JWT HS256 self-contained: sign/verify + issuer/audience/maxAge; password scrypt; `AuthService` login/refresh-rotation/logout/logoutAll/verifyToken; `RefreshSessionStore` utk revoke; + tests 13)
- `[x]` RBAC (identity-aware: `can(userId, perm, {storeId})` resolve role via injected `RoleResolver`, fail-closed tanpa resolver; + tests)
- `[x]` Crypto (AES-256-GCM token encryption, HMAC-SHA256, sha256/randomHex; + tests)
- `[x]` Logger (console, zero-dep)
- `[x]` Event bus (in-process; + tests)
- `[x]` HTTP client (fetch, retry/backoff, hooks, JSON; + tests)
- `[x]` Cache (`createMemoryCache`: TTL lazy + sweep, `invalidate` prefix/glob; + tests 5; impl Redis nanti)
- `[x]` Queue (`createMemoryQueue`: delay/retry/remove; + tests 5; prod pakai BullMQ/Redis)
  - Catatan: stor untuk `RefreshSessionStore` di-binding di lapisan infra (db-pg), bukan di core.

---

## 3. Database

- `[x]` Decide Drizzle ORM (query-layer tipis) + raw SQL DDL (clean-room, tanpa drizzle-kit)
- `[x]` Complete schema: stores, users, platform_accounts, orders, products, customers, inventory, shipments, finance
- `[x]` Migration runner (folder `migrations/`, tabel `schema_migrations`, urut + transaksi)
- `[x]` Seed script (`db:seed`, tsx → bootstrap merchant lokal di Postgres)

---

## 4. Connectors (Plugin Architecture)

`[x]` DECISION: **Clean-room HTTP (build dari dokumentasi resmi)** — no official SDK, publish-safe.
`[x]` DECISION: **Plugin monorepo** — tiap platform = package `@opensellvy/platform-*`, didaftarkan
ke registry. Module & API tak pernah import platform-* langsung.
`[x]` Connector contract (`PlatformPlugin`: capabilities, auth, gateway, webhook) + registry
    - Registry satu-gate: `registerPlatform` melempar `RegisterError` pada duplicate (anti silent-overwrite);
      allow overwrite via `{ replace: true }`; + tests 5.
    - Token refresh-on-expiry: `PlatformAuth.refreshToken(context)` kini return `OAuthToken` baru;
      `channelContext` lazy-refresh & persist saat `expiresAt` mendekati kedaluwarsa (margin 60s); + test.
    - `PlatformAuth` (getAuthorizeUrl/exchangeCode/refreshToken) kini terima `context: ConnectorContext`
      — dibutuhkan adapter nyata (redirectUri & shopId dari credentials). Implementasi stub/test disesuaikan;
      `PlatformCredentials` + `OAuthConfiguration` dapat `baseUrl?`; SDK `PlatformConfig` + `defaultCredentials`
      meneruskan `baseUrl?`/`shopId?`.
    - Umbrella SDK `OpenSellvy` → `await sdk.open()`, inject repository (Postgres via `config.databaseUrl`,
      fallback in-memory); fix wiring `repos`/`repositories`; + tests.
    - OAuth ergonomi: `createOAuthClient` (RFC6749 authorize/exchange/refresh) + `createMemoryTokenStore`; + tests.

### 4.1 Shopee
`[x]` Study API docs (Open Platform) + konfirmasi tipe signing (Public vs Shop) & baseUrl per region
`[x]` OAuth flow (partner_id, sign public, authorize URL auth_partner, token/get, access_token/get)
`[x]` HTTP client + signature (HMAC-SHA256; base string partner_id+path+timestamp[+access_token+shop_id])
`[x]` Order sync (get_order_list, get_order_detail) + ship_order + update_order_status
`[x]` Product pull/push (get_item_list/detail, add_item/update_item)
`[x]` Inventory sync (product/update_stock)
`[x]` Return manage (returns confirm/refund)
`[x]` Webhook receiver (verify via HMAC + map event → domain)

> **Base adapter sudah ada & hijau (25 test). TAPI sebagian masih dasar/stub — perlu HARDENING
> sebelum dianggap production-ready. Checklist di bawah berdasar inspeksi kode (2026-09-02).**

### 4.1.1 Shopee HARDENING (belum selesai — dasar/stub)
- `[~]` **`syncInventory` salah asumsi id** (`shopee.connector.ts:237`) — kirim `item_id: item.sku` &
      `model_id: item.sku`. Shopee butuh `item_id` (number) + `model_id` benar (item model-level punya
      `model_id` beda). `sku` ≠ `item_id`/`model_id` → **pasti gagal di sandbox nyata**.
      Butuh: resolve `item_id` (via `get_item_list`/sku mapping) + `get_model_list` utk `model_id`.
- `[~]` **`pullOrders` hanya ambil order PERTAMA** (`shopee.connector.ts:126-132`) — `orderList[0]!`
      lalu `return [domain]`. `get_order_list`+`get_order_detail` bisa balik banyak order →
      yang lain dibuang. Belum ada **pagination** (`cursor`/`more`/offset) utk list besar.
- `[ ]` **`updateOrder` ship logic keras & tak diverifikasi** (`shopee.connector.ts:155`) —
      `logistics_channel_id: Number(patch.courier||'')||0` (0 = bukan channel valid); butuh
      resolusi channel via `get_logistics_channel` + `init_logistics` sebelum `ship_order`.
      Status lain (selain cancel/accept/ship) tidak ditangani.
- `[ ]` **`manageReturn` action→endpoint salah/dangkal** (`shopee.connector.ts:257`) —
      `reject`→`/returns/refund`, `receive`→`/returns/confirm`; asumsi `request.id.replace('srn-','')`
      = `return_sn` fragil. Perlu verifikasi endpoint + payload resmi
      (`returns/confirm`, `returns/reject`, `returns/refund`, `returns/complete`).
- `[ ]` **Webhook paling minim** (`shopee.webhook.ts`) — dibuat dg `partnerKey:''` & `baseUrl:''`
      (`shopee.connector.ts:273`) → tak bisa verify nyata; verifier & `map()` belum cocokkan format
      header/event resmi Open Platform; **tanpa test** (`shopee.webhook.spec.ts` tak ada).
- `[ ]` **`pushProduct` payload placeholder** (`shopee.connector.ts:211`) — `category_id:0`,
      `weight:'1'`, `dimensions:{}`, `tier_variation:[]`; belum mapping variant/multi-SKU/attribute.
- `[ ]` **`getShop`/`getOrder` fallback diam-diam** — fallback ke `entry.shopId ?? ''` / order kosong.
- `[ ]` **Kredensial sandbox nyata utk integrasi e2e** (kini stub fetch di test; akses token ±4 jam).

> Prioritas usulan: ① syncInventory (id mapping) ② pullOrders multi-order+pagination
> ③ updateOrder ship (logistics channel) ④ manageReturn ⑤ webhook ⑥ pushProduct.

### 4.2 TikTok Shop / Tokopedia
`[ ]` Study API docs (TTS + Tokopedia: merged platform)
`[ ]` OAuth flow (Open Platform Token)
`[ ]` Order sync
`[ ]` Product sync
`[ ]` Webhook receiver

### 4.3 Lazada
`[ ]` Study API docs (Lazada Open Platform)
`[ ]` OAuth flow
`[ ]` Order sync
`[ ]` Product sync
`[ ]` Webhook receiver

### 4.4 Blibli
`[ ]` Study API docs (Blibli OpenAPI)
`[ ]` OAuth flow
`[ ]` Order sync
`[ ]` Product sync
`[ ]` Webhook receiver

---

## 5. Modules (18 domains)

`[x]` product — unified product, variant, channel listing
`[x]` catalog — category & attribute mapping (list = produk + stok tersedia)
`[x]` inventory — stock management & sync to channels
`[x]` order — omnichannel order, status machine & push-back DUA ARAH
`[x]` fulfillment — pick-pack-ship workflow
`[x]` shipping — multi-courier (JNE, J&T, SiCepat, Anteraja, Grab) + default flat rate
`[x]` payment — capture/partial-refund/full-refund
`[x]` customer — unified customer, history
`[x]` return — return & refund flow + aksi platform
`[x]` warehouse — multi-warehouse (default)
`[x]` finance — settlement + rekonsiliasi (reconcile dari order scan)
`[x]` promotion — voucher validation (percent/fixed/min-spend/max-discount)
`[x]` notification — interface (+ event hooks)
`[x]` analytics — sales summary, channel performance (avg fulfillment), top products
`[x]` user — staff management (role: owner/admin/manager/operator/viewer)
`[x]` store — multi-store management
`[x]` channel — channel connect/sync/mapping (OAuth)
`[x]` audit — audit trail & logging
Catatan: semua punya battle-test di `packages/module/tests/` (33 test: finance/analytics/returns/
fulfillment/promotion/payment/user+audit/shipping/catalog/updateStatus-edges).

---

## 6. API Layer

`[~]` Implemented (Hono, REST-first), in progress
   - `[x]` `@opensellvy/api` — Hono server (`@hono/node-server`), layering: Router → Controller → Service (module) → Repository
   - `[x]` REST routes: health, stores CRUD-lite, orders list/detail/sync, products/inventory/channels, webhook receiver per-platform
   - `[x]` Middleware: cors, bearer auth (HMAC self-contained via `@opensellvy/core`, **fail-closed default**; `authMode:'open'` utk dev), rate-limit (in-memory), error-handler
   - `[x]` Webhook dispatch: controller verifikasi sig → `api.onWebhook({platform,event,type,data,signature})`
   - `[x]` OAuth: `GET /api/stores/:storeId/oauth/:platform/authorize` + `POST /api/oauth/:platform/callback`
   - `[x]` `createServer(config, deps)` + `buildApp(ctx)`; controller tak pernah akses repo langsung
`[ ]` GraphQL schema (baseline resolvers per module) — deferred
`[x]` Auth provider guide (`core/auth` + `POST /api/auth/{login,refresh,logout}`; bearer JWT via `authService`; HMAC legacy fallback; decision #8)

---

## 7. UI (optional — fase akhir setelah platform stabil)

`[ ]` Components (DataTable, OrderStatusBadge, PlatformIcon)
`[ ]` Hooks (useOrder, useProduct)
`[ ]` Providers (Auth, Theme)

---

## 8. Docs & Quality

`[ ]` Architecture doc
`[ ]` Getting started guide
`[ ]` Per-platform connector docs
`[ ]` API reference
`[~]` Unit & integration tests — **124 test hijau** (core 50, connector 10, module 33, platform-local 4, api 10, db-pg 15, opensellvy 2)
  - db-pg battle test: semua repository di Postgres nyata (stores, channels, users, members, warehouses, customers, returns, payments, shipments, settlements, promotions, notifications, audits) + lifecycle + auth e2e. Mengungkap bug: `delete` di products/channels/stores/warehouses tidak dieksekusi (`void` query lazy Drizzle) → difix `await`.
  - core +23: auth, cache memory, queue memory, **RedisCache (ioredis, integrasi Redis nyata)**, **BullMqQueue (BullMQ, integrasi Redis + retry/backoff)**.
`[x]` Quality gates: ESLint flat config (typescript-eslint) → `pnpm -r lint` hijau semua paket;
  TS strict penuh (`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) → typecheck hijau;
  `pnpm check` = typecheck + lint + build + test satu perintah.
`[ ]` Integration tests (mock server per platform)
`[ ]` CI (lint, typecheck, test, build)

---

## Open Decisions (tracking)

|#| Topic | Options | Status |
|---|---|---|---|
|1| Platform API strategy | Official SDK / Community SDK / **Clean-room HTTP (decided)** | **DECIDED** |
|2| Plugin packaging | **Monorepo packages/ (decided)** — `@opensellvy/platform-*` per connector | **DECIDED** |
|3| ORM | **Drizzle (decided, implemented)** — query-layer tipis; DDL raw SQL; tanpa drizzle-kit | **DECIDED** |
|4| HTTP server | **Hono (decided, implemented)** / Fastify / Express | **DECIDED** |
|5| GraphQL engine | Yoga (recommended) / Apollo | Open |
|6| API structure | GraphQL main + REST webhooks (recommended) | Open |
|7| Monitoring | Sentry / OpenTelemetry / later | Open |
|8| Auth provider | Self-hosted JWT / Supabase / Auth.js | Open |
|9| Build order | **DOMAIN-first (decided)**: domain contract → module penuh → adapter local → schema DB → adapter platform. Platform = external adapter di edge | **DECIDED** (revisi dari vertical-shopee-first) |
|10| Auth vs OAuth concern | Auth = user OMS (seller/admin/RBAC, `core/auth`), OAuth = platform connector (`connector/oauth`). DB dipisah: `users`+`store_members` vs `platform_accounts`+`platform_tokens` | **DECIDED** |

---

## Target platform launch order

1. Shopee — partner program & sandbox mudah diakses
2. TikTok Shop/Tokopedia — volume terbesar TTS + Tokopedia legacy merger
3. Lazada
4. Blibli
## Quality gates & infra adapters (fase hardening)
- `[x]` ESLint flat config (typescript-eslint) → `pnpm -r lint` hijau semua paket.
- `[x]` TS strict penuh (`noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`) → typecheck hijau 14/14.
- `[x]` `pnpm check` = typecheck + lint + build + test satu perintah.
- `[x]` Root build diserialkan `--workspace-concurrency=1 --sort` (race order build db→db-pg di DTS).
- `[x]` cache-redis: `createRedisCache`/`RedisCache` (ioredis; set/get/del/invalidate SCAN+DEL/TTL) di core.
- `[x]` queue-bullmq: `createBullMqQueue`/`BullMqQueue` (BullMQ; add dengan delay/attempts/backoff, process dispatcher satu-worker, remove, close) di core.
- `[x]` db-pg battle-test semua repo di Postgres nyata (15 test db-pg).
- `[ ]` Lanjutkan platform adapters (shopee/tokopedia/lazada/blibli) pakai registry + pooling cache/queue di atas core.
