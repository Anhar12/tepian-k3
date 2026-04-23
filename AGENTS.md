# AGENTS.md

This file provides guidance to Codex (and other AI agents) when working with code in this repository.

---

## TL;DR

- **Stack:** TypeScript monorepo, Hono + tRPC backend, React 19 + TanStack Router frontend, PostgreSQL + Drizzle ORM, JWT auth
- **Package manager:** pnpm + Turborepo. Always use `pnpm`, never `npm` or `yarn`
- **Dev:** `pnpm dev` (web :3001, server :3000)
- **DB changes:** edit `packages/db/src/schema.ts` → `pnpm db:generate` → `pnpm db:migrate`
- **New feature:** create schema → queries → router → register in `packages/api/src/root.ts`
- **All queries** use Effect (`Effect.gen`, `runEffect`). All mutations log to audit table.
- **All tables** use UUIDv7 PKs and soft deletes (`deletedAt`).
- **Error messages** are in Bahasa Indonesia.
- **35 tRPC routers**, **~1685-line schema**, strict TypeScript throughout.
- **JSDoc required** on all new exported functions, hooks, and components. See [docs/JSDOC_CONVENTION.md](docs/JSDOC_CONVENTION.md).
- **Stop after 2 failed TS type attempts** — present alternatives instead.

---

## Project Overview

**tepian-k3** is a K3 (Kesehatan dan Keselamatan Kerja) laboratory testing management system built with the Better-T-Stack, providing end-to-end type safety from PostgreSQL to React UI.

**Tech Stack:**

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** React 19 + TanStack Router + shadcn/ui + TailwindCSS 4
- **Backend:** Hono + tRPC
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** JWT (HS256) with role-based permissions via `jose`
- **Language:** TypeScript 5+ strict mode

---

## Commands

```bash
# Dev
pnpm dev              # All apps (web :3001, server :3000)
pnpm dev:web          # Web only
pnpm dev:server       # Server only
pnpm build            # Build all
pnpm check-types      # Type check monorepo
pnpm web:prettier     # Format web app

# Database
pnpm db:push          # Push schema (dev only)
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations (prod)
pnpm db:studio        # Drizzle Studio GUI
pnpm db:seed          # Seed database
pnpm db:reset         # Reset + re-migrate
```

---

## Architecture

### Monorepo Structure

```
tepian-k3/
├── apps/
│   ├── web/        # React frontend (TanStack Router)
│   └── server/     # Hono backend with tRPC handler
└── packages/
    ├── api/        # tRPC routers (35 routers)
    ├── auth/       # JWT authentication + middleware
    ├── db/         # Drizzle schema + migrations (~1685 lines)
    ├── queries/    # Effect-based DB query functions
    ├── schema/     # Zod validation schemas
    ├── services/   # Email, storage, logger, PDF, doc-signing, rate-limiter
    ├── constants/  # App-wide constants and enums
    ├── types/      # Shared TypeScript types
    ├── utils/      # Shared utility functions
    ├── config/     # Shared configs (tsconfig.base.json)
    └── shared/     # Cross-app utilities
```

**Build order:** `constants → types → schema → db → queries → services → auth → api → apps`

**Import namespace:** `@tepian-k3/*` (e.g. `@tepian-k3/db/client`, `@tepian-k3/schema/user.schema`)

### tRPC Routers (35)

| Group              | Routers                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Auth & Users       | `auth`, `user`, `role`, `permission`                                                                                    |
| Orders             | `order`, `cart`                                                                                                         |
| Testing            | `testing`, `test`, `worksheet`                                                                                          |
| Documents          | `document`, `generateDocument`                                                                                          |
| Parameters & Tools | `parameter`, `parameterCategories`, `parameterTool`, `parameterChemicalMaterial`, `tool`, `cluster`, `chemicalMaterial` |
| Employees          | `employee`, `employeeCertification`, `position`                                                                         |
| Geography          | `province`, `regency`, `district`, `village`                                                                            |
| Company            | `userCompany`, `userCompanyTestingLocation`, `kbli`                                                                     |
| Content            | `banner`, `news`, `survey`                                                                                              |
| System             | `notifications`, `event`, `audit`                                                                                       |

### Database Tables

| Group             | Tables                                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users & Auth      | `users`, `otpCodes`, `passwordResets`                                                                                                                 |
| Authorization     | `roles`, `permissions`, `userRoles`, `rolePermissions`, `userPermissions`                                                                             |
| Companies         | `userCompanies`, `userCompanyTestingLocation`, `kblis`                                                                                                |
| Testing           | `parameters`, `parameterCategories`, `clusters`, `tools`, `parameterTools`, `parameterChemicalMaterials`, `chemicalMaterials`                         |
| Tool Calibrations | `toolCalibrations`, `toolCalibrationCertificates`, `toolCalibrationDocumentations`                                                                    |
| Orders            | `order`, `orderItem`, `cart`, `orderStatusHistory`                                                                                                    |
| Testing Process   | `testing`, `testingItem`                                                                                                                              |
| Worksheets        | `worksheets`, `worksheetItems`, `worksheetTools`, `worksheetChemicalMaterials`, `worksheetNotes`, `worksheetAssignments`, `worksheetOperationalCosts` |
| Employees         | `employees`, `positions`, `employeeCertifications`                                                                                                    |
| Documents         | `documents`, `documentSignatures`, `documentVerifications`                                                                                            |
| Geography         | `provinces`, `regencies`, `districts`, `villages`                                                                                                     |
| Content           | `banners`, `news`, `surveyQuestions`, `surveyResponses`, `surveyFeedback`                                                                             |
| Audit             | `audits`                                                                                                                                              |

---

## Key Patterns

### Schema conventions

```typescript
// UUIDv7 primary key
id: uuid("id").primaryKey().notNull().$default(() => uuidv7())

// Soft delete via timestamps spread
...timestamps  // adds createdAt, updatedAt, deletedAt

// Unique index that ignores soft-deleted rows
uniqueIndex("name_idx").on(table.name).where(sql`${table.deletedAt} IS NULL`)
```

### tRPC procedure types

| Procedure                                                             | Use when                     |
| --------------------------------------------------------------------- | ---------------------------- |
| `publicProcedure`                                                     | No auth needed               |
| `protectedProcedure`                                                  | Any logged-in user           |
| `withPermission(p)`                                                   | Specific permission required |
| `withRole(r)` / `withAnyRole` / `withAllRoles`                        | Role-based access            |
| `withRateLimit` / `withProtectedRateLimit` / `withRoleBasedRateLimit` | Rate limiting                |
| `formDataProcedure(schema)`                                           | File uploads                 |

---

## Important Rules

- **Never commit `.env`** — use `.env.example` as template
- **Transactions required** when mutations touch multiple tables
- **Always validate input** with Zod schemas from `@tepian-k3/schema`
- **UUIDs are v7** — use `uuidv7()` from the `uuid` package
- **Cascade deletes** are enabled — be careful with deletions
- **File uploads** must go through `storageService`
- **Permission checks** are runtime — cached in JWT, re-validated on sensitive ops
- **Multi-file changes** — present a full checklist to the user before starting, get confirmation
- **New docs** go in the relevant package's `docs/` folder
- **Cross-module or generated code** — add an authorship comment at the top of the file or section:

  ```typescript
  ##################
  # authored (generated by codex, Apr 24 2026 22:00 WITA)
  ##################

  // ... generated code here ...

  ##################
  # end authored
  ##################
  ```

  Use `codex` or `claude` depending on which tool generated it. Include a human-readable timestamp (e.g. `Apr 24 2026 22:00 WITA`) at generation time. For a full generated file, place the opening comment at the very top and the closing comment at the very bottom. For a partial section, wrap only the generated block.

---

## Testing Workflow (Business Logic)

1. Parameter Selection → 2. Add to Cart → 3. Checkout → 4. Order Approval → 5. Payment Upload → 6. Lab Testing → 7. Worksheet (tools, materials, costs) → 8. Document Generation → 9. Document Signing (QR) → 10. Completion

---

## Documentation Index

| File                                                                                     | Topic                            |
| ---------------------------------------------------------------------------------------- | -------------------------------- |
| [docs/PATTERNS.md](docs/PATTERNS.md)                                                     | Code patterns and examples       |
| [docs/JSDOC_CONVENTION.md](docs/JSDOC_CONVENTION.md)                                     | JSDoc rules and examples         |
| [docs/DOCKER_COMPOSE_GUIDE.md](docs/DOCKER_COMPOSE_GUIDE.md)                             | Docker setup and troubleshooting |
| [docs/EMPLOYEE_AUTH_GUIDE.md](docs/EMPLOYEE_AUTH_GUIDE.md)                               | Employee authentication          |
| [docs/POLYMORPHIC_RELATIONS_GUIDE.md](docs/POLYMORPHIC_RELATIONS_GUIDE.md)               | Document polymorphic relations   |
| [docs/DOCUMENT_VERIFICATION.md](docs/DOCUMENT_VERIFICATION.md)                           | Document verification system     |
| [apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md](apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md) | tRPC + TanStack Query patterns   |
| [docs/BRANCH_NAMING.md](docs/BRANCH_NAMING.md)                                           | Git branch naming conventions    |
| [docs/VERSION_PLANNING.md](docs/VERSION_PLANNING.md)                                     | SemVer strategy and release plan |
| [AGENT_CHANGELOG.md](AGENT_CHANGELOG.md)                                                 | Agent change history             |
