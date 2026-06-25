# Agent Changelog

> Every time an agent modifies this file or makes significant codebase changes, it MUST append an entry here.
> Format: `### YYYY-MM-DD — <short description>`

---

### 2026-06-25 — Optimasi Dokumentasi, PRD, dan Gitignore untuk LLM & Junior Dev

- **Pembaruan:** Mengoptimalkan seluruh dokumentasi agar ramah terhadap model AI berbiaya murah (low-resource LLMs) dan developer junior, serta menyinkronkan status modul Pelatihan (LMS) ke production:
  - **.gitignore:** Mengecualikan berkas panduan (`AGENTS.md`, `CLAUDE.md`, `TODO.md`, `llms.txt`, dan folder `docs/`) secara eksplisit menggunakan tanda negasi (`!`) agar tidak pernah terabaikan oleh git.
  - **llms.txt:** Melengkapi skema 15 tabel database Pelatihan, tRPC Routers Pelatihan, dan struktur routing frontend di web client/back-office, serta memetakan monorepo agar berbasis arsitektur _Modular Monolith_.
  - **CLAUDE.md:** Memperbaiki instruksi registrasi router ke sub-router domain (`packages/api/src/routers/<domain>/index.ts`) bukan `root.ts` langsung, melengkapi daftar tRPC Routers dan Database Tables Pelatihan, serta memperbarui statistik file skema.
  - **docs/VERSION_PLANNING.md:** Menandai seluruh checklist pengembangan Pelatihan (LMS + Admin panel) sebagai selesai (`[x]`) dan berstatus `✅ Production`.
  - **TODO.md:** Menyinkronkan target migrasi Modular Monolith untuk folder pelatihan dan menandai semua tugas pelatihan selesai.

---

### 2026-06-15 — Mengganti tag img dengan ImageWithFallback untuk mematuhi aturan linting

- **Perbaikan:** Mengganti semua penggunaan tag native `<img>` di halaman utama pelatihan (`apps/web/src/routes/pelatihan/index.tsx`) dengan komponen `<ImageWithFallback />` guna memenuhi aturan linter `tepian/no-img-element` dan mencegah kegagalan commit pada pre-commit hook (husky):
  - Mengubah tag `<img>` untuk roda gigi K3 melayang 1 dan 2.
  - Mengubah tag `<img>` untuk background biru shape `talent_bg.png`.
  - Mengubah tag `<img>` untuk logo watermark background `logo-watermark.png`.

---

### 2026-06-15 — Penyesuaian proporsi gambar talent dan merapatkan roda gerigi K3

- **Perbaikan:** Menyesuaikan elemen-elemen di section "Gambar Talent" (Kenapa Memilih Kami) pada halaman utama pelatihan (`apps/web/src/routes/pelatihan/index.tsx`):
  - Mengurangi ukuran wadah gambar talent (`h-[86%]` dan `w-[90%]`) serta mengaturnya ke posisi bawah (`bottom-0`) agar proporsinya seimbang dan tidak terlalu mendominasi background biru.
  - Memperbarui koordinat wadah pemotongan sudut kiri (`rounded-tl-[155px]` dan `rounded-bl-[170px]`) agar sejalan dengan skala baru.
  - Merapatkan posisi roda gigi K3 atas-kiri ke arah talent (menjadi `left-[7%]` dan `top-[12%]`).
  - Merapatkan posisi roda gigi K3 bawah-kanan ke arah talent (menjadi `left-[54%]` dan `top-[59%]`).

---

### 2026-06-15 — Update background shape Gambar Talent (Why Choose Us) dengan image dari Figma

- **Perbaikan:** Memperbarui background "Gambar Talent" (Kenapa Memilih Kami) di halaman utama pelatihan (`apps/web/src/routes/pelatihan/index.tsx`) dengan:
  - Mengunduh background asli `talent_bg.png` (node 2703:9341) dari Figma.
  - Mengganti elemen CSS `div` dengan tag `<img>` yang merujuk ke `/assets/talent_bg.png` agar desain 100% presisi dengan layout asli Figma.
  - Menyelaraskan dimensi background menjadi tinggi `443.65px` dan lebar `527.44px`.

---

### 2026-06-15 — Update layout Gambar Talent (Why Choose Us) dengan Floating Gears K3

- **Perbaikan:** Memperbarui visual section "Gambar Talent" (Kenapa Memilih Kami) di halaman utama pelatihan (`apps/web/src/routes/pelatihan/index.tsx`) dengan:
  - Mengunduh dan memasang asset gambar baru `talent_new.png` dari Figma.
  - Mengunduh asset roda gigi K3 (`gear_k3.png`) dari Figma.
  - Menyusun layout responsif `Group 1000002958` (node 2797:8613) yang memiliki gambar talent dengan background shape biru solid `bg-blue-500` (lebar `527.44px`, tinggi `h-96`) dan dua roda gigi K3 yang melayang.
  - Membalik gambar talent secara horizontal (`scale-x-[-1]`) agar talent menghadap ke kiri.
  - Mengurangi intensitas efek blur pada roda gigi K3 (menjadi `blur(2px)` di kiri atas dan `blur(3px)` di kanan bawah) agar tidak terlalu blur.
  - Menerapkan animasi putaran lambat (searah jarum jam 25s, berlawanan jarum jam 35s) sebagai micro-interaction premium.
  - Membersihkan imports Lucide icons yang tidak digunakan (`Award`, `CheckCircle2`).

---

### 2026-06-15 — Update layout Butuh In-House Training sesuai Figma

- **Perbaikan:** Memperbarui visual section "Butuh In-House Training" di halaman utama pelatihan (`apps/web/src/routes/pelatihan/index.tsx`) dengan:
  - Mengubah background menjadi solid `#3A86F4`.
  - Mengunduh dan memasang asset gambar baru `in_house_new.png` dari Figma.
  - Memasang logo watermark bundar Tepian K3 (`logo-watermark.png`) di sebelah kiri sebagai latar belakang.
  - Menerapkan absolute-positioned background shapes (light blue circles) dan menyelaraskan padding serta layout grid agar responsif dan presisi sesuai Figma.

---

### 2026-06-15 — Hapus FAQ di halaman Pelatihan

- **Perbaikan:** Menghapus bagian FAQ (Frequently Asked Questions) beserta _state_, _query_, dan _imports_ yang berkaitan dari halaman katalog utama pelatihan (`apps/web/src/routes/pelatihan/index.tsx`).

---

### 2026-06-15 — Fix ERR_BLOCKED_BY_RESPONSE.NotSameOrigin on static files in production

- **Masalah:** Di production, gambar-gambar statis (`/api/public/*` dan `/api/uploads/*`) diblokir oleh browser dengan eror `Failed to load resource: net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`. Hal ini dikarenakan:
  1. Header `Cross-Origin-Resource-Policy` diset ke `same-site`, sehingga memblokir pemuatan gambar jika domain frontend dan backend dianggap cross-site oleh browser.
  2. Middleware `secureHeaders` menyertakan `Cross-Origin-Embedder-Policy: require-corp` secara global pada file statis.
- **Perbaikan:**
  - Mengubah CORP header menjadi `cross-origin` pada route `/api/public/*` dan `/api/uploads/*` di [index.ts](file:///d:/project/k3/tepian-k3/apps/server/src/index.ts).
  - Melewati pengisian header `Cross-Origin-Embedder-Policy` dan `Cross-Origin-Opener-Policy` untuk route statis (`/api/uploads` dan `/api/public`) di [secure-headers.ts](file:///d:/project/k3/tepian-k3/apps/server/src/middleware/secure-headers.ts).
- **Verifikasi:** Menjalankan `pnpm check-types` dan berhasil lulus (12/12 packages sukses).

---

### 2026-06-10 — Repair corrupted pelatihan migration chain

- **Masalah:** `pnpm db:migrate` gagal di `0010_good_marvel_apes.sql` dengan `relation "pelatihan" does not exist`. Penyebab dari merge PR #78 (pelatihan LMS):
  - `_journal.json` terduplikasi — dua lineage ter-interleave dengan idx bertabrakan (dua `0009`, dua `0010`, … s/d `0022`).
  - `CREATE TABLE "pelatihan"` (tabel induk) tidak pernah ada di SQL manapun — fitur dikembangkan via `db:push`, hanya ALTER turunannya yang ter-commit.
- **Perbaikan (production-safe):**
  - Hapus tail teracak: `0009_modern_night_thrasher.sql` + `0010`–`0023` beserta snapshot-nya (`0010_snapshot.json`–`0023_snapshot.json`).
  - Rewind `_journal.json` ke migration bersih terakhir `0009_rare_edwin_jarvis` (idx 0–9).
  - `pnpm db:generate` → hasilkan satu migration konsolidasi `0010_freezing_mattie_franklin.sql` (21 CREATE TABLE termasuk `pelatihan`, semua enum pelatihan, penambahan `document_type`/`order_item_type`).
  - File `0000`–`0009_rare_edwin_jarvis` dibiarkan **byte-identical** → hash di `drizzle.__drizzle_migrations` prod tetap valid; prod cukup apply `0010` baru sebagai pending.
  - `pnpm db:migrate` lulus di DB dev.
- **AGENTS.md** — Tambah dua aturan di "Database & Data Integrity": jangan `db:push` lalu commit ALTER manual; jaga koherensi migration chain + jangan ubah migration yang sudah teraplikasi di prod.
- **Sebelum deploy prod:** verifikasi last applied = `0009_rare_edwin_jarvis` (atau lebih awal) via `SELECT ... FROM drizzle.__drizzle_migrations`.

---

### 2026-06-01 — Documentation overhaul + Pelatihan back-office UI

- **AGENTS.md** — Ditulis ulang sepenuhnya:
  - Tambahkan tabel domain status (Pengujian ✅, Pelatihan 🚧, Uji Kompetensi/Konsultasi 📋)
  - Perbarui tRPC namespace dari flat (`trpc.user.*`) ke modular (`trpc.platform.user.*`)
  - Tambahkan monorepo structure tree yang mencerminkan schema modular monolith
  - Tambahkan tabel database tables per domain (platform, pengujian, pelatihan)
  - Tambahkan checklist "Adding a New Feature" step-by-step
  - Tambahkan frontend route structure tree (termasuk pelatihan sub-routes)
  - Perbarui Documentation Index dengan semua dokumen yang ada
- **docs/PATTERNS.md** — Ditulis ulang dengan 11 pola komplit:
  - Tambahkan JSDoc ke semua contoh kode
  - Perbarui tRPC client patterns ke modern `useSuspenseQuery` + options proxy
  - Tambahkan Section 11: "Adding a New Domain Module" checklist
  - Perbaiki contoh audit logging agar mencakup `oldValues`, `changedFields`, `description`
  - Perbaiki pagination pattern dengan `::int` cast dan `orderBy` yang lebih lengkap
- **docs/JSDOC_CONVENTION.md** — Ditulis ulang:
  - Tambahkan contoh untuk tRPC procedures dan Effect-based query functions
  - Tambahkan aturan bahasa (deskripsi = Bahasa Indonesia, types = Inggris)
  - Tambahkan tabel aturan quick-reference
  - Tambahkan contoh baik vs buruk
- **Pelatihan back-office UI** (sebelumnya di sesi ini):
  - Buat `$pelatihanId.tsx` layout route dengan CourseHeader + TabNav + Outlet
  - Buat komponen `CourseHeader` dan `TabNav`
  - Implementasi 4 tab: Overview, Materi, Quiz & Post Test, Peserta
  - Fix TypeScript errors: AppRouter import path (`@tepian-k3/api/root`), params `z.object()`, relative imports
  - `pnpm check-types` lulus 12/12 packages, 0 errors ✅

---

### 2026-05-30 — Per-resource approval actions

- Split permission actions in `packages/constants/src/permissions.ts` into
  `PERMISSION_BASE_ACTION` (`view`, `create`, `read`, `update`, `delete`) and
  `PERMISSION_APPROVAL_ACTION` (`review`, `verify`, `approve`, `reject`).
  `PERMISSION_ACTION` is now their union, so the DB `action` pgEnum and the
  `PermissionAction` type are unchanged.
- Added types `PermissionBaseAction` / `PermissionApprovalAction` and helpers
  `getResourceApprovalActions()` / `getResourceActions()`.
- Changed `RESOURCES` in `packages/constants/src/resources.ts` from a string
  array to an array of `ResourceConfig` objects: `{ key, approvalActions? }`,
  where `approvalActions` is an array, the literal `"all"`, or omitted (none).
  `Resource` is now `(typeof RESOURCES)[number]["key"]` — same string union as
  before. Added `RESOURCE_KEYS`.
- Base CRUD actions are generated for every resource; approval actions only for
  resources that opt in. `getResourcePermissions`, `getAllPermissions`,
  `isValidPermission`, and `generatePermissionsList` updated accordingly.
- Seeder (`packages/db/src/seed/index.ts`):
  - Wrapped the structural permission/role/role-permission sync in a single
    `db.transaction` so authorization can't end up half-applied on failure.
  - Added an orphan-permission prune: permissions no longer produced by
    `generatePermissionsList()` (e.g. `logs.approve`) are deleted in every
    environment, mirroring the existing stale role-permission reconcile.
    Cascades to `role_permissions` / `user_permissions` (both `onDelete:
"cascade"`). This also stops orphans leaking into the role-management UI,
    which lists permissions from the DB, not the constants.
- Verified: full monorepo `check-types` passes; every permission referenced in
  `ROLE_PERMISSIONS` still exists in `generatePermissionsList()` (no role loses
  access). Current total: 363 permissions.
- Updated `packages/constants/README.md` (action model, hierarchy, counts).

### 2026-02-26 — Granular document generation permissions

- Added 2 new resources to `packages/constants/src/resources.ts`: `documents-spt`, `documents-admin`
- Updated `ROLE_PERMISSIONS` in `packages/constants/src/roles.ts`:
  - `penjadwalan`: replaced `documents.create` with `documents-spt.create`
  - `admin_manager`: added `documents-admin.create`
  - `head_of_institution`: added `documents-spt.create`
- Updated `withPermission` in `packages/api/src/routers/generate-document.ts`:
  - `generateOfferingLetter`, `generateSpkDocument`, `generateTagihanDocument` → `documents-admin.create`
  - `generateAssignmentLetter` → `documents-spt.create`
- Updated `withPermission` in `packages/api/src/routers/document.ts`:
  - `uploadSPT` → `documents-spt.create`
- Updated frontend permission checks:
  - `jadwal-personel.tsx`: "Buat SPT" and "Upload SPT" → `documents-spt.create`
  - `$orderId.detail.tsx`: added `PermissionGate` around "Buat Invoice" and "Buat SPK" buttons → `documents-admin.create`
  - `detail-transaksi.tsx`: added `PermissionGate` around "Cetak Penawaran" button → `documents-admin.create`
- Seed script unchanged — auto-generates new permissions from `generatePermissionsList()`

---

### 2026-02-25 — Slim down CLAUDE.md, extract to separate docs

- Rewrote CLAUDE.md: 910 → 283 lines
- Extracted code patterns to `docs/PATTERNS.md`
- Extracted JSDoc rules to `docs/JSDOC_CONVENTION.md`
- Replaced long code blocks with table summaries and doc links
- Added Documentation Index table at bottom of CLAUDE.md

---

### 2026-02-25 — Initial audit and update of CLAUDE.md

- Added TL;DR section to CLAUDE.md
- Corrected router count: 23 → 35
- Corrected `schema.ts` line count: 1018 → ~1685
- Corrected `document.ts` line count: 434 → ~559
- Added missing routers: `chemicalMaterial`, `parameterChemicalMaterial`, `employee`, `employeeCertification`, `position`, `worksheet`, `generateDocument`, `survey`, `banner`, `news`, `notifications`, `event`, `test`
- Added missing DB tables: worksheets (7 tables), tool calibrations (3 tables), `positions`, `employeeCertifications`, `banners`, `news`, survey tables, `chemicalMaterials`
- Added missing frontend routes: `worksheets/`, `employee/`, `display-board/`, and top-level pages
- Updated Testing Workflow to include worksheet step
- Moved changelog to `AGENT_CHANGELOG.md`

### 2026-03-06 — Phase 6: Group Types Package + Enforce Boundaries

- Moved 14 platform type files to `packages/types/src/platform/` (auth, audit, banner, document, districts, employee, news, permission, position, provinces, regencies, roles, users, villages)
- Moved 23 pengujian type files to `packages/types/src/pengujian/` (cart, chemical-material, clusters, kbli, order, order-item, order-status-history, parameter-_, survey, testing, testing-item, tool-calibration-_, tool-codes, tools, user-company\*, worksheet, worksheet-assignment)
- `data-table.types.ts` and `utils.types.ts` remain at root (shared utilities)
- Fixed internal `./utils.types` → `../utils.types` relative imports in 17 moved files
- Updated `packages/types/package.json` exports with `./platform/*`, `./pengujian/*` and stub domain paths
- Updated all `@tepian-k3/types/*` import paths across the monorepo (~60 occurrences in apps/web, packages/services, packages/queries, packages/schema)
- Scaffolded empty `pelatihan/`, `uji-kompetensi/`, `konsultasi/` index files
- Enforced boundaries: `packages/types/eslint.config.js` now includes `...boundaries`; `boundaries.js` updated to also match `src/platform/*.types.ts` and `src/pengujian/*.types.ts`; `packages/types` added to `domainPackages` in root `eslint.config.js`
- `pnpm check-types` passes across all 12 packages
