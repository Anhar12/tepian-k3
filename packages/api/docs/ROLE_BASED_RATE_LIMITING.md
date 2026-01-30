# Role-Based Rate Limiting

This guide explains how to use role-based rate limiting in your tRPC routers, where different user roles automatically receive different rate limits.

## Overview

Role-based rate limiting automatically applies different rate limits based on a user's role. This is useful for:

- **Giving admins higher limits** than regular users
- **Preventing abuse** from low-privilege accounts
- **Providing premium features** with higher limits for certain roles
- **Simplifying rate limit management** - no need to manually configure limits for each role

## Rate Limit Tiers

The system defines 4 tiers, each with different limits:

| Tier          | Roles                       | API Calls | Mutations | Queries | Uploads | Emails |
| ------------- | --------------------------- | --------- | --------- | ------- | ------- | ------ |
| **Unlimited** | super_admin, admin          | 100k/hr   | 10k/hr    | 50k/hr  | 1000/hr | 500/hr |
| **Premium**   | lab_manager, lab_technician | 5k/hr     | 500/hr    | 2k/hr   | 100/hr  | 50/hr  |
| **Standard**  | user, employee              | 1k/hr     | 100/hr    | 500/hr  | 20/hr   | 10/hr  |
| **Basic**     | viewer                      | 100/hr    | 10/hr     | 100/hr  | 5/hr    | 3/hr   |

### Tier Assignment

Roles are mapped to tiers in `packages/constants/src/rate-limits.ts`:

```typescript
export const ROLE_RATE_LIMIT_TIERS: Record<Role, RateLimitTier> = {
  // Admin tiers - highest limits
  super_admin: "unlimited",
  admin: "unlimited",
  lab_manager: "premium",

  // Staff tiers - moderate limits
  lab_technician: "premium",
  employee: "standard",

  // User tiers - standard limits
  user: "standard",

  // Restricted tiers - lowest limits
  viewer: "basic",
};
```

**Important:** If a user has multiple roles, the system automatically uses the **highest tier** among all their roles.

## Basic Usage

### withRoleBasedRateLimit Middleware

The `withRoleBasedRateLimit` middleware automatically applies appropriate rate limits based on the authenticated user's roles.

```typescript
import { createTRPCRouter, withRoleBasedRateLimit } from "..";

export const userRouter = createTRPCRouter({
  // Automatically applies different limits based on user role
  getProfile: withRoleBasedRateLimit("api").query(async ({ ctx }) => {
    return await getUserProfile(ctx.user.id);
  }),

  updateProfile: withRoleBasedRateLimit("mutations")
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      return await updateUserProfile(ctx.user.id, input);
    }),
});
```

### Operation Types

The middleware accepts 5 operation types, each with its own rate limits per tier:

1. **`api`** - General API calls (queries + mutations)
2. **`mutations`** - Write operations (create, update, delete)
3. **`queries`** - Read operations (get, list, search)
4. **`uploads`** - File upload operations
5. **`email`** - Email sending operations

```typescript
export const contentRouter = createTRPCRouter({
  // Read operations - higher limits
  getContent: withRoleBasedRateLimit("queries")
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => { ... }),

  // Write operations - moderate limits
  createContent: withRoleBasedRateLimit("mutations")
    .input(createContentSchema)
    .mutation(async ({ input }) => { ... }),

  // Uploads - restrictive limits
  uploadFile: withRoleBasedRateLimit("uploads")
    .input(uploadSchema)
    .mutation(async ({ input }) => { ... }),

  // Email - very restrictive limits
  sendNotification: withRoleBasedRateLimit("email")
    .input(emailSchema)
    .mutation(async ({ input }) => { ... }),
});
```

## Real-World Examples

### Example 1: User Management Router

```typescript
import { createTRPCRouter, withRoleBasedRateLimit } from "..";
import usersQueries from "@tepian-k3/queries/users.queries";

export const userRouter = createTRPCRouter({
  /**
   * Get all users (paginated)
   * - Admins: 100k queries/hr
   * - Users: 500 queries/hr
   * - Viewers: 100 queries/hr
   */
  getAll: withRoleBasedRateLimit("queries")
    .input(paginationSchema)
    .query(async ({ input }) => {
      return await usersQueries.getAllUsers(input);
    }),

  /**
   * Get user by ID
   * - Admins: 50k queries/hr
   * - Users: 500 queries/hr
   * - Viewers: 100 queries/hr
   */
  getById: withRoleBasedRateLimit("queries")
    .input(z.object({ id: z.uuidv7() }))
    .query(async ({ input }) => {
      return await usersQueries.getUserById(input.id);
    }),

  /**
   * Create new user
   * - Admins: 10k mutations/hr
   * - Users: 100 mutations/hr
   * - Viewers: 10 mutations/hr (restricted)
   */
  create: withRoleBasedRateLimit("mutations")
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await usersQueries.createUser(input);
    }),

  /**
   * Update user
   * - Admins: 10k mutations/hr
   * - Users: 100 mutations/hr
   * - Viewers: 10 mutations/hr (restricted)
   */
  update: withRoleBasedRateLimit("mutations")
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      return await usersQueries.updateUser(input);
    }),
});
```

### Example 2: Document Management Router

```typescript
import { createTRPCRouter, withRoleBasedRateLimit } from "..";
import { documentService } from "@tepian-k3/services/storage";

export const documentRouter = createTRPCRouter({
  /**
   * List documents
   * Query operation with role-based limits
   */
  list: withRoleBasedRateLimit("queries")
    .input(paginationSchema)
    .query(async ({ input }) => {
      return await documentService.list(input);
    }),

  /**
   * Upload document
   * Upload operation with restrictive limits
   * - Admins: 1000/hr
   * - Lab Staff: 100/hr
   * - Users: 20/hr
   * - Viewers: 5/hr
   */
  upload: withRoleBasedRateLimit("uploads")
    .input(uploadDocumentSchema)
    .mutation(async ({ input, ctx }) => {
      return await documentService.upload(input, ctx.user.id);
    }),

  /**
   * Generate document
   * Mutation with moderate limits
   */
  generate: withRoleBasedRateLimit("mutations")
    .input(generateDocumentSchema)
    .mutation(async ({ input }) => {
      return await documentService.generate(input);
    }),
});
```

### Example 3: Email Notification Router

```typescript
import { createTRPCRouter, withRoleBasedRateLimit } from "..";
import { emailService } from "@tepian-k3/services/email";

export const emailRouter = createTRPCRouter({
  /**
   * Send email notification
   * Email operation with very restrictive limits
   * - Admins: 500/hr
   * - Lab Staff: 50/hr
   * - Users: 10/hr
   * - Viewers: 3/hr
   */
  send: withRoleBasedRateLimit("email")
    .input(sendEmailSchema)
    .mutation(async ({ input, ctx }) => {
      return await emailService.send({
        to: input.to,
        subject: input.subject,
        body: input.body,
        from: ctx.user.email,
      });
    }),

  /**
   * Send bulk email (admin only)
   * Still rate limited but with high limits for admins
   */
  sendBulk: withRoleBasedRateLimit("email")
    .input(sendBulkEmailSchema)
    .mutation(async ({ input }) => {
      return await emailService.sendBulk(input);
    }),
});
```

### Example 4: Testing Workflow Router

```typescript
import { createTRPCRouter, withRoleBasedRateLimit } from "..";

export const testingRouter = createTRPCRouter({
  /**
   * Get testing data
   * Lab staff get higher limits for querying
   */
  getAll: withRoleBasedRateLimit("queries")
    .input(paginationSchema)
    .query(async ({ input }) => {
      return await testingQueries.getAll(input);
    }),

  /**
   * Update testing results
   * Lab technicians get premium limits (500/hr)
   * Regular users get standard limits (100/hr)
   */
  updateResults: withRoleBasedRateLimit("mutations")
    .input(updateResultsSchema)
    .mutation(async ({ input }) => {
      return await testingQueries.updateResults(input);
    }),

  /**
   * Upload test report
   * Lab staff: 100/hr
   * Users: 20/hr
   */
  uploadReport: withRoleBasedRateLimit("uploads")
    .input(uploadReportSchema)
    .mutation(async ({ input }) => {
      return await testingQueries.uploadReport(input);
    }),
});
```

## Custom Keys

You can provide a custom function to generate the rate limit key:

```typescript
export const orderRouter = createTRPCRouter({
  // Rate limit by user + order ID combination
  updateOrder: withRoleBasedRateLimit(
    "mutations",
    (ctx, input) => `order:${input.orderId}:${ctx.user.id}`,
  )
    .input(updateOrderSchema)
    .mutation(async ({ input }) => {
      return await orderQueries.update(input);
    }),

  // Rate limit by company ID
  createOrder: withRoleBasedRateLimit(
    "mutations",
    (ctx) => `order:create:${ctx.user.companyId}`,
  )
    .input(createOrderSchema)
    .mutation(async ({ input }) => {
      return await orderQueries.create(input);
    }),
});
```

## Advantages Over Fixed Rate Limiting

### Before: Fixed Rate Limiting

```typescript
// ❌ Same limits for everyone
export const userRouter = createTRPCRouter({
  getProfile: withProtectedRateLimit(rateLimiters.api())
    .query(async ({ ctx }) => { ... }),

  // All users limited to 1000 requests/hr
  // Admins need more, viewers should have less
});
```

### After: Role-Based Rate Limiting

```typescript
// ✅ Automatic tier selection based on role
export const userRouter = createTRPCRouter({
  getProfile: withRoleBasedRateLimit("api")
    .query(async ({ ctx }) => { ... }),

  // Admins: 100k/hr
  // Users: 1k/hr
  // Viewers: 100/hr
});
```

## Combining with Other Middleware

Role-based rate limiting can be combined with permission checks:

```typescript
import { withPermission, withRoleBasedRateLimit } from "..";

export const adminRouter = createTRPCRouter({
  // First check permission, then apply role-based rate limit
  deleteUser: withPermission("users.delete")
    .use(async ({ ctx, next }) => {
      // Apply role-based rate limiting manually
      const limiter = createRateLimiter(
        getRateLimitConfig(ctx.user.roles as Role[], "mutations"),
      );

      const result = await limiter.consume(`delete:${ctx.user.id}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Terlalu banyak permintaan",
        });
      }

      return next({ ctx });
    })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await usersQueries.deleteUser(input.id);
    }),
});
```

## Accessing Rate Limit Info

Rate limit information is added to the context:

```typescript
export const userRouter = createTRPCRouter({
  getProfile: withRoleBasedRateLimit("api").query(async ({ ctx }) => {
    // Access rate limit info
    console.log(`Remaining: ${ctx.rateLimit.remaining}`);
    console.log(`Reset in: ${ctx.rateLimit.resetMs}ms`);
    console.log(`Tier: ${ctx.rateLimit.tier}`);

    return {
      profile: await getUserProfile(ctx.user.id),
      rateLimit: ctx.rateLimit, // Include in response if needed
    };
  }),
});
```

## Customizing Tier Configuration

You can modify tier configurations in [packages/constants/src/rate-limits.ts](f:\Monorepo\tepian-k3\packages\constants\src\rate-limits.ts):

```typescript
export const RATE_LIMIT_TIER_CONFIGS: Record<RateLimitTier, {...}> = {
  standard: {
    api: { points: 1000, duration: 3600, strategy: "sliding-window" },
    mutations: { points: 100, duration: 3600, strategy: "sliding-window" },
    queries: { points: 500, duration: 3600, strategy: "sliding-window" },
    uploads: { points: 20, duration: 3600, strategy: "token-bucket" },
    email: { points: 10, duration: 3600, strategy: "token-bucket" },
  },
  // ... other tiers
};
```

## Testing

### Test Different Role Limits

```typescript
describe("Role-Based Rate Limiting", () => {
  it("should allow more requests for admins than users", async () => {
    // Admin user - should handle 5000 requests/hr
    const adminCaller = createCallerWithRole("admin");

    for (let i = 0; i < 100; i++) {
      await adminCaller.user.getProfile();
    }
    // All succeed

    // Regular user - limited to 1000 requests/hr
    const userCaller = createCallerWithRole("user");

    for (let i = 0; i < 100; i++) {
      await userCaller.user.getProfile();
    }
    // All succeed

    // Viewer - limited to 100 requests/hr
    const viewerCaller = createCallerWithRole("viewer");

    for (let i = 0; i < 100; i++) {
      await viewerCaller.user.getProfile();
    }
    // Should be rate limited
  });
});
```

## Best Practices

### 1. Choose the Right Operation Type

```typescript
// ✅ Good: Use specific operation types
getUsers: withRoleBasedRateLimit("queries"); // Read-heavy
createUser: withRoleBasedRateLimit("mutations"); // Write operation
uploadDoc: withRoleBasedRateLimit("uploads"); // File upload
sendEmail: withRoleBasedRateLimit("email"); // Email sending

// ❌ Less ideal: Use generic "api" for everything
getUsers: withRoleBasedRateLimit("api");
createUser: withRoleBasedRateLimit("api");
```

### 2. Use Role-Based for Most Endpoints

```typescript
// ✅ Good: Use role-based for general endpoints
export const userRouter = createTRPCRouter({
  getAll: withRoleBasedRateLimit("queries").query(...),
  getById: withRoleBasedRateLimit("queries").query(...),
  create: withRoleBasedRateLimit("mutations").mutation(...),
});
```

### 3. Combine with Fixed Limits for Sensitive Operations

```typescript
// Use both: Fixed strict limit + role-based
export const authRouter = createTRPCRouter({
  // Fixed strict limit for login (applies to all roles)
  login: withRateLimit(rateLimiters.auth(), (ctx, input) => `login:${input.email}`)
    .input(loginSchema)
    .mutation(...),

  // Role-based for post-auth operations
  changePassword: withRoleBasedRateLimit("mutations")
    .input(changePasswordSchema)
    .mutation(...),
});
```

### 4. Monitor Rate Limit Usage

```typescript
export const monitoredRouter = createTRPCRouter({
  getData: withRoleBasedRateLimit("queries").query(async ({ ctx }) => {
    // Log rate limit usage
    if (ctx.rateLimit.remaining < 10) {
      console.warn(
        `User ${ctx.user.id} approaching rate limit: ${ctx.rateLimit.remaining} remaining`,
      );
    }

    return await fetchData();
  }),
});
```

## Summary

1. **Use `withRoleBasedRateLimit(operation)`** for automatic tier selection
2. **Choose appropriate operation type**: queries, mutations, uploads, email
3. **4 tiers available**: basic, standard, premium, unlimited
4. **Highest tier wins** when user has multiple roles
5. **Customize keys** for specific rate limiting needs
6. **Access rate limit info** via `ctx.rateLimit`

For more details, see:

- [Rate Limiting Middleware Guide](./RATE_LIMITING_MIDDLEWARE.md)
- [Rate Limiter Service Documentation](../../services/src/rate-limiter/docs/README.md)
- [Rate Limit Constants](../../constants/src/rate-limits.ts)
