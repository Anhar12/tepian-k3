# Rate Limiter Service

A powerful rate limiting service with Redis support and in-memory fallback.

## Quick Start

```typescript
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

// Use preset for authentication
const limiter = rateLimiters.auth();

// Check rate limit
const result = await limiter.consume(`login:${userId}`);

if (!result.allowed) {
  throw new Error(
    `Rate limit exceeded. Try again in ${Math.ceil(result.resetMs / 1000)}s`,
  );
}
```

## Features

- **Multiple Strategies**: Sliding window, token bucket, fixed window
- **Redis-backed**: Distributed rate limiting with automatic fallback
- **Preset Configurations**: Pre-configured for common use cases
- **Type-safe**: Full TypeScript support

## Available Presets

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

## Custom Configuration

```typescript
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";

const limiter = createRateLimiter({
  points: 100,
  duration: 60,
  strategy: "sliding-window",
  blockDuration: 300,
});
```

## Documentation

- [Complete Documentation](./docs/README.md)
- [Integration Guide](./docs/INTEGRATION_GUIDE.md)
- [API Examples](./docs/examples/api-rate-limiting.example.ts)
- [Auth Examples](./docs/examples/auth-rate-limiting.example.ts)
- [tRPC Integration](./docs/examples/trpc-integration.example.ts)

## Configuration

Set these environment variables (optional - uses in-memory fallback if not available):

```env
MEMURAI_HOST=localhost
MEMURAI_PORT=6379
MEMURAI_PASSWORD=your_password
```

## API Methods

- `consume(key, points?)` - Consume rate limit points
- `get(key)` - Get current status
- `reset(key)` - Reset rate limit
- `penalty(key)` - Block immediately
- `reward(key, points?)` - Add points back
- `isBlocked(key)` - Check if blocked
- `getRemaining(key)` - Get remaining points

## Example Usage

### Authentication

```typescript
const limiter = rateLimiters.auth();
await limiter.consume(`login:${email}`);
```

### API Calls

```typescript
const limiter = rateLimiters.api();
await limiter.consume(`api:user:${userId}`);
```

### Email Sending

```typescript
const limiter = rateLimiters.email();
await limiter.consume(`email:${email}`);
```

For complete examples and integration guides, see the [documentation](./docs/README.md).
