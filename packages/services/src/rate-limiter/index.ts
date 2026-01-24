/**
 * Rate limiter service
 * Provides rate limiting with Redis and in-memory fallback
 */
import Redis from "ioredis";
import { RateLimiter } from "./rate-limiter";
import type { RateLimiterConfig, RateLimiterResult } from "./types";
import { RateLimiterPresets } from "./types";
import { env } from "../../env";
import { logInfo, logWarn } from "../logger";

// Export types and presets
export type { RateLimiterConfig, RateLimiterResult };
export { RateLimiterPresets };

/**
 * Redis connection configuration
 */
interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

/**
 * Rate limiter service factory
 */
export class RateLimiterService {
  private redis: Redis | null = null;
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * Initialize Redis connection
   * @param config Redis configuration (uses env vars if not provided)
   */
  constructor(config?: RedisConfig) {
    try {
      const redisConfig = {
        host: config?.host ?? env.MEMURAI_HOST ?? "localhost",
        port: config?.port ?? Number(env.MEMURAI_PORT) ?? 6379,
        password: config?.password ?? env.MEMURAI_PASSWORD,
        db: config?.db ?? 0,
        retryStrategy: (times: number) => {
          if (times > 3) {
            logWarn(
              "RateLimiterService.retryStrategy",
              "Exceeded maximum Redis reconnection attempts",
            );
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true,
      };

      this.redis = new Redis(redisConfig);

      this.redis.on("error", (err) => {
        logWarn("RateLimiterService.Redis", `Redis error: ${err.message}`);
      });

      this.redis.on("connect", () => {
        logInfo("RateLimiterService.Redis", "Connected to Redis server");
      });

      // Try to connect
      this.redis.connect().catch((err) => {
        logWarn(
          "RateLimiterService.Redis",
          `Failed to connect to Redis: ${err.message}`,
        );
      });
    } catch (error) {
      logWarn(
        "RateLimiterService",
        `Failed to initialize Redis: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Create a rate limiter with specific configuration
   * @param name Unique name for this rate limiter
   * @param config Rate limiter configuration
   * @returns Rate limiter instance
   */
  create(name: string, config: RateLimiterConfig): RateLimiter {
    const key = `${name}:${JSON.stringify(config)}`;

    if (this.limiters.has(key)) {
      return this.limiters.get(key)!;
    }

    const limiter = new RateLimiter(config, this.redis ?? undefined);
    this.limiters.set(key, limiter);
    return limiter;
  }

  /**
   * Create a rate limiter using a preset configuration
   * @param name Unique name for this rate limiter
   * @param preset Preset name from RateLimiterPresets
   * @returns Rate limiter instance
   */
  createFromPreset(
    name: string,
    preset: keyof typeof RateLimiterPresets,
  ): RateLimiter {
    const isDev = env.NODE_ENV === "development";
    if (isDev) {
      // In development, use a more lenient config for STRICT preset
      return this.create(name, RateLimiterPresets["DEV_MODE"]);
    }
    return this.create(name, RateLimiterPresets[preset]);
  }

  /**
   * Get or create a rate limiter
   * @param name Unique name for this rate limiter
   * @param config Rate limiter configuration
   * @returns Rate limiter instance
   */
  get(name: string, config: RateLimiterConfig): RateLimiter {
    return this.create(name, config);
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    // Cleanup all limiters
    this.limiters.forEach((limiter) => {
      limiter.destroy();
    });
    this.limiters.clear();

    // Close Redis connection
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Global rate limiter service instance
let rateLimiterService: RateLimiterService | null = null;

/**
 * Get the global rate limiter service instance
 */
export function getRateLimiterService(): RateLimiterService {
  if (!rateLimiterService) {
    rateLimiterService = new RateLimiterService();
  }
  return rateLimiterService;
}

/**
 * Create a rate limiter helper function for common use cases
 */
export function createRateLimiter(
  config: RateLimiterConfig,
  name: string = "default",
): RateLimiter {
  const service = getRateLimiterService();
  return service.create(name, config);
}

/**
 * Create a rate limiter from a preset
 */
export function createRateLimiterFromPreset(
  preset: keyof typeof RateLimiterPresets,
  name: string = "default",
): RateLimiter {
  const service = getRateLimiterService();
  return service.createFromPreset(name, preset);
}

// Export the main classes
export { RateLimiter } from "./rate-limiter";

// Convenience exports for presets
export const rateLimiters = {
  auth: () => createRateLimiterFromPreset("AUTH", "auth"),
  api: () => createRateLimiterFromPreset("API", "api"),
  email: () => createRateLimiterFromPreset("EMAIL", "email"),
  otp: () => createRateLimiterFromPreset("OTP", "otp"),
  passwordReset: () =>
    createRateLimiterFromPreset("PASSWORD_RESET", "password-reset"),
  strict: () => createRateLimiterFromPreset("STRICT", "strict"),
  moderate: () => createRateLimiterFromPreset("MODERATE", "moderate"),
  lenient: () => createRateLimiterFromPreset("LENIENT", "lenient"),
};
