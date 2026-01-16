# Permission-Based Rate Limiting Guide

This guide explains how to use the `withPermissionAndRateLimit` middleware for endpoints that require both permission checks and role-based rate limiting.

## Overview

The `withPermissionAndRateLimit` middleware combines two important protections:

1. **Permission Checking** - Ensures the user has the required permission
2. **Role-Based Rate Limiting** - Applies different rate limits based on user's role tier

This is more efficient than using `withPermission()` and manually implementing rate limiting, as it performs both checks in a single middleware layer.

## Rate Limit Tiers

Different user roles get different rate limit tiers:

| Tier | Roles | Queries/hr | Mutations/hr | API Calls/hr | Uploads/hr | Emails/hr |
|------|-------|------------|--------------|--------------|------------|-----------|
| **Basic** | viewer | 100 | 10 | 100 | 5 | 3 |
| **Standard** | user, employee | 500 | 100 | 1,000 | 20 | 10 |
| **Premium** | lab_technician, lab_manager | 2,000 | 500 | 5,000 | 100 | 50 |
| **Unlimited** | admin, super_admin | 50,000 | 10,000 | 100,000 | 1,000 | 500 |

## Basic Usage

### Example 1: Audit Router

```typescript
import { createTRPCRouter, withPermissionAndRateLimit } from "@tepian-k3/api";
import { paginationSchema } from "@tepian-k3/schema/common.schema";
import auditQueries from "@tepian-k3/queries/audit.queries";

export const auditRouter = createTRPCRouter({
  // Protect with "audits.read" permission + queries rate limit
  getAll: withPermissionAndRateLimit("audits.read", "queries")
    .input(paginationSchema)
    .query(async ({ input }) => {
      return await auditQueries.getAll(input);
    }),

  // Protect with "audits.export" permission + api rate limit
  export: withPermissionAndRateLimit("audits.export", "api")
    .query(async () => {
      return await auditQueries.export();
    }),

  // Protect with "audits.delete" permission + mutations rate limit
  delete: withPermissionAndRateLimit("audits.delete", "mutations")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await auditQueries.delete(input.id);
    }),
});
```

### Example 2: Document Router with Custom Rate Limit Keys

```typescript
import { createTRPCRouter, withPermissionAndRateLimit, formDataProcedure } from "@tepian-k3/api";
import { uploadSchema } from "@tepian-k3/schema/document.schema";
import documentQueries from "@tepian-k3/queries/document.queries";

export const documentRouter = createTRPCRouter({
  // Custom rate limit key per entity type
  upload: withPermissionAndRateLimit(
    "documents.create",
    "uploads",
    (ctx, input) => `upload:${ctx.user.id}:${input.entityType}`
  )
    .input(z.any()) // FormData handled by formDataProcedure
    .use(formDataProcedure(uploadSchema))
    .mutation(async ({ input, ctx }) => {
      return await documentQueries.upload(ctx.input.data);
    }),

  // Rate limit by document ID
  download: withPermissionAndRateLimit(
    "documents.read",
    "api",
    (ctx, input) => `download:${ctx.user.id}:${input.id}`
  )
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await documentQueries.download(input.id);
    }),
});
```

## API Reference

### `withPermissionAndRateLimit(permission, operation, getKey?)`

Creates a middleware that checks permission and applies role-based rate limiting.

**Parameters:**

- `permission: Permission` - Required permission (e.g., "users.read", "orders.create")
- `operation: "api" | "mutations" | "queries" | "uploads" | "email"` - Type of operation for rate limiting
- `getKey?: (ctx, input?) => string` - Optional custom key generator (defaults to `${operation}:${userId}`)

**Returns:**

A tRPC procedure that:
1. Requires authentication (from `protectedProcedure`)
2. Checks if user has the required permission
3. Applies role-based rate limits based on user's highest role tier
4. Adds rate limit info to context: `ctx.rateLimit.remaining`, `ctx.rateLimit.resetMs`

## Operation Types

Choose the operation type based on your endpoint's purpose:

| Operation | Use For | Example Endpoints |
|-----------|---------|-------------------|
| `"queries"` | Read operations, data fetching | `getAll`, `getById`, `search` |
| `"mutations"` | Create/Update/Delete operations | `create`, `update`, `delete`, `restore` |
| `"api"` | General API calls, exports, reports | `export`, `generateReport`, `sync` |
| `"uploads"` | File upload operations | `upload`, `uploadBulk`, `importFile` |
| `"email"` | Email sending operations | `sendVerification`, `sendNotification` |

## Error Handling

### Permission Denied (403 FORBIDDEN)

```json
{
  "code": "FORBIDDEN",
  "message": "Anda tidak memiliki izin untuk mengakses sumber daya ini."
}
```

**Cause:** User doesn't have the required permission.

### Rate Limit Exceeded (429 TOO_MANY_REQUESTS)

```json
{
  "code": "TOO_MANY_REQUESTS",
  "message": "Terlalu banyak permintaan. Coba lagi dalam 42 detik."
}
```

**Cause:** User exceeded their role-based rate limit.

## Rate Limit Headers

The middleware adds rate limit information to the response context:

```typescript
{
  ctx: {
    rateLimit: {
      remaining: 95,        // Requests remaining in window
      resetMs: 42000,       // Milliseconds until reset
      tier: "role-based"    // Tier type
    }
  }
}
```

You can access this in your procedure:

```typescript
getProfile: withPermissionAndRateLimit("users.read", "queries")
  .query(async ({ ctx }) => {
    console.log(`Remaining: ${ctx.rateLimit.remaining}`);
    console.log(`Resets in: ${ctx.rateLimit.resetMs}ms`);

    return await userQueries.getById(ctx.user.id);
  }),
```

## Comparison with Other Approaches

### ❌ Using `withPermission()` Only

```typescript
// No rate limiting
getAll: withPermission("audits.read")
  .query(async () => {
    return await auditQueries.getAll();
  }),
```

**Problems:**
- No protection against abuse
- Users can make unlimited requests

### ⚠️ Using `withPermission()` + Manual Rate Limiting

```typescript
// Verbose and error-prone
getAll: withPermission("audits.read")
  .query(async ({ ctx }) => {
    const config = getRateLimitConfig(ctx.user.roles, "queries");
    const limiter = createRateLimiter(config);
    const result = await limiter.consume(`queries:${ctx.user.id}`);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(result.resetMs / 1000)} detik.`,
      });
    }

    return await auditQueries.getAll();
  }),
```

**Problems:**
- Boilerplate code repeated in every endpoint
- Easy to forget or implement incorrectly
- Harder to maintain

### ✅ Using `withPermissionAndRateLimit()`

```typescript
// Clean and concise
getAll: withPermissionAndRateLimit("audits.read", "queries")
  .query(async () => {
    return await auditQueries.getAll();
  }),
```

**Benefits:**
- Single line of middleware
- Consistent behavior across all endpoints
- Automatic role-based tier selection
- Easy to maintain

## Best Practices

1. **Choose the right operation type** - Use `"queries"` for reads, `"mutations"` for writes
2. **Use custom keys for fine-grained control** - Rate limit by entity type, action, etc.
3. **Don't over-protect** - Not every endpoint needs rate limiting (e.g., `getById` with specific IDs)
4. **Monitor rate limits** - Log when users hit limits to identify abuse patterns
5. **Document limits** - Let users know what limits apply to their role tier

## Testing

Test both permission and rate limit enforcement:

```typescript
describe("Audit Router", () => {
  it("should deny access without permission", async () => {
    const caller = createCaller({ user: viewerUser });

    await expect(caller.audit.delete({ id: "123" }))
      .rejects.toThrow("Anda tidak memiliki izin");
  });

  it("should enforce rate limits", async () => {
    const caller = createCaller({ user: viewerUser });

    // Viewer has 10 mutations/hour
    for (let i = 0; i < 10; i++) {
      await caller.audit.delete({ id: `${i}` });
    }

    // 11th request should fail
    await expect(caller.audit.delete({ id: "11" }))
      .rejects.toThrow("Terlalu banyak permintaan");
  });

  it("should apply different limits for admins", async () => {
    const caller = createCaller({ user: adminUser });

    // Admin has 10,000 mutations/hour
    for (let i = 0; i < 100; i++) {
      await caller.audit.delete({ id: `${i}` });
    }

    // Should still work
    await expect(caller.audit.delete({ id: "101" }))
      .resolves.toBeDefined();
  });
});
```

## Related Documentation

- [Rate Limiting Middleware Guide](./RATE_LIMITING_MIDDLEWARE.md)
- [Role-Based Rate Limiting](./ROLE_BASED_RATE_LIMITING.md)
- [Rate Limits Architecture](../../constants/docs/RATE_LIMITS_ARCHITECTURE.md)
- [Rate Limiter Service](../../services/src/rate-limiter/README.md)
