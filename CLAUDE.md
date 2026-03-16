# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Changelog

> After any significant change to this file or the codebase, append an entry to [AGENT_CHANGELOG.md](AGENT_CHANGELOG.md).

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

# Email testing
pnpm email:dev        # Start Ethereal test server
pnpm email:verify     # Send test verification email

# Docker
docker compose up -d                              # All services
docker compose -f docker-compose.infra.yml up -d  # Infrastructure only
docker compose -f docker-compose.server.yml up -d # API server only
docker compose -f docker-compose.web.yml up -d    # Web frontend only
docker compose exec postgres psql -U tepian -d tepian_k3

# pnpm workspace
pnpm add <pkg> -w                          # Root
pnpm add <pkg> --filter @tepian-k3/web     # Web app
pnpm add <pkg> --filter @tepian-k3/server  # Server
turbo -F @tepian-k3/web dev                # Run in specific package
rm -rf .turbo && pnpm turbo run build --force  # Clear cache + rebuild
```

See [Docker Compose Guide](docs/DOCKER_COMPOSE_GUIDE.md) for full Docker details.

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

### Frontend Routes (`apps/web/src/routes/`)

- `(auth)/` — login, register, verify-email (public)
- `(core)/` — protected routes:
  - `dashboard/`, `back-office/`, `pengujian/`, `worksheets/`, `employee/`, `display-board/`
  - `konsultasi/`, `pelatihan/`, `uji-kompetensi/`
  - `document.tsx`, `notifications.tsx`, `pdf-editor.tsx`, `profile.tsx`, `settings.tsx`
- `verify.$token.tsx`, `unauthorized.tsx`

### Services (`packages/services/src/`)

| Service                      | Description                                                |
| ---------------------------- | ---------------------------------------------------------- |
| `storage/`                   | Filesystem / MinIO / S3 — via `STORAGE_PROVIDER`           |
| `email/`                     | Nodemailer / Resend — via `EMAIL_PROVIDER`                 |
| `logger/`                    | Winston — console + rotating file                          |
| `image/`                     | Image optimization and format conversion                   |
| `pdf/`                       | PDF generation + QR embedding via pdf-lib                  |
| `document-signing/`          | JWT-based signatures + QR verification                     |
| `rate-limiter/`              | Sliding-window / token-bucket / fixed-window, Redis-backed |
| `notifications/event-bus.ts` | SSE for real-time updates                                  |

---

## Key Patterns

See [docs/PATTERNS.md](docs/PATTERNS.md) for full code examples covering:

- Effect-based query functions
- Standard CRUD router structure
- Soft delete / restore
- Pagination
- Audit logging
- File upload
- Rate limiting
- Document verification flow
- Frontend route protection
- tRPC client usage (classic, modern, direct)

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

### JWT token payload

```typescript
{ id, email, roles: string[], permissions: string[], createdAt, updatedAt, exp, iat, jti }
```

---

## Testing Workflow (Business Logic)

1. Parameter Selection → 2. Add to Cart → 3. Checkout → 4. Order Approval → 5. Payment Upload → 6. Lab Testing → 7. Worksheet (tools, materials, costs) → 8. Document Generation → 9. Document Signing (QR) → 10. Completion

---

## Environment Variables

```env
# Required
POSTGRES_URL=postgresql://user:password@localhost:5432/db_name
SERVER_HOSTNAME=localhost
SERVER_PORT=3000
NODE_ENV=development
JWT_SECRET=...                          # min 32 chars
JWT_RESET_PASSWORD_SECRET=...
JWT_DOCUMENT_SECRET=...
JWT_LEGAL_DOCUMENT_SECRET=...
JWT_TESTING_DOCUMENT_SECRET=...
JWT_COMPANY_DOCUMENT_SECRET=...
DOCUMENT_QR_EXPIRATION=7d
DOCUMENT_VERIFICATION_BASE_URL=http://localhost:3001/verify
VITE_API_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001

# Optional
EMAIL_PROVIDER=ethereal                 # or 'resend'
EMAIL_FROM=noreply@example.com
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
STORAGE_PROVIDER=filesystem             # or 'minio', 's3'
STORAGE_PATH=./uploads
MEMURAI_HOST=localhost
MEMURAI_PORT=6379
```

Env vars are validated with `@t3-oss/env-core` in each package and passed through Turborepo via `globalPassThroughEnv`.

---

## Important Rules

- **Never commit `.env`** — use `.env.example` as template
- **Transactions required** when mutations touch multiple tables
- **Always validate input** with Zod schemas from `@tepian-k3/schema`
- **UUIDs are v7** — use `uuidv7()` from the `uuid` package
- **Cascade deletes** are enabled — be careful with deletions
- **File uploads** must go through `storageService`
- **Permission checks** are runtime — cached in JWT, re-validated on sensitive ops
- **TanStack Router issues** — check https://tanstack.com/router/latest/docs first, not generic React docs
- **Multi-file changes** — present a full checklist to the user before starting, get confirmation
- **New docs** go in the relevant package's `docs/` folder

---

## Branch Naming & Versioning

See [docs/BRANCH_NAMING.md](docs/BRANCH_NAMING.md) and [docs/VERSION_PLANNING.md](docs/VERSION_PLANNING.md) for full details.

### Branch Format

```
<type>/<scope>[-<description>]
```

| Type        | SemVer Impact | Merges Into      | Use When                               |
| ----------- | ------------- | ---------------- | -------------------------------------- |
| `feat/`     | MINOR / MAJOR | `beta` or parent | New feature or module                  |
| `fix/`      | PATCH         | `beta`           | Non-critical bug fix                   |
| `hotfix/`   | PATCH         | `main` + `beta`  | Critical production fix                |
| `chore/`    | PATCH         | `beta`           | Dependencies, config, CI/CD, tooling   |
| `refactor/` | PATCH         | `beta`           | Code restructuring, no behavior change |
| `docs/`     | None          | `beta`           | Documentation only                     |

**Layer prefixes** for sub-branches: `db-`, `api-`, `svc-`, `ui-` (e.g. `feat/pelatihan-ui-browse`)

**Long-lived branches:** `main` (production, tagged releases) and `beta` (staging / pre-release)

### Versioning (SemVer)

| Bump    | When                                                        |
| ------- | ----------------------------------------------------------- |
| `PATCH` | Bug fixes, small tweaks, column changes on existing tables  |
| `MINOR` | New API endpoints, new UI pages, new tables                 |
| `MAJOR` | New business domain modules (e.g. entirely new feature set) |

**Rules:**

- Never put version numbers in branch names — use git tags (`v2.0.0-alpha.1`)
- Always use kebab-case, keep names under 50 characters
- `hotfix/*` branches from `main`, merges into `main` + `beta`
- All other types (`feat/`, `fix/`, `chore/`, etc.) branch from `beta`, merge into `beta`
- **Never branch `fix/` or `chore/` from `beta` and merge directly to `main`** — this drags all unreleased `beta` commits into the release
- After every merge to `main`, sync `beta`: `git checkout beta && git merge main && git push origin beta`

---

## Documentation Index

| File                                                                                           | Topic                            |
| ---------------------------------------------------------------------------------------------- | -------------------------------- |
| [docs/PATTERNS.md](docs/PATTERNS.md)                                                           | Code patterns and examples       |
| [docs/JSDOC_CONVENTION.md](docs/JSDOC_CONVENTION.md)                                           | JSDoc rules and examples         |
| [docs/DOCKER_COMPOSE_GUIDE.md](docs/DOCKER_COMPOSE_GUIDE.md)                                   | Docker setup and troubleshooting |
| [docs/EMPLOYEE_AUTH_GUIDE.md](docs/EMPLOYEE_AUTH_GUIDE.md)                                     | Employee authentication          |
| [docs/POLYMORPHIC_RELATIONS_GUIDE.md](docs/POLYMORPHIC_RELATIONS_GUIDE.md)                     | Document polymorphic relations   |
| [docs/DOCUMENT_VERIFICATION.md](docs/DOCUMENT_VERIFICATION.md)                                 | Document verification system     |
| [docs/PDF_EDITOR_USER_GUIDE.md](docs/PDF_EDITOR_USER_GUIDE.md)                                 | PDF signing and QR embedding     |
| [packages/api/docs/RATE_LIMITING_MIDDLEWARE.md](packages/api/docs/RATE_LIMITING_MIDDLEWARE.md) | Rate limiting middleware         |
| [apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md](apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md)       | tRPC + TanStack Query patterns   |
| [docs/BRANCH_NAMING.md](docs/BRANCH_NAMING.md)                                                 | Git branch naming conventions    |
| [docs/VERSION_PLANNING.md](docs/VERSION_PLANNING.md)                                           | SemVer strategy and release plan |
| [AGENT_CHANGELOG.md](AGENT_CHANGELOG.md)                                                       | Agent change history             |
