# Development Patterns

Core coding patterns used throughout this codebase.

---

## Effect-Based Query Functions

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
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return user;
    },
    catch: (error) => error as TRPCError,
  });
```

All routers wrap with `runEffect()`:

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

---

## Standard CRUD Router

```typescript
export const resourceRouter = createTRPCRouter({
  getAll: publicProcedure.query(async () => { ... }),
  getPaginated: withPermission("resources.read")
    .input(schema)
    .query(async ({ input }) => { ... }),
  getById: withPermission("resources.read")
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => { ... }),
  create: withPermission("resources.create")
    .input(createSchema)
    .mutation(async ({ input }) => { ... }),
  update: withPermission("resources.update")
    .input(updateSchema)
    .mutation(async ({ input }) => { ... }),
  delete: withPermission("resources.delete")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => { ... }),
  restore: withPermission("resources.delete")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => { ... }),
});
```

---

## Soft Delete Pattern

```typescript
// Delete: Sets deletedAt timestamp
await db
  .update(table)
  .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
  .where(eq(table.id, id))
  .returning();

// Restore: Clears deletedAt
await db
  .update(table)
  .set({ deletedAt: null })
  .where(eq(table.id, id))
  .returning();

// Always exclude soft-deleted in queries
where: and(eq(table.id, id), isNull(table.deletedAt));
```

---

## Pagination Pattern

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

---

## Audit Logging

All mutations must log to the audit table:

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

---

## File Upload Pattern

```typescript
upload: protectedProcedure
  .use(formDataProcedure(uploadSchema))
  .mutation(
    async ({ ctx }) =>
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

---

## Rate Limiting Pattern

See [Rate Limiting Middleware Guide](../packages/api/docs/RATE_LIMITING_MIDDLEWARE.md) for full docs.

```typescript
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

// Public endpoint (IP-based)
login: withRateLimit(
  rateLimiters.auth(),
  (ctx, input) => `login:${input.email}`,
);

// Protected endpoint (user-based)
sendEmail: withProtectedRateLimit(
  rateLimiters.email(),
  (ctx) => `email:${ctx.user.email}`,
);

// Role-based automatic tier (Admins: 100k/hr, Users: 1k/hr, Viewers: 100/hr)
getProfile: withRoleBasedRateLimit("api");
```

---

## Document Verification Flow

1. Generate verification token (JWT with short expiry)
2. Create QR code embedding verification URL
3. Embed QR in PDF document
4. Store document with verification token
5. User scans QR → redirects to `/verify/$token`
6. Frontend calls `document.verifyDocument` with token
7. Backend validates JWT, logs verification attempt

---

## Frontend Route Protection

```typescript
export const Route = createFileRoute("/(core)/back-office/users/")({
  beforeLoad: async ({ context }) => {
    await requirePermission(context, { permission: "users.read" });
    // Multiple (any): permission: ["users.read", "admin.access"]
    // Multiple (all): permission: [...], requireAll: true
  },
});
```

---

## tRPC Client Patterns (Frontend)

```typescript
// Classic (tRPC hooks)
const user = trpc.user.getById.useQuery({ id });
const update = trpc.user.update.useMutation();

// Modern (TanStack Query + tRPC options)
const user = useQuery(trpc.user.getById.queryOptions({ id }));
const update = useMutation(trpc.user.update.mutationOptions());

// Direct client (non-React contexts)
await trpcClient.auth.logout.mutate({ refreshToken });
```

See [tRPC TanStack Query Usage Guide](../apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md) for more.
