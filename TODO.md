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
3. `[ ]` **Implementasi module penuh** berdasarkan domain types (tanpa dependency platform) —
   module jadi reusable, dipanggil semua platform.
4. `[ ]` **Adapter `local` store** → buktikan one-gate end-to-end tanpa platform.
5. `[ ]` **Adapt schema DB ke domain** (bukan ke payload platform).
6. `[ ]` **Shopee adapter**: study docs → implementasi clean-room (OAuth, sign, pull/push, webhook, mapper)
7. `[ ]` Replikasi adapter ke TTS/Tokopedia → Lazada → Blibli

---

## 2. Core

- `[ ]` Auth (JWT, session, refresh token)
- `[ ]` RBAC (role definitions done, perlu user-store binding)
- `[ ]` Crypto (token encryption utk platform credentials)
- `[ ]` Logger
- `[ ]` Event bus
- `[ ]` Cache
- `[ ]` Queue (bullmq)

---

## 3. Database

- `[ ]` Decide Drizzle vs Prisma vs Kysely
- `[ ]` Complete schema: stores, users, platform_accounts, orders, products, customers, inventory, shipments, finance
- `[ ]` Migration runner
- `[ ]` Seed script

---

## 4. Connectors (Plugin Architecture)

`[x]` DECISION: **Clean-room HTTP (build dari dokumentasi resmi)** — no official SDK, publish-safe.
`[x]` DECISION: **Plugin monorepo** — tiap platform = package `@opensellvy/platform-*`, didaftarkan
ke registry. Module & API tak pernah import platform-* langsung.
`[x]` Connector contract (`PlatformPlugin`: capabilities, auth, gateway, webhook) + registry

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

`[ ]` product — unified product, variant, channel listing
`[ ]` catalog — category & attribute mapping
`[ ]` inventory — stock management & sync to channels
`[ ]` order — omnichannel order, status, mapper
`[ ]` fulfillment — pick-pack-ship workflow
`[ ]` shipping — multi-courier (JNE, J&T, SiCepat, Anteraja, Grab)
`[ ]` payment — gateway (Midtrans, Xendit, DOKU)
`[ ]` customer — unified customer, merge, history
`[ ]` return — return & refund flow
`[ ]` warehouse — multi-warehouse
`[ ]` finance — invoice, settlement, reconciliation
`[ ]` promotion — voucher, flash sale, bundle
`[ ]` notification — email/WA/SMS/push + templates
`[ ]` analytics — sales, product, channel report
`[ ]` user — staff management
`[ ]` store — multi-store management
`[ ]` channel — channel connect/sync/mapping
`[ ]` audit — audit trail & logging

---

## 6. API Layer

`[ ]` GraphQL schema (baseline resolvers per module)
`[ ]` GraphQL context (auth, db, tenant isolation)
`[ ]` REST webhooks (per platform callback receiver)
`[ ]` OAuth callback endpoints
`[ ]` Middleware (auth, rate-limit, cors, error-handler)

---

## 7. UI (optional)

`[ ]` Components (DataTable, OrderStatusBadge, PlatformIcon)
`[ ]` Hooks (useOrder, useProduct)
`[ ]` Providers (Auth, Theme)

---

## 8. Docs & Quality

`[ ]` Architecture doc
`[ ]` Getting started guide
`[ ]` Per-platform connector docs
`[ ]` API reference
`[ ]` Unit tests
`[ ]` Integration tests (mock server per platform)
`[ ]` CI (lint, typecheck, test, build)

---

## Open Decisions (tracking)

|#| Topic | Options | Status |
|---|---|---|---|
|1| Platform API strategy | Official SDK / Community SDK / **Clean-room HTTP (decided)** | **DECIDED** |
|2| Plugin packaging | **Monorepo packages/ (decided)** — `@opensellvy/platform-*` per connector | **DECIDED** |
|3| ORM | Drizzle (recommended) / Prisma / Kysely | Open |
|4| HTTP server | Hono (recommended) / Fastify / Express | Open |
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