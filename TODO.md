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
