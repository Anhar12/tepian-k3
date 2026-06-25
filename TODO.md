# TODO.md - tepian-k3 Improvement Roadmap

## Legend

- [ ] Not started
- [x] Completed
- Priority: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Master Data Excel Import/Export (Pengujian)

> **Goal:** Menyediakan fitur impor dan ekspor data master pengujian (kategori parameter, parameter, kode alat, alat, dan bahan kimia) berbasis berkas Excel (.xlsx).

- [x] Konstanta metadata kolom dan sheet (`packages/constants/src/pengujian-excel.constants.ts`)
- [x] Skema validasi baris Zod (`packages/schema/src/pengujian/pengujian-excel.schema.ts`)
- [x] Parser Excel Service (`packages/services/src/excel/pengujian-excel.parser.ts`)
- [x] Builder Excel Service (`packages/services/src/excel/pengujian-excel.builder.ts`)
- [x] Query transaksi dan pencatatan audit log (`packages/queries/src/pengujian/pengujian-excel.queries.ts`)
- [x] Router tRPC endpoint upload & download (`packages/api/src/routers/pengujian/pengujian-excel.ts`)
- [ ] Integrasi halaman UI pengujian master data Excel di admin panel (frontend)

## Pelatihan (LMS) - Sesi Aktif & Evaluasi

> **Goal:** Mengembangkan fitur belajar mandiri secara sekuensial, kuis/ujian akhir, presensi kelas sinkronus, dan penilaian esai manual oleh instruktur.

- [x] Kolom `attendanceToken` di tabel `pelatihanSchedules`
- [x] Pembatasan materi kurikulum secara sekuensial (Sequential Lock) di layer query
- [x] Logika presensi kelas sinkronus dengan token presensi
- [x] Logika penyerahan ujian pre-test/post-test/kuis oleh pengguna
- [x] Logika penilaian esai manual beserta perhitungan ulang nilai kuis di layer query
- [x] Pengiriman notifikasi otomatis untuk pendaftaran kelas, hasil persetujuan berkas, dan nilai ujian
- [x] Layout navigasi dan ruang kelas belajar (`belajar/$enrollmentId.tsx`, `belajar/$enrollmentId/index.tsx`, `materi.$materiId.tsx`, `ujian.$assessmentId.tsx`)
- [x] Komponen peninjau hasil kuis (`quiz-result.tsx`) dan halaman cetak sertifikat (`sertifikat.$enrollmentId.tsx`)
- [x] Halaman administrasi daftar transaksi pelatihan (`transaksi.tsx`, `transaksi.$orderId.tsx`)
- [x] Panel instruktur back-office untuk menilai esai ujian (`penilaian.tsx`)

---

## Kode Alat

> **Goal:** Build a kode alat management feature in the pengujian domain, allowing lab technicians to assign unique codes to each tool for better tracking and inventory management. This includes:

- [x] New `kodeAlat` table in DB schema (pengujian module) with fields: `id`, `kode`, `isActive`, `createdAt`, `updatedAt`
- [x] New `kodeAlat` tRPC router (pengujianRouter) with mutations to create, update, deactivate kode alat, and a query to list kode alat for a given tool
- [x] New CRUD "Kode Alat" page in admin panel (frontend)

## Mengembalikan Alat

> **Goal:** Implement the "return tools" flow in pengujian, allowing users to return borrowed tools after testing is complete. This includes:

- New "Return Tools" button in worksheet details page (frontend)
- New `returnTools` tRPC mutation in `pengujianRouter`

- [x] Backend: `returnTools` mutation that:
  - Validates the worksheet is in a state that allows returning tools
  - Updates the `tool` records to set availability back to "available"
  - Creates a new `worksheetNote` with type "return" for audit purposes
  - this add `checkTool` too like the bottom one 4 checks and then determine the condition of the tool if it is good or damaged and then update the tools condition and availability based on the check tool result using select
- [ ] Frontend: "Return Tools" button that:
  - Calls `returnTools` mutation when clicked
  - Shows a confirmation modal before proceeding
  - Displays success or error notifications based on the result
  - Updates the worksheet details page to reflect the returned tools and their updated availability/condition

## Pengecekan Alat di detail alat

> **Goal:** Add a "Check Tool" button in the tool details page that shows current availability and condition, and allows users to report issues with the tool. This includes:

- New "Check Tool" button in tool details page (frontend)
- New `checkTool` tRPC query in `pengujianRouter` that returns current availability and condition, as well as a history of
  reported issues for that tool.
- New this Check Tool will determine the `tools` Condition based on the latest `Check Tool` result, and if the tool is reported as damaged, it will update the `tools` Condition to "damaged" and set availability to "unavailable". If the tool is repaired, users can update the condition back to "good" and availability to "available".

- [x] Backend: `checkTool` query that:
  - Accepts a tool ID as input
  - Returns the current availability and condition of the tool
  - There was 4 check for this first is Alat Menyala, Penyimpangan +- 5%, Kelengkapan Alat, dan Kondisi Fisik Alat and then the checker determines the overall condition based on these checks. so there will be an select for selecting condition
- [x] Frontend: "Check Tool" button that:
  - Calls `checkTool` query when clicked
  - Displays the current availability and condition of the tool
  - Shows a history of reported issues for that tool
  - If the tool is reported as damaged, show an option to update the condition and availability

---

## Modular Monolith Migration

> **Goal:** Reorganize the flat package structure into clearly bounded domain modules
> without changing any business logic or breaking existing functionality.
> Pure file/folder reorganization + import path updates only.

### Background & Decision

tepian-k3 has 4 business domains:

| Domain             | Status                    | Description                                         |
| ------------------ | ------------------------- | --------------------------------------------------- |
| **Pengujian**      | Fully built (~35 routers) | Lab testing: order → testing → worksheet → document |
| **Pelatihan**      | Fully built (LMS + Admin) | Training management                                 |
| **Uji Kompetensi** | Stub only (route.tsx)     | Competency testing                                  |
| **Konsultasi**     | Stub only (route.tsx)     | Consultation management                             |

**Why modular monolith, not microservices:**

- All 4 domains share: users, employees, documents, audit logs, notifications, geography
- Distributed transactions (e.g., worksheet completion deducting chemical stock) are trivial in monolith, complex in microservices
- Only 1 of 4 domains is built — wrong time to split
- tRPC end-to-end type safety would break across service boundaries
- No independent scaling requirements yet

**Why not stay fully flat:**

- No way to tell "this is pengujian code" from "this is platform code"
- Any file can import from any other — no boundaries enforced
- When building the 3 new features, code will mix without structure

### Module Boundaries

```
platform        <- no domain imports allowed
    ^
pengujian       <- can import from platform only
pelatihan       <- can import from platform only
uji-kompetensi  <- can import from platform only
konsultasi      <- can import from platform only
```

Domain modules CANNOT import from each other. Cross-domain data goes through `platform` exports only.

### Target Structure

```
packages/
  db/src/
    schema/
      platform.ts          <- users, roles, permissions, employees, positions,
                              geography, notifications, audit, documents, banners, news,
                              surveyQuestions, surveyResponses, surveyFeedback
      pengujian.ts         <- parameters, parameterCategories, tools, clusters,
                              chemicalMaterials, cart, order, testing, worksheets,
                              kbli, userCompany, userCompanyTestingLocation
    schema.ts              <- re-exports from both (backwards compat, no changes elsewhere)

  queries/src/
    platform/              <- 19 query files + index.ts (public API)
    pengujian/             <- 19 query files + index.ts (public API)
    pelatihan/             <- 10 query files + index.ts (LMS domain queries)
    uji-kompetensi/        <- index.ts (empty scaffold)
    konsultasi/            <- index.ts (empty scaffold)

  schema/src/ (Zod schemas)
    platform/              <- ~20 schema files + index.ts
    pengujian/             <- ~19 schema files + index.ts
    pelatihan/             <- 3 schema files + index.ts (LMS validation)
    uji-kompetensi/        <- index.ts (empty scaffold)
    konsultasi/            <- index.ts (empty scaffold)

  api/src/routers/
    platform/              <- 13 routers + index.ts (exports platformRouter)
    pengujian/             <- 14 routers + index.ts (exports pengujianRouter)
    pelatihan/             <- 9 routers + index.ts (exports pelatihanRouter, complete)
    uji-kompetensi/        <- index.ts (exports ujiKompetensiRouter, empty)
    konsultasi/            <- index.ts (exports konsultasiRouter, empty)

  api/src/root.ts          <- 5 module routers instead of 35 individual ones
```

### Phase 1 — Split DB Schema

> Risk: Low. `schema.ts` re-exports everything — no imports break anywhere.

#### Cross-module FK rules

Drizzle `.references()` creates an import dependency between schema files. The allowed
direction is pengujian → platform. The reverse direction (platform → pengujian) must be avoided.

Two issues to fix before splitting:

1. **`notifications.orderId` and `notifications.testingId`** — these are platform-side columns
   that reference pengujian tables (`order`, `testing`). Since orders use soft delete and are
   never actually hard-deleted, the cascade constraint was never firing anyway. Remove `.references()`
   and keep them as plain nullable UUIDs. Handle notification cleanup at the application level
   (mutation deletes notifications when deleting an order). `documentId` stays — `documents` is platform.

2. **`surveyQuestions`, `surveyResponses`, `surveyFeedback`** — these are order satisfaction
   surveys. `surveyResponses` references `order.id`, so they belong in pengujian, not platform.

#### Checklist

- [x] Fix `notifications` cross-module FKs in existing `schema.ts` first:
  - Change `orderId` from `.references(() => order.id, { onDelete: "cascade" })` to plain `uuid("order_id")`
  - Change `testingId` from `.references(() => testing.id, { onDelete: "cascade" })` to plain `uuid("testing_id")`
  - Run `pnpm db:generate` to create a migration that drops those FK constraints
  - Run `pnpm db:migrate`
- [x] Create `packages/db/src/schema/` directory
- [x] Create `packages/db/src/schema/platform.ts`
  - Move: `users`, `otpCodes`, `passwordResets`, `refreshTokens`
  - Move: `roles`, `permissions`, `userRoles`, `rolePermissions`, `userPermissions`
  - Move: `employees`, `positions`, `employeeCertifications`
  - Move: `provinces`, `regencies`, `districts`, `villages`
  - Move: `notifications`, `audits`
  - Move: `documents`, `documentSignatures`, `documentVerifications`
  - Move: `banners`, `news`
  - Move: related enums (`permissionActionEnum`, `auditActionEnum`, `employeeStatusEnum`, `notificationTypeEnum`, `documentEntityTypeEnum`, `documentTypeEnum`, `documentStatusEnum`)
  - NOTE: `surveyQuestions/Responses/Feedback` go to pengujian, NOT here
- [x] Create `packages/db/src/schema/pengujian.ts`
  - `pengujian.ts` imports platform tables only for `.references()` — this is the allowed direction
  - Move: `parameters`, `parameterCategories`, `parameterTools`, `parameterChemicalMaterials`
  - Move: `tools`, `toolCalibrations`, `toolCalibrationCertificates`, `toolCalibrationDocumentations`
  - Move: `clusters`, `chemicalMaterials`
  - Move: `kblis`, `userCompanies`, `userCompanyTestingLocation`
  - Move: `cart`, `order`, `orderItem`, `orderStatusHistory`
  - Move: `testing`, `testingItem`
  - Move: `worksheets`, `worksheetItems`, `worksheetTools`, `worksheetChemicalMaterials`, `worksheetNotes`, `worksheetAssignments`, `worksheetOperationalCosts`
  - Move: `surveyQuestions`, `surveyResponses`, `surveyFeedback` (references order — belongs here)
  - Move: related enums (`orderStatusEnum`, `testingStatusEnum`, `approvalStatusEnum`, `paymentStatusEnum`, `ToolsConditionEnum`, `ToolsAvailabilityEnum`, `BahanUnitEnum`, `BahanStatusEnum`, `worksheetStatusEnum`, `worksheetNoteStatusEnum`)
- [x] Update `packages/db/src/schema.ts` to re-export from `./schema/platform` and `./schema/pengujian`
- [x] Run `pnpm check-types` — must pass before proceeding

### Phase 2 — Group Query Files

> Risk: Low-medium. Import paths inside query files change, public interface stays the same.

- [x] Create `packages/queries/src/platform/` — move 19 platform query files
  - `users.queries.ts`, `roles.queries.ts`, `permission.queries.ts`, `user-permission.queries.ts`, `user-roles.queries.ts`
  - `employees.queries.ts`, `employee-certification.queries.ts`, `position.queries.ts`
  - `province.queries.ts`, `regency.queries.ts`, `district.queries.ts`, `village.queries.ts`
  - `notifications.queries.ts`, `audit.queries.ts`
  - `document.queries.ts`, `document-transaction.queries.ts`
  - `banner.queries.ts`, `news.queries.ts`
  - `otp.queries.ts`, `password-resets.queries.ts`, `refresh-tokens.queries.ts`
  - Create `index.ts` re-exporting all platform queries
  - NOTE: `survey.queries.ts` goes to pengujian, NOT here
- [x] Create `packages/queries/src/pengujian/` — move 19 pengujian query files
  - `parameter.queries.ts`, `parameter-categories.queries.ts`, `parameter-tool.queries.ts`, `parameter-chemical-material.queries.ts`
  - `tools.queries.ts`, `tool-calibration.queries.ts`, `clusters.queries.ts`, `chemical-material.queries.ts`
  - `kbli.queries.ts`, `user-company.queries.ts`, `user-company-testing-location.queries.ts`
  - `cart.queries.ts`, `order.queries.ts`, `order-item.queries.ts`, `order-status-history.queries.ts`
  - `testing.queries.ts`, `worksheet.queries.ts`, `worksheet-note.queries.ts`, `survey.queries.ts`
  - Create `index.ts` re-exporting all pengujian queries
- [x] Scaffold: `pelatihan/index.ts`, `uji-kompetensi/index.ts`, `konsultasi/index.ts`
- [x] Run `pnpm check-types`

### Phase 3 — Group Zod Schema Files

> Risk: Low. Only import paths change, Zod schema shapes are unchanged.

- [x] Create `packages/schema/src/platform/` — move ~20 schema files
  - `auth.schema.ts`, `users.schema.ts`, `role.schema.ts`, `password.schema.ts`, `otp.schema.ts`
  - `employee.schema.ts`, `employee-certification.schema.ts`, `position.schema.ts`
  - `province.schema.ts`, `district.schema.ts`, `regency.schema.ts`, `village.schema.ts`
  - `notification.schema.ts`, `audit.schema.ts`, `event.schema.ts`
  - `document.schema.ts`, `banner.schema.ts`, `news.schema.ts`
  - `filter.schema.ts`, `pagination.schema.ts`
  - Create `index.ts`
  - NOTE: `survey.schema.ts` goes to pengujian, NOT here
- [x] Create `packages/schema/src/pengujian/` — move ~19 schema files
  - `parameter.schema.ts`, `parameter-categories.schema.ts`, `parameter-tool.schema.ts`, `parameter-chemical-material.schema.ts`
  - `tools.schema.ts`, `tool-calibration.schema.ts`, `cluster.schema.ts`, `chemical-material.schema.ts`
  - `kbli.schema.ts`, `user-company.schema.ts`, `user-company-testing-location.schema.ts`
  - `cart.schema.ts`, `order.schema.ts`, `order-item.schema.ts`
  - `testing.schema.ts`, `testing-item.schema.ts`, `worksheet.schema.ts`
  - `survey.schema.ts`, `generate-document.schema.ts`
  - Create `index.ts`
- [x] Scaffold: `pelatihan/index.ts`, `uji-kompetensi/index.ts`, `konsultasi/index.ts`
- [x] Update all `@tepian-k3/schema/*` import paths in routers and queries
- [x] Run `pnpm check-types`

### Phase 4 — Group API Routers

> Risk: Medium. `root.ts` changes + all frontend tRPC calls need updating.

- [x] Create `packages/api/src/routers/platform/` — move 13 routers
  - `auth.ts`, `user.ts`, `role.ts`, `permission.ts`
  - `employee.ts`, `employee-certification.ts`, `position.ts`
  - `province.ts`, `regency.ts`, `district.ts`, `village.ts`
  - `notifications.ts`, `event.ts`, `audit.ts`, `document.ts`, `banner.ts`, `news.ts`
  - Create `index.ts` exporting `platformRouter`
- [x] Create `packages/api/src/routers/pengujian/` — move 14 routers
  - `parameter.ts`, `parameter-categories.ts`, `parameter-tool.ts`, `parameter-chemical-material.ts`
  - `tool.ts`, `cluster.ts`, `chemical-material.ts`
  - `cart.ts`, `order.ts`, `order.notification-config.ts`, `test.ts`, `testing.ts`
  - `worksheet.ts`, `survey.ts`, `kbli.ts`, `user-company.ts`, `user-company-testing-location.ts`, `generate-document.ts`
  - Create `index.ts` exporting `pengujianRouter`
- [x] Scaffold module routers:
  - `pelatihan/index.ts` — empty `pelatihanRouter`
  - `uji-kompetensi/index.ts` — empty `ujiKompetensiRouter`
  - `konsultasi/index.ts` — empty `konsultasiRouter`
- [x] Update `packages/api/src/root.ts`:
  ```ts
  export const appRouter = createTRPCRouter({
    platform: platformRouter,
    pengujian: pengujianRouter,
    pelatihan: pelatihanRouter,
    ujiKompetensi: ujiKompetensiRouter,
    konsultasi: konsultasiRouter,
  });
  ```
- [x] Update all frontend tRPC calls in `apps/web/src/` (see mapping table below)
- [x] Run `pnpm check-types`

### Phase 5 — Enforce Boundaries (Lint Rules)

> Risk: Zero. Additive only.

- [x] Add `eslint-plugin-import` boundary rules — domain modules cannot import from each other
- [x] Create `docs/MODULE_BOUNDARIES.md` for future contributors

---

### Frontend tRPC Call Mapping (for Phase 4)

| Before                              | After                                         |
| ----------------------------------- | --------------------------------------------- |
| `trpc.auth.*`                       | `trpc.platform.auth.*`                        |
| `trpc.user.*`                       | `trpc.platform.user.*`                        |
| `trpc.role.*`                       | `trpc.platform.role.*`                        |
| `trpc.permission.*`                 | `trpc.platform.permission.*`                  |
| `trpc.employee.*`                   | `trpc.platform.employee.*`                    |
| `trpc.employeeCertification.*`      | `trpc.platform.employeeCertification.*`       |
| `trpc.position.*`                   | `trpc.platform.position.*`                    |
| `trpc.province.*`                   | `trpc.platform.province.*`                    |
| `trpc.regency.*`                    | `trpc.platform.regency.*`                     |
| `trpc.district.*`                   | `trpc.platform.district.*`                    |
| `trpc.village.*`                    | `trpc.platform.village.*`                     |
| `trpc.notifications.*`              | `trpc.platform.notifications.*`               |
| `trpc.event.*`                      | `trpc.platform.event.*`                       |
| `trpc.audit.*`                      | `trpc.platform.audit.*`                       |
| `trpc.document.*`                   | `trpc.platform.document.*`                    |
| `trpc.banner.*`                     | `trpc.platform.banner.*`                      |
| `trpc.news.*`                       | `trpc.platform.news.*`                        |
| `trpc.parameter.*`                  | `trpc.pengujian.parameter.*`                  |
| `trpc.parameterCategories.*`        | `trpc.pengujian.parameterCategories.*`        |
| `trpc.parameterTool.*`              | `trpc.pengujian.parameterTool.*`              |
| `trpc.parameterChemicalMaterial.*`  | `trpc.pengujian.parameterChemicalMaterial.*`  |
| `trpc.tool.*`                       | `trpc.pengujian.tool.*`                       |
| `trpc.cluster.*`                    | `trpc.pengujian.cluster.*`                    |
| `trpc.chemicalMaterial.*`           | `trpc.pengujian.chemicalMaterial.*`           |
| `trpc.cart.*`                       | `trpc.pengujian.cart.*`                       |
| `trpc.order.*`                      | `trpc.pengujian.order.*`                      |
| `trpc.test.*`                       | `trpc.pengujian.test.*`                       |
| `trpc.testing.*`                    | `trpc.pengujian.testing.*`                    |
| `trpc.worksheet.*`                  | `trpc.pengujian.worksheet.*`                  |
| `trpc.survey.*`                     | `trpc.pengujian.survey.*`                     |
| `trpc.kbli.*`                       | `trpc.pengujian.kbli.*`                       |
| `trpc.userCompany.*`                | `trpc.pengujian.userCompany.*`                |
| `trpc.userCompanyTestingLocation.*` | `trpc.pengujian.userCompanyTestingLocation.*` |
| `trpc.generateDocument.*`           | `trpc.pengujian.generateDocument.*`           |

---

### New Feature Convention (Pelatihan / Uji Kompetensi / Konsultasi)

When building a new domain module, follow this order:

1. Add DB tables to `packages/db/src/schema/<module>.ts`
2. Add queries to `packages/queries/src/<module>/`
3. Add Zod schemas to `packages/schema/src/<module>/`
4. Add routers to `packages/api/src/routers/<module>/`
5. Export from the module's `index.ts`
6. Module router is already registered in `root.ts` — no change needed there

### Phase 6 — Group Types Package

> Risk: Low. Only file/folder reorganization + import path updates. The `./*` export in `package.json` already supports deep imports so consumer paths like `@tepian-k3/types/users.types` continue to work after moving files into subdirectories.

- [x] Create `packages/types/src/platform/` — move platform type files:
  - `users.types.ts`, `employee.types.ts`, `position.types.ts`
  - `permission.types.ts`, `roles.types.ts`
  - `document.types.ts`
  - `provinces.types.ts`, `regencies.types.ts`, `districts.types.ts`, `villages.types.ts`
  - Also moved: `auth.types.ts`, `audit.types.ts`, `banner.types.ts`, `news.types.ts`
- [x] Create `packages/types/src/pengujian/` — move pengujian type files:
  - `parameters.types.ts`, `parameter-categories.types.ts`, `parameter-chemical-material.types.ts`
  - `clusters.types.ts`, `chemical-material.types.ts`
  - `tool-calibration.types.ts`, `tool-calibration-certificate.types.ts`, `tool-calibration-documentation.types.ts`
  - `cart.types.ts`, `order-item.types.ts`, `order-status-history.types.ts`
  - `testing.types.ts`, `testing-item.types.ts`
  - `worksheet-assignment.types.ts`
  - `kbli.types.ts`, `user-company.types.ts`, `user-company-testing-location.types.ts`
  - `survey.types.ts`
  - Also moved: `order.types.ts`, `worksheet.types.ts`, `parameter-tool.types.ts`, `tool-codes.types.ts`, `tools.types.ts`
- [x] Scaffold empty directories: `pelatihan/`, `uji-kompetensi/`, `konsultasi/`
- [x] Update `packages/types/package.json` exports to include subdirectory paths
- [x] Update all `@tepian-k3/types/*` import paths across the monorepo
- [x] Enforce boundaries: add `...boundaries` to `packages/types/eslint.config.js`, update `boundaries.js` file patterns, add `packages/types` to root `eslint.config.js`
- [x] Run `pnpm check-types`

### Execution Order

Run phases in sequence. Each phase must pass `pnpm check-types` before proceeding.

```
Phase 1 (DB Schema split)     -> safe, no downstream import changes
Phase 2 (Query grouping)      -> update imports within query files only
Phase 3 (Zod schema grouping) -> update imports in routers + queries
Phase 4 (Router grouping)     -> update root.ts + all frontend trpc calls  <- biggest step
Phase 5 (Lint boundaries)     -> additive only, no code changes
Phase 6 (Types grouping)      -> update imports across all packages
```

Phases 1-3 are internal refactors with zero visible effect on the running app.
Phase 4 is the only phase that changes the public tRPC API surface.
