# Development Patterns

Pola-pola coding yang digunakan secara konsisten di seluruh codebase ini.
Baca juga [AGENTS.md](../AGENTS.md) untuk konteks arsitektur yang lebih luas.

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

Lihat [Rate Limiting Guide](../packages/api/docs/RATE_LIMITING_MIDDLEWARE.md) untuk dokumentasi lengkap.

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

---

## 8. Frontend Route Protection

```typescript
export const Route = createFileRoute("/(core)/back-office/resource/")({
  // Gunakan z.object() bukan parse/stringify
  params: z.object({
    resourceId: z.string(),
  }),

  beforeLoad: async ({ context }) => {
    // Single permission
    await requirePermission(context, { permission: "resource.read" });

    // Multiple — OR (cukup salah satu)
    await requirePermission(context, {
      permission: ["resource.read", "admin.access"],
    });

    // Multiple — AND (semua harus ada)
    await requirePermission(context, {
      permission: ["resource.read", "admin.access"],
      requireAll: true,
    });
  },

  // Pre-fetch data sebelum render untuk menghindari loading flicker
  loader: async ({ context, params }) =>
    context.queryClient.ensureQueryData(
      context.trpc.domain.resource.getById.queryOptions({
        id: params.resourceId,
      }),
    ),

  component: ResourcePage,
  pendingComponent: LoadingComponent, // tampilkan saat loader berjalan
  errorComponent: ErrorComponent,
});
```

---

## 9. tRPC Client Patterns (Frontend)

```typescript
import { useSuspenseQuery, useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { trpcClient } from "@/utils/trpc";

// Modern (direkomendasikan) — TanStack Query + tRPC options proxy
const { data } = useSuspenseQuery(
  trpc.platform.user.getById.queryOptions({ id }),
);

// Standard — untuk data yang boleh loading
const { data, isLoading } = useQuery(
  trpc.pengujian.order.getPaginated.queryOptions({ page: 1 }),
);

// Mutation
const createMutation = useMutation(
  trpc.pelatihan.base.create.mutationOptions({
    onSuccess: () => {
      /* invalidate cache, show toast */
    },
    onError: (err) => {
      /* handle error */
    },
  }),
);

// Direct client — untuk non-React contexts (loaders, beforeLoad, etc.)
await trpcClient.platform.auth.logout.mutate({ refreshToken });
```

Lihat [tRPC TanStack Query Usage Guide](../apps/web/docs/TRPC_TANSTACK_QUERY_USAGE.md) untuk pola lebih lanjut.

---

## 10. Document Verification Flow

```
1. Generate verification token (JWT, short expiry via documentSigningService)
2. Buat QR code yang embed verification URL
3. Embed QR ke dalam PDF dokumen
4. Simpan dokumen dengan verification token di DB
5. User scan QR → redirect ke /verify/$token
6. Frontend panggil document.verifyDocument dengan token
7. Backend validasi JWT, log verification attempt ke audit
```

---

## 11. Adding a New Domain Module

Untuk domain baru (pelatihan, uji-kompetensi, konsultasi), ikuti urutan ini:

```bash
# 1. DB Schema
# Tambahkan tabel ke: packages/db/src/schema/<domain>.ts
# Re-export dari: packages/db/src/schema.ts

# 2. Migrations
pnpm db:generate
pnpm db:migrate

# 3. Queries
# Buat files di: packages/queries/src/<domain>/
# Export dari: packages/queries/src/<domain>/index.ts

# 4. Zod Schemas
# Buat files di: packages/schema/src/<domain>/
# Export dari: packages/schema/src/<domain>/index.ts

# 5. tRPC Routers
# Buat files di: packages/api/src/routers/<domain>/
# Export dari: packages/api/src/routers/<domain>/index.ts
# (root.ts sudah register domain router — tidak perlu diubah)

# 6. Frontend Routes
# Buat di: apps/web/src/routes/(core)/back-office/<domain>/

# 7. Type check
pnpm check-types  # harus 0 errors
```
