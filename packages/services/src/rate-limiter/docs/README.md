# Rate Limiter Service

A powerful and flexible rate limiting service with Redis support and in-memory fallback for the Tepian K3 monorepo.

## Features

- **Multiple Strategies**: Sliding window, token bucket, and fixed window algorithms
- **Redis-backed**: Uses Redis for distributed rate limiting across multiple instances
- **Automatic Fallback**: Falls back to in-memory storage when Redis is unavailable
- **Preset Configurations**: Pre-configured rate limiters for common use cases
- **Type-safe**: Full TypeScript support with comprehensive types
- **Flexible**: Customizable configurations for any rate limiting scenario

## Installation

The rate limiter service is already included in the `@tepian-k3/services` package:

```typescript
import {
  createRateLimiter,
  createRateLimiterFromPreset,
  RateLimiterPresets,
  rateLimiters,
} from "@tepian-k3/services/rate-limiter";
```

## Quick Start

### Using Presets

The easiest way to get started is using preset configurations:

```typescript
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

// For authentication endpoints (5 attempts per 15 minutes)
const authLimiter = rateLimiters.auth();

// Check if a user can login
const result = await authLimiter.consume(`login:${userId}`);

if (!result.allowed) {
  throw new Error(
    `Too many login attempts. Try again in ${Math.ceil(result.resetMs / 1000)} seconds`
  );
}

// Login successful
```

### Using Custom Configuration

```typescript
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";

const limiter = createRateLimiter({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
  strategy: "sliding-window", // Use sliding window algorithm
});

const result = await limiter.consume(`api:${userId}`);
```

## Rate Limiting Strategies

### 1. Sliding Window (Recommended)

Most accurate algorithm. Counts requests in a rolling time window.

**Pros:**
- Most accurate rate limiting
- No edge case issues at window boundaries
- Fair distribution of requests

**Cons:**
- Slightly more complex
- Uses more memory

**Use when:** You need precise rate limiting and want to prevent burst attacks at window boundaries.

```typescript
const limiter = createRateLimiter({
  points: 100,
  duration: 60,
  strategy: "sliding-window",
});
```

### 2. Token Bucket

Good for handling burst traffic. Tokens refill continuously at a steady rate.

**Pros:**
- Allows controlled bursts
- Tokens regenerate smoothly over time
- Good for APIs with bursty traffic patterns

**Cons:**
- Can allow bursts that exceed average rate
- More complex to understand

**Use when:** You want to allow short bursts while maintaining an average rate limit.

```typescript
const limiter = createRateLimiter({
  points: 100,
  duration: 60,
  strategy: "token-bucket",
});
```

### 3. Fixed Window

Simplest algorithm. Resets counter at fixed intervals.

**Pros:**
- Very simple
- Low memory usage
- Fast performance

**Cons:**
- Edge case issues at window boundaries
- Can allow 2x requests at boundaries

**Use when:** Simplicity is more important than precision.

```typescript
const limiter = createRateLimiter({
  points: 100,
  duration: 60,
  strategy: "fixed-window",
});
```

## Available Presets

### Authentication (`AUTH`)
```typescript
const limiter = rateLimiters.auth();
// 5 attempts per 15 minutes
// Blocks for 15 minutes on limit exceeded
```

### API Calls (`API`)
```typescript
const limiter = rateLimiters.api();
// 1000 requests per hour
```

### Email Sending (`EMAIL`)
```typescript
const limiter = rateLimiters.email();
// 10 emails per hour
// Uses token bucket strategy
```

### OTP Verification (`OTP`)
```typescript
const limiter = rateLimiters.otp();
// 3 attempts per 5 minutes
// Blocks for 5 minutes on limit exceeded
```

### Password Reset (`PASSWORD_RESET`)
```typescript
const limiter = rateLimiters.passwordReset();
// 3 attempts per hour
// Blocks for 1 hour on limit exceeded
```

### General Purpose

```typescript
// 10 requests per minute - very strict
const strict = rateLimiters.strict();

// 30 requests per minute - moderate
const moderate = rateLimiters.moderate();

// 100 requests per minute - lenient
const lenient = rateLimiters.lenient();
```

## API Reference

### `consume(key: string, points?: number)`

Consume points from the rate limit.

```typescript
const result = await limiter.consume("user:123", 1);

if (result.allowed) {
  console.log(`Request allowed. ${result.remaining} remaining`);
} else {
  console.log(`Rate limited. Reset in ${result.resetMs}ms`);
}
```

**Response:**
```typescript
{
  allowed: boolean;        // Whether request is allowed
  remaining: number;       // Remaining points
  limit: number;          // Total points allowed
  resetMs: number;        // Milliseconds until reset
  resetAt: Date;          // Date when limit resets
  consumed: number;       // Total points consumed
  isMemoryFallback?: boolean; // Using in-memory fallback
}
```

### `get(key: string)`

Get current rate limit status without consuming points.

```typescript
const status = await limiter.get("user:123");

if (status) {
  console.log(`${status.remaining}/${status.limit} requests remaining`);
}
```

### `reset(key: string)`

Reset rate limit for a key.

```typescript
await limiter.reset("user:123");
```

### `delete(key: string)`

Delete rate limit data for a key (alias for reset).

```typescript
await limiter.delete("user:123");
```

### `penalty(key: string)`

Block a key for the configured block duration.

```typescript
// Block user for suspicious behavior
await limiter.penalty("user:123");
```

### `reward(key: string, points?: number)`

Add points back to a key's allowance.

```typescript
// Reward user for good behavior
await limiter.reward("user:123", 5);
```

### `isBlocked(key: string)`

Check if a key is currently blocked.

```typescript
const blocked = await limiter.isBlocked("user:123");
if (blocked) {
  console.log("User is currently rate limited");
}
```

### `getRemaining(key: string)`

Get remaining points for a key.

```typescript
const remaining = await limiter.getRemaining("user:123");
console.log(`${remaining} requests remaining`);
```

## Configuration Options

```typescript
interface RateLimiterConfig {
  // Maximum number of requests allowed in the window
  points: number;

  // Time window in seconds
  duration: number;

  // Strategy to use (default: "sliding-window")
  strategy?: "sliding-window" | "token-bucket" | "fixed-window";

  // Block duration in seconds when limit exceeded (default: duration)
  blockDuration?: number;

  // Key prefix for Redis keys (default: "rate-limit")
  keyPrefix?: string;

  // Use in-memory fallback when Redis unavailable (default: true)
  useInMemoryFallback?: boolean;
}
```

## Advanced Usage

### Per-User API Rate Limiting

```typescript
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";

const apiLimiter = createRateLimiter({
  points: 1000,
  duration: 3600, // 1 hour
  strategy: "sliding-window",
});

// In your API handler
async function handleApiRequest(req: Request, userId: string) {
  const result = await apiLimiter.consume(`api:${userId}`);

  if (!result.allowed) {
    return Response.json(
      {
        error: "Rate limit exceeded",
        resetAt: result.resetAt,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.resetAt.toISOString(),
          "Retry-After": Math.ceil(result.resetMs / 1000).toString(),
        },
      }
    );
  }

  // Process request
}
```

### IP-Based Rate Limiting

```typescript
const ipLimiter = createRateLimiter({
  points: 100,
  duration: 60,
  strategy: "sliding-window",
});

async function handleRequest(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const result = await ipLimiter.consume(`ip:${ip}`);

  if (!result.allowed) {
    throw new Error("Too many requests from this IP");
  }

  // Process request
}
```

### Multiple Rate Limiters

```typescript
// Different rate limits for different actions
const loginLimiter = rateLimiters.auth();
const otpLimiter = rateLimiters.otp();
const emailLimiter = rateLimiters.email();

// Login endpoint
async function login(email: string, password: string) {
  const loginResult = await loginLimiter.consume(`login:${email}`);
  if (!loginResult.allowed) {
    throw new Error("Too many login attempts");
  }

  // Verify credentials...
}

// Send OTP endpoint
async function sendOTP(email: string) {
  const otpResult = await otpLimiter.consume(`otp:${email}`);
  if (!otpResult.allowed) {
    throw new Error("Too many OTP requests");
  }

  const emailResult = await emailLimiter.consume(`email:${email}`);
  if (!emailResult.allowed) {
    throw new Error("Email rate limit exceeded");
  }

  // Send OTP...
}
```

### Progressive Rate Limiting

```typescript
// Start strict, become more lenient for verified users
async function getRateLimiter(userId: string, userTier: string) {
  switch (userTier) {
    case "premium":
      return createRateLimiter({
        points: 10000,
        duration: 3600,
        strategy: "token-bucket",
      });
    case "verified":
      return rateLimiters.lenient();
    default:
      return rateLimiters.moderate();
  }
}
```

## Environment Variables

The rate limiter uses the following environment variables:

```env
# Redis Configuration (optional - uses in-memory fallback if not available)
MEMURAI_HOST=localhost
MEMURAI_PORT=6379
MEMURAI_PASSWORD=your_redis_password
```

## Error Handling

The rate limiter automatically falls back to in-memory storage if Redis is unavailable:

```typescript
const limiter = createRateLimiter({
  points: 100,
  duration: 60,
  useInMemoryFallback: true, // Default: true
});

// Will use Redis if available, otherwise falls back to memory
const result = await limiter.consume("user:123");

// Check if using fallback
if (result.isMemoryFallback) {
  console.warn("Using in-memory rate limiting");
}
```

## Testing

### Mock Rate Limiter for Tests

```typescript
// In your test file
const mockLimiter = {
  consume: jest.fn().mockResolvedValue({
    allowed: true,
    remaining: 99,
    limit: 100,
    resetMs: 60000,
    resetAt: new Date(Date.now() + 60000),
    consumed: 1,
  }),
};
```

### Reset Rate Limits Between Tests

```typescript
import { getRateLimiterService } from "@tepian-k3/services/rate-limiter";

afterEach(async () => {
  const service = getRateLimiterService();
  // Close connections and cleanup
  await service.close();
});
```

## Best Practices

1. **Choose the right strategy**: Use sliding-window for authentication, token-bucket for API calls with bursts
2. **Use descriptive keys**: Include resource type in keys (e.g., `login:${userId}`, `api:${apiKey}`)
3. **Set appropriate limits**: Balance security with user experience
4. **Configure block duration**: Set longer blocks for sensitive operations
5. **Monitor fallback usage**: Alert if Redis is down and fallback is being used
6. **Include rate limit headers**: Help clients implement proper retry logic
7. **Reset on password change**: Reset auth rate limits when user changes password
8. **Combine multiple limits**: Use both IP and user-based rate limiting

## Troubleshooting

### Rate limiter always uses memory fallback

**Issue**: Redis connection is failing

**Solution**:
- Check Redis/Memurai is running
- Verify environment variables are set correctly
- Check network connectivity

### Rate limits not working across multiple servers

**Issue**: Using in-memory storage

**Solution**:
- Ensure Redis is properly configured and connected
- Check `useInMemoryFallback` is not forced to true

### Rate limits reset unexpectedly

**Issue**: Using fixed-window strategy

**Solution**:
- Switch to sliding-window strategy for more accurate limiting
- Or increase the duration to smooth out resets

## Related Documentation

- [Redis Documentation](https://redis.io/docs/)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Sliding Window Algorithm](https://konghq.com/blog/engineering/how-to-design-a-scalable-rate-limiting-algorithm)
