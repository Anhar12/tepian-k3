# TODO.md - tepian-k3 Improvement Roadmap

## Legend

- [ ] Not started
- [x] Completed
- Priority: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 Critical Priority

### Testing

- [ ] Set up Vitest with monorepo configuration (`vitest.config.ts`, `vitest.workspace.ts`)
- [ ] Write unit tests for auth flows (login, register, OTP, password reset, refresh token)
- [ ] Write unit tests for query functions (`packages/queries/`) - especially `users.queries.ts`
- [ ] Write integration tests for critical routers (auth, order, document, worksheet)
- [ ] Write schema validation tests (`packages/schema/`)
- [ ] Add coverage reporting with minimum thresholds (auth: 90%, queries: 80%, routers: 80%)

### Data Integrity - Transaction Handling

- [x] Wrap `createUser()` in a transaction (user creation + default role assignment)
- [x] Wrap `updateUser()` in a transaction (role deletion + role insertion + user update)
- [x] Fix `updateUserAvatar()` - DB update BEFORE file deletion (not after)
- [x] Fix `adminCreateUser()` - wrap in transaction
- [x] Implement transaction in order router (line 349: explicit TODO in code)
- [x] Audit `worksheet.ts` for missing transactions (37+ Effect.gen calls, only 13 use transactions)

### CI/CD

- [x] Create `.github/workflows/ci.yml` (type-check, lint, test, build on PR)
- [x] Block merges without passing CI checks
- [x] Add build artifact caching for pnpm and Turborepo

### Input Validation Hardening

- [x] Replace all `z.string()` ID inputs with `z.uuidv7()` across routers
- [x] Add min/max length validation on string fields (name, email, description)
- [x] Add file upload validation (size limits, MIME type whitelist)

---

## 🟠 High Priority

### Code Quality

- [x] Set up ESLint with `typescript-eslint` for the entire monorepo
- [x] Configure lint-staged in root `package.json` (runs `eslint --fix`)
- [x] Eliminate `any` types in `form-data-parser.ts` and `table.tsx`
- [x] Eliminate remaining `any` type usages across API code
- [x] Replace `console.log` calls in production code with logger service
- [x] Remove legacy `encrypt()`/`decrypt()` auth functions

### Security

- [x] Add security headers middleware for Hono (X-Content-Type-Options, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy)
- [x] Add startup validation to reject default JWT secrets in production
- [x] Add failed login attempt lockout (5 attempts → 30 min cooldown via sliding-window rate limiter)
- [x] Support multiple CORS origins (comma-separated `CORS_ORIGIN`)
- [x] Add audit logging for permission changes (role assignment/removal)

### Frontend UX

- [ ] Add `pendingComponent` (loading skeleton) to 20+ routes that lack them
- [x] Add route-level `errorComponent` to all 14 back-office data-fetching routes
- [x] Create reusable `<TableSkeleton />` and `<FormSkeleton />` components
- [x] Create `<RouteErrorBoundary />` component

### Pagination Validation

- [x] Create shared pagination schema (`packages/schema/src/pagination.schema.ts`)
- [x] Apply shared pagination schema across all 16+ paginated endpoints

---

## 🟡 Medium Priority

### Documentation

- [ ] Create `docs/ARCHITECTURE.md` - tech choices (Effect, Drizzle, tRPC) with rationale
- [ ] Create `docs/TESTING.md` - how to write and run tests for each package
- [ ] Create `docs/DEPLOYMENT.md` - build process, migrations, environment setup
- [ ] Create `docs/TROUBLESHOOTING.md` - common issues and solutions
- [x] Convert in-code TODOs to GitHub Issues with labels

### Performance

- [ ] Audit largest routers for N+1 queries (worksheet.ts, order.ts, document.ts)
- [ ] Add Drizzle `with()` relations where needed to avoid N+1
- [ ] Configure Vite manual chunks for code splitting (vendor, router, pdf libs)
- [ ] Lazy-load TanStack Router routes for `/back-office/*` and `/pengujian/*`
- [ ] Lazy-load PDF generation imports (pdf-lib, @react-pdf/renderer)
- [ ] Add Redis caching for frequently accessed read-only data (parameters, clusters)

### Database

- [ ] Add `db:rollback` script for migration rollbacks
- [ ] Enhance seed data with realistic test scenarios
- [ ] Document production migration safety (backup, rollback, dry-run)
- [ ] Handle database constraint violations gracefully with user-friendly messages

### In-Code TODOs

- [x] `packages/api/src/routers/user.ts:14` - Add combobox search support for user lists
- [x] `packages/api/src/routers/order.ts:349` - Convert to transaction (see Critical section)
- [x] `apps/web/src/routes/(core)/worksheets/index.tsx:137` - Create worksheet items API

---

## 🟢 Low Priority

### Build & Monitoring

- [ ] Add Vite bundle analyzer (`rollup-plugin-visualizer`) as `pnpm build:analyze`
- [ ] Set bundle size budgets (fail CI if bundle > threshold)
- [ ] Add dead code / unused export detection
- [ ] Add query performance logging/monitoring

### Advanced Security

- [ ] Implement Content Security Policy (CSP) headers
- [ ] Consider TOTP/2FA for admin accounts
- [ ] Document row-level security patterns for orders, testing, documents
- [ ] Add email enumeration prevention review

### Accessibility

- [ ] Audit forms, tables, and modals for ARIA compliance
- [ ] Test keyboard navigation across all routes
- [ ] Test with screen readers (NVDA)

### Developer Experience

- [x] Add `pnpm dev:all` script to run web + server + db:studio together
- [ ] Set up MSW (Mock Service Worker) for offline/test development
- [x] Add `db:snapshot` / `db:restore` scripts for testing workflows
- [x] Add Prettier config at monorepo root (currently only in web app)

---

## Stats Snapshot

| Area                       | Current                   | Target                   |
| -------------------------- | ------------------------- | ------------------------ |
| Test files                 | 0                         | 50+                      |
| CI/CD pipelines            | 0                         | 1 (GitHub Actions)       |
| ESLint config              | ✅ Monorepo-wide          | Monorepo-wide            |
| `any` type usages          | Reduced (key files fixed) | 0                        |
| Routes with loading UI     | ~9/30                     | 30/30                    |
| Routes with error boundary | ✅ 16/30                  | 30/30                    |
| Transaction coverage       | Partial                   | All multi-step mutations |

---

## Summary of Completed Work

### Code Quality

- **ESLint**: Installed `eslint`, `@eslint/js`, `typescript-eslint` at root. Created `eslint.config.js` (flat config) with TypeScript strict rules, ignoring `dist/node_modules/.turbo/drizzle/migrations`.
- **lint-staged**: Updated root `package.json` lint-staged from empty to `"eslint --fix"`. Updated `.husky/pre-commit` to run `npx lint-staged`.
- **Legacy auth removal**: Deleted `encrypt()`/`decrypt()` from `packages/auth/src/index.ts`. Updated `packages/auth/src/utils.ts` to use `verifyAccessToken` instead.
- **console.log cleanup**: Removed debug logs from `packages/queries/src/order.queries.ts`. Replaced `console.log` with `logInfo` in `apps/server/src/index.ts` (server startup and shutdown).
- **`any` elimination**: Fixed `packages/api/src/utils/form-data-parser.ts` (introduced `FormDataRecord` type alias, typed `coerceValue` return). Fixed `packages/services/src/pdf/components/table.tsx` default generic from `any` to `unknown`.

### Security

- **Security headers**: Created `apps/server/src/middleware/secure-headers.ts` — sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Strict-Transport-Security` (production only).
- **JWT validation**: Added startup check in `apps/server/src/index.ts` — throws if JWT secrets contain placeholder values (`your-secret`, `change-this`, etc.) in production.
- **Login lockout**: Added per-email sliding-window rate limiter in `packages/api/src/routers/auth.ts` — 5 failed attempts triggers 30-minute lockout using `createRateLimiter`.
- **Multi-origin CORS**: Updated `apps/server/src/index.ts` to parse comma-separated `CORS_ORIGIN`. Changed `apps/server/env.ts` validation from `z.url()` to `z.string().min(1)`.
- **Permission audit logging**: Added audit log to `updateRolePermissions` mutation in `packages/api/src/routers/permission.ts`. Added `"role"`, `"role_permission"`, `"user_permission"` to `AuditEntityType` in `packages/types/src/audit.types.ts`.

### Frontend UX

- **RouteErrorBoundary**: Created `apps/web/src/components/route-error-boundary.tsx` — inline error card with reload button, Indonesian text.
- **Skeleton wrappers**: Created `apps/web/src/components/table-skeleton.tsx` and `apps/web/src/components/form-skeleton.tsx`.
- **errorComponent**: Added `errorComponent: RouteErrorBoundary` to all 14 back-office index routes (users, roles, parameters, parameter-categories, tools, clusters, employees, positions, kblis, orders, testings, worksheets, chemical-materials, survey-questions).

### Pagination Validation

- **Shared schema**: Created `packages/schema/src/pagination.schema.ts` with `page` (int, min 1, default 1) and `perPage` (int, min 1, max 100, default 10).
- **Applied to 16+ schemas**: cluster, tools, role, users, parameter (2 schemas), parameter-categories, employee, position, kbli, chemical-material, survey, district, regency, province, village, tool-calibration, user-company, user-company-testing-location — all now use `paginationSchema.extend({...})`.
