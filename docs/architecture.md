# OpenSellvy Architecture

## Concern boundaries

### 1. Auth (user-facing) vs OAuth (platform-facing) — tidak boleh dicampur

| | `core/auth` | `connector/oauth` |
|---|---|---|
| Siapa | User OMS: seller, admin, staff | Merchant store di platform (Shopee `shop_id`, dst) |
| Proses | login, JWT, session, refresh_token user | authorize URL, exchange code, token lifecycle platform |
| RBAC | permission per role, scoped per store | — |
| Data | `users`, `store_members`, `refresh_tokens` | `platform_accounts`, `platform_tokens` (encrypted) |
| Milik | identity user (global) + membership (per store) | tenant (`store_id`); token di-share semua user store |

Rule:
- `core/auth` TIDAK tahu platform API.
- `connector/oauth` TIDAK tahu user session OMS.
- Titik temu hanya: RBAC meng-gate aksi OAuth (mis. `channel.manage`), dipicu dari action API.

### 2. Identity vs Membership (DB)

- `users` = identity only (email, password_hash, status). Bukan 1 store, bukan role global.
- `store_members(store_id, user_id, role)` = multi-store + role PER STORE (owner/admin/manager/operator/viewer).
- Session context (`UserContext`) berisi `storeId` hasıl resolve login, bukan kolom `users`.

## Single gate (plugin, hexagonal/port-adapter)

Module & API hanya tahu `@opensellvy/connector` registry — tidak pernah import `@opensellvy/platform-*`.
Tambah platform = register plugin; payload platform di-normalisasi oleh connector ke Unified types
(domain kita sendiri). API platform kapanpun berubah → cukup update adapter ybs, internal OMS aman.

```
request → module → registry.get(platform) → plugin.gateway → Unified types
```

Domain model TIDAK menyesuaikan diri ke tiap platform; field yang platform tidak sediakan
di-omit/null oleh adapter.

## Dependency direction (wajib)

```
types ← core ← connector ← module ← api ← opensellvy (umbrella)
       ← db
       ← platform-* (implements connector contract)
       ← platform-local (adapter bukti one-gate, tanpa HTTP)
```
core/module TIDAK men-depend platform-*.

## Build order (domain-first)

1. Walking skeleton (primitif core) — mostly done
2. Domain contract penuh (order, product, inventory, customer, fulfillment, ...) — dari domain OMS
3. Implementasi module penuh berdasarkan domain types (tanpa dependency platform) — reusable semua platform
4. Adapter `local` store → buktikan one-gate end-to-end
5. Adapt schema DB ke domain
6. Shopee adapter (study docs, clean-room: OAuth, sign, pull/push, webhook, mapper)
7. Replikasi adapter ke TTS/Tokopedia → Lazada → Blibli