# Combined Permission and Rate Limiting Middleware

## Summary

Created `withPermissionAndRateLimit()` - a new middleware that combines permission checking and role-based rate limiting in a single, efficient middleware layer.

## What Was Changed

### 1. New Middleware in `packages/api/src/index.ts`

Added `withPermissionAndRateLimit()` function (lines 598-658):

```typescript
export const withPermissionAndRateLimit = <TInput = unknown>(
  permission: Permission,
  operation: "api" | "mutations" | "queries" | "uploads" | "email",
  getKey?: (ctx, input?) => string
) => { ... }
```

**Features:**

- ✅ Extends `protectedProcedure` (requires authentication)
- ✅ Checks user permission first
- ✅ Applies role-based rate limits automatically
- ✅ Returns rate limit info in context (`ctx.rateLimit`)
- ✅ Throws appropriate errors (FORBIDDEN or TOO_MANY_REQUESTS)

### 2. Updated Audit Router Example

Modified `packages/api/src/routers/audit.ts` to demonstrate usage:

**Before:**

```typescript
getAuditLogs: withPermission("audits.view")
  .input(auditSchema.getAuditLogsSchema)
  .query(async ({ input, ctx }) => { ... })
```

**After:**

```typescript
getAuditLogs: withPermissionAndRateLimit("audits.view", "queries")
  .input(auditSchema.getAuditLogsSchema)
  .query(async ({ input, ctx }) => { ... })
```

### 3. Documentation

Created two comprehensive guides:

1. **[PERMISSION_RATE_LIMITING.md](./PERMISSION_RATE_LIMITING.md)** - Complete usage guide with examples
2. **[COMBINED_MIDDLEWARE_SUMMARY.md](./COMBINED_MIDDLEWARE_SUMMARY.md)** - This summary

## How It Works

The middleware performs checks in this order:

1. **Authentication** (from `protectedProcedure`) - Ensures user is logged in
2. **Permission Check** - Verifies user has required permission
3. **Role-Based Rate Limiting** - Applies limits based on user's highest role tier
4. **Execute Procedure** - If all checks pass, runs the actual query/mutation

## Rate Limit Tiers

| Tier          | Roles                       | Example Limits                         |
| ------------- | --------------------------- | -------------------------------------- |
| **Basic**     | viewer                      | 100 queries/hr, 10 mutations/hr        |
| **Standard**  | user, employee              | 500 queries/hr, 100 mutations/hr       |
| **Premium**   | lab_technician, lab_manager | 2,000 queries/hr, 500 mutations/hr     |
| **Unlimited** | admin, super_admin          | 50,000 queries/hr, 10,000 mutations/hr |

## Usage Examples

### Basic Usage

```typescript
// Query endpoint with permission + rate limiting
getAll: withPermissionAndRateLimit("resources.read", "queries")
  .input(paginationSchema)
  .query(async ({ input }) => {
    return await resourceQueries.getAll(input);
  });

// Mutation endpoint
create: withPermissionAndRateLimit("resources.create", "mutations")
  .input(createSchema)
  .mutation(async ({ input }) => {
    return await resourceQueries.create(input);
  });

// Upload endpoint
upload: withPermissionAndRateLimit("documents.create", "uploads")
  .input(uploadSchema)
  .mutation(async ({ input }) => {
    return await documentQueries.upload(input);
  });
```

### Custom Rate Limit Keys

```typescript
// Rate limit per entity type
upload: withPermissionAndRateLimit(
  "documents.create",
  "uploads",
  (ctx, input) => `upload:${ctx.user.id}:${input.entityType}`
)
  .input(uploadSchema)
  .mutation(async ({ input }) => { ... })

// Rate limit by IP + user
getReport: withPermissionAndRateLimit(
  "reports.export",
  "api",
  (ctx) => `report:${ctx.user.id}:${ctx.ip}`
)
  .query(async () => { ... })
```

## Benefits

### ✅ Compared to `withPermission()` Only

- **Security**: Prevents abuse with automatic rate limiting
- **Fairness**: Different limits for different role tiers
- **Protection**: Guards against DoS attacks

### ✅ Compared to Manual Rate Limiting

- **Less Code**: Single middleware vs. manual implementation
- **Consistency**: Same behavior across all endpoints
- **Maintainability**: Centralized logic, easier to update
- **Type Safety**: Full TypeScript support

### ✅ Compared to Separate Middlewares

- **Performance**: Single middleware pass instead of two
- **Clarity**: Clear intent in one line of code
- **Simplicity**: No need to chain multiple middlewares

## Error Responses

### Permission Denied (403)

```json
{
  "code": "FORBIDDEN",
  "message": "Anda tidak memiliki izin untuk mengakses sumber daya ini."
}
```

### Rate Limit Exceeded (429)

```json
{
  "code": "TOO_MANY_REQUESTS",
  "message": "Terlalu banyak permintaan. Coba lagi dalam 42 detik."
}
```

## Context Extensions

The middleware adds rate limit information to the context:

```typescript
{
  ctx: {
    rateLimit: {
      remaining: 95,        // Requests left in window
      resetMs: 42000,       // MS until reset
      tier: "role-based"    // Tier type
    }
  }
}
```

Access it in your procedure:

```typescript
getProfile: withPermissionAndRateLimit("users.read", "queries").query(
  async ({ ctx }) => {
    console.log(`Rate limit: ${ctx.rateLimit.remaining} remaining`);
    return await userQueries.getById(ctx.user.id);
  },
);
```

## Migration Guide

### From `withPermission()` to `withPermissionAndRateLimit()`

1. **Identify the operation type**:
   - Read operations → `"queries"`
   - Create/Update/Delete → `"mutations"`
   - File uploads → `"uploads"`
   - Email sending → `"email"`
   - Other API calls → `"api"`

2. **Replace the middleware**:

```typescript
// Before
getAll: withPermission("resources.read")
  .query(async () => { ... })

// After
getAll: withPermissionAndRateLimit("resources.read", "queries")
  .query(async () => { ... })
```

3. **Test the endpoint** to ensure:
   - Permission checking still works
   - Rate limits are applied correctly
   - Error messages are appropriate

### When to Use Which Middleware

| Middleware                     | Use When                                        |
| ------------------------------ | ----------------------------------------------- |
| `publicProcedure`              | No auth required, no rate limiting needed       |
| `protectedProcedure`           | Auth required, no permission/rate limit checks  |
| `withPermission()`             | Permission check only, no rate limiting         |
| `withRoleBasedRateLimit()`     | Rate limiting only, no permission check         |
| `withPermissionAndRateLimit()` | **Both permission and rate limiting needed** ⭐ |

## Testing

Example test cases:

```typescript
describe("Audit Router with Combined Middleware", () => {
  it("should deny access without permission", async () => {
    const caller = createCaller({ user: viewerUser });

    await expect(
      caller.audit.getStatistics({ entityType: "order" }),
    ).rejects.toThrow("tidak memiliki izin");
  });

  it("should enforce rate limits for viewers", async () => {
    const caller = createCaller({ user: viewerUser });

    // Viewer has 100 queries/hour
    for (let i = 0; i < 100; i++) {
      await caller.audit.getEntityHistory({
        entityType: "order",
        entityId: `${i}`,
      });
    }

    // 101st request should fail
    await expect(
      caller.audit.getEntityHistory({
        entityType: "order",
        entityId: "101",
      }),
    ).rejects.toThrow("Terlalu banyak permintaan");
  });

  it("should allow more requests for admins", async () => {
    const caller = createCaller({ user: adminUser });

    // Admin has 50,000 queries/hour
    for (let i = 0; i < 100; i++) {
      await caller.audit.getEntityHistory({
        entityType: "order",
        entityId: `${i}`,
      });
    }

    // Should still work
    await expect(
      caller.audit.getEntityHistory({
        entityType: "order",
        entityId: "101",
      }),
    ).resolves.toBeDefined();
  });
});
```

## Related Files

- [packages/api/src/index.ts](../src/index.ts) - Middleware implementation (lines 598-658)
- [packages/api/src/routers/audit.ts](../src/routers/audit.ts) - Example usage
- [packages/constants/src/rate-limits.ts](../../constants/src/rate-limits.ts) - Rate limit tier configs
- [packages/services/src/rate-limiter/](../../services/src/rate-limiter/) - Rate limiter service

## Related Documentation

- [Permission Rate Limiting Guide](./PERMISSION_RATE_LIMITING.md) - Detailed usage guide
- [Rate Limiting Middleware Guide](./RATE_LIMITING_MIDDLEWARE.md) - General rate limiting docs
- [Role-Based Rate Limiting](./ROLE_BASED_RATE_LIMITING.md) - Role-based rate limits
- [Rate Limits Architecture](../../constants/docs/RATE_LIMITS_ARCHITECTURE.md) - Architecture overview
