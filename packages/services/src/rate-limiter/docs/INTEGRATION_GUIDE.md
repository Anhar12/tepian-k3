# Rate Limiter Integration Guide

This guide shows how to integrate the rate limiter service into your tRPC API and Hono server.

## Quick Start

### 1. Import the Rate Limiter

```typescript
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
```

### 2. Use in tRPC Procedures

```typescript
import { createTRPCRouter, publicProcedure } from "@tepian-k3/api/trpc";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const limiter = rateLimiters.auth();

      // Get IP from request headers
      const ip = ctx.req.header("x-forwarded-for") || ctx.req.header("x-real-ip") || "unknown";

      // Check rate limit
      const result = await limiter.consume(`login:${input.email}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many login attempts. Try again in ${Math.ceil(result.resetMs / 60000)} minutes`,
        });
      }

      // Process login...
      const user = await authenticateUser(input.email, input.password);

      if (!user) {
        // Login failed, but attempt was counted
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Invalid credentials. ${result.remaining} attempts remaining`,
        });
      }

      // Success - reset rate limit
      await limiter.reset(`login:${input.email}`);

      return { user, token: generateToken(user) };
    }),
});
```

## Integration Examples

### Authentication Endpoints

#### Login

```typescript
export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      const limiter = rateLimiters.auth();
      const ip = getClientIp(ctx.req);

      // Rate limit by email and IP
      const [emailResult, ipResult] = await Promise.all([
        limiter.consume(`login:email:${input.email}`),
        limiter.consume(`login:ip:${ip}`),
      ]);

      if (!emailResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many login attempts. Try again in ${Math.ceil(emailResult.resetMs / 60000)} minutes`,
        });
      }

      if (!ipResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many login attempts from your IP. Try again in ${Math.ceil(ipResult.resetMs / 60000)} minutes`,
        });
      }

      // Authenticate user...
      const result = await authenticateUser(input.email, input.password);

      if (!result.success) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `Invalid credentials. ${emailResult.remaining} attempts remaining`,
        });
      }

      // Success - reset limits
      await limiter.reset(`login:email:${input.email}`);
      await limiter.reset(`login:ip:${ip}`);

      return result;
    }),
});
```

#### OTP Sending

```typescript
sendOTP: publicProcedure
  .input(z.object({ email: z.string().email() }))
  .mutation(async ({ input, ctx }) => {
    const otpLimiter = rateLimiters.otp();
    const emailLimiter = rateLimiters.email();
    const ip = getClientIp(ctx.req);

    // Check OTP rate limit
    const otpResult = await otpLimiter.consume(`otp:send:${input.email}`);
    if (!otpResult.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many OTP requests. Try again in ${Math.ceil(otpResult.resetMs / 60000)} minutes`,
      });
    }

    // Check IP rate limit
    const ipResult = await otpLimiter.consume(`otp:send:ip:${ip}`);
    if (!ipResult.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many OTP requests from your IP",
      });
    }

    // Check email rate limit
    const emailResult = await emailLimiter.consume(`email:otp:${input.email}`);
    if (!emailResult.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Email rate limit exceeded",
      });
    }

    // Send OTP
    const otp = await generateAndSendOTP(input.email);

    return {
      success: true,
      attemptsRemaining: otpResult.remaining,
      expiresIn: 300, // 5 minutes
    };
  }),
```

#### OTP Verification

```typescript
verifyOTP: publicProcedure
  .input(z.object({ email: z.string().email(), code: z.string() }))
  .mutation(async ({ input }) => {
    const limiter = rateLimiters.otp();

    // Rate limit verification attempts
    const result = await limiter.consume(`otp:verify:${input.email}`);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many verification attempts. Request a new OTP in ${Math.ceil(result.resetMs / 60000)} minutes`,
      });
    }

    // Verify OTP
    const isValid = await verifyOTPCode(input.email, input.code);

    if (!isValid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Invalid OTP. ${result.remaining} attempts remaining`,
      });
    }

    // Success - reset limit
    await limiter.reset(`otp:verify:${input.email}`);

    return { success: true };
  }),
```

### API Endpoints

#### Protected API with Rate Limiting

```typescript
export const dataRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const limiter = rateLimiters.api();

      // Rate limit by user ID
      const result = await limiter.consume(`api:user:${ctx.user.id}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `API rate limit exceeded. Try again in ${Math.ceil(result.resetMs / 1000)} seconds`,
        });
      }

      // Fetch data...
      const data = await fetchData(input);

      return {
        data,
        rateLimit: {
          limit: result.limit,
          remaining: result.remaining,
          resetAt: result.resetAt,
        },
      };
    }),
});
```

### Hono Middleware

#### Rate Limiting Middleware

Create a reusable middleware:

```typescript
// packages/api/src/middleware/rate-limit.ts
import { createMiddleware } from "hono/factory";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { TRPCError } from "@trpc/server";

export const rateLimitMiddleware = (limiterType: keyof typeof rateLimiters = "api") => {
  return createMiddleware(async (c, next) => {
    const limiter = rateLimiters[limiterType]();

    // Get user ID from context or use IP
    const userId = c.get("userId");
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const key = userId ? `api:user:${userId}` : `api:ip:${ip}`;

    // Check rate limit
    const result = await limiter.consume(key);

    // Add headers
    c.header("X-RateLimit-Limit", result.limit.toString());
    c.header("X-RateLimit-Remaining", result.remaining.toString());
    c.header("X-RateLimit-Reset", result.resetAt.toISOString());

    if (!result.allowed) {
      c.header("Retry-After", Math.ceil(result.resetMs / 1000).toString());
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }

    await next();
  });
};
```

#### Usage in Hono App

```typescript
// apps/server/src/index.ts
import { Hono } from "hono";
import { rateLimitMiddleware } from "./middleware/rate-limit";

const app = new Hono();

// Apply to all API routes
app.use("/api/*", rateLimitMiddleware("api"));

// Apply specific limiters to auth routes
app.use("/api/auth/login", rateLimitMiddleware("auth"));
app.use("/api/auth/otp", rateLimitMiddleware("otp"));

// Your routes...
```

## Advanced Patterns

### Cost-Based Rate Limiting

Different operations consume different amounts of quota:

```typescript
export const dataRouter = createTRPCRouter({
  getData: protectedProcedure.query(async ({ ctx }) => {
    await consumeRateLimit(ctx.user.id, 1); // 1 point for read
    return fetchData();
  }),

  createData: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      await consumeRateLimit(ctx.user.id, 5); // 5 points for write
      return createData(input);
    }),

  deleteData: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await consumeRateLimit(ctx.user.id, 10); // 10 points for delete
      return deleteData(input.id);
    }),
});

async function consumeRateLimit(userId: string, points: number) {
  const limiter = rateLimiters.api();
  const result = await limiter.consume(`api:user:${userId}`, points);

  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Insufficient rate limit quota. Operation requires ${points} points, but only ${result.remaining} remaining.`,
    });
  }
}
```

### Tiered Rate Limiting

Different limits based on user tier:

```typescript
async function getRateLimiter(userRole: string) {
  const config = {
    free: { points: 100, duration: 3600 },
    premium: { points: 1000, duration: 3600 },
    enterprise: { points: 10000, duration: 3600 },
  }[userRole] || { points: 100, duration: 3600 };

  return createRateLimiter({
    ...config,
    strategy: "sliding-window",
  });
}

export const dataRouter = createTRPCRouter({
  getData: protectedProcedure.query(async ({ ctx }) => {
    const limiter = await getRateLimiter(ctx.user.role);
    const result = await limiter.consume(`api:user:${ctx.user.id}`);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }

    return fetchData();
  }),
});
```

## Helper Functions

### Get Client IP

```typescript
export function getClientIp(req: Request): string {
  return (
    req.header("x-forwarded-for")?.split(",")[0].trim() ||
    req.header("x-real-ip") ||
    req.header("cf-connecting-ip") || // Cloudflare
    "unknown"
  );
}
```

### Format Rate Limit Error

```typescript
export function formatRateLimitError(result: RateLimiterResult): string {
  const seconds = Math.ceil(result.resetMs / 1000);
  const minutes = Math.ceil(seconds / 60);

  if (minutes > 60) {
    const hours = Math.ceil(minutes / 60);
    return `Try again in ${hours} hour${hours > 1 ? "s" : ""}`;
  }

  if (minutes > 1) {
    return `Try again in ${minutes} minutes`;
  }

  return `Try again in ${seconds} seconds`;
}
```

## Testing

### Mock Rate Limiter in Tests

```typescript
// In your test setup
jest.mock("@tepian-k3/services/rate-limiter", () => ({
  rateLimiters: {
    auth: () => ({
      consume: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 4,
        limit: 5,
        resetMs: 900000,
        resetAt: new Date(Date.now() + 900000),
        consumed: 1,
      }),
      reset: jest.fn(),
    }),
    api: () => ({
      consume: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 999,
        limit: 1000,
        resetMs: 3600000,
        resetAt: new Date(Date.now() + 3600000),
        consumed: 1,
      }),
      reset: jest.fn(),
    }),
  },
}));
```

## Monitoring

### Log Rate Limit Events

```typescript
import { logger } from "@tepian-k3/services/logger";

export async function consumeWithLogging(
  limiter: RateLimiter,
  key: string,
  points = 1
) {
  const result = await limiter.consume(key, points);

  if (!result.allowed) {
    logger.warn("Rate limit exceeded", {
      key,
      points,
      remaining: result.remaining,
      limit: result.limit,
      resetAt: result.resetAt,
    });
  }

  return result;
}
```

## Best Practices

1. **Always rate limit authentication endpoints** - Use `rateLimiters.auth()`
2. **Combine email and IP rate limiting** - Prevent attacks across multiple accounts
3. **Reset limits on successful actions** - Don't penalize legitimate users
4. **Use descriptive keys** - Include action type: `login:email:${email}`
5. **Add rate limit headers** - Help clients implement retry logic
6. **Choose appropriate presets** - Match the sensitivity of the endpoint
7. **Monitor fallback usage** - Alert if Redis is unavailable
8. **Test rate limits** - Ensure they work as expected in production

## Troubleshooting

### Rate limits not persisting across restarts

**Issue**: Using in-memory fallback

**Solution**: Ensure Redis is properly configured and connected

### Rate limits too strict

**Issue**: Users getting blocked frequently

**Solution**:
- Increase `points` or `duration`
- Use `token-bucket` strategy for bursty traffic
- Reset limits on successful operations

### Rate limits not working across servers

**Issue**: Each server has its own in-memory storage

**Solution**: Ensure Redis is connected and shared across servers

## Related Documentation

- [Rate Limiter README](./README.md) - Full documentation
- [API Rate Limiting Examples](./examples/api-rate-limiting.example.ts)
- [Auth Rate Limiting Examples](./examples/auth-rate-limiting.example.ts)
