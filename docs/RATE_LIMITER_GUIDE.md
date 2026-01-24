# Rate Limiter Service Guide

## Overview

The rate limiter service provides flexible and robust rate limiting capabilities for the Tepian K3 application. It supports multiple strategies, Redis-backed distributed rate limiting, and automatic in-memory fallback.

## Location

- **Package**: `@tepian-k3/services`
- **Import**: `@tepian-k3/services/rate-limiter`
- **Source**: `packages/services/src/rate-limiter/`

## Key Features

1. **Multiple Strategies**
   - Sliding Window (recommended) - Most accurate
   - Token Bucket - Good for burst traffic
   - Fixed Window - Simplest implementation

2. **Redis Integration**
   - Distributed rate limiting across multiple servers
   - Atomic operations using Lua scripts
   - Automatic fallback to in-memory storage

3. **Preset Configurations**
   - Pre-configured for common use cases
   - Authentication (5/15min)
   - API calls (1000/hour)
   - Email sending (10/hour)
   - OTP (3/5min)
   - Password reset (3/hour)

4. **Type Safety**
   - Full TypeScript support
   - Comprehensive type definitions

## Quick Start

```typescript
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

// Use preset for authentication
const authLimiter = rateLimiters.auth();

// Check rate limit
const result = await authLimiter.consume(`login:${userId}`);

if (!result.allowed) {
  throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(result.resetMs / 1000)}s`);
}

// Proceed with operation
```

## Common Use Cases

### 1. Authentication Rate Limiting

```typescript
// Login attempts
const limiter = rateLimiters.auth();
await limiter.consume(`login:${email}`);

// OTP verification
const otpLimiter = rateLimiters.otp();
await otpLimiter.consume(`otp:verify:${email}`);

// Password reset
const resetLimiter = rateLimiters.passwordReset();
await resetLimiter.consume(`password-reset:${email}`);
```

### 2. API Rate Limiting

```typescript
// General API calls
const apiLimiter = rateLimiters.api();
await apiLimiter.consume(`api:user:${userId}`);

// By IP address
await apiLimiter.consume(`api:ip:${ipAddress}`);
```

### 3. Email Rate Limiting

```typescript
// Email sending
const emailLimiter = rateLimiters.email();
await emailLimiter.consume(`email:${email}`);
```

### 4. Custom Rate Limits

```typescript
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";

const customLimiter = createRateLimiter({
  points: 50,           // 50 requests
  duration: 300,        // per 5 minutes
  strategy: "sliding-window",
  blockDuration: 600,   // block for 10 minutes on limit exceeded
});
```

## Integration with tRPC

### Basic Integration

```typescript
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { TRPCError } from "@trpc/server";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      const limiter = rateLimiters.auth();
      const result = await limiter.consume(`login:${input.email}`);

      if (!result.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many attempts. Try again in ${Math.ceil(result.resetMs / 60000)} minutes`,
        });
      }

      // Process login...
    }),
});
```

### With Rate Limit Headers

```typescript
export const dataRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const limiter = rateLimiters.api();
    const result = await limiter.consume(`api:user:${ctx.user.id}`);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded",
      });
    }

    // Return data with rate limit info
    return {
      data: await fetchData(),
      rateLimit: {
        limit: result.limit,
        remaining: result.remaining,
        resetAt: result.resetAt,
      },
    };
  }),
});
```

## Available Presets

| Preset | Limit | Duration | Use Case |
|--------|-------|----------|----------|
| `STRICT` | 10 req | 1 min | Very restrictive |
| `MODERATE` | 30 req | 1 min | General use |
| `LENIENT` | 100 req | 1 min | Less restrictive |
| `API` | 1000 req | 1 hour | API endpoints |
| `AUTH` | 5 req | 15 min | Login/auth |
| `EMAIL` | 10 req | 1 hour | Email sending |
| `OTP` | 3 req | 5 min | OTP verification |
| `PASSWORD_RESET` | 3 req | 1 hour | Password resets |

## Rate Limiting Strategies

### Sliding Window (Recommended)

Most accurate algorithm. Counts requests in a rolling time window.

**Use when**: You need precise rate limiting for security-sensitive operations.

### Token Bucket

Allows controlled bursts. Tokens refill continuously at a steady rate.

**Use when**: You want to allow short bursts while maintaining an average rate.

### Fixed Window

Simplest algorithm. Resets counter at fixed intervals.

**Use when**: Simplicity is more important than precision.

## API Methods

### `consume(key, points?)`

Consume points from the rate limit.

```typescript
const result = await limiter.consume("user:123", 1);
// Returns: { allowed, remaining, limit, resetMs, resetAt, consumed }
```

### `get(key)`

Get current status without consuming points.

```typescript
const status = await limiter.get("user:123");
```

### `reset(key)`

Reset rate limit for a key.

```typescript
await limiter.reset("user:123");
```

### `penalty(key)`

Block a key immediately.

```typescript
await limiter.penalty("user:123");
```

### `reward(key, points?)`

Add points back.

```typescript
await limiter.reward("user:123", 5);
```

### `isBlocked(key)`

Check if blocked.

```typescript
const blocked = await limiter.isBlocked("user:123");
```

## Best Practices

1. **Always rate limit authentication** - Use `rateLimiters.auth()`
2. **Combine email and IP limiting** - Prevent attacks across multiple accounts
3. **Reset on success** - Don't penalize legitimate users
4. **Use descriptive keys** - e.g., `login:email:${email}`
5. **Add response headers** - Help clients implement retry logic
6. **Choose appropriate presets** - Match endpoint sensitivity
7. **Monitor fallback usage** - Alert if Redis is down

## Environment Variables

```env
# Redis Configuration (optional - uses in-memory fallback if not available)
MEMURAI_HOST=localhost
MEMURAI_PORT=6379
MEMURAI_PASSWORD=your_redis_password
```

## Examples

See detailed examples in:
- `packages/services/src/rate-limiter/docs/examples/api-rate-limiting.example.ts`
- `packages/services/src/rate-limiter/docs/examples/auth-rate-limiting.example.ts`

## Full Documentation

For complete documentation, see:
- [Rate Limiter README](../packages/services/src/rate-limiter/docs/README.md)
- [Integration Guide](../packages/services/src/rate-limiter/docs/INTEGRATION_GUIDE.md)

## Testing

### Mock in Tests

```typescript
jest.mock("@tepian-k3/services/rate-limiter", () => ({
  rateLimiters: {
    auth: () => ({
      consume: jest.fn().mockResolvedValue({
        allowed: true,
        remaining: 4,
        limit: 5,
        resetMs: 900000,
        resetAt: new Date(),
        consumed: 1,
      }),
    }),
  },
}));
```

## Troubleshooting

### Rate limits not persisting across restarts

Ensure Redis is properly configured and connected. Check:
- Redis/Memurai is running
- Environment variables are set correctly
- Network connectivity to Redis

### Rate limits not working across servers

Ensure all servers connect to the same Redis instance.

### Rate limits too strict/lenient

Adjust the preset or create custom configuration:

```typescript
const limiter = createRateLimiter({
  points: 100,      // Adjust this
  duration: 60,     // Adjust this
  strategy: "sliding-window",
});
```

## Performance

- **Redis**: Atomic operations using Lua scripts
- **Memory Fallback**: Low overhead, automatic cleanup
- **Overhead**: ~1-2ms per rate limit check with Redis

## Security Considerations

1. **Use both email and IP rate limiting** for authentication
2. **Set appropriate block durations** for sensitive operations
3. **Monitor for unusual patterns** (e.g., distributed attacks)
4. **Reset limits on successful password changes**
5. **Consider progressive penalties** for repeat offenders

## Related Services

- [Email Service](../packages/services/src/email/) - For sending OTP and verification emails
- [Logger Service](../packages/services/src/logger/) - For logging rate limit events
- [Auth Package](../packages/auth/) - For authentication and authorization
