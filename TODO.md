# OpenSellvy - Development Roadmap

> Omnichannel OMS SDK untuk platform ecommerce Indonesia (Shopee, TikTok Shop/Tokopedia, Lazada, Blibli).

## Status Legend

- `[ ]` Not started
- `[x]` Done
- `[~]` In progress
- `[!]` Blocked / needs decision

---

## 1. Foundation

`[x]` Repo scaffolding (directory tree, package.json, tsconfig, tsup, vitest, .env.example)

`[ ]` Decide core stack: DB ORM (Drizzle vs Prisma), HTTP server (Hono vs Fastify vs Express), API (GraphQL Yoga vs Apollo)

`[ ]` Decide API design: GraphQL-first vs REST-first vs hybrid (GraphQL main + REST webhooks)

`[ ]` Build & publish pipeline (tsup, npm publishing, CI)

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

## 4. Connectors (Platform API)

`[!]` **DECISION NEEDED: Build from HTTP docs (clean-room) vs official SDK vs community SDK.**
Rekomendasi: clean-room HTTP implementation dari dokumentasi resmi (no legal risk, publish-safe).

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
|1| Platform API strategy | Official SDK / Community SDK / Clean-room HTTP (recommended) | **NEED DECISION** — risk: official SDK (TTS/Tokopedia, Lazada) punya license restriction utk redistribution |
|2| ORM | Drizzle (recommended) / Prisma / Kysely | Open |
|3| HTTP server | Hono (recommended) / Fastify / Express | Open |
|4| GraphQL engine | Yoga (recommended) / Apollo | Open |
|5| API structure | GraphQL main + REST webhooks (recommended) | Open |
|6| Sentry/monitoring | Later | Open |
|7| Auth provider | Self-hosted JWT / Supabase / Auth.js | Open |

---

## Target platform launch order

1. Shopee — partner program & sandbox mudah diakses
2. TikTok Shop/Tokopedia — volume terbesar TTS + Tokopedia legacy merger
3. Lazada
4. Blibli