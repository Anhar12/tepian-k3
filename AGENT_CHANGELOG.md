# Agent Changelog

> Every time an agent modifies this file or makes significant codebase changes, it MUST append an entry here.
> Format: `### YYYY-MM-DD — <short description>`

---

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
