# Role-Based Rate Limiting Example

This example demonstrates the difference between fixed rate limiting and role-based rate limiting.

## Scenario

You have a user management API with different types of users:
- **Admins** - Need high limits to manage the system
- **Lab Managers** - Need moderate limits for daily operations
- **Regular Users** - Need standard limits
- **Viewers** - Need restrictive limits (read-only)

## Approach 1: Fixed Rate Limiting (Not Ideal)

```typescript
import { createTRPCRouter, withProtectedRateLimit } from "..";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

export const userRouter = createTRPCRouter({
  /**
   * ❌ Problem: Same limit for all roles
   * Everyone gets 1000 requests/hr, regardless of role
   */
  getAll: withProtectedRateLimit(rateLimiters.api())
    .input(paginationSchema)
    .query(async ({ input }) => {
      return await usersQueries.getAll(input);
    }),

  /**
   * ❌ Problem: Admins hit limits doing system maintenance
   * ❌ Problem: Viewers shouldn't have same limits as admins
   */
  getById: withProtectedRateLimit(rateLimiters.api())
    .input(z.object({ id: z.uuidv7() }))
    .query(async ({ input }) => {
      return await usersQueries.getById(input.id);
    }),

  /**
   * ❌ Problem: Need to create separate limiters for different roles
   */
  create: withProtectedRateLimit(rateLimiters.api())
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await usersQueries.create(input);
    }),
});
```

### Issues with Fixed Rate Limiting:

1. **Admins get rate limited** during legitimate system maintenance
2. **Viewers have too much access** - can make as many requests as admins
3. **No differentiation** between different user types
4. **Manual management** - need to create and maintain separate limiters

## Approach 2: Manual Role-Based Rate Limiting (Complex)

```typescript
import { createTRPCRouter, protectedProcedure } from "..";
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";

export const userRouter = createTRPCRouter({
  /**
   * ⚠️ Works but verbose and error-prone
   */
  getAll: protectedProcedure
    .input(paginationSchema)
    .use(async ({ ctx, next }) => {
      // Manually check roles and apply limits
      const isAdmin = ctx.user.roles.includes("admin");
      const isViewer = ctx.user.roles.includes("viewer");

      let limiter;
      if (isAdmin) {
        limiter = createRateLimiter({ points: 100000, duration: 3600 });
      } else if (isViewer) {
        limiter = createRateLimiter({ points: 100, duration: 3600 });
      } else {
        limiter = createRateLimiter({ points: 1000, duration: 3600 });
      }

      const result = await limiter.consume(`user:${ctx.user.id}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Terlalu banyak permintaan",
        });
      }

      return next({ ctx });
    })
    .query(async ({ input }) => {
      return await usersQueries.getAll(input);
    }),
});
```

### Issues with Manual Role-Based Limiting:

1. **Verbose and repetitive** - same code in every endpoint
2. **Error-prone** - easy to forget roles or misconfigure
3. **Hard to maintain** - changes require updating every endpoint
4. **No centralized configuration** - limits scattered across code

## Approach 3: Role-Based Rate Limiting Middleware (Best)

```typescript
import { createTRPCRouter, withRoleBasedRateLimit } from "..";

export const userRouter = createTRPCRouter({
  /**
   * ✅ Automatic tier selection based on role
   * - Admins: 50,000 queries/hr
   * - Lab Managers: 2,000 queries/hr
   * - Users: 500 queries/hr
   * - Viewers: 100 queries/hr
   */
  getAll: withRoleBasedRateLimit("queries")
    .input(paginationSchema)
    .query(async ({ input }) => {
      return await usersQueries.getAll(input);
    }),

  /**
   * ✅ Simple, clean, maintainable
   */
  getById: withRoleBasedRateLimit("queries")
    .input(z.object({ id: z.uuidv7() }))
    .query(async ({ input }) => {
      return await usersQueries.getById(input.id);
    }),

  /**
   * ✅ Mutation-specific limits
   * - Admins: 10,000 mutations/hr
   * - Lab Managers: 500 mutations/hr
   * - Users: 100 mutations/hr
   * - Viewers: 10 mutations/hr
   */
  create: withRoleBasedRateLimit("mutations")
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await usersQueries.create(input);
    }),

  update: withRoleBasedRateLimit("mutations")
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      return await usersQueries.update(input);
    }),

  delete: withRoleBasedRateLimit("mutations")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(async ({ input }) => {
      return await usersQueries.delete(input.id);
    }),
});
```

### Benefits of Role-Based Middleware:

1. **Clean and concise** - one line per endpoint
2. **Automatic tier selection** - no manual role checking
3. **Centralized configuration** - all limits defined in one place
4. **Easy to maintain** - change limits in one location
5. **Type-safe** - TypeScript ensures correct usage

## Real-World Comparison

### Scenario: Document Upload Endpoint

#### Without Role-Based Limiting

```typescript
uploadDocument: protectedProcedure
  .input(uploadSchema)
  .use(async ({ ctx, next }) => {
    // 50 lines of role-checking and limiter creation
    const roles = ctx.user.roles;
    let points = 20; // default

    if (roles.includes("super_admin") || roles.includes("admin")) {
      points = 1000;
    } else if (roles.includes("lab_manager") || roles.includes("lab_technician")) {
      points = 100;
    } else if (roles.includes("viewer")) {
      points = 5;
    }

    const limiter = createRateLimiter({
      points,
      duration: 3600,
      strategy: "token-bucket",
    });

    const result = await limiter.consume(`upload:${ctx.user.id}`);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(result.resetMs / 1000)} detik.`,
      });
    }

    return next({ ctx });
  })
  .mutation(async ({ input, ctx }) => {
    return await documentService.upload(input, ctx.user.id);
  }),
```

#### With Role-Based Limiting

```typescript
uploadDocument: withRoleBasedRateLimit("uploads")
  .input(uploadSchema)
  .mutation(async ({ input, ctx }) => {
    return await documentService.upload(input, ctx.user.id);
  }),
```

**Result:**
- **50+ lines reduced to 4 lines**
- **Same functionality**
- **More maintainable**
- **Less error-prone**

## Complete Example: Order Management Router

```typescript
import { createTRPCRouter, withRoleBasedRateLimit } from "..";
import orderQueries from "@tepian-k3/queries/order.queries";

export const orderRouter = createTRPCRouter({
  /**
   * List orders with pagination
   * Higher roles can query more frequently
   */
  getAll: withRoleBasedRateLimit("queries")
    .input(paginationSchema)
    .query(async ({ input, ctx }) => {
      return await orderQueries.getAll(input, ctx.user.id);
    }),

  /**
   * Get order by ID
   * Standard query limits
   */
  getById: withRoleBasedRateLimit("queries")
    .input(z.object({ id: z.uuidv7() }))
    .query(async ({ input, ctx }) => {
      return await orderQueries.getById(input.id, ctx.user.id);
    }),

  /**
   * Create new order
   * Mutation limits apply
   */
  create: withRoleBasedRateLimit("mutations")
    .input(createOrderSchema)
    .mutation(async ({ input, ctx }) => {
      return await orderQueries.create(input, ctx.user.id);
    }),

  /**
   * Update order
   * Mutation limits apply
   */
  update: withRoleBasedRateLimit("mutations")
    .input(updateOrderSchema)
    .mutation(async ({ input, ctx }) => {
      return await orderQueries.update(input);
    }),

  /**
   * Approve order (admin/manager only)
   * Combines permission check with role-based rate limiting
   */
  approve: withPermission("orders.approve")
    .use(async ({ ctx, next }) => {
      // Role-based rate limiting is handled by the middleware chain
      return next({ ctx });
    })
    .input(z.object({ id: z.uuidv7() }))
    .mutation(async ({ input }) => {
      return await orderQueries.approve(input.id);
    }),

  /**
   * Generate invoice PDF
   * Uses mutation limits
   */
  generateInvoice: withRoleBasedRateLimit("mutations")
    .input(z.object({ orderId: z.uuidv7() }))
    .mutation(async ({ input, ctx }) => {
      return await orderQueries.generateInvoice(input.orderId, ctx.user.id);
    }),

  /**
   * Upload payment proof
   * Uses upload-specific limits (most restrictive)
   */
  uploadPaymentProof: withRoleBasedRateLimit("uploads")
    .input(uploadPaymentProofSchema)
    .mutation(async ({ input, ctx }) => {
      return await orderQueries.uploadPaymentProof(
        input.orderId,
        input.file,
        ctx.user.id
      );
    }),

  /**
   * Send order confirmation email
   * Email-specific limits (very restrictive)
   */
  sendConfirmation: withRoleBasedRateLimit("email")
    .input(z.object({ orderId: z.uuidv7() }))
    .mutation(async ({ input, ctx }) => {
      return await orderQueries.sendConfirmationEmail(input.orderId, ctx.user.id);
    }),
});
```

## Rate Limit Behavior by Role

### Example Test Results

```typescript
describe("Role-Based Rate Limiting", () => {
  it("should apply different limits based on role", async () => {
    // Admin user
    const adminCaller = await createAuthenticatedCaller({
      roles: ["admin"],
    });

    // Can make 50,000 queries/hr
    for (let i = 0; i < 1000; i++) {
      await adminCaller.order.getAll({ page: 1, limit: 10 });
    }
    // All succeed ✅

    // Regular user
    const userCaller = await createAuthenticatedCaller({
      roles: ["user"],
    });

    // Can make 500 queries/hr
    for (let i = 0; i < 500; i++) {
      await userCaller.order.getAll({ page: 1, limit: 10 });
    }
    // All succeed ✅

    // 501st request fails
    await expect(
      userCaller.order.getAll({ page: 1, limit: 10 })
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    // Rate limited ❌

    // Viewer
    const viewerCaller = await createAuthenticatedCaller({
      roles: ["viewer"],
    });

    // Can make only 100 queries/hr
    for (let i = 0; i < 100; i++) {
      await viewerCaller.order.getAll({ page: 1, limit: 10 });
    }
    // All succeed ✅

    // 101st request fails
    await expect(
      viewerCaller.order.getAll({ page: 1, limit: 10 })
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    // Rate limited ❌
  });
});
```

## Migration Path

### Step 1: Identify Endpoints Needing Rate Limits

```typescript
// Current code without rate limiting
export const userRouter = createTRPCRouter({
  getAll: protectedProcedure.query(...),
  create: protectedProcedure.mutation(...),
  update: protectedProcedure.mutation(...),
});
```

### Step 2: Add Role-Based Rate Limiting

```typescript
import { withRoleBasedRateLimit } from "..";

export const userRouter = createTRPCRouter({
  getAll: withRoleBasedRateLimit("queries").query(...),
  create: withRoleBasedRateLimit("mutations").mutation(...),
  update: withRoleBasedRateLimit("mutations").mutation(...),
});
```

### Step 3: Test with Different Roles

```bash
# Test as admin
curl -H "Authorization: Bearer <admin-token>" http://localhost:3000/trpc/user.getAll

# Test as user
curl -H "Authorization: Bearer <user-token>" http://localhost:3000/trpc/user.getAll

# Test as viewer
curl -H "Authorization: Bearer <viewer-token>" http://localhost:3000/trpc/user.getAll
```

## Summary

**Use Role-Based Rate Limiting When:**
- ✅ You have different user roles with different privilege levels
- ✅ You want automatic tier selection based on roles
- ✅ You want clean, maintainable code
- ✅ You want centralized rate limit configuration

**Use Fixed Rate Limiting When:**
- ✅ You need the same limit for all users (e.g., login attempts)
- ✅ You need very specific custom limits
- ✅ The endpoint is public (no authentication)

**Best Practice:**
- Use `withRoleBasedRateLimit` for **most authenticated endpoints**
- Use `withRateLimit` for **public endpoints** and **specific use cases**
- Combine both when needed for **defense in depth**

For complete documentation, see [Role-Based Rate Limiting Guide](../ROLE_BASED_RATE_LIMITING.md).
