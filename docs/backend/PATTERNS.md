# Development Patterns

Pola-pola coding yang digunakan secara konsisten di seluruh codebase ini.
Baca juga [AGENTS.md](../../AGENTS.md) untuk konteks arsitektur yang lebih luas.

---

## 1. Effect-Based Query Functions

Semua fungsi database di `packages/queries/` menggunakan **Effect** untuk error handling.
Jangan pernah pakai `try/catch` langsung di query functions — gunakan `Effect.tryPromise`.

```typescript
// packages/queries/src/<domain>/<resource>.queries.ts
import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { eq, isNull, and } from "drizzle-orm";
import { users } from "@tepian-k3/db/schema";

/**
 * Mengambil satu user berdasarkan ID.
 * Melempar NOT_FOUND jika user tidak ada atau sudah dihapus (soft delete).
 */
export const getUserById = (id: string) =>
  Effect.tryPromise({
    try: async () => {
      const user = await db.query.users.findFirst({
        where: and(eq(users.id, id), isNull(users.deletedAt)),
      });
      if (!user)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User tidak ditemukan",
        });
      return user;
    },
    catch: (error) => error as TRPCError,
  });
```

---

## 2. Standard CRUD Router

Setiap router mengikuti struktur ini. Semua mutasi **wajib** log ke audit table.

```typescript
// packages/api/src/routers/<domain>/<resource>.ts
export const resourceRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async () =>
      await runEffect(
        Effect.gen(function* () {
          return yield* resourceQueries.getAll();
        }),
      ),
  ),

  getPaginated: withPermission("resources.read")
    .input(paginationSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            return yield* resourceQueries.getPaginated(input);
          }),
        ),
    ),

  getById: withPermission("resources.read")
    .input(z.object({ id: z.string().uuid() }))
    .query(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            return yield* resourceQueries.getById(input.id);
          }),
        ),
    ),

  create: withPermission("resources.create")
    .input(createResourceSchema)
    .mutation(
      async ({ ctx, input }) =>
        await runEffect(
          Effect.gen(function* () {
            const result = yield* resourceQueries.create(input);
            yield* auditQueries.createAudit({
              entityType: "resource",
              entityId: result.id,
              action: "CREATE",
              userId: ctx.user.id,
              userEmail: ctx.user.email,
              oldValues: null,
              newValues: result,
              changedFields: Object.keys(input),
              description: `Membuat resource: ${result.name}`,
            });
            return result;
          }),
        ),
    ),

  update: withPermission("resources.update")
    .input(updateResourceSchema)
    .mutation(
      async ({ ctx, input }) =>
        await runEffect(
          Effect.gen(function* () {
            const old = yield* resourceQueries.getById(input.id);
            const result = yield* resourceQueries.update(input);
            yield* auditQueries.createAudit({
              entityType: "resource",
              entityId: result.id,
              action: "UPDATE",
              userId: ctx.user.id,
              userEmail: ctx.user.email,
              oldValues: old,
              newValues: result,
              changedFields: Object.keys(input).filter((k) => k !== "id"),
              description: `Memperbarui resource: ${result.name}`,
            });
            return result;
          }),
        ),
    ),

  delete: withPermission("resources.delete")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(
      async ({ ctx, input }) =>
        await runEffect(
          Effect.gen(function* () {
            const result = yield* resourceQueries.softDelete(input.id);
            yield* auditQueries.createAudit({
              entityType: "resource",
              entityId: input.id,
              action: "DELETE",
              userId: ctx.user.id,
              userEmail: ctx.user.email,
              oldValues: result,
              newValues: null,
              changedFields: ["deletedAt"],
              description: `Menghapus resource: ${result.name}`,
            });
            return result;
          }),
        ),
    ),

  restore: withPermission("resources.delete")
    .input(z.object({ id: z.string().uuid() }))
    .mutation(
      async ({ ctx, input }) =>
        await runEffect(
          Effect.gen(function* () {
            const result = yield* resourceQueries.restore(input.id);
            yield* auditQueries.createAudit({
              entityType: "resource",
              entityId: input.id,
              action: "UPDATE",
              userId: ctx.user.id,
              userEmail: ctx.user.email,
              oldValues: { deletedAt: "set" },
              newValues: { deletedAt: null },
              changedFields: ["deletedAt"],
              description: `Memulihkan resource: ${result.name}`,
            });
            return result;
          }),
        ),
    ),
});
```

---

## 3. Soft Delete Pattern

```typescript
// Soft delete: set timestamp deletedAt
await db
  .update(table)
  .set({ deletedAt: sql`CURRENT_TIMESTAMP`, updatedAt: sql`CURRENT_TIMESTAMP` })
  .where(and(eq(table.id, id), isNull(table.deletedAt)))
  .returning();

// Restore: clear deletedAt
await db
  .update(table)
  .set({ deletedAt: null, updatedAt: sql`CURRENT_TIMESTAMP` })
  .where(and(eq(table.id, id)))
  .returning();

// SELALU tambahkan isNull(table.deletedAt) di query untuk exclude soft-deleted rows
where: and(eq(table.id, id), isNull(table.deletedAt));
```

---

## 4. Pagination Pattern

```typescript
// Standar pagination response shape yang digunakan di seluruh API
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
    orderBy: [desc(table.createdAt)],
    with: { relatedTable: true }, // tambahkan relasi jika perlu
  }),
  db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(
      and(
        isNull(table.deletedAt),
        search ? ilike(table.name, `%${search}%`) : undefined,
      ),
    ),
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

---

## 5. Audit Logging

**Semua mutasi wajib** log ke tabel `audits`. Jangan skip ini meskipun untuk operasi kecil.

```typescript
yield *
  auditQueries.createAudit({
    entityType: "user", // nama entitas/tabel (singular, lowercase)
    entityId: user.id, // UUID entitas yang diubah
    action: "CREATE", // CREATE | UPDATE | DELETE
    userId: ctx.user.id, // UUID user yang melakukan aksi
    userEmail: ctx.user.email, // email untuk audit trail
    oldValues: null, // null untuk CREATE
    newValues: user, // null untuk DELETE
    changedFields: ["name", "email"], // array field yang berubah
    description: `Membuat user ${user.name}`, // human-readable description
  });
```

---

## 6. File Upload Pattern

```typescript
// Di router — gunakan formDataProcedure untuk file upload
upload: protectedProcedure
  .use(formDataProcedure(uploadSchema))
  .mutation(async ({ ctx }) =>
    await runEffect(
      Effect.gen(function* () {
        const arrayBuffer = yield* Effect.tryPromise(() =>
          ctx.input.data.file.arrayBuffer()
        );
        const buffer = Buffer.from(arrayBuffer);
        const filename = `uploads/${Date.now()}-${ctx.input.data.file.name}`;
        const uploaded = yield* storageService.upload(
          buffer,
          filename,
          ctx.input.data.file.type
        );
        return { url: uploaded.url, filename };
      })
    )
  ),
```

---

## 7. Rate Limiting Pattern

Lihat [Rate Limiting Guide](../../packages/api/docs/RATE_LIMITING_MIDDLEWARE.md) untuk dokumentasi lengkap.

```typescript
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

// Public endpoint — rate limit by IP
login: withRateLimit(
  rateLimiters.auth(),
  (ctx, input) => `login:${input.email}`,
);

// Protected endpoint — rate limit by user
sendEmail: withProtectedRateLimit(
  rateLimiters.email(),
  (ctx) => `email:${ctx.user.email}`,
);

// Role-based automatic tier
// Admins: 100k req/hr | Users: 1k req/hr | Viewers: 100 req/hr
getProfile: withRoleBasedRateLimit("api");
```
