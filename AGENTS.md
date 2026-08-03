# AGENTS.md

> Panduan ini dibaca **secara otomatis** oleh semua AI agents (Codex, Claude, Gemini, dll)
> setiap memulai sesi baru di repositori ini. Baca seluruhnya sebelum membuat perubahan apapun.

---

## TL;DR — Baca Ini Dulu

| Hal                 | Keterangan                                                                                                            |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Stack**           | TypeScript monorepo · Hono + tRPC backend · React 19 + TanStack Router frontend · PostgreSQL + Drizzle ORM · JWT auth |
| **Package manager** | `pnpm` + Turborepo. **Jangan pernah** gunakan `npm` atau `yarn`                                                       |
| **Dev server**      | `pnpm dev` → web `:3001`, server `:3000`                                                                              |
| **Type check**      | `pnpm check-types` — **wajib lulus** sebelum menyelesaikan tugas                                                      |
| **DB change**       | Edit schema → `pnpm db:generate` → `pnpm db:migrate`                                                                  |
| **New feature**     | schema → queries → router → daftarkan di `packages/api/src/routers/<domain>/index.ts`                                 |
| **Query pattern**   | Semua query pakai `Effect.gen` + `runEffect`. Semua mutasi log ke audit table                                         |
| **PK**              | UUIDv7 (`uuidv7()`) di semua tabel. Soft delete via `deletedAt`                                                       |
| **Error messages**  | Harus dalam **Bahasa Indonesia**                                                                                      |
| **tRPC namespace**  | `trpc.platform.*`, `trpc.pengujian.*`, `trpc.pelatihan.*` (modular)                                                   |
| **JSDoc**           | Wajib di semua exported functions, hooks, dan components                                                              |
| **Commit/PR**       | Jangan jalankan `git commit` / `git push` / `gh pr create` — berikan perintahnya ke user                              |
| **Max TS retry**    | Stop setelah 2 kali gagal type fix — presentasikan alternatif                                                         |

---

## Commands

```bash
# Development
pnpm dev              # Semua apps (web :3001, server :3000)
pnpm dev:web          # Web only
pnpm dev:server       # Server only

# Quality
pnpm check-types      # Type check seluruh monorepo
pnpm build            # Build semua packages
pnpm web:prettier     # Format web app

# Database
pnpm db:push          # Push schema langsung (dev only — jangan di prod!)
pnpm db:generate      # Generate migration files dari schema
pnpm db:migrate       # Jalankan pending migrations (production)
pnpm db:studio        # Drizzle Studio GUI (browser)
pnpm db:seed          # Seed database dengan data awal
pnpm db:reset         # Reset DB + re-migrate (dev only)
```

---

## Important Rules

### Panduan Utama & Pola Kode

- **Import CommonJS di ESM** — Jika mengimpor library CommonJS (seperti `exceljs`), wajib menggunakan default import: `import exceljs from "exceljs"`. Jangan gunakan `import * as exceljs` karena akan memicu crash `Workbook is not a constructor` di runtime.
- **Pola Query & Error Handling Effect** — Selalu gunakan `Effect.tryPromise` untuk query DB di `packages/queries` dan `runEffect(Effect.gen(function* () { ... }))` di tRPC router. Gunakan _optional chaining_ `error?.code` dan `error?.message` pada handler `runEffect` agar terhindar dari crash `TypeError: Cannot read properties of undefined (reading 'code')`.
- **Pembuatan Template PDF & Dokumen** — Template PDF menggunakan `@react-pdf/renderer` di `packages/services/src/pdf/templates`. Selalu gunakan `fixed={true}` pada baris header tabel agar otomatis diulang saat pergantian halaman (_page break_), serta `wrap={false}` pada baris item/list agar teks tidak terpotong di tengah halaman.
- **Fallback Data & Null Safety Dokumen** — Selalu gunakan _nullish coalescing_ (`?? ""`) untuk field DB yang opsional/nullable (`headOfCompany`, `startDate`, `regency`) agar alur pencetakan PDF dan TTE tidak melempar `400 Bad Request`.
- **Registrasi Router Baru** — Setiap menambahkan router tRPC baru, WAJIB mendaftarkannya di `packages/api/src/routers/<domain>/index.ts` agar endpoint dapat diakses.
- **File Upload & FormData** — JANGAN parse `FormData` secara manual di endpoint tRPC. Selalu gunakan `formDataProcedure` dari `@tepian-k3/api/middlewares/form-data.middleware` jika fitur membutuhkan upload file.

### Git & Perubahan Kode

- **Jangan jalankan `git commit`, `git push`, atau `gh pr create`** — sediakan perintah eksak untuk dijalankan user sendiri. Exception: jika user secara eksplisit minta _generate PR title/description_, tulis teks saja tanpa menjalankan perintah apapun.
- **Jangan pernah commit `.env`** — gunakan `.env.example` sebagai template.
- **Multi-file changes** — presentasikan checklist lengkap ke user, minta konfirmasi sebelum memulai.
- **Maksimal 2 kali** percobaan fix TypeScript type error — jika masih gagal, presentasikan alternatif solusi.

### Database & Data Integrity

- **Transaksi wajib** jika satu mutasi menyentuh lebih dari satu tabel.
- **Cascade deletes aktif** — hati-hati saat melakukan delete, bisa menghapus data terkait.
- **Jangan kembangkan schema lewat `db:push` lalu commit ALTER manual** — base `CREATE TABLE` tidak akan tertangkap sebagai SQL dan migration akan gagal di environment bersih (`relation "x" does not exist`). Selalu `pnpm db:generate` agar setiap perubahan punya file SQL lengkap.
- **Migration chain harus koheren** — jangan pernah merge `_journal.json` sampai menghasilkan idx duplikat atau dua tag dengan nomor sama. Saat resolve konflik journal/migration, pilih satu lineage; jika perlu, hapus tail yang belum pernah teraplikasi di prod (verifikasi via `drizzle.__drizzle_migrations`) dan regenerate satu migration konsolidasi dari snapshot bersih terakhir. **Jangan ubah isi file migration yang sudah teraplikasi di prod** — hash-nya harus tetap valid.
- **File uploads** harus melalui `storageService` dari `@tepian-k3/services`.
- **UUIDs selalu v7** — gunakan `uuidv7()` from package `uuid`.
- **Selalu validasi input** dengan Zod schemas dari `@tepian-k3/schema`.

### Auth & Security

- **JWT Caching** — roles dan permissions di-cache dalam stateless JWT access token saat login. Perubahan permission di DB membutuhkan **logout + login ulang** untuk berlaku.
- **Dynamic Role Verification** — routes `/back-office`, `/employee`, dan `/display-board` menggunakan `requireRoles` untuk memblokir customers (yang hanya punya role `"user"`). User internal yang punya minimal satu role selain `"user"` dapat melewati guard dasar. Permission spesifik dicek dinamis di halaman masing-masing.
- **Dynamic Sidebar Rendering** — `app-sidebar.tsx` mengecek permissions secara dinamis. Mendukung dynamic roles dengan memperlakukan role apapun selain `"user"` sebagai internal role.

### Testing & TDD

- **TDD Framework** — Selalu gunakan Vitest sebagai framework utama untuk menjalankan tests.
- **In-Memory Database** — Untuk test queries/database, wajib menggunakan **PGlite** (`@electric-sql/pglite`) sebagai database in-memory yang sepenuhnya kompatibel dengan PostgreSQL tanpa perlu Docker. Gunakan _mocking_ vi.mock pada `@tepian-k3/db/client`.
- **Database Constraints** — Pastikan constraint unik (`uuidv7()` wajib) dan properti wajib (seperti enum `tools_availability`, `companyId`, `userId`, `worksheetId`, dsb.) selalu disediakan di dalam test mock. Gunakan UUIDv7 untuk menghindari error duplikasi _primary key_.
- **CI/CD** — Seluruh PR wajib lolos GitHub Actions workflow `.github/workflows/test.yml` dan pre-push hooks (`.husky/pre-push`) yang menjalankan `pnpm check-types` dan `pnpm test`. Jangan lewatkan tes saat membuat query/API baru.

### Dokumentasi & Kode

- **JSDoc wajib** di semua exported functions, hooks, dan React components baru.
- **Dokumen baru** simpan di folder `docs/` package yang relevan.
- **Error messages** selalu dalam **Bahasa Indonesia**.
- **Cross-module atau generated code** — tambahkan authorship comment:

```typescript
// ##################
// authored (generated by claude, Jun 01 2026 11:00 WITA)
// ##################

// ... kode di sini ...

// ##################
// end authored
// ##################
```

---

## 🗺️ Peta Dokumentasi

Untuk detail arsitektur, panduan desain, tabel database, routing frontend, dan standar kode lengkap, **BACA:**
👉 **[docs/INDEX.md](docs/INDEX.md)** 👈

Beberapa dokumen penting yang wajib Anda periksa sesuai konteks tugas:

- **Alur Bisnis & Transaksi**: [`docs/getting-started/BUSINESS_FLOW.md`](docs/getting-started/BUSINESS_FLOW.md)
- **Panduan Pengujian (TDD)**: [`docs/testing/TESTING_GUIDE.md`](docs/testing/TESTING_GUIDE.md)
- **Aturan Pengembangan Frontend**: [`docs/frontend/DESIGN_GUIDE.md`](docs/frontend/DESIGN_GUIDE.md)
- **Sistem Backend (tRPC & Effect)**: [`docs/backend/PATTERNS.md`](docs/backend/PATTERNS.md)
