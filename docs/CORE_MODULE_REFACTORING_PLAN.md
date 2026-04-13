# Core Module Refactoring Plan

## Goal

Refactor `apps/web/src/routes/(core)` to support 4 service modules cleanly:

- `pengujian`
- `pelatihan`
- `uji-kompetensi`
- `konsultasi`

while keeping role-based routes (`public`, `employee`, `back-office`, `dashboard`) easy to maintain.

## Recommended Architecture

Keep **file-based routes** for URL structure, but move feature logic into **module folders**.

### Route layer (thin)

Location:

`apps/web/src/routes/(core)`

Responsibilities:

- Route declaration (`createFileRoute`)
- Page composition only
- Import screen components from module layer

### Module layer (feature ownership)

Location:

`apps/web/src/modules`

Responsibilities:

- Feature UI, domain logic, queries, schema adapters, shared constants
- Ownership by business module

## Folder Structure (Target)

```txt
apps/web/src/
  routes/
    (core)/
      pengujian/
      pelatihan/
      uji-kompetensi/
      konsultasi/
      employee/
      back-office/
      dashboard/
  modules/
    pengujian/
      public/
      employee/
      back-office/
      dashboard/
      shared/
    pelatihan/
      public/
      employee/
      back-office/
      dashboard/
      shared/
    uji-kompetensi/
      public/
      employee/
      back-office/
      dashboard/
      shared/
    konsultasi/
      public/
      employee/
      back-office/
      dashboard/
      shared/
```

## Rules of Split

1. Keep `back-office` and `dashboard` as shared route shells/layouts.
2. Create module-specific pages inside them.
3. Avoid putting business logic directly in route files.
4. Put reusable cross-role logic in `modules/<module>/shared`.
5. If UI is identical but data differs, reuse component and inject module config.

## Routing Recommendation

Use role-first URLs, module-second pages for internal areas:

- `/back-office/pengujian/*`
- `/back-office/pelatihan/*`
- `/back-office/uji-kompetensi/*`
- `/back-office/konsultasi/*`
- `/dashboard/pengujian/*`
- `/dashboard/pelatihan/*`
- `/dashboard/uji-kompetensi/*`
- `/dashboard/konsultasi/*`

Public service flow can stay module-first:

- `/pengujian/*`
- `/pelatihan/*`
- `/uji-kompetensi/*`
- `/konsultasi/*`

## Incremental Migration Plan

### Phase 1 (Pilot: Pengujian)

1. Create `apps/web/src/modules/pengujian/*`.
2. Move complex UI + logic from routes to module screens/components.
3. Keep route files as thin wrappers importing from module layer.
4. Verify route behavior unchanged.

### Phase 2 (Template Expansion)

1. Scaffold same structure for `pelatihan`, `uji-kompetensi`, `konsultasi`.
2. Add module config objects (label, color, permissions, endpoints).
3. Reuse shared shells for `back-office` and `dashboard`.

### Phase 3 (Standardization)

1. Enforce import boundaries (route -> module, not module -> route).
2. Normalize naming: kebab-case for route folders, consistent module keys.
3. Add docs for how to add a new service module.

## Definition of Done

- Every route under `(core)` has thin route files.
- Each module owns its business logic in `apps/web/src/modules/<module>`.
- Back-office and dashboard are shared shells with module-specific pages.
- No duplicated business logic across module areas.
- New module can be added with predictable structure and minimal copy-paste.

## Suggested Next Execution

1. Migrate only `pengujian` first.
2. After stable, scaffold the other 3 modules using the same template.
3. Add lint/import rule to prevent route-layer business logic growth.
