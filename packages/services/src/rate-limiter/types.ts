/**
 * Rate limiter types and interfaces
 */

/**
 * Rate limiter strategy type
 */
export type RateLimiterStrategy =
  | "sliding-window" // Most accurate, recommended
  | "token-bucket" // Good for burst traffic
  | "fixed-window"; // Simplest, least accurate

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  points: number;

  /**
   * Time window in seconds
   */
  duration: number;

  /**
   * Strategy to use for rate limiting
   * @default "sliding-window"
   */
  strategy?: RateLimiterStrategy;

  /**
   * Block duration in seconds when limit is exceeded
   * @default duration
   */
  blockDuration?: number;

  /**
   * Key prefix for Redis keys
   * @default "rate-limit"
   */
  keyPrefix?: string;

  /**
   * Whether to use in-memory fallback when Redis is unavailable
   * @default true
   */
  useInMemoryFallback?: boolean;
}

/**
 * Rate limiter result
 */
export interface RateLimiterResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;

  /**
   * Number of remaining points
   */
  remaining: number;

  /**
   * Total number of points allowed
   */
  limit: number;

  /**
   * Number of milliseconds until the limit resets
   */
  resetMs: number;

  /**
   * Unix timestamp when the limit resets
   */
  resetAt: Date;

  /**
   * Number of points consumed by this request
   */
  consumed: number;

  /**
   * Whether the in-memory fallback was used
   */
  isMemoryFallback?: boolean;
}

/**
 * Rate limiter storage interface
 */
export interface IRateLimiterStorage {
  consume(key: string, points?: number): Promise<RateLimiterResult>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<RateLimiterResult | null>;
  reset(key: string): Promise<void>;
}

/**
 * Rate limiter preset configurations
 */
export const RateLimiterPresets = {
  /**
   * Very strict: 10 requests per minute
   */
  STRICT: {
    points: 10,
    duration: 60,
    strategy: "sliding-window" as const,
  },

  /**
   * Moderate: 30 requests per minute
   */
  MODERATE: {
    points: 30,
    duration: 60,
    strategy: "sliding-window" as const,
  },

  /**
   * Lenient: 100 requests per minute
   */
  LENIENT: {
    points: 100,
    duration: 60,
    strategy: "sliding-window" as const,
  },

  /**
   * API: 1000 requests per hour
   */
  API: {
    points: 1000,
    duration: 3600,
    strategy: "sliding-window" as const,
  },

  /**
   * Authentication: 5 attempts per 15 minutes
   */
  AUTH: {
    points: 5,
    duration: 900,
    blockDuration: 900,
    strategy: "sliding-window" as const,
  },

  /**
   * Email: 10 emails per hour
   */
  EMAIL: {
    points: 10,
    duration: 3600,
    strategy: "token-bucket" as const,
  },

  /**
   * OTP: 3 attempts per 5 minutes
   */
  OTP: {
    points: 3,
    duration: 300,
    blockDuration: 300,
    strategy: "sliding-window" as const,
  },

  /**
   * Password reset: 3 attempts per hour
   */
  PASSWORD_RESET: {
    points: 3,
    duration: 3600,
    blockDuration: 3600,
    strategy: "sliding-window" as const,
  },
} as const;
