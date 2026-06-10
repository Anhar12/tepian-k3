# AI Agent Rules — tepian-k3

> **MANDATORY** — Dokumen ini WAJIB dibaca dan dipatuhi oleh semua AI agents
> (Claude, Codex, Gemini, Cursor, dll) sebelum melakukan perubahan apapun.
> Pelanggaran terhadap aturan ini dianggap **GAGAL**.

---

## Daftar Isi

1. [Prinsip Dasar](#prinsip-dasar)
2. [Alur Kerja Wajib](#alur-kerja-wajib)
3. [Backend Rules](#backend-rules)
4. [Frontend Rules](#frontend-rules)
5. [Design & UI Rules](#design--ui-rules)
6. [Landing Page Design Rules](#landing-page-design-rules)
7. [Admin Page Design Rules](#admin-page-design-rules)
8. [Database Rules](#database-rules)
9. [Security Rules](#security-rules)
10. [Git & Delivery Rules](#git--delivery-rules)
11. [Documentation Rules](#documentation-rules)
12. [Error Handling Rules](#error-handling-rules)
13. [Testing & Verification Rules](#testing--verification-rules)
14. [Performance Rules](#performance-rules)
15. [Severity Levels](#severity-levels)

---

## Prinsip Dasar

### ⚠️ Non-Negotiable

Berikut aturan yang **TIDAK BOLEH dilanggar dalam kondisi apapun**:

| #  | Rule                                                                       |
| -- | -------------------------------------------------------------------------- |
| 1  | **JANGAN** jalankan `npm` atau `yarn` — **HANYA** `pnpm`                  |
| 2  | **JANGAN** jalankan `git commit`, `git push`, `gh pr create`               |
| 3  | **JANGAN** commit file `.env`                                              |
| 4  | **WAJIB** lulus `pnpm check-types` sebelum menyelesaikan tugas             |
| 5  | **WAJIB** menjalankan `pnpm web:prettier` setelah perubahan frontend       |
| 6  | **Error messages** selalu dalam **Bahasa Indonesia**                       |
| 7  | **JSDoc** wajib di semua exported functions, hooks, dan components baru    |
| 8  | **UUIDv7** (`uuidv7()`) untuk semua primary key baru                      |
| 9  | **Soft delete** via `deletedAt` — jangan hard delete                       |
| 10 | **Audit log** wajib di semua mutasi                                        |

### Prioritas Referensi

Saat ada konflik antara dokumen, ikuti urutan prioritas ini:

```
1. AGENTS.md (tertinggi)
2. AI_AGENT_RULES.md (dokumen ini)
3. FRONTEND_DESIGN_GUIDE.md
4. PATTERNS.md
5. Domain-specific docs (PELATIHAN_FEATURE_DESIGN.md, dll)
```

---

## Alur Kerja Wajib

### Sebelum Menulis Kode

```
1. BACA AGENTS.md secara lengkap
2. BACA AI_AGENT_RULES.md (dokumen ini)
3. Pahami konteks task dan domain yang terlibat
4. Identifikasi file-file yang akan dimodifikasi
5. Verifikasi bahwa pattern yang akan digunakan sesuai PATTERNS.md
6. Jika multi-file change: presentasikan checklist ke user terlebih dahulu
```

### Setelah Menulis Kode

```
1. Jalankan `pnpm check-types` — HARUS 0 errors
2. Jalankan `pnpm web:prettier` jika ada perubahan frontend
3. Verifikasi JSDoc ada di semua exported functions baru
4. Verifikasi error messages dalam Bahasa Indonesia
5. Verifikasi audit log ada di semua mutasi baru
6. Presentasikan git commands ke user (JANGAN jalankan sendiri)
```

### Saat Gagal Type Check

```
1. Analisis error — identifikasi root cause
2. Perbaiki — attempt #1
3. Jalankan ulang `pnpm check-types`
4. Jika masih gagal — attempt #2
5. JIKA MASIH GAGAL setelah 2 kali: STOP dan presentasikan alternatif ke user
   Jangan coba lagi tanpa persetujuan user
```

---

## Backend Rules

### Effect-Based Queries

```typescript
// ✅ BENAR — gunakan Effect.tryPromise
export const getById = (id: string) =>
  Effect.tryPromise({
    try: async () => {
      const item = await db.query.table.findFirst({
        where: and(eq(table.id, id), isNull(table.deletedAt)),
      });
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Data tidak ditemukan" });
      return item;
    },
    catch: (error) => error as TRPCError,
  });

// ❌ SALAH — jangan gunakan try/catch langsung
export const getById = async (id: string) => {
  try {
    return await db.query.table.findFirst({ ... });
  } catch (e) { ... }
};
```

### tRPC Router

```typescript
// ✅ BENAR — gunakan runEffect + Effect.gen
getPaginated: withPermission("resource.read")
  .input(paginationSchema)
  .query(async ({ input }) =>
    await runEffect(Effect.gen(function* () {
      return yield* queries.getPaginated(input);
    }))
  ),

// ❌ SALAH — langsung panggil query tanpa Effect wrapper
getPaginated: withPermission("resource.read")
  .input(paginationSchema)
  .query(async ({ input }) => {
    return await queries.getPaginated(input);
  }),
```

### Audit Logging

**SETIAP mutasi (create, update, delete, restore)** WAJIB log ke audit:

```typescript
yield* auditQueries.createAudit({
  entityType: "resource",     // nama entity (singular, lowercase)
  entityId: result.id,        // UUID entity
  action: "CREATE",           // CREATE | UPDATE | DELETE
  userId: ctx.user.id,
  userEmail: ctx.user.email,
  oldValues: null,            // null untuk CREATE
  newValues: result,          // null untuk DELETE
  changedFields: Object.keys(input),
  description: `Membuat resource: ${result.name}`, // Bahasa Indonesia
});
```

### Module Boundaries

```
platform        ← TIDAK BOLEH import dari domain manapun
    ^
pengujian       ← HANYA boleh import dari platform
pelatihan       ← HANYA boleh import dari platform
uji-kompetensi  ← HANYA boleh import dari platform
konsultasi      ← HANYA boleh import dari platform

❌ DILARANG: pengujian ← import → pelatihan (peer import)
```

---

## Frontend Rules

### Routing

```typescript
// ✅ BENAR — gunakan z.object untuk params
export const Route = createFileRoute("/(core)/back-office/resource/$id")({
  params: z.object({ id: z.string() }),
  beforeLoad: async ({ context }) => {
    await requirePermission(context, { permission: "resource.read" });
  },
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.domain.resource.getById.queryOptions({ id: params.id })
    ),
  component: ResourcePage,
});

// ❌ SALAH — jangan gunakan parse/stringify untuk params
params: { parse: (p) => ({ id: p.id }), stringify: (p) => ({ id: p.id }) }
```

### Data Fetching

```typescript
// ✅ BENAR — TanStack Query + tRPC options proxy
const { data, isLoading } = useQuery(
  trpc.pengujian.order.getPaginated.queryOptions({ page: 1 })
);

// ✅ BENAR — Mutation dengan success/error handling
const mutation = useMutation(
  trpc.pelatihan.base.create.mutationOptions({
    onSuccess: () => {
      globalSuccessToast("Pelatihan berhasil dibuat!");
      queryClient.invalidateQueries();
    },
    onError: (err) => {
      globalErrorToast(err.message);
    },
  })
);

// ❌ SALAH — jangan gunakan fetch() atau axios langsung
const data = await fetch("/api/pelatihan");
```

### Komponen

```typescript
// ✅ BENAR — import dari @/components/ui/
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ❌ SALAH — jangan import dari path relatif atau node_modules langsung
import { Button } from "../../components/Button";
import { Button } from "@radix-ui/react-button";
```

### Toast/Notifikasi

```typescript
// ✅ BENAR — gunakan globalSuccessToast / globalErrorToast
import { globalSuccessToast, globalErrorToast } from "@/lib/toast";

globalSuccessToast("Data berhasil disimpan!");
globalErrorToast("Gagal menyimpan data. Silakan coba lagi.");

// ❌ SALAH — jangan gunakan alert() atau console.log untuk feedback user
alert("Berhasil!");
console.log("Error:", error);
```

---

## Design & UI Rules

### Wajib Dibaca Dulu

Sebelum menyentuh kode UI, **WAJIB baca** [FRONTEND_DESIGN_GUIDE.md](FRONTEND_DESIGN_GUIDE.md).

### Rules Kritikal

| #  | Rule                                                                          | Deskripsi / Ketentuan Tambahan |
| -- | ----------------------------------------------------------------------------- | ------------------------------ |
| 1  | **Gunakan design token** (CSS variables) — jangan hardcode warna              | Selalu gunakan CSS Custom Properties dari `index.css` (mis. `bg-primary`, `border-border`, dll). |
| 2  | **Gunakan shadcn/ui** components — jangan buat komponen UI custom jika sudah ada | Tombol, input, dialog, dropdown, kartu harus memakai `@/components/ui`. |
| 3  | **Mobile-first** — selalu desain dari mobile, lalu scale up                   | Semua struktur layout diawali tanpa prefix breakpoints, lalu gunakan `md:`, `lg:` untuk desktop. |
| 4  | **Skeleton loaders** — tampilkan skeleton saat loading, bukan spinner kosong  | Untuk setiap section loading data list/detail, sediakan placeholder skeleton yang presisi. |
| 5  | **ImageWithFallback** — jangan gunakan `<img>` native                         | Wajib memakai komponen `<ImageWithFallback>` untuk proteksi broken assets. |
| 6  | **Konsisten** — ikuti pattern yang sudah ada di halaman lain                  | Pertahankan visual grid, borders, shadows, dan radii yang seragam di seluruh aplikasi. |
| 7  | **Responsive** — test di 3 breakpoint: mobile (360px), tablet (768px), desktop (1280px) | Pastikan layout mengalir alami tanpa pemotongan teks kasar (*layout shift* / overflow). |
| 8  | **Font** — Poppins untuk UI, Plus Jakarta Sans untuk hero heading landing     | **Poppins** untuk teks badan, form, tombol. **Plus Jakarta Sans** untuk hero title/h1. |
| 9  | **Animasi** — subtle saja (`hover:scale-[1.02]`), jangan berlebihan          | Gunakan transisi mikro-interaksi seperti `active:scale-[0.98]` dan `duration-300` agar UI terasa hidup. |
| 10 | **Symmetry & Button pairs** — tombol berdampingan HARUS sama tinggi & padding  | Tombol primer & sekunder berdampingan wajib memiliki padding (`px-8 py-4` / `h-12`) yang seragam. |
| 11 | **Strict Figma-to-Code Translation** — jangan menebak layout                  | Jika figma URL / node ID disediakan, gunakan perkakas mcp untuk mengekstrak dimensi, border-radius, dan shadow asli. |
| 12 | **Dynamic Content & State Handling** — sediakan toggle bio / detail           | Konten biografis atau paragraf panjang wajib memiliki pelindung toggle fold ("Selengkapnya" / "Sembunyikan") + Chevron. |
| 13 | **Subscription / Paywall Warning States** — sediakan status terproteksi        | Bagian interaktif untuk pengguna belum mendaftar/berlangganan wajib memiliki backdrop blur, pesan informasi amber/merah, dan CTA dinamis. |

### Ikon

```typescript
// ✅ BENAR — Lucide React
import { Award, BookOpen, ChevronDown } from "lucide-react";

// ✅ BENAR — Tabler Icons
import { IconPhoto, IconPlus, IconEdit } from "@tabler/icons-react";

// ❌ SALAH — jangan campur Lucide dan Tabler dalam satu file
import { Award } from "lucide-react";
import { IconPhoto } from "@tabler/icons-react"; // ← di file yang sama
```

---

## Landing Page Design Rules

### Struktur

Setiap landing page harus mengikuti pola:

```
Hero Banner (full-width, image/carousel, overlay + CTA)
   ↓
Value Proposition / Stats (numbers, achievements)
   ↓
Content Sections (alternating bg-white / bg-gray-50)
   ↓
CTA Banner (gradient background, persuasive text)
   ↓
FAQ (collapsible, clean)
   ↓
Final CTA (call to action)
```

### Hero Banner Rules

1. **Full-width** — `relative w-full` dengan aspect ratio minimal 16:9
2. **Overlay** — Selalu ada `bg-gradient-to-r from-black/60 via-black/40 to-transparent`
3. **CTA di atas gambar** — Teks putih, tombol kontras tinggi
4. **Auto-slide** — Interval 5 detik, pause on hover, indicator dots di bawah
5. **Gambar dinamis** — Diambil dari API, fallback ke gambar statis jika kosong
6. **Max 5 slides** — Jangan lebih dari 5 untuk performance

### CTA Section Rules

1. **Gradient background** — Bukan solid color, gunakan `bg-gradient-to-r`
2. **Teks heading besar** — `text-4xl md:text-5xl font-extrabold`, warna putih
3. **Body text** — `text-lg md:text-xl`, `text-white/80`
4. **Tombol kontras** — Background putih atau orange, bukan transparan
5. **Max 2 tombol** — Primary + Secondary, layout horizontal
6. **Tombol sama besar** — Padding `px-8 py-4` identik di kedua tombol
7. **Mobile stack** — `flex-wrap` agar tombol stack di mobile

### Card Grid Rules

1. **4 kolom desktop** — `grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
2. **Hover effect** — `hover:shadow-lg hover:scale-[1.02] transition-all duration-300`
3. **Image ratio** — `aspect-video` (16:9) untuk thumbnail
4. **Truncate text** — Gunakan `line-clamp-2` untuk deskripsi kartu
5. **Badge** — Kategori/level/type ditampilkan sebagai badge di atas kartu
6. **Price** — Format Rupiah: `Rp 1.500.000` (gunakan `toLocaleString("id-ID")`)

---

## Admin Page Design Rules

### Table Page

1. **Card wrapper** — Semua tabel dibungkus `<Card>`
2. **Header** — Title + description + action button (Tambah)
3. **Search** — Input search di atas tabel, max-width `max-w-sm`
4. **Pagination** — Di bawah tabel, "Menampilkan X-Y dari Z" + prev/next
5. **Empty state** — Tampilkan ilustrasi + pesan jika data kosong
6. **Loading** — Skeleton rows, bukan spinner di tengah

### Detail/Edit Page

1. **Breadcrumb** — Navigasi breadcrumb di atas halaman
2. **Tab navigation** — Gunakan tab untuk multi-section (Overview, Materi, Quiz, dll)
3. **Sticky header** — Title + action buttons sticky di top saat scroll
4. **Form sections** — Grup related fields dalam `<Card>` terpisah
5. **Save indicator** — Tampilkan "Tersimpan" atau "Belum tersimpan" jika ada unsaved changes

### Image Upload Admin

Saat admin mengunggah gambar (banner, thumbnail):

1. **Preview** — Tampilkan preview gambar setelah upload
2. **Dimensi** — Tampilkan rekomendasi ukuran (mis. "1920×800px untuk banner")
3. **File size** — Warning jika > 500KB (banner) atau > 200KB (thumbnail)
4. **Format** — Accept hanya: `.webp`, `.jpg`, `.jpeg`, `.png`
5. **Delete** — Tombol hapus gambar yang sudah diupload
6. **Drag & drop** — Gunakan `SingleImageUpload` component

---

## Database Rules

### Schema

```typescript
// ✅ BENAR — UUIDv7 + timestamps + soft delete index
export const newTable = createTable("new_table", {
  id: uuid("id").primaryKey().notNull().$default(() => uuidv7()),
  name: varchar("name", { length: 250 }).notNull(),
  ...timestamps,  // createdAt, updatedAt, deletedAt
}, (table) => ({
  nameIdx: uniqueIndex("new_table_name_idx")
    .on(table.name)
    .where(sql`${table.deletedAt} IS NULL`),
}));
```

### Migrations

```bash
# SELALU ikuti urutan ini:
1. Edit schema di packages/db/src/schema/<domain>.ts
2. pnpm db:generate    # Generate migration SQL
3. pnpm db:migrate     # Apply migration
4. pnpm check-types    # Verify types
```

### Query Rules

1. **Selalu** filter `isNull(table.deletedAt)` di semua SELECT queries
2. **Transaksi** wajib jika mutasi menyentuh > 1 tabel
3. **Pagination** wajib untuk list endpoints — jangan return semua rows
4. **Count query** terpisah dari data query untuk pagination metadata
5. **Cast count** ke integer: `sql<number>\`count(*)::int\``

---

## Security Rules

1. **Permission check** — Semua endpoint admin harus gunakan `withPermission()`
2. **Route protection** — Semua route admin harus punya `beforeLoad` dengan `requirePermission()`
3. **Input validation** — Semua input harus divalidasi via Zod schema
4. **File uploads** — Hanya melalui `storageService`, validasi MIME type
5. **SQL injection** — Gunakan Drizzle ORM query builder, jangan raw SQL tanpa parameterized
6. **XSS** — React otomatis escape, tapi jangan gunakan `dangerouslySetInnerHTML`
7. **Rate limiting** — Endpoint sensitif (auth, upload) harus punya rate limit

---

## Git & Delivery Rules

### AI Agent DILARANG

```bash
# ❌ JANGAN PERNAH jalankan command ini:
git commit -m "..."
git push origin ...
gh pr create ...
git merge ...
git rebase ...
```

### AI Agent HARUS

```bash
# ✅ Berikan perintah ini ke user untuk dijalankan sendiri:
"Silakan jalankan perintah berikut:"
git add -A
git commit -m "feat(pelatihan): add landing page banner carousel"
git push origin feat/pelatihan-landing
```

### Commit Message Format

```
<type>(<scope>): <description>

Types:  feat, fix, refactor, docs, style, chore, test
Scope:  platform, pengujian, pelatihan, web, server, db, api
```

Contoh:
```
feat(pelatihan): add hero banner carousel with admin management
fix(pengujian): correct status calculation for completed orders
docs(agents): add frontend design guide and AI agent rules
refactor(api): extract pagination logic to shared utility
```

---

## Documentation Rules

### JSDoc

```typescript
// ✅ BENAR — deskriptif, Bahasa Indonesia, dengan @param dan @returns
/**
 * Mengambil daftar pelatihan yang dipaginasi berdasarkan filter pencarian.
 *
 * @param input - Opsi filter dan paginasi
 * @param input.page - Nomor halaman saat ini (dimulai dari 1)
 * @param input.limit - Jumlah item per halaman (default: 10)
 * @returns Daftar pelatihan beserta metadata paginasi
 */
export const getPaginatedPelatihan = (input: Input) => ...

// ❌ SALAH — terlalu singkat, Bahasa Inggris, tanpa parameter
/**
 * Get pelatihan.
 */
export const getPaginatedPelatihan = (input: Input) => ...
```

### Authorship Comment

Semua kode yang di-generate AI agents harus ditandai:

```typescript
// ##################
// authored (generated by <agent>, <tanggal> <waktu> WITA)
// ##################

// ... kode di sini ...

// ##################
// end authored
// ##################
```

Contoh:
```typescript
// ##################
// authored (generated by gemini, Jun 02 2026 22:00 WITA)
// ##################
```

### Kapan Membuat Dokumen Baru

- **Fitur baru** → Buat desain doc di `docs/<FEATURE>_DESIGN.md`
- **Pattern baru** → Tambahkan ke `docs/PATTERNS.md`
- **Perubahan arsitektur** → Update `AGENTS.md`
- **Guide frontend** → Update `docs/FRONTEND_DESIGN_GUIDE.md`

---

## Error Handling Rules

### Backend Errors

```typescript
// ✅ BENAR — Bahasa Indonesia, spesifik
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Pelatihan dengan ID tersebut tidak ditemukan",
});

throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Judul pelatihan tidak boleh kosong",
});

throw new TRPCError({
  code: "FORBIDDEN",
  message: "Anda tidak memiliki izin untuk menghapus pelatihan ini",
});

// ❌ SALAH — Bahasa Inggris, generik
throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
throw new Error("Something went wrong");
```

### Frontend Errors

```typescript
// ✅ BENAR — Toast spesifik
globalSuccessToast("Pelatihan berhasil dibuat!");
globalErrorToast("Gagal menyimpan data. Silakan coba lagi.");
globalErrorToast("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");

// ❌ SALAH — Generik atau Bahasa Inggris
globalErrorToast("Error");
toast.error("Something went wrong");
```

---

## Testing & Verification Rules

### Sebelum Menyelesaikan Task

```bash
# 1. Type check (WAJIB — tidak ada pengecualian)
pnpm check-types

# 2. Format (WAJIB jika ada perubahan frontend)
pnpm web:prettier

# 3. Build (OPSIONAL — hanya jika diminta user)
pnpm build
```

### Saat Ada Migration

```bash
# WAJIB ikuti urutan:
pnpm db:generate
pnpm db:migrate
pnpm check-types
```

---

## Performance Rules

### Backend

1. **Pagination** — Selalu return paginated data, jangan `findMany` tanpa limit
2. **Select columns** — Jangan `select *`, pilih kolom yang dibutuhkan saja
3. **Eager loading** — Gunakan `with: {}` untuk join, bukan N+1 queries
4. **Index** — Buat index untuk kolom yang sering di-filter/search

### Frontend

1. **Lazy loading** — Images di bawah fold harus `loading="lazy"`
2. **Code splitting** — Per-route (otomatis via TanStack Router)
3. **Prefetch** — Critical data di `loader`, bukan di component
4. **Debounce** — Search input harus debounce 300ms
5. **Memoization** — `useMemo` untuk expensive computation, `useCallback` untuk stable refs
6. **Virtual list** — Untuk list > 100 items, pertimbangkan virtualization

---

## Severity Levels

### 🔴 CRITICAL — Harus diperbaiki segera

- Type check gagal (`pnpm check-types` error)
- Security vulnerability (SQL injection, XSS, missing auth)
- Data loss risk (hard delete tanpa soft delete)
- Production breaking change

### 🟡 WARNING — Harus diperbaiki sebelum selesai

- Missing JSDoc di exported function
- Error message dalam Bahasa Inggris
- Missing audit log di mutasi
- Performance issue (N+1 query, missing pagination)

### 🔵 INFO — Nice to have

- Missing skeleton loader
- Could use better variable naming
- Minor styling inconsistency
- Missing `aria-label` pada icon button

---

## Quick Reference

### New Feature Checklist

```
□ Schema      → packages/db/src/schema/<domain>.ts
□ Migration   → pnpm db:generate && pnpm db:migrate
□ Queries     → packages/queries/src/<domain>/<resource>.queries.ts
□ Zod Schema  → packages/schema/src/<domain>/<resource>.schema.ts
□ Router      → packages/api/src/routers/<domain>/<resource>.ts
□ Register    → packages/api/src/routers/<domain>/index.ts
□ Frontend    → apps/web/src/routes/(core)/<path>/
□ JSDoc       → Semua exported functions
□ Audit Log   → Semua mutasi
□ Type Check  → pnpm check-types (0 errors)
□ Format      → pnpm web:prettier
□ Authorship  → Comment block dengan nama agent + timestamp
```

### Import Paths

```typescript
// Database
import { db } from "@tepian-k3/db/client";
import { users, pelatihan } from "@tepian-k3/db/schema";

// Queries
import * as userQueries from "@tepian-k3/queries/platform/users";
import * as pelatihanQueries from "@tepian-k3/queries/pelatihan/pelatihan";

// Schemas (Zod)
import { createPelatihanSchema } from "@tepian-k3/schema/pelatihan";

// Auth
import { withPermission, protectedProcedure } from "@tepian-k3/auth";

// Services
import { storageService } from "@tepian-k3/services/storage";

// Frontend
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { globalSuccessToast } from "@/lib/toast";
```
