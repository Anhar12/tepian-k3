# Rate Limiting Middleware for tRPC

This guide explains how to use the rate limiting middleware in your tRPC routers.

## Overview

The rate limiting middleware provides two main functions:

1. **`withRateLimit`** - For public procedures (unauthenticated)
2. **`withProtectedRateLimit`** - For protected procedures (authenticated)

These middleware functions work just like `withPermission`, `withRole`, etc. - they wrap your procedures and automatically enforce rate limits.

## Basic Usage

### Public Procedures (IP-based)

```typescript
import { createTRPCRouter, withRateLimit } from "..";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

export const authRouter = createTRPCRouter({
  // Rate limit login attempts by IP address (5 attempts per 15 minutes)
  login: withRateLimit(rateLimiters.auth())
    .input(loginSchema)
    .mutation(async ({ input }) => {
      // Your login logic here
    }),

  // Rate limit registration by IP (same limits as AUTH preset)
  register: withRateLimit(rateLimiters.auth())
    .input(registerSchema)
    .mutation(async ({ input }) => {
      // Your registration logic here
    }),
});
```

### Protected Procedures (User-based)

```typescript
import { createTRPCRouter, withProtectedRateLimit } from "..";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

export const userRouter = createTRPCRouter({
  // Rate limit by user ID (1000 requests per hour)
  getProfile: withProtectedRateLimit(rateLimiters.api()).query(
    async ({ ctx }) => {
      // User is guaranteed to exist (from protectedProcedure)
      return await getUserProfile(ctx.user.id);
    },
  ),

  // Rate limit updates by user ID
  updateProfile: withProtectedRateLimit(rateLimiters.api())
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      return await updateUserProfile(ctx.user.id, input);
    }),
});
```

## Custom Rate Limit Keys

You can provide a custom function to generate the rate limit key:

### Example: Rate limit by email address

```typescript
export const authRouter = createTRPCRouter({
  // Rate limit by email instead of IP
  login: withRateLimit(
    rateLimiters.auth(),
    (ctx, input) => `login:${input.email}`,
  )
    .input(loginSchema)
    .mutation(async ({ input }) => {
      // Login logic
    }),

  // Rate limit password reset by email (3 attempts per hour)
  forgotPassword: withRateLimit(
    rateLimiters.passwordReset(),
    (ctx, input) => `reset:${input.email}`,
  )
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      // Password reset logic
    }),
});
```

### Example: Rate limit by user email (protected)

```typescript
export const emailRouter = createTRPCRouter({
  // Rate limit sending emails by user email (10 per hour)
  sendEmail: withProtectedRateLimit(
    rateLimiters.email(),
    (ctx) => `email:${ctx.user.email}`,
  )
    .input(emailSchema)
    .mutation(async ({ input, ctx }) => {
      // Send email logic
    }),
});
```

### Example: Composite keys

```typescript
export const otpRouter = createTRPCRouter({
  // Rate limit OTP by email + IP combination
  sendOtp: withRateLimit(
    rateLimiters.otp(),
    (ctx, input) => `otp:${input.email}:${ctx.ip}`,
  )
    .input(otpSchema)
    .mutation(async ({ input }) => {
      // Send OTP logic
    }),
});
```

## Available Presets

The `rateLimiters` service provides 8 preset configurations:

```typescript
rateLimiters.auth(); // 5 attempts per 15 minutes
rateLimiters.api(); // 1000 requests per hour
rateLimiters.email(); // 10 emails per hour
rateLimiters.otp(); // 3 attempts per 5 minutes
rateLimiters.passwordReset(); // 3 attempts per hour
rateLimiters.strict(); // 10 requests per minute
rateLimiters.moderate(); // 30 requests per minute
rateLimiters.lenient(); // 100 requests per minute
```

## Combining with Other Middleware

You can chain rate limiting with other middleware:

### Rate limiting + Permission checks

```typescript
export const adminRouter = createTRPCRouter({
  // First check rate limit, then check permission
  deleteUser: withProtectedRateLimit(rateLimiters.strict())
    .use(async ({ ctx, next }) => {
      // Check permission
      const hasPermission = await permissionQueries.userHasPermission(
        ctx.user.id,
        "users.delete",
      );
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Tidak memiliki izin",
        });
      }
      return next({ ctx });
    })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Delete user logic
    }),
});
```

### Rate limiting with existing middleware patterns

```typescript
import { withPermission } from "..";

export const orderRouter = createTRPCRouter({
  // Use withPermission which already includes protectedProcedure
  // Then add rate limiting
  createOrder: withPermission("orders.create")
    .use(async ({ ctx, next }) => {
      // Apply rate limiting manually in middleware
      const limiter = rateLimiters.api();
      const result = await limiter.consume(`user:${ctx.user.id}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Terlalu banyak permintaan`,
        });
      }

      return next({ ctx });
    })
    .input(createOrderSchema)
    .mutation(async ({ input, ctx }) => {
      // Create order logic
    }),
});
```

## Accessing Rate Limit Info

The rate limit information is added to the context and available in your procedure:

```typescript
export const apiRouter = createTRPCRouter({
  getData: withProtectedRateLimit(rateLimiters.api()).query(async ({ ctx }) => {
    // Access rate limit info
    console.log(`Remaining requests: ${ctx.rateLimit.remaining}`);
    console.log(`Reset in: ${ctx.rateLimit.resetMs}ms`);

    return {
      data: await fetchData(),
      rateLimit: ctx.rateLimit, // Return to client if needed
    };
  }),
});
```

## Best Practices

### 1. Choose the Right Preset

- **Authentication endpoints** (login, register, password reset): Use `rateLimiters.auth()` or `rateLimiters.otp()`
- **Email sending**: Use `rateLimiters.email()`
- **General API calls**: Use `rateLimiters.api()`
- **Admin/sensitive operations**: Use `rateLimiters.strict()`
- **Public endpoints**: Use `rateLimiters.moderate()` or `rateLimiters.lenient()`

### 2. Use Specific Keys

More specific keys provide better isolation:

```typescript
// ✅ Good: Specific key per action
withRateLimit(rateLimiters.auth(), (ctx, input) => `login:${input.email}`);

// ❌ Less ideal: Generic key
withRateLimit(rateLimiters.auth(), (ctx) => ctx.ip);
```

### 3. Apply Rate Limiting Early

Apply rate limiting before expensive operations:

```typescript
export const searchRouter = createTRPCRouter({
  // ✅ Good: Rate limit before expensive search
  search: withRateLimit(rateLimiters.api())
    .input(searchSchema)
    .query(async ({ input }) => {
      // Expensive database search
      return await performSearch(input);
    }),
});
```

### 4. Consider Using Multiple Rate Limiters

Different endpoints may need different limits:

```typescript
export const authRouter = createTRPCRouter({
  // Strict limit for login
  login: withRateLimit(rateLimiters.auth())
    .input(loginSchema)
    .mutation(async ({ input }) => {
      /* ... */
    }),

  // More lenient for checking email availability
  checkEmail: withRateLimit(rateLimiters.moderate())
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      /* ... */
    }),
});
```

### 5. Use IP-based for Public, User-based for Protected

```typescript
// ✅ Public endpoints: IP-based rate limiting
login: withRateLimit(rateLimiters.auth())
  .input(loginSchema)
  .mutation(async ({ input }) => { /* ... */ }),

// ✅ Protected endpoints: User-based rate limiting
updateProfile: withProtectedRateLimit(rateLimiters.api())
  .input(updateSchema)
  .mutation(async ({ input, ctx }) => { /* ... */ }),
```

## Real-World Examples

### Complete Auth Router

```typescript
import { createTRPCRouter, withRateLimit } from "..";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { loginSchema, registerSchema, otpSchema } from "@tepian-k3/schema";

export const authRouter = createTRPCRouter({
  // Rate limit login by email (5 attempts per 15 min)
  login: withRateLimit(
    rateLimiters.auth(),
    (ctx, input) => `login:${input.email}`,
  )
    .input(loginSchema)
    .mutation(async ({ input }) => {
      return await handleLogin(input);
    }),

  // Rate limit registration by IP (5 per 15 min)
  register: withRateLimit(rateLimiters.auth())
    .input(registerSchema)
    .mutation(async ({ input }) => {
      return await handleRegistration(input);
    }),

  // Rate limit OTP sending (3 per 5 min per email)
  sendOtp: withRateLimit(
    rateLimiters.otp(),
    (ctx, input) => `otp:${input.email}`,
  )
    .input(otpSchema)
    .mutation(async ({ input }) => {
      return await sendOtpEmail(input.email);
    }),

  // Rate limit OTP verification (3 per 5 min per email)
  verifyOtp: withRateLimit(
    rateLimiters.otp(),
    (ctx, input) => `verify:${input.email}`,
  )
    .input(z.object({ email: z.string(), code: z.string() }))
    .mutation(async ({ input }) => {
      return await verifyOtpCode(input);
    }),

  // Rate limit password reset requests (3 per hour per email)
  forgotPassword: withRateLimit(
    rateLimiters.passwordReset(),
    (ctx, input) => `reset:${input.email}`,
  )
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      return await sendPasswordResetEmail(input.email);
    }),
});
```

### Complete User Router

```typescript
import { createTRPCRouter, withProtectedRateLimit } from "..";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

export const userRouter = createTRPCRouter({
  // Standard API rate limit (1000 per hour per user)
  getProfile: withProtectedRateLimit(rateLimiters.api()).query(
    async ({ ctx }) => {
      return await getUserProfile(ctx.user.id);
    },
  ),

  // Standard API rate limit for updates
  updateProfile: withProtectedRateLimit(rateLimiters.api())
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      return await updateUserProfile(ctx.user.id, input);
    }),

  // Strict rate limit for sensitive operations
  deleteAccount: withProtectedRateLimit(rateLimiters.strict()).mutation(
    async ({ ctx }) => {
      return await deleteUserAccount(ctx.user.id);
    },
  ),

  // Email-specific rate limit for email changes
  changeEmail: withProtectedRateLimit(
    rateLimiters.email(),
    (ctx) => `change-email:${ctx.user.email}`,
  )
    .input(z.object({ newEmail: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      return await changeUserEmail(ctx.user.id, input.newEmail);
    }),
});
```

## Error Handling

When rate limit is exceeded, a `TOO_MANY_REQUESTS` error is thrown:

```typescript
// On the client side
try {
  await trpc.auth.login.mutate({ email, password });
} catch (error) {
  if (error.code === "TOO_MANY_REQUESTS") {
    // Show user-friendly message
    toast.error(error.message); // "Terlalu banyak permintaan. Coba lagi dalam X detik."
  }
}
```

## Custom Rate Limiter

If presets don't fit your needs, create a custom rate limiter:

```typescript
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";

// Create custom rate limiter
const customLimiter = createRateLimiter({
  points: 50, // 50 requests
  duration: 300, // per 5 minutes
  strategy: "sliding-window",
  blockDuration: 600, // Block for 10 minutes if exceeded
});

// Use in router
export const apiRouter = createTRPCRouter({
  customEndpoint: withRateLimit(customLimiter).query(async () => {
    /* ... */
  }),
});
```

## Testing

For testing, you can bypass rate limiting or use lenient limits:

```typescript
// In test environment
const testLimiter =
  process.env.NODE_ENV === "test"
    ? createRateLimiter({ points: 1000000, duration: 1 }) // Essentially no limit
    : rateLimiters.auth();

export const authRouter = createTRPCRouter({
  login: withRateLimit(testLimiter)
    .input(loginSchema)
    .mutation(async ({ input }) => {
      /* ... */
    }),
});
```

## Monitoring

To monitor rate limiting effectiveness, log when limits are hit:

```typescript
export const withRateLimit = <TInput = unknown>(
  limiter: RateLimiter,
  getKey?: (ctx: any, input?: TInput) => string,
) =>
  publicProcedure.use(async ({ ctx, next, getRawInput }) => {
    const rawInput = await getRawInput();
    const key = getKey ? getKey(ctx, rawInput as TInput) : ctx.ip;

    const result = await limiter.consume(key);

    if (!result.allowed) {
      // Log rate limit hit for monitoring
      console.warn(`[Rate Limit] Key: ${key}, Reset in: ${result.resetMs}ms`);

      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Terlalu banyak permintaan. Coba lagi dalam ${Math.ceil(result.resetMs / 1000)} detik.`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        rateLimit: result,
      },
    });
  });
```

## Summary

1. Use `withRateLimit()` for public procedures (defaults to IP-based)
2. Use `withProtectedRateLimit()` for authenticated procedures (defaults to user-based)
3. Provide custom key functions for specific rate limiting needs
4. Choose appropriate presets for different use cases
5. Chain with other middleware as needed
6. Access rate limit info in `ctx.rateLimit`

For more details on the rate limiter service itself, see the [Rate Limiter Service Documentation](../../services/src/rate-limiter/docs/README.md).
