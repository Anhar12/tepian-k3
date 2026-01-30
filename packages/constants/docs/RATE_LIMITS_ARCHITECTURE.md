# Rate Limits Architecture

## Package Dependency Structure

The rate limiting system follows a clean dependency hierarchy to maintain the principle that **constants should not depend on any other packages**.

### Dependency Flow

```
constants (no dependencies)
    ↓
services (depends on constants)
    ↓
api (depends on services and constants)
```

### Type Definitions

#### In `@tepian-k3/constants`

The constants package defines the **base types** for rate limiting:

```typescript
// packages/constants/src/rate-limits.ts

export type RateLimiterStrategy =
  | "sliding-window"
  | "token-bucket"
  | "fixed-window";

export interface RateLimiterConfig {
  points: number;
  duration: number;
  strategy: RateLimiterStrategy;
  blockDuration?: number;
  keyPrefix?: string;
  useInMemoryFallback?: boolean;
}
```

**Why here?**

- Constants package is the foundation layer
- No dependencies on other packages
- Provides shared types for rate limit tier configurations
- Can be imported by services, API, and any other package

#### In `@tepian-k3/services/rate-limiter`

The services package defines the **implementation types**:

```typescript
// packages/services/src/rate-limiter/types.ts

export interface RateLimiterConfig {
  points: number;
  duration: number;
  strategy?: RateLimiterStrategy;
  blockDuration?: number;
  keyPrefix?: string;
  useInMemoryFallback?: boolean;
}

export interface RateLimiterResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetMs: number;
  resetAt: Date;
  consumed: number;
  isMemoryFallback?: boolean;
}
```

**Why here?**

- Implementation-specific types
- Result types that consumers need
- Can depend on constants for base types
- Provides the actual rate limiter functionality

#### In `@tepian-k3/api`

The API package uses both:

```typescript
// packages/api/src/index.ts

import { getRateLimitConfig } from "@tepian-k3/constants";
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";
import type { RateLimiter } from "@tepian-k3/services/rate-limiter";

export const withRoleBasedRateLimit = <TInput = unknown>(
  operation: "api" | "mutations" | "queries" | "uploads" | "email",
  getKey?: (ctx: ..., input?: TInput) => string
) =>
  protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
    // Get config from constants
    const config = getRateLimitConfig(ctx.user.roles, operation);

    // Create limiter using services
    const limiter = createRateLimiter(config);

    // Use limiter
    const result = await limiter.consume(key);
    // ...
  });
```

## Type Compatibility

The `RateLimiterConfig` type in constants is **structurally compatible** with the services version because:

1. Both define the same required fields: `points`, `duration`, `strategy`
2. Both use the same optional fields: `blockDuration`, `keyPrefix`, `useInMemoryFallback`
3. TypeScript uses structural typing, so they're interchangeable

### Example: Tier Configuration

```typescript
// In constants package
import type { RateLimiterConfig } from "./rate-limits";

export const RATE_LIMIT_TIER_CONFIGS = {
  standard: {
    api: {
      points: 1000,
      duration: 3600,
      strategy: "sliding-window",
    } satisfies RateLimiterConfig,
    // ...
  },
  // ...
};

// In API package
import { getRateLimitConfig } from "@tepian-k3/constants";
import { createRateLimiter } from "@tepian-k3/services/rate-limiter";

// This works because types are compatible
const config = getRateLimitConfig(["user"], "api");
const limiter = createRateLimiter(config); // ✅ No type errors
```

## Benefits of This Architecture

1. **No Circular Dependencies**: Constants doesn't depend on services
2. **Clean Separation**: Types live where they make sense conceptually
3. **Easy to Maintain**: Tier configs in one place (constants)
4. **Type Safety**: Full TypeScript support across all packages
5. **Reusability**: Other packages can import rate limit types from constants

## Migration Notes

### Before (❌ Incorrect)

```typescript
// constants/src/rate-limits.ts
import type { RateLimiterConfig } from "@tepian-k3/services/rate-limiter"; // ❌ Wrong!
```

**Problem**: Constants package depending on services violates the hierarchy.

### After (✅ Correct)

```typescript
// constants/src/rate-limits.ts
export interface RateLimiterConfig {
  points: number;
  duration: number;
  strategy: RateLimiterStrategy;
  blockDuration?: number;
  keyPrefix?: string;
  useInMemoryFallback?: boolean;
}
```

**Solution**: Define the type locally in constants.

## Related Documentation

- [Rate Limiting Middleware Guide](../../api/docs/RATE_LIMITING_MIDDLEWARE.md)
- [Role-Based Rate Limiting](../../api/docs/ROLE_BASED_RATE_LIMITING.md)
- [Rate Limiter Service](../../services/src/rate-limiter/README.md)
