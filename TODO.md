# OpenSellvy - Development Roadmap

> Omnichannel OMS SDK untuk platform ecommerce Indonesia (Shopee, TikTok Shop/Tokopedia, Lazada, Blibli).

## Status Legend

- `[ ]` Not started
- `[x]` Done
- `[~]` In progress
- `[!]` Blocked / needs decision

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
- Tests battle: finance/analytics/returns/fulfillment/promotion/payment/user+audit/
        shipping/catalog/updateStatus-edges (module 33), connector 10, api 9, platform-local 4,
        db-pg 2, opensellvy 2, core 42 = **102 test hijau**, typecheck & build 14/14, demo:local jalan.
      - core/auth: JWT HS256 (sign/verify, issuer/audience/maxAge), password scrypt, AuthService
        login/refresh(rotation)/logout/logoutAll/verifyToken, session store (hash token, revoke),
        fail-closed & anti-lockout (INVALID_CREDENTIALS tak bocorkan email/password); + tests 13.
      - core cache/queue: `createMemoryCache` (TTL lazy + sweep + invalidate prefix/glob) &
        `createMemoryQueue` (delay, retry attempts, remove) — pengganti nyata Redis/BullMQ nanti; + tests 10.
  7. `[ ]` **Shopee adapter**: study docs → implementasi clean-room (OAuth, sign, pull/push, webhook, mapper)
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
    - Umbrella SDK `OpenSellvy` → `await sdk.open()`, inject repository (Postgres via `config.databaseUrl`,
      fallback in-memory); fix wiring `repos`/`repositories`; + tests.
    - OAuth ergonomi: `createOAuthClient` (RFC6749 authorize/exchange/refresh) + `createMemoryTokenStore`; + tests.

### 4.1 Shopee
`[ ]` Study API docs (Open Platform)
`[ ]` OAuth flow (partner_id, sign, authorize URL)
`[ ]` HTTP client + signature (HMAC-SHA256)
`[ ]` Order sync (get_order_list, get_order_detail)
`[ ]` Product push
`[ ]` Inventory sync
`[ ]` Webhook receiver

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
`[ ]` Auth provider eksternal (decision #8 open) — bearer HMAC internal jalan dulu

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
`[~]` Unit tests — **102 test hijau** (core 42, connector 10, module 33, platform-local 4, api 9, db-pg 2, opensellvy 2)
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