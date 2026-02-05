# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript monorepo. The primary stack is: TypeScript, tRPC, TanStack Query, TanStack Router, Vite, React, Docker/Coolify for deployment. Always assume TypeScript strict mode is enabled.

**tepian-k3** is a TypeScript monorepo for a K3 (Kesehatan dan Keselamatan Kerja / Occupational Health and Safety) laboratory testing management system. Built with the Better-T-Stack, it provides end-to-end type safety from PostgreSQL to React UI using tRPC, Drizzle ORM, and TanStack Router.

**Tech Stack:**

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** React 19 + TanStack Router + shadcn/ui + TailwindCSS 4
- **Backend:** Hono + tRPC
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** JWT with role-based permissions
- **Language:** TypeScript 5+ with strict type checking

## Common Commands

### Development

```bash
pnpm dev              # Start all apps (web on :3001, server on :3000)
pnpm dev:web          # Start only web app
pnpm dev:server       # Start only API server
```

### Building

```bash
pnpm build            # Build all packages and apps
pnpm check-types      # Type check entire monorepo
```

### Database

```bash
pnpm db:push          # Push schema changes (development only)
pnpm db:generate      # Generate migration files
pnpm db:migrate       # Run migrations (production)
pnpm db:studio        # Open Drizzle Studio GUI at https://local.drizzle.studio
pnpm db:seed          # Seed database with initial data
pnpm db:reset         # Reset database and re-run migrations
```

### Testing Email

```bash
pnpm email:dev        # Start Ethereal email test server
pnpm email:verify     # Send test verification email
```

### Code Quality

```bash
pnpm web:prettier     # Format web app with Prettier
```

## Architecture Overview

### Monorepo Structure

```
tepian-k3/
├── apps/
│   ├── web/           # React frontend (TanStack Router)
│   └── server/        # Hono backend with tRPC handler
└── packages/
    ├── api/           # tRPC routers (23 routers)
    ├── auth/          # JWT authentication + middleware
    ├── db/            # Drizzle schema + migrations
    ├── queries/       # Database query functions (Effect-based)
    ├── schema/        # Zod validation schemas
    ├── services/      # Email, storage, logging, PDF, document signing
    ├── constants/     # App-wide constants and enums
    ├── types/         # Shared TypeScript types
    ├── utils/         # Shared utility functions
    ├── config/        # Shared configs (tsconfig.base.json)
    └── shared/        # Cross-app utilities
```

### Package Dependency Order

Packages must be built in dependency order (Turborepo handles this automatically):

```
constants → types → schema → db → queries → services → auth → api → apps
```

### Import Pattern

All packages use the `@tepian-k3/*` namespace:

```typescript
import { userRouter } from "@tepian-k3/api/routers/users";
import { db } from "@tepian-k3/db/client";
import { userSchema } from "@tepian-k3/schema/user.schema";
import { usersQueries } from "@tepian-k3/queries/users.queries";
```

## Database Schema Architecture

**Location:** `packages/db/src/schema.ts` (1018 lines)

### Key Patterns

1. **UUIDs v7 for Primary Keys:** All tables use UUIDv7 (time-sortable)

   ```typescript
   id: uuid("id")
     .primaryKey()
     .notNull()
     .$default(() => uuidv7());
   ```

2. **Soft Deletes:** All tables include `timestamps` with `deletedAt`

   ```typescript
   ...timestamps  // Adds createdAt, updatedAt, deletedAt
   ```

3. **Unique Constraints with Soft Delete:**

   ```typescript
   uniqueIndex("email_deleted_at_unique_idx")
     .on(table.email)
     .where(sql`${table.deletedAt} IS NULL`);
   ```

4. **Polymorphic Relations:** Documents use `entityType` + `entityId` pattern
   ```typescript
   entityType: documentEntityTypeEnum("entity_type").notNull();
   entityId: uuid("entity_id").notNull(); // References order.id, testing.id, etc.
   ```

### Core Domain Models

- **Users & Auth:** `users`, `otpCodes`, `passwordResets`
- **Authorization:** `roles`, `permissions`, `userRoles`, `rolePermissions`, `userPermissions`
- **Companies:** `userCompanies`, `userCompanyTestingLocation`, `kblis`
- **Testing:** `parameters`, `parameterCategories`, `clusters`, `tools`, `parameterTools`
- **Orders:** `order`, `orderItem`, `cart`, `orderStatusHistory`
- **Testing Process:** `testing`, `testingItem`
- **Documents:** `documents`, `documentSignatures`, `documentVerifications`
- **Geography:** `provinces`, `regencies`, `districts`, `villages`
- **Audit:** `audits`
- **Employees:** `employees` (linked to `users` table via `userId`)

### Employee Authentication

Employees share the same authentication system as regular users:

- `employees` table has a `userId` foreign key linking to `users`
- Employees log in using the same JWT auth system
- Access is controlled via roles (e.g., "Lab Technician", "Lab Manager")
- See `docs/EMPLOYEE_AUTH_GUIDE.md` for implementation details

## tRPC API Architecture

**Location:** `packages/api/src/`

### Router Structure (23 Routers)

**Authentication & Authorization:**

- `auth` - Login, registration, OTP, password reset
- `user`, `role`, `permission` - User management

**Core Domain:**

- `order` - Order management, invoice/offering letter generation
- `cart` - Shopping cart
- `document` - Document upload, verification, signing (largest: 434 lines)
- `testing` - Testing management
- `audit` - Audit logging

**Parameters & Tools:**

- `parameter`, `parameter-categories`, `parameter-tool`
- `tool`, `cluster`

**Geography:**

- `province`, `regency`, `district`, `village`

**Company:**

- `user-company`, `user-company-testing-location`, `kbli`

### Procedure Types

1. **`publicProcedure`** - No authentication required
2. **`protectedProcedure`** - Requires valid JWT token
3. **`withPermission(permission)`** - Requires specific permission
4. **`withRole(role)`** - Requires specific role
5. **`withAnyRole(roles[])`** - Requires any of the specified roles
6. **`withAllRoles(roles[])`** - Requires all specified roles
7. **`withRateLimit(limiter, getKey?)`** - Rate limiting for public procedures
8. **`withProtectedRateLimit(limiter, getKey?)`** - Rate limiting for protected procedures
9. **`withRoleBasedRateLimit(operation, getKey?)`** - Automatic role-based rate limiting
10. **`formDataProcedure(schema)`** - Handles file uploads

### Common Patterns

**Standard CRUD Router:**

```typescript
export const resourceRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => { ... }),
  getPaginated: withPermission("resources.read")
    .input(schema)
    .query(async ({ input }) => { ... }),
  getById: withPermission("resources.read")
    .input(z.object({ id: z.uuidv7() }))
    .query(async ({ input }) => { ... }),
  create: withPermission("resources.create")
    .input(createSchema)
    .mutation(async ({ input }) => { ... }),
  update: withPermission("resources.update")
    .input(updateSchema)
    .mutation(async ({ input }) => { ... }),
  delete: withPermission("resources.delete")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(async ({ input }) => { ... }),
  restore: withPermission("resources.delete")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(async ({ input }) => { ... }),
});
```

**Effect-Based Error Handling:**
All async operations use Effect for composable error handling:

```typescript
create: withPermission("resources.create")
  .input(createSchema)
  .mutation(
    async ({ input }) =>
      await runEffect(
        Effect.gen(function* () {
          const result = yield* resourceQueries.create(input);
          yield* auditService.log("CREATE", "resource", result.id);
          return result;
        })
      )
  ),
```

**File Upload Pattern:**

```typescript
upload: protectedProcedure
  .input(z.object({
    title: z.string(),
    file: z.file(),
  }))
  .use(formDataProcedure(uploadSchema))
  .mutation(
    async ({ input, ctx }) =>
      await runEffect(
        Effect.gen(function* () {
          const arrayBuffer = yield* Effect.tryPromise(() =>
            ctx.input.data.file.arrayBuffer()
          );
          const buffer = Buffer.from(arrayBuffer);
          const uploaded = yield* storageService.upload(buffer, filename);
          return { url: uploaded.url };
        })
      )
  ),
```

**Rate Limiting Pattern:**

```typescript
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

// Public endpoint with IP-based rate limiting
login: withRateLimit(
  rateLimiters.auth(),
  (ctx, input) => `login:${input.email}`
)
  .input(loginSchema)
  .mutation(async ({ input }) => { ... }),

// Protected endpoint with user-based rate limiting
sendEmail: withProtectedRateLimit(
  rateLimiters.email(),
  (ctx) => `email:${ctx.user.email}`
)
  .input(emailSchema)
  .mutation(async ({ input, ctx }) => { ... }),

// Role-based rate limiting (automatic tier selection)
// Admins: 100k/hr, Users: 1k/hr, Viewers: 100/hr
getProfile: withRoleBasedRateLimit("api")
  .query(async ({ ctx }) => { ... }),
```

See [Rate Limiting Middleware Guide](packages/api/docs/RATE_LIMITING_MIDDLEWARE.md) for complete documentation.

### Adding a New Router

1. **Create router file:** `packages/api/src/routers/new-resource.ts`
2. **Import and register in root:** `packages/api/src/root.ts`
3. **Create query functions:** `packages/queries/src/new-resource.queries.ts`
4. **Create schemas:** `packages/schema/src/new-resource.schema.ts`

All queries should be Effect-based and all routers should use `runEffect()` wrapper.

## Authentication & Authorization

### JWT Strategy

- **Algorithm:** HS256 (HMAC-SHA256)
- **Token Expiry:** 30 days (regular auth), 30 minutes (password reset)
- **Storage:** HTTP Authorization header (API) or Cookie (web)
- **Library:** `jose` for JWT operations

### Token Payload Structure

```typescript
{
  id: string;              // User ID
  email: string;
  roles: string[];         // Array of role names
  permissions: string[];   // Array of permission strings
  createdAt: string;
  updatedAt: string | null;
  exp: number;             // Expiration (Unix timestamp)
  iat: number;             // Issued at
  jti: string;             // JWT ID (used as session ID)
}
```

### Permission Model

Fine-grained permissions use `resource.action` pattern:

- `users.read`, `users.create`, `users.update`, `users.delete`
- `orders.read`, `orders.create`, `orders.update`, `orders.delete`
- Permissions are checked at runtime from database
- Both role-based and user-specific permission overrides supported

### Frontend Route Protection

**Location:** `apps/web/src/utils/require-permission.ts`

```typescript
// Single permission
beforeLoad: async ({ context }) => {
  await requirePermission(context, { permission: "users.create" });
};

// Multiple permissions (any)
beforeLoad: async ({ context }) => {
  await requirePermission(context, {
    permission: ["users.create", "users.update"],
  });
};

// Multiple permissions (all)
beforeLoad: async ({ context }) => {
  await requirePermission(context, {
    permission: ["users.create", "admin.access"],
    requireAll: true,
  });
};
```

## Services Layer

**Location:** `packages/services/src/`

### Available Services

1. **Storage Service** (`storage/`)
   - Providers: Filesystem, MinIO, S3
   - Operations: upload, download, delete, getUrl
   - Configured via `STORAGE_PROVIDER` env var

2. **Email Service** (`email/`)
   - Providers: Nodemailer (SMTP), Resend
   - Templates for: OTP verification, password reset, welcome emails
   - Configured via `EMAIL_PROVIDER` env var

3. **Logger Service** (`logger/`)
   - Winston-based logging
   - Transports: Console, File rotation
   - Log levels: error, warn, info, debug

4. **Image Service** (`image/`)
   - Image optimization and transformation
   - Format conversion, resizing

5. **PDF Service** (`pdf/`)
   - PDF generation and modification using pdf-lib
   - QR code embedding for document verification
   - Client-side PDF signing (`pdf/client/`)

6. **Document Signing Service** (`document-signing/`)
   - JWT-based document signatures
   - QR code generation for verification
   - Token expiry: configurable via `DOCUMENT_QR_EXPIRATION`
   - Separate JWT secrets for different document types

7. **Rate Limiter Service** (`rate-limiter/`)
   - Multiple strategies: sliding-window, token-bucket, fixed-window
   - Redis-backed with automatic in-memory fallback
   - Preset configurations for common use cases
   - Used for: authentication, API calls, email sending, OTP verification
   - See `docs/RATE_LIMITER_GUIDE.md` for implementation details

8. **Event Bus** (`notifications/event-bus.ts`)
   - Server-sent events (SSE) for real-time notifications
   - Used for order status updates, testing progress

## Frontend Architecture

**Location:** `apps/web/src/`

### TanStack Router Structure

**File-based routing with route groups:**

- `(auth)/` - Authentication routes (login, register, verify-email)
  - Public routes, no auth required

- `(core)/` - Protected routes (requires authentication)
  - `dashboard/` - User dashboard and company management
  - `back-office/` - Admin routes (users, roles, parameters, tools, clusters, kblis)
  - `pengujian/` - Testing workflow (order creation, checkout, status tracking)
  - `konsultasi/`, `pelatihan/`, `uji-kompetensi/` - Feature sections

- `verify.$token.tsx` - Document verification route
- `unauthorized.tsx` - Access denied page

### Route Protection Pattern

```typescript
// In route file
export const Route = createFileRoute("/(core)/back-office/users/")({
  beforeLoad: async ({ context }) => {
    await requirePermission(context, { permission: "users.read" });
  },
  // ... component, loader
});
```

### Component Structure

- **shadcn/ui components** in `apps/web/src/components/ui/`
- **Route-specific components** colocated with routes using `-components/` directories
- **Data tables** use TanStack Table with server-side pagination
- **Forms** use React Hook Form + Zod validation

### tRPC Client Usage Patterns

The frontend supports three patterns for making tRPC calls:

1. **Classic Pattern** - Using tRPC hooks directly:

   ```typescript
   const user = trpc.user.getById.useQuery({ id });
   const updateUser = trpc.user.update.useMutation();
   ```

2. **Modern Pattern** - Using TanStack Query hooks with tRPC options:

   ```typescript
   const user = useQuery(trpc.user.getById.queryOptions({ id }));
   const updateUser = useMutation(trpc.user.update.mutationOptions());
   ```

3. **Direct Client** - For non-React contexts (utilities, lib files):
   ```typescript
   await trpcClient.auth.logout.mutate({ refreshToken });
   ```

See [tRPC TanStack Query Usage Guide](apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md) for detailed examples and best practices.

## UI/UX Guidelines

- When implementing UI features, always consider mobile/touch compatibility first
- Avoid tooltips for interactive elements on mobile - prefer popovers or other touch-friendly alternatives
- Ensure touch targets are at least 44px for accessibility
- For styling tasks, reference existing similar components (like `index.tsx`) before creating new styles
- When working with third-party UI libraries (Sonner, Radix, etc.), verify the installed version in `package.json` before implementing features

## Environment Variables

**Location:** Root `.env` file (not committed)

### Required Variables

```env
# Database (required)
POSTGRES_URL=postgresql://user:password@localhost:5432/db_name

# Server (required)
SERVER_HOSTNAME=localhost
SERVER_PORT=3000
NODE_ENV=development

# Auth (required, min 32 chars each)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_RESET_PASSWORD_SECRET=your-reset-password-secret

# Document Signing (required)
JWT_DOCUMENT_SECRET=document-signing-secret
JWT_LEGAL_DOCUMENT_SECRET=legal-document-secret
JWT_TESTING_DOCUMENT_SECRET=testing-document-secret
JWT_COMPANY_DOCUMENT_SECRET=company-document-secret
DOCUMENT_QR_EXPIRATION=7d
DOCUMENT_VERIFICATION_BASE_URL=http://localhost:3001/verify

# Frontend (required)
VITE_API_URL=http://localhost:3000

# CORS (required)
CORS_ORIGIN=http://localhost:3001

# Email Provider (optional)
EMAIL_PROVIDER=ethereal  # or 'resend'
EMAIL_FROM=noreply@example.com
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-user
SMTP_PASSWORD=your-ethereal-password

# Storage Provider (optional)
STORAGE_PROVIDER=filesystem  # or 'minio', 's3'
STORAGE_PATH=./uploads

# Redis/Memurai (optional)
MEMURAI_HOST=localhost
MEMURAI_PORT=6379
```

### Environment Variable Flow

Environment variables are:

1. Defined in root `.env`
2. Passed through Turborepo via `globalPassThroughEnv` in `turbo.json`
3. Validated using `@t3-oss/env-core` in each package
4. Accessed via typed `env` object imports

## Key Development Patterns

### 1. Effect-Based Query Functions

All database queries in `packages/queries/` use Effect for error handling:

```typescript
// packages/queries/src/users.queries.ts
export const getUserById = (id: string) =>
  Effect.tryPromise({
    try: async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      if (!user)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      return user;
    },
    catch: (error) => error as TRPCError,
  });
```

### 2. Soft Delete Pattern

All resources support soft deletion:

```typescript
// Delete: Sets deletedAt timestamp
const deleted = await db
  .update(table)
  .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
  .where(eq(table.id, id))
  .returning();

// Restore: Clears deletedAt
const restored = await db
  .update(table)
  .set({ deletedAt: null })
  .where(eq(table.id, id))
  .returning();

// Queries exclude soft-deleted by default
where: and(eq(table.id, id), isNull(table.deletedAt));
```

### 3. Pagination Pattern

Standard pagination for list endpoints:

```typescript
const { page = 1, limit = 10, search } = input;
const offset = (page - 1) * limit;

const [items, totalCount] = await Promise.all([
  db.query.table.findMany({
    where: search ? ilike(table.name, `%${search}%`) : undefined,
    limit,
    offset,
  }),
  db.select({ count: sql<number>`count(*)` }).from(table),
]);

return {
  data: items,
  pagination: {
    page,
    limit,
    totalPages: Math.ceil(totalCount[0].count / limit),
    totalItems: totalCount[0].count,
  },
};
```

### 4. Audit Logging

All mutations should log to audit table:

```typescript
await auditQueries.createAudit({
  entityType: "user",
  entityId: user.id,
  action: "CREATE",
  userId: ctx.user.id,
  userEmail: ctx.user.email,
  oldValues: null,
  newValues: user,
  changedFields: ["name", "email"],
  description: `Created user ${user.name}`,
});
```

### 5. Document Verification Flow

1. Generate verification token (JWT with short expiry)
2. Create QR code embedding verification URL
3. Embed QR in PDF document
4. Store document with verification token
5. User scans QR → redirects to `/verify/$token`
6. Frontend calls `document.verifyDocument` with token
7. Backend validates JWT, logs verification attempt

## Testing Workflow

The application manages an end-to-end testing workflow:

1. **Parameter Selection** - User selects testing parameters from clusters/categories
2. **Add to Cart** - Parameters added with quantity and testing location
3. **Checkout** - Create order from cart items
4. **Order Approval** - Admin approves order (status: pending → approved)
5. **Payment** - User uploads payment proof (status: unpaid → paid)
6. **Testing** - Lab creates testing records, performs tests, enters results
7. **Document Generation** - Generate offering letter, invoice, testing certificates
8. **Document Signing** - Authorized users sign documents with QR verification
9. **Completion** - Order marked complete, customer receives signed documents

## Common Tasks

### Adding a New Database Table

1. **Add schema** in `packages/db/src/schema.ts`:

   ```typescript
   export const newTable = createTable("new_table", {
     id: uuid("id")
       .primaryKey()
       .notNull()
       .$default(() => uuidv7()),
     name: varchar("name", { length: 250 }).notNull(),
     ...timestamps,
   });
   ```

2. **Generate migration:**

   ```bash
   pnpm db:generate
   ```

3. **Review and apply migration:**
   ```bash
   pnpm db:migrate
   ```

### Adding a New tRPC Router

1. **Create router:** `packages/api/src/routers/new-resource.ts`
2. **Create queries:** `packages/queries/src/new-resource.queries.ts`
3. **Create schemas:** `packages/schema/src/new-resource.schema.ts`
4. **Register in root:** Import and add to `appRouter` in `packages/api/src/root.ts`
5. **Frontend auto-updates** with new procedures via tRPC client

### Adding a New Service

1. **Create service file:** `packages/services/src/new-service/index.ts`
2. **Export from package:** Add export in `packages/services/src/index.ts`
3. **Use in API:** Import via `@tepian-k3/services/new-service`

### Debugging

- **API Logs:** Check `apps/server/logs/` directory
- **Database Queries:** Set `DEBUG=drizzle:*` environment variable
- **tRPC Errors:** Check browser network tab and server console
- **Email Testing:** Use `pnpm email:dev` to start Ethereal test server

## Important Notes

- **Never commit `.env` files** - Use `.env.example` as template
- **All mutations must use transactions** when modifying multiple tables
- **Always validate input** with Zod schemas from `@tepian-k3/schema`
- **Error messages** are in Indonesian (Bahasa Indonesia)
- **UUIDs are v7** (time-sortable) - use `uuidv7()` from `uuid` package
- **Foreign keys use cascade delete** - be careful with deletions
- **All file uploads** must use `storageService` (supports multiple providers)
- **Document verification** URLs must use `DOCUMENT_VERIFICATION_BASE_URL` env var
- **Permission checks** happen at runtime - cached in JWT but validated on sensitive operations

## Documentation

Additional documentation in `docs/` folder:

- `EMPLOYEE_AUTH_GUIDE.md` - Employee authentication implementation
- `POLYMORPHIC_RELATIONS_GUIDE.md` - Document polymorphic relations
- `DOCUMENT_VERIFICATION.md` - Document verification system
- `PDF_EDITOR_USER_GUIDE.md` - PDF signing and QR code embedding
- See `docs/` folder for complete list

IMPORTANT: If YOU ADD NEW DOCUMENTATION PUT IT IN THE PACKAGE FOLDERS AS WELL BUT INSIDE THE docs/ FOLDER
FOR EXAMPLE YOU CAN PUT IT IN THE PACKAGE FOLDERS BUT INSIDE THE docs/example/\*.example.md
FOR BETTER ORGANIZATION AND EASY TO FIND.

## TypeScript Conventions

- When encountering TypeScript type errors, especially with complex generic types (tRPC, TanStack Query, Zod), stop after 2 failed attempts and present the user with a summary of what was tried, what failed, and 2-3 alternative architectural approaches rather than continuing to iterate on type gymnastics.
- When creating reusable hooks or utilities for this codebase, prioritize practical type safety over perfect generic inference. If a fully generic approach creates unresolvable type conflicts, use a well-typed wrapper pattern with explicit type parameters at the call site rather than trying to infer everything automatically.

## Framework-Specific Notes

This project uses TanStack Router with Vite. When troubleshooting TanStack Router issues, always check TanStack's official documentation first (https://tanstack.com/router/latest/docs) before suggesting generic React solutions. TanStack Router has its own patterns (autoCodeSplitting, file-based routing) that differ from standard React Router.

## Workflow Rules

When implementing changes across multiple files (skeleton loaders, hooks, utilities), create a checklist of ALL files that need changes BEFORE starting work. Present this checklist to the user for confirmation. Do not begin editing until the full scope is agreed upon.

## Monorepo Commands Reference

```bash
# Install dependencies
pnpm install

# Add dependency to root workspace
pnpm add <package> -w

# Add dependency to specific package
pnpm add <package> --filter @tepian-k3/web
pnpm add <package> --filter @tepian-k3/server

# Add internal package dependency
pnpm add @tepian-k3/utils --filter @tepian-k3/api

# Run command in specific package
turbo -F @tepian-k3/web dev
turbo -F @tepian-k3/db db:push

# Clear Turborepo cache
rm -rf .turbo

# Force rebuild (ignore cache)
pnpm turbo run build --force
```
