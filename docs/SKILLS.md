# OpenSellvy — SKILLS.md (Workflow & Checklist Teknis)

> Dokumen operasional: langkah kerja, checklist, dan "sumber kebenaran" teknis.
> Dibaca BERSAMA `AGENTS.md` (konteks) + `TODO.md` (roadmap).
>
> **Urutan baca saat fresh AI:** `AGENTS.md` → `SKILLS.md` → `TODO.md`.

---

## S0. Keadaan saat ini (snapshot)

> ⚠️ Dokumen ini TIDAK menyimpan state yang berubah-ubah (jumlah test, file belum di-commit,
> posisi kerja). Sumber status LIVE hanya **`TODO.md` → STATE TRACKER** (dengan timestamp).
> Baca STATE TRACKER + `git status -s` dulu setiap mulai.

Fakta statis (arsitektur, bukan state):
- **Arsitektur:** plugin monorepo, domain-first, satu-gate registry (`@opensellvy/connector`).
- **Adapter rujukan:** `platform-shopee` (full Open Platform v2, terverifikasi sandbox live).

---

## S1. Pemicu kerja / akuisisi konteks

Lakukan ini DI AWAL setiap sesi (bukan nanti):
1. `cat AGENTS.md docs/SKILLS.md TODO.md` — hafalkan kontrak & status.
2. `git log --oneline -15` + `git status -s` — tahu posisi & file belum di-commit.
3. `pnpm check` — tahu baseline hijau/merah SEBELUM menyentuh kode.

---

## S2. Rule emas

1. **Eksplorasi dulu, kode belakangan.** Baca file tetangga + package.json + tsconfig
   sebelum edit. Jangan tebak pola.
2. **Ikuti pola existing** — tidak introduksi library/pola baru tanpa bukti dipakai.
3. **Tanpa komentar kode** kecuali diminta; docblock publik boleh (gaya existing).
4. **Update `TODO.md`** tiap area selesai (status checklist + jumlah test).
5. **Verifikasi:** `pnpm check` (atau typecheck+lint+test area) sebelum selesai.
   Setelah ubah kontrak → **build paket dependen dulu**.
6. **Komit hanya saat diminta**, pola `feat(<area>): ...`. Jangan commit kredensial.
7. **Satu gate**: jangan import `@opensellvy/platform-*` dari module/sdk/api.
8. **Klarifikasi ambiguitas**, tapi cari dulu jawabannya di kode/TODO/docs.

---

## S3. Checklist teknis per tugas

### S3a. Ubah kontrak di `types` / `connector` / `core`
- [ ] Cek semua implementer (`grep -rn "interface\|method" packages --include=*.ts`).
- [ ] Update interface + semua stub plugin + test (register/api/module/db-pg).
- [ ] **Build paket basis dulu**: `pnpm --filter @opensellvy/connector build` (dst),
      lalu typecheck dependen (`pnpm -r run typecheck`).
- [ ] `pnpm check` hijau.

### S3b. Tambah/modifikasi adapter platform
- [ ] Tiru struktur `platform-shopee` (§4 AGENTS): client → auth → mapper → webhook → connector → index.
- [ ] `options.fetch` + `options.now` injectable (test dengan stub fetch, tanpa kredensial).
- [ ] Mapper toleran: `?` field, fallback utk field wajib domain.
- [ ] Client: signing + common params (URL GET/POST) + normalisasi error platform.
- [ ] `registerX()` panggil `registerPlatform(plugin)`.
- [ ] Test: signing, HTTP layer, auth, mapper, gateway via stub fetch.
- [ ] `pnpm check` hijau.

### S3c. Tulis/ubah test (vitest)
- [ ] Stub fetch: `(input, init) => Promise<{ status, ok, headers: Headers, text: () => Promise<string> }>`.
- [ ] Verifikasi URL (common params), body JSON, dan mapping domain.
- [ ] Test toleran payload minimal (field wajib ber-default).
- [ ] `pnpm --filter @opensellvy/<pkg> test`.

---

## S4. Jebakan yang sudah diketahui (jangan jatuh dua kali)

1. **`exactOptionalPropertyTypes`**: jangan tulis `field: maybeUndefined` utk field `?: T`.
   Wajib conditional spread `...(x !== undefined ? { field: x } : {})`. Ini error TS yang
   paling sering muncul di mapper/domain optional.
2. **`noUncheckedIndexedAccess`**: `arr[0]` adalah `T | undefined`. Handle dengan guard
   (contoh: `if (orderList.length === 0) return []; ... orderList[0]!`).
3. **Build serial**: jangan ubah ke paralel — urutan DTS antar paket dependen penting.
4. **Response platform bisa beda dari dugaan**: verifikasi live/sandbox kalau bisa.
   Contoh nyata: Shopee `get_order_detail` pakai `order_list`, bukan `order`.
5. **`pnpm -r typecheck` berhenti di paket pertama gagal** → pakai `pnpm -r run typecheck`.
6. **db-pg battle test** butuh Postgres nyata (drizzle migrate dulu).

---

## S5. Alur verifikasi akhir

```bash
pnpm -r run typecheck      # semua paket, tidak berhenti
pnpm -r lint               # 0 error
pnpm build                 # serial, sukses
pnpm test                  # semua paket hijau
```

Atau sekali jalan: `pnpm check`. Baseline harus 0.

---

## S6. Sumber kebenaran keputusan

- `TODO.md` — roadmap + keputusan tiap area + status test.
- `docs/architecture.md` — keputusan arsitektur.
- `docs/connectors/*` — studi/keputusan per platform.
- `AGENTS.md` §5 — fakta teknis Shopee terverifikasi (JANGAN diubah tanpa validasi live).

Baca sebelum mengubah arah. Update `TODO.md` setiap selesai.
