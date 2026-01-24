/**
 * API Rate Limiting Examples
 * Demonstrates how to implement rate limiting for API endpoints
 */

import {
  createRateLimiter,
  rateLimiters,
  type RateLimiterResult,
} from "@tepian-k3/services/rate-limiter";
import type { Context } from "hono";

/**
 * Example 1: Basic API rate limiting per user
 */
export async function basicApiRateLimiting(userId: string) {
  const limiter = rateLimiters.api();

  const result = await limiter.consume(`api:user:${userId}`);

  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded. Try again in ${Math.ceil(result.resetMs / 1000)} seconds`
    );
  }

  // Process API request
  return { success: true, remaining: result.remaining };
}

/**
 * Example 2: API rate limiting with response headers
 */
export async function apiWithRateLimitHeaders(c: Context, userId: string) {
  const limiter = rateLimiters.api();

  const result = await limiter.consume(`api:user:${userId}`);

  // Always add rate limit headers
  c.header("X-RateLimit-Limit", result.limit.toString());
  c.header("X-RateLimit-Remaining", result.remaining.toString());
  c.header("X-RateLimit-Reset", result.resetAt.toISOString());

  if (!result.allowed) {
    c.header("Retry-After", Math.ceil(result.resetMs / 1000).toString());
    return c.json(
      {
        error: "Too many requests",
        message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetMs / 1000)} seconds`,
        resetAt: result.resetAt,
      },
      429
    );
  }

  // Process request
  return c.json({ success: true });
}

/**
 * Example 3: Tiered rate limiting based on user role
 */
export async function tieredRateLimiting(
  userId: string,
  userRole: "free" | "premium" | "enterprise"
) {
  let limiter;

  switch (userRole) {
    case "enterprise":
      limiter = createRateLimiter({
        points: 10000,
        duration: 3600, // 10,000 requests per hour
        strategy: "token-bucket",
      });
      break;
    case "premium":
      limiter = createRateLimiter({
        points: 5000,
        duration: 3600, // 5,000 requests per hour
        strategy: "token-bucket",
      });
      break;
    case "free":
    default:
      limiter = createRateLimiter({
        points: 1000,
        duration: 3600, // 1,000 requests per hour
        strategy: "sliding-window",
      });
      break;
  }

  const result = await limiter.consume(`api:${userRole}:${userId}`);

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    resetAt: result.resetAt,
  };
}

/**
 * Example 4: IP-based rate limiting for public endpoints
 */
export async function ipBasedRateLimiting(ipAddress: string) {
  const limiter = createRateLimiter({
    points: 100,
    duration: 60, // 100 requests per minute
    strategy: "sliding-window",
    blockDuration: 300, // Block for 5 minutes on limit exceeded
  });

  const result = await limiter.consume(`ip:${ipAddress}`);

  if (!result.allowed) {
    throw new Error(
      `Too many requests from IP ${ipAddress}. Blocked for ${Math.ceil(result.resetMs / 1000)} seconds`
    );
  }

  return result;
}

/**
 * Example 5: API key rate limiting
 */
export async function apiKeyRateLimiting(apiKey: string) {
  const limiter = createRateLimiter({
    points: 5000,
    duration: 3600, // 5,000 requests per hour
    strategy: "token-bucket",
  });

  const result = await limiter.consume(`apikey:${apiKey}`);

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    limit: result.limit,
    resetMs: result.resetMs,
  };
}

/**
 * Example 6: Endpoint-specific rate limiting
 */
export async function endpointSpecificRateLimiting(
  userId: string,
  endpoint: string
) {
  // Different limits for different endpoints
  const limiterConfig = {
    "/api/data": { points: 1000, duration: 3600 },
    "/api/search": { points: 100, duration: 60 },
    "/api/upload": { points: 10, duration: 3600 },
    "/api/export": { points: 5, duration: 3600 },
  };

  const config = limiterConfig[endpoint] || { points: 100, duration: 60 };

  const limiter = createRateLimiter({
    ...config,
    strategy: "sliding-window",
  });

  const result = await limiter.consume(`${endpoint}:${userId}`);

  return result;
}

/**
 * Example 7: Burst protection with sliding window
 */
export async function burstProtection(userId: string) {
  // Allow bursts but with strict average rate
  const limiter = createRateLimiter({
    points: 10,
    duration: 10, // 10 requests per 10 seconds
    strategy: "sliding-window",
  });

  const result = await limiter.consume(`burst:${userId}`);

  if (!result.allowed) {
    throw new Error("Burst limit exceeded. Please slow down your requests.");
  }

  return result;
}

/**
 * Example 8: Combined rate limiting (IP + User)
 */
export async function combinedRateLimiting(userId: string, ipAddress: string) {
  const userLimiter = rateLimiters.api();
  const ipLimiter = createRateLimiter({
    points: 1000,
    duration: 60,
    strategy: "sliding-window",
  });

  // Check both limits
  const [userResult, ipResult] = await Promise.all([
    userLimiter.consume(`api:user:${userId}`),
    ipLimiter.consume(`api:ip:${ipAddress}`),
  ]);

  if (!userResult.allowed) {
    throw new Error("User rate limit exceeded");
  }

  if (!ipResult.allowed) {
    throw new Error("IP rate limit exceeded");
  }

  return {
    allowed: true,
    userRemaining: userResult.remaining,
    ipRemaining: ipResult.remaining,
  };
}

/**
 * Example 9: Cost-based rate limiting (different operations cost different points)
 */
export async function costBasedRateLimiting(
  userId: string,
  operation: "read" | "write" | "delete"
) {
  const limiter = createRateLimiter({
    points: 1000,
    duration: 3600,
    strategy: "token-bucket",
  });

  // Different operations cost different points
  const costs = {
    read: 1,
    write: 5,
    delete: 10,
  };

  const cost = costs[operation];
  const result = await limiter.consume(`api:${userId}`, cost);

  if (!result.allowed) {
    throw new Error(
      `Insufficient rate limit. Operation requires ${cost} points, but only ${result.remaining} remaining.`
    );
  }

  return {
    success: true,
    remaining: result.remaining,
    cost,
  };
}

/**
 * Example 10: Rate limiting middleware for Hono
 */
export function createRateLimitMiddleware(
  limiterName: string = "api",
  getUserId: (c: Context) => string | null = (c) => c.get("userId")
) {
  return async (c: Context, next: () => Promise<void>) => {
    const userId = getUserId(c);

    if (!userId) {
      // For unauthenticated requests, use IP
      const ip = c.req.header("x-forwarded-for") || "unknown";
      const limiter = rateLimiters.moderate();
      const result = await limiter.consume(`${limiterName}:ip:${ip}`);

      c.header("X-RateLimit-Limit", result.limit.toString());
      c.header("X-RateLimit-Remaining", result.remaining.toString());
      c.header("X-RateLimit-Reset", result.resetAt.toISOString());

      if (!result.allowed) {
        c.header("Retry-After", Math.ceil(result.resetMs / 1000).toString());
        return c.json(
          {
            error: "Rate limit exceeded",
            resetAt: result.resetAt,
          },
          429
        );
      }
    } else {
      const limiter = rateLimiters.api();
      const result = await limiter.consume(`${limiterName}:user:${userId}`);

      c.header("X-RateLimit-Limit", result.limit.toString());
      c.header("X-RateLimit-Remaining", result.remaining.toString());
      c.header("X-RateLimit-Reset", result.resetAt.toISOString());

      if (!result.allowed) {
        c.header("Retry-After", Math.ceil(result.resetMs / 1000).toString());
        return c.json(
          {
            error: "Rate limit exceeded",
            resetAt: result.resetAt,
          },
          429
        );
      }
    }

    await next();
  };
}

/**
 * Example usage in Hono app
 */
export function exampleHonoUsage() {
  // In your Hono app:
  // app.use("/api/*", createRateLimitMiddleware("api"));
  //
  // Or for specific routes:
  // app.post("/api/upload", createRateLimitMiddleware("upload"), async (c) => {
  //   // Handle upload
  // });
}
