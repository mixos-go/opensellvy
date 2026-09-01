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

## Single gate (plugin)

Module & API hanya tahu `@opensellvy/connector` registry — tidak pernah import `@opensellvy/platform-*`.
Tambah platform = register plugin; payload platform di-normalisasi oleh connector ke Unified types.

```
request → module → registry.get(platform) → plugin.gateway → Unified types
```

## Dependency direction (wajib)

```
types ← core ← connector ← module ← api ← opensellvy (umbrella)
       ← db
       ← platform-* (implements connector contract)
```
core/module TIDAK men-depend platform-*.

## Build order (vertical slice)

1. Walking skeleton (primitif core) — mostly done
2. Shopee vertical penuh (OAuth, sign, pull/push, webhook, mappers)
3. Refactor core/db/module agar FIT unified model hasil mapper Shopee
4. Replikasi pattern ke TTS/Tokopedia → Lazada → Blibli