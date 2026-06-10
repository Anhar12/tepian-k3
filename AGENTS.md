# AGENTS.md

> Panduan ini dibaca **secara otomatis** oleh semua AI agents (Codex, Claude, Gemini, dll)
> setiap memulai sesi baru di repositori ini. Baca seluruhnya sebelum membuat perubahan apapun.

---

## TL;DR — Baca Ini Dulu

| Hal | Keterangan |
|---|---|
| **Stack** | TypeScript monorepo · Hono + tRPC backend · React 19 + TanStack Router frontend · PostgreSQL + Drizzle ORM · JWT auth |
| **Package manager** | `pnpm` + Turborepo. **Jangan pernah** gunakan `npm` atau `yarn` |
| **Dev server** | `pnpm dev` → web `:3001`, server `:3000` |
| **Type check** | `pnpm check-types` — **wajib lulus** sebelum menyelesaikan tugas |
| **DB change** | Edit schema → `pnpm db:generate` → `pnpm db:migrate` |
| **New feature** | schema → queries → router → daftarkan di `packages/api/src/routers/<domain>/index.ts` |
| **Query pattern** | Semua query pakai `Effect.gen` + `runEffect`. Semua mutasi log ke audit table |
| **PK** | UUIDv7 (`uuidv7()`) di semua tabel. Soft delete via `deletedAt` |
| **Error messages** | Harus dalam **Bahasa Indonesia** |
| **tRPC namespace** | `trpc.platform.*`, `trpc.pengujian.*`, `trpc.pelatihan.*` (modular) |
| **JSDoc** | Wajib di semua exported functions, hooks, dan components |
| **Commit/PR** | Jangan jalankan `git commit` / `git push` / `gh pr create` — berikan perintahnya ke user |
| **Max TS retry** | Stop setelah 2 kali gagal type fix — presentasikan alternatif |
| **Design rules** | Baca **wajib**: [AI_AGENT_RULES.md](docs/AI_AGENT_RULES.md) + [FRONTEND_DESIGN_GUIDE.md](docs/FRONTEND_DESIGN_GUIDE.md) |

---

## Project Overview

**tepian-k3** adalah sistem manajemen laboratorium pengujian K3 (Kesehatan dan Keselamatan Kerja) yang dibangun di atas Better-T-Stack, memberikan end-to-end type safety dari PostgreSQL hingga React UI.

Sistem memiliki **4 domain bisnis**:

| Domain | Status | Deskripsi |
|---|---|---|
| **Pengujian** | ✅ Production | Lab testing: order → testing → worksheet → document |
| **Pelatihan** | 🚧 In Progress | LMS/Training management (v2.0.0) |
| **Uji Kompetensi** | 📋 Planned | Competency testing |
| **Konsultasi** | 📋 Planned | Consultation management |

**Tech Stack:**

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** React 19 + TanStack Router + shadcn/ui + TailwindCSS 4
- **Backend:** Hono + tRPC v11
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** JWT (HS256) stateless dengan role-based permissions via `jose`
- **Language:** TypeScript 5+ strict mode
- **Effect System:** `effect` library untuk error handling di layer query

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

## Architecture

### Monorepo Structure

```
tepian-k3/
├── apps/
│   ├── web/                    # React frontend (TanStack Router, port 3001)
│   │   ├── src/routes/         # File-based routing
│   │   │   ├── (core)/         # Authenticated routes
│   │   │   │   ├── back-office/   # Internal staff UI
│   │   │   │   ├── employee/      # Employee-specific UI
│   │   │   │   └── display-board/ # Read-only dashboard
│   │   │   └── (public)/       # Unauthenticated routes
│   │   └── docs/               # Web-specific documentation
│   └── server/                 # Hono backend with tRPC handler (port 3000)
│
└── packages/
    ├── api/                    # tRPC routers (modular: platform + pengujian + pelatihan)
    │   └── src/routers/
    │       ├── platform/       # Auth, users, roles, employees, documents, etc.
    │       ├── pengujian/      # Parameters, tools, orders, testing, worksheets
    │       └── pelatihan/      # Training management (in progress)
    ├── auth/                   # JWT middleware + permission helpers
    ├── db/                     # Drizzle schema + migrations
    │   └── src/schema/
    │       ├── platform.ts     # Platform tables
    │       ├── pengujian.ts    # Pengujian tables
    │       └── pelatihan.ts    # Pelatihan tables (in progress)
    ├── queries/                # Effect-based DB query functions
    │   └── src/
    │       ├── platform/       # Platform queries
    │       ├── pengujian/      # Pengujian queries
    │       └── pelatihan/      # Pelatihan queries (in progress)
    ├── schema/                 # Zod validation schemas
    │   └── src/
    │       ├── platform/
    │       ├── pengujian/
    │       └── pelatihan/
    ├── services/               # Email, storage, logger, PDF, doc-signing, rate-limiter
    ├── constants/              # App-wide constants, enums, permissions, resources
    ├── types/                  # Shared TypeScript types
    │   └── src/
    │       ├── platform/
    │       └── pengujian/
    ├── utils/                  # Shared utility functions
    ├── config/                 # Shared configs (tsconfig.base.json)
    └── shared/                 # Cross-app utilities
```

**Build order:** `constants → types → schema → db → queries → services → auth → api → apps`

**Import namespace:** `@tepian-k3/<package>` (e.g. `@tepian-k3/db/client`, `@tepian-k3/api/root`)

### Module Boundaries

```
platform        ← tidak boleh import dari domain manapun
    ^
pengujian       ← hanya boleh import dari platform
pelatihan       ← hanya boleh import dari platform
uji-kompetensi  ← hanya boleh import dari platform
konsultasi      ← hanya boleh import dari platform
```

> Domain modules **TIDAK BOLEH** saling import satu sama lain. Cross-domain data hanya melalui `platform` exports.

---

## tRPC Router Namespace

Semua tRPC calls di frontend menggunakan namespace modular:

| Namespace | Berisi |
|---|---|
| `trpc.platform.*` | `auth`, `user`, `role`, `permission`, `employee`, `employeeCertification`, `position`, `province`, `regency`, `district`, `village`, `notifications`, `event`, `audit`, `document`, `banner`, `news` |
| `trpc.pengujian.*` | `parameter`, `parameterCategories`, `parameterTool`, `parameterChemicalMaterial`, `tool`, `cluster`, `chemicalMaterial`, `cart`, `order`, `test`, `testing`, `worksheet`, `survey`, `kbli`, `userCompany`, `userCompanyTestingLocation`, `generateDocument` |
| `trpc.pelatihan.*` | `base`, `categories`, `materials`, `assessments`, `enrollments`, `progress` *(in progress)* |

**Contoh penggunaan:**

```typescript
// Platform domain
const user = useQuery(trpc.platform.user.getById.queryOptions({ id }));
const update = useMutation(trpc.platform.user.update.mutationOptions());

// Pengujian domain
const orders = useQuery(trpc.pengujian.order.getPaginated.queryOptions({ page: 1 }));

// Pelatihan domain
const pelatihan = useQuery(trpc.pelatihan.base.getPelatihanById.queryOptions({ id }));
```

---

## Database Tables

### Platform Domain (`packages/db/src/schema/platform.ts`)

| Group | Tables |
|---|---|
| Users & Auth | `users`, `otpCodes`, `passwordResets`, `refreshTokens` |
| Authorization | `roles`, `permissions`, `userRoles`, `rolePermissions`, `userPermissions` |
| Employees | `employees`, `positions`, `employeeCertifications` |
| Geography | `provinces`, `regencies`, `districts`, `villages` |
| Documents | `documents`, `documentSignatures`, `documentVerifications` |
| Content | `banners`, `news` |
| System | `notifications`, `audits` |

### Pengujian Domain (`packages/db/src/schema/pengujian.ts`)

| Group | Tables |
|---|---|
| Parameters | `parameters`, `parameterCategories`, `parameterTools`, `parameterChemicalMaterials` |
| Tools | `tools`, `toolCalibrations`, `toolCalibrationCertificates`, `toolCalibrationDocumentations` |
| Master Data | `clusters`, `chemicalMaterials`, `kblis`, `userCompanies`, `userCompanyTestingLocation` |
| Orders | `cart`, `order`, `orderItem`, `orderStatusHistory` |
| Testing Process | `testing`, `testingItem` |
| Worksheets | `worksheets`, `worksheetItems`, `worksheetTools`, `worksheetChemicalMaterials`, `worksheetNotes`, `worksheetAssignments`, `worksheetOperationalCosts` |
| Survey | `surveyQuestions`, `surveyResponses`, `surveyFeedback` |

### Pelatihan Domain (`packages/db/src/schema/pelatihan.ts`) — *In Progress*

| Group | Tables |
|---|---|
| Core | `pelatihan`, `pelatihanCategories` |
| Content | `pelatihanMaterials`, `pelatihanAssessments`, `pelatihanQuestions`, `pelatihanQuestionOptions` |
| Enrollment | `pelatihanCart`, `pelatihanEnrollments`, `pelatihanProgress` |
| Assessments | `pelatihanAssessmentAttempts`, `pelatihanAssessmentAnswers` |
| Certificates | `pelatihanCertificates` |

---

## Key Patterns

### 1. Schema Convention

```typescript
// UUIDv7 primary key — gunakan SELALU untuk PK baru
id: uuid("id").primaryKey().notNull().$default(() => uuidv7())

// Soft delete — spread timestamps di semua tabel
...timestamps  // menambahkan: createdAt, updatedAt, deletedAt

// Unique index yang mengabaikan soft-deleted rows
uniqueIndex("name_idx").on(table.name).where(sql`${table.deletedAt} IS NULL`)
```

### 2. Effect-Based Query Pattern

```typescript
// packages/queries/src/<domain>/<resource>.queries.ts
export const getById = (id: string) =>
  Effect.tryPromise({
    try: async () => {
      const item = await db.query.table.findFirst({
        where: and(eq(table.id, id), isNull(table.deletedAt)),
      });
      if (!item)
        throw new TRPCError({ code: "NOT_FOUND", message: "Data tidak ditemukan" });
      return item;
    },
    catch: (error) => error as TRPCError,
  });
```

### 3. tRPC Router Pattern

```typescript
// packages/api/src/routers/<domain>/<resource>.ts
export const resourceRouter = createTRPCRouter({
  // Query: Public
  getAll: publicProcedure.query(async () => { ... }),

  // Query: With permission + pagination
  getPaginated: withPermission("resource.read")
    .input(paginationSchema)
    .query(async ({ input }) =>
      await runEffect(Effect.gen(function* () {
        return yield* queries.getPaginated(input);
      }))
    ),

  // Mutation: Create with audit log
  create: withPermission("resource.create")
    .input(createResourceSchema)
    .mutation(async ({ ctx, input }) =>
      await runEffect(
        Effect.gen(function* () {
          const result = yield* queries.create(input);
          yield* auditQueries.createAudit({
            entityType: "resource",
            entityId: result.id,
            action: "CREATE",
            userId: ctx.user.id,
            userEmail: ctx.user.email,
            oldValues: null,
            newValues: result,
            changedFields: Object.keys(input),
            description: `Membuat resource baru: ${result.name}`,
          });
          return result;
        })
      )
    ),
});
```

### 4. tRPC Procedure Types

| Procedure | Gunakan ketika |
|---|---|
| `publicProcedure` | Tidak perlu autentikasi |
| `protectedProcedure` | User mana pun yang sudah login |
| `withPermission("resource.action")` | Butuh permission spesifik |
| `withRole("roleName")` / `withAnyRole` / `withAllRoles` | Role-based access |
| `withRateLimit` / `withProtectedRateLimit` / `withRoleBasedRateLimit` | Perlu rate limiting |
| `formDataProcedure(schema)` | File uploads |

### 5. Frontend Route Protection

```typescript
export const Route = createFileRoute("/(core)/back-office/resource/")(  {
  params: z.object({ id: z.string() }),   // gunakan z.object, bukan parse/stringify
  beforeLoad: async ({ context }) => {
    await requirePermission(context, { permission: "resource.read" });
    // Untuk beberapa permission (OR): permission: ["resource.read", "admin.access"]
    // Untuk beberapa permission (AND): ..., requireAll: true
  },
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.domain.resource.getById.queryOptions({ id: params.id })
    ),
  component: MyComponent,
});
```

### 6. Soft Delete Pattern

```typescript
// Delete (set timestamp)
await db.update(table)
  .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
  .where(eq(table.id, id))
  .returning();

// Restore (clear timestamp)
await db.update(table)
  .set({ deletedAt: null })
  .where(eq(table.id, id))
  .returning();

// SELALU exclude soft-deleted dalam query
where: and(eq(table.id, id), isNull(table.deletedAt))
```

### 7. Pagination Pattern

```typescript
const { page = 1, limit = 10, search } = input;
const offset = (page - 1) * limit;

const [items, [{ count }]] = await Promise.all([
  db.query.table.findMany({
    where: and(
      isNull(table.deletedAt),
      search ? ilike(table.name, `%${search}%`) : undefined,
    ),
    limit,
    offset,
    orderBy: desc(table.createdAt),
  }),
  db.select({ count: sql<number>`count(*)` }).from(table)
    .where(isNull(table.deletedAt)),
]);

return {
  data: items,
  pagination: {
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
  },
};
```

### 8. File Upload Pattern

```typescript
upload: protectedProcedure
  .use(formDataProcedure(uploadSchema))
  .mutation(async ({ ctx }) =>
    await runEffect(
      Effect.gen(function* () {
        const arrayBuffer = yield* Effect.tryPromise(() =>
          ctx.input.data.file.arrayBuffer()
        );
        const buffer = Buffer.from(arrayBuffer);
        const uploaded = yield* storageService.upload(buffer, filename, mimeType);
        return { url: uploaded.url };
      })
    )
  ),
```

---

## Adding a New Feature (Checklist)

Ikuti urutan ini **setiap kali** menambah fitur di domain yang ada atau domain baru:

```
1. DB Schema  → packages/db/src/schema/<domain>.ts
2. Migration  → pnpm db:generate && pnpm db:migrate
3. Queries    → packages/queries/src/<domain>/<resource>.queries.ts
4. Zod Schema → packages/schema/src/<domain>/<resource>.schema.ts
5. tRPC Router → packages/api/src/routers/<domain>/<resource>.ts
6. Register   → packages/api/src/routers/<domain>/index.ts (tambahkan ke domainRouter)
7. Frontend   → apps/web/src/routes/(core)/<path>/
8. Type check → pnpm check-types (wajib lulus)
```

> `root.ts` **tidak perlu diubah** — setiap domain router sudah terdaftar di sana.

---

## Important Rules

### Git & Perubahan Kode

- **Jangan jalankan `git commit`, `git push`, atau `gh pr create`** — sediakan perintah eksak untuk dijalankan user sendiri. Exception: jika user secara eksplisit minta *generate PR title/description*, tulis teks saja tanpa menjalankan perintah apapun.
- **Jangan pernah commit `.env`** — gunakan `.env.example` sebagai template.
- **Multi-file changes** — presentasikan checklist lengkap ke user, minta konfirmasi sebelum memulai.
- **Maksimal 2 kali** percobaan fix TypeScript type error — jika masih gagal, presentasikan alternatif solusi.

### Database & Data Integrity

- **Transaksi wajib** jika satu mutasi menyentuh lebih dari satu tabel.
- **Cascade deletes aktif** — hati-hati saat melakukan delete, bisa menghapus data terkait.
- **Jangan kembangkan schema lewat `db:push` lalu commit ALTER manual** — base `CREATE TABLE` tidak akan tertangkap sebagai SQL dan migration akan gagal di environment bersih (`relation "x" does not exist`). Selalu `pnpm db:generate` agar setiap perubahan punya file SQL lengkap.
- **Migration chain harus koheren** — jangan pernah merge `_journal.json` sampai menghasilkan idx duplikat atau dua tag dengan nomor sama. Saat resolve konflik journal/migration, pilih satu lineage; jika perlu, hapus tail yang belum pernah teraplikasi di prod (verifikasi via `drizzle.__drizzle_migrations`) dan regenerate satu migration konsolidasi dari snapshot bersih terakhir. **Jangan ubah isi file migration yang sudah teraplikasi di prod** — hash-nya harus tetap valid.
- **File uploads** harus melalui `storageService` dari `@tepian-k3/services`.
- **UUIDs selalu v7** — gunakan `uuidv7()` dari package `uuid`.
- **Selalu validasi input** dengan Zod schemas dari `@tepian-k3/schema`.

### Auth & Security

- **JWT Caching** — roles dan permissions di-cache dalam stateless JWT access token saat login. Perubahan permission di DB membutuhkan **logout + login ulang** untuk berlaku.
- **Dynamic Role Verification** — routes `/back-office`, `/employee`, dan `/display-board` menggunakan `requireRoles` untuk memblokir customers (yang hanya punya role `"user"`). User internal yang punya minimal satu role selain `"user"` dapat melewati guard dasar. Permission spesifik dicek dinamis di halaman masing-masing.
- **Dynamic Sidebar Rendering** — `app-sidebar.tsx` mengecek permissions secara dinamis. Mendukung dynamic roles dengan memperlakukan role apapun selain `"user"` sebagai internal role.

### Dokumentasi & Kode

- **JSDoc wajib** di semua exported functions, hooks, dan React components baru. Lihat [docs/JSDOC_CONVENTION.md](docs/JSDOC_CONVENTION.md).
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

Gunakan `codex` atau `claude` sesuai tool yang dipakai. Sertakan timestamp yang dapat dibaca manusia (zona waktu WITA).

---

## Business Workflow (Pengujian)

Alur bisnis utama sistem pengujian K3:

```
1. Parameter Selection    → user memilih parameter uji dari katalog
2. Add to Cart            → parameter masuk ke keranjang
3. Checkout               → buat order dari keranjang
4. Order Approval         → admin/manajer menyetujui order
5. Payment Upload         → user upload bukti pembayaran
6. Lab Testing            → teknisi lab melakukan pengujian
7. Worksheet              → entry tools, materials, costs di worksheet
8. Document Generation    → generate SPT, SPK, invoice
9. Document Signing (QR)  → tanda tangan digital + QR verification
10. Completion            → order selesai, dokumen tersimpan
```

## Business Workflow (Pelatihan) — In Progress

```
1. Browse                 → user melihat katalog pelatihan
2. Enroll / Add to Cart   → gratis langsung enroll, berbayar via cart
3. Pre-Test               → tes awal sebelum belajar
4. Study Materials        → belajar via video/PDF/PPT
5. Post-Test              → tes akhir setelah materi
6. Certificate            → sertifikat otomatis jika lulus
```

---

## Frontend Route Structure

```
apps/web/src/routes/
├── (core)/                          # Authenticated (requires login)
│   ├── back-office/                 # Internal staff (role ≠ "user")
│   │   ├── _layout.tsx              # Back-office layout
│   │   ├── dashboard/               # Main dashboard
│   │   ├── users/                   # User management
│   │   ├── roles/                   # Role management
│   │   ├── employees/               # Employee management
│   │   ├── order/                   # Order management
│   │   ├── pengujian/               # Testing management
│   │   ├── worksheet/               # Worksheet management
│   │   ├── parameter/               # Parameter catalogue
│   │   ├── tool/                    # Tool inventory
│   │   ├── pelatihan/               # Training management (in progress)
│   │   │   ├── index.tsx            # List + filter trainings
│   │   │   ├── create.tsx           # Create training form
│   │   │   ├── $pelatihanId.tsx     # Detail layout (header + tab nav)
│   │   │   └── $pelatihanId/
│   │   │       ├── overview.tsx     # Stats + info + recent activity
│   │   │       ├── materi.tsx       # Material management
│   │   │       ├── quiz.tsx         # Assessment management
│   │   │       ├── peserta.tsx      # Participant list
│   │   │       └── edit.tsx         # Edit training form
│   │   └── ...
│   ├── employee/                    # Employee self-service
│   └── display-board/               # Read-only display
└── (public)/                        # Unauthenticated
    ├── login.tsx
    ├── register.tsx
    └── verify/$token.tsx            # Document verification
```

---

## Documentation Index

| Dokumen | Topik |
|---|---|
| [docs/AI_AGENT_RULES.md](docs/AI_AGENT_RULES.md) | **⚠️ WAJIB BACA** — Aturan lengkap AI agents (backend, frontend, design, security) |
| [docs/FRONTEND_DESIGN_GUIDE.md](docs/FRONTEND_DESIGN_GUIDE.md) | **⚠️ WAJIB BACA** — UI/UX design system, component library, layout patterns |
| [docs/DEVELOPER_AND_AGENT_PLAYBOOK.md](docs/DEVELOPER_AND_AGENT_PLAYBOOK.md) | Buku Panduan Pengembang & AI Agent (Playbook) Better-T-Stack |
| [docs/PATTERNS.md](docs/PATTERNS.md) | Code patterns dan contoh lengkap |
| [docs/JSDOC_CONVENTION.md](docs/JSDOC_CONVENTION.md) | Aturan dan contoh JSDoc |
| [docs/MODULE_BOUNDARIES.md](docs/MODULE_BOUNDARIES.md) | Modular monolith boundaries |
| [docs/DOCKER_COMPOSE_GUIDE.md](docs/DOCKER_COMPOSE_GUIDE.md) | Docker setup dan troubleshooting |
| [docs/EMPLOYEE_AUTH_GUIDE.md](docs/EMPLOYEE_AUTH_GUIDE.md) | Autentikasi karyawan |
| [docs/POLYMORPHIC_RELATIONS_GUIDE.md](docs/POLYMORPHIC_RELATIONS_GUIDE.md) | Relasi polimorfik dokumen |
| [docs/DOCUMENT_VERIFICATION.md](docs/DOCUMENT_VERIFICATION.md) | Sistem verifikasi dokumen |
| [docs/PERMISSIONS_GUIDE.md](docs/PERMISSIONS_GUIDE.md) | Permission system (363 permissions) |
| [docs/PELATIHAN_FEATURE_DESIGN.md](docs/PELATIHAN_FEATURE_DESIGN.md) | Desain fitur pelatihan (LMS) |
| [docs/VERSION_PLANNING.md](docs/VERSION_PLANNING.md) | SemVer strategy + release plan |
| [docs/BRANCH_NAMING.md](docs/BRANCH_NAMING.md) | Git branch naming conventions |
| [apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md](apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md) | tRPC + TanStack Query patterns |
| [AGENT_CHANGELOG.md](AGENT_CHANGELOG.md) | Riwayat perubahan oleh AI agents |
| [TODO.md](TODO.md) | Roadmap fitur + migration checklist |
