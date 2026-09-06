# Universal Platform Adapter — Pattern & Checklist

> Dokumen **single-source-of-truth** untuk membangun/memelihara adapter platform
> (`@opensellvy/platform-*`). Berlaku SAMA untuk semua platform
> (Shopee, TikTok Shop/Tokopedia, Lazada, Blibli, dll.) — bukan milik satu platform.
>
> Level yang dibahas di sini = **kontrak `@opensellvy/connector`** (PlatformPlugin,
> gateway grouped per-domain) — BUKAN facade API platform-agnostic (`ShopeeApi` dsb).
> Module/API/SDK hanya tahu `connectors.get(platform).gateway` — tidak pernah import
> `@opensellvy/platform-*` (agen satu-gate).

---

## 1. Kenapa adapter berbicara dalam DOMAIN types

`PlatformGateway` memakai **domain types** (`UnifiedOrder`, `UnifiedProduct`, `Payment`,
`Promotion`, `Shipment`, `MediaAsset`, `StockLevel`, `ReturnRequest`, …) — BUKAN payload
mentah platform. Keuntungan:

- **Reuse satu set module** untuk semua platform (`@opensellvy/module`).
- Perubahan skema platform lokal → cukup ubah adapter, module/API/SDK tak berubah.
- Mapper toleran: field platform yang hilang → fallback default domain.
- Test adapter bisa pakai stub fetch tanpa kredensial nyata (inject `options.fetch`).

---

## 2. Struktur file adapter (Wajib ikuti pola `platform-shopee`)

```
packages/platform-<x>/src/
  <x>.client.ts     HTTP + signing + common params + normalisasi error platform → error custom
  <x>.auth.ts       OAuth: getAuthorizeUrl / exchangeCode / refreshToken (RFC6749)
  <x>.mapper.ts     payload platform ↔ domain types (toleran, field `?`, default aman)
  <x>.webhook.ts    verify (HMAC timing-safe) + map event → domain
  <x>.connector.ts  create<X>Plugin(...) → PlatformPlugin penuh + register<X>()
  index.ts          export semua
tests/
  *.spec.ts         vitest, stub fetch (tanpa kredensial nyata)
  conformance.spec.ts  utk capability-driven enforcement (lihat §5)
```

Pola wajib:
1. `options.fetch` + `options.now` **injectable** → mudah di-test.
2. **Mapper toleran**: field `?`, fallback default utk field wajib domain.
3. **Client** menangani: signing, common params (URL utk GET & POST), body utk POST,
   normalisasi error → error custom (`XxxApiError`).
4. `register<X>()` memanggil `registerPlatform(plugin)`.

---

## 3. Checklist universal per capability (WAJIB)

Kontrak: di `@opensellvy/connector` ada `CAPABILITY_METHODS` (lihat
`packages/connector/src/capabilities.ts`) — peta capability → domain gateway yang wajib.

> **Aturan emas (capability-driven):** Sebuah capability HANYA boleh dideklarasikan di
> `PlatformPlugin.capabilities[]` jika SEMUA method gateway di domain terkait
> terimplementasi **nyata**. Method yang masih `NotImplementedError` TIDAK boleh
> di-backing oleh capability terdeklarasi. Jika platform memang tidak punya konsep itu,
> **tolong TIDAK deklarasikan capability-nya** (bukan menaruh method kosong).

| Capability | Domain gateway terkait | Method yang wajib hidup |
|---|---|---|
| `order.pull` | `gateway.order` | `pull` |
| `order.push` | `gateway.order` | `push` |
| `order.fulfill` | `gateway.fulfillment` | `ship`, `updateStatus` |
| `order.tracking` | `gateway.order` | `track` |
| `product.pull` | `gateway.product` | `pull` |
| `product.push` | `gateway.product` | `push` |
| `inventory.sync` | `gateway.inventory` | `sync`, (`getStockLevels`, `adjust`) |
| `promotion.sync` | `gateway.promotion` | `list`, `get`, `create`, `update`, `setActive` |
| `return.manage` | `gateway.returns` | `list`, `get`, `act` |
| `payment.read` | `gateway.payment` | `list`, `get`, `refund` |
| `shipping.rate` | `gateway.shipping` | `getRates` |
| `category.read` | `gateway.product` | `listCategories` |
| `media.manage` | `gateway.media` | `upload`, `list` |
| `finance.read` | `gateway.finance` | `overview`, `transactions`, `statement`, `payoutInfo` |
| `merchant.read` | `gateway.merchant` | `getProfile`, `listShops`, `listWarehouses`, `listWarehouseLocations` |
| `shop.settings` | `gateway.shop` | `getSettings`, `setHolidayMode`, `listWarehouses` |
| `webhook.receive` | *(bukan gateway)* | dipenuhi `PlatformPlugin.webhook` |

> Catatan: `webhook.receive` dipenuhi oleh `PlatformPlugin.webhook` (verify + map),
> bukan method gateway — jangan cari di `gateway`.

---

## 4. Enforcement (otomatis, bukan sekadar janji)

1. **Registrasi**: `registerPlatform()` memanggil `assertCapabilitiesImplementable(plugin)`
   → melempar `RegisterError` bila ada capability terdeklarasi yang domain gateway-nya
   kosong/tak terdefinisi.
2. **Conformance test** (wajib ada di tiap adapter): `tests/conformance.spec.ts` memanggil
   `assertNoStubMethods(plugin, makeContext)` dari `@opensellvy/connector`. Test ini
   memanggil setiap method gateway yang terkait capability, dengan stub fetch kosong,
   dan **gagal bila method melempar `NotImplementedError`**. Error bukan
   `NotImplementedError` (auth/network/business) diizinkan — itu bukti method benar-benar
   memanggil platform.
3. **Sentinel**: adapter memakai `NotImplementedError` (dari `@opensellvy/connector`)
   di helper `notImplemented()`, agar bisa dibedakan dari error nyata.

---

## 5. Cara menambahkan platform baru (ringkas)

1. Buat package `@opensellvy/platform-<x>` (ikut pola §2), depend: `connector, core, types`.
2. Implementasikan `PlatformPlugin` penuh + `register<X>()`.
3. Deklarasikan `capabilities` **hanya** untuk yang benar-benar didukung.
4. Tambah `tests/conformance.spec.ts` → jalankan `assertNoStubMethods`.
5. Live-verify terhadap sandbox platform (env-only creds, jangan commit).
6. `pnpm --filter @opensellvy/platform-<x> check` hijau.
7. Isi `docs/connectors/<x>.md` (pemetaan capability → endpoint platform).
8. Daftarkan di registry oleh pemakai SDK (bukan di dalam SDK).

---

## 6. Aturan pemeliharaan (agar tim internal tak menyentuh platform)

- Module/API/SDK **tidak pernah import** `@opensellvy/platform-*` — perubahan perilaku
  platform cukup di adapter, tanpa menyentuh module/API/SDK.
- Ubah **kontrak** `PlatformGateway`/`Capability` = breaking → update SEMUA implementer
  (semua adapter + test + `docs/connectors/*.md`) + `CAPABILITY_METHODS` + build connector
  dulu, lalu typecheck dependen (module/api/sdk/adapters).
- Tambah method baru ke kontrak = **wajib** diberi implementasi nyata di adapter yang
  mendeklarasikan capability terkait, + conformance test tetap hijau.
- Jangan edit output generator `src/generated/` — ubah generator lalu regenerate.
