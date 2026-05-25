import type { Role } from "./roles";

/**
 * Rate limiter strategy types
 */
export type RateLimiterStrategy =
  | "sliding-window"
  | "token-bucket"
  | "fixed-window";

/**
 * Rate limiter configuration
 * This is a simplified version compatible with @tepian-k3/services/rate-limiter
 * The service accepts additional optional fields, but these are the required ones for tier configs
 */
export interface RateLimiterConfig {
  /** Number of points (requests) allowed */
  points: number;
  /** Duration in seconds for the rate limit window */
  duration: number;
  /** Strategy to use for rate limiting */
  strategy: RateLimiterStrategy;
  /** Optional: Block duration in seconds when limit is exceeded */
  blockDuration?: number;
  /** Optional: Key prefix for Redis keys */
  keyPrefix?: string;
  /** Optional: Whether to use in-memory fallback when Redis is unavailable */
  useInMemoryFallback?: boolean;
}

/**
 * Rate limit tiers for different user roles
 * Higher roles get more generous limits
 */
export type RateLimitTier = "basic" | "standard" | "premium" | "unlimited";

/**
 * Map roles to rate limit tiers
 */
export const ROLE_RATE_LIMIT_TIERS: Record<Role, RateLimitTier> = {
  // Admin tiers - highest limits
  super_admin: "unlimited",
  admin: "unlimited",
  koordinator_pengujian: "premium",

  // Staff tiers - moderate limits
  petugas_laboratorium: "premium",
  kepala_balai: "premium",
  koordinator_administrasi: "premium",
  bendahara: "premium",
  penyelia: "premium",
  koordinator_mutu: "premium",
  employee: "standard",
  petugas_sampling: "standard",
  tim_peralatan: "standard",
  kaji_ulang: "standard",
  tim_penjadwalan: "standard",
  petugas_koding: "standard",

  // User tiers - standard limits
  user: "standard",

  // Restricted tiers - lowest limits
  viewer: "basic",
};

/**
 * Rate limit configurations for each tier
 * Each tier defines different limits for various operations
 */
export const RATE_LIMIT_TIER_CONFIGS: Record<
  RateLimitTier,
  {
    api: RateLimiterConfig;
    mutations: RateLimiterConfig;
    queries: RateLimiterConfig;
    uploads: RateLimiterConfig;
    email: RateLimiterConfig;
  }
> = {
  // Basic tier - Restrictive limits for viewers
  basic: {
    api: { points: 100, duration: 3600, strategy: "sliding-window" }, // 100 per hour
    mutations: { points: 10, duration: 3600, strategy: "sliding-window" }, // 10 per hour
    queries: { points: 100, duration: 3600, strategy: "sliding-window" }, // 100 per hour
    uploads: { points: 5, duration: 3600, strategy: "token-bucket" }, // 5 per hour
    email: { points: 3, duration: 3600, strategy: "token-bucket" }, // 3 per hour
  },

  // Standard tier - Regular user limits
  standard: {
    api: { points: 1000, duration: 3600, strategy: "sliding-window" }, // 1000 per hour
    mutations: { points: 100, duration: 3600, strategy: "sliding-window" }, // 100 per hour
    queries: { points: 500, duration: 3600, strategy: "sliding-window" }, // 500 per hour
    uploads: { points: 20, duration: 3600, strategy: "token-bucket" }, // 20 per hour
    email: { points: 10, duration: 3600, strategy: "token-bucket" }, // 10 per hour
  },

  // Premium tier - Staff and high-privilege users
  premium: {
    api: { points: 5000, duration: 3600, strategy: "sliding-window" }, // 5000 per hour
    mutations: { points: 500, duration: 3600, strategy: "sliding-window" }, // 500 per hour
    queries: { points: 2000, duration: 3600, strategy: "sliding-window" }, // 2000 per hour
    uploads: { points: 100, duration: 3600, strategy: "token-bucket" }, // 100 per hour
    email: { points: 50, duration: 3600, strategy: "token-bucket" }, // 50 per hour
  },

  // Unlimited tier - Admins (very high limits, not truly unlimited)
  unlimited: {
    api: { points: 100000, duration: 3600, strategy: "sliding-window" }, // 100k per hour
    mutations: { points: 10000, duration: 3600, strategy: "sliding-window" }, // 10k per hour
    queries: { points: 50000, duration: 3600, strategy: "sliding-window" }, // 50k per hour
    uploads: { points: 1000, duration: 3600, strategy: "token-bucket" }, // 1000 per hour
    email: { points: 500, duration: 3600, strategy: "token-bucket" }, // 500 per hour
  },
};

/**
 * Get rate limit tier for a role
 * @param role - The user's role
 * @returns The rate limit tier for that role
 */
export function getRateLimitTier(role: Role): RateLimitTier {
  return ROLE_RATE_LIMIT_TIERS[role];
}

/**
 * Get rate limit tier for multiple roles
 * Returns the highest tier among all roles
 * @param roles - Array of user's roles
 * @returns The highest rate limit tier
 */
export function getHighestRateLimitTier(roles: Role[]): RateLimitTier {
  const tierPriority: Record<RateLimitTier, number> = {
    basic: 1,
    standard: 2,
    premium: 3,
    unlimited: 4,
  };

  let highestTier: RateLimitTier = "basic";
  let highestPriority = 0;

  for (const role of roles) {
    const tier = ROLE_RATE_LIMIT_TIERS[role];
    const priority = tierPriority[tier];

    if (priority > highestPriority) {
      highestTier = tier;
      highestPriority = priority;
    }
  }

  return highestTier;
}

/**
 * Get rate limit configuration for a specific operation and role
 * @param roles - Array of user's roles
 * @param operation - The type of operation (api, mutations, queries, uploads, email)
 * @returns Rate limiter configuration
 */
export function getRateLimitConfig(
  roles: Role[],
  operation: keyof (typeof RATE_LIMIT_TIER_CONFIGS)["basic"],
): RateLimiterConfig {
  const tier = getHighestRateLimitTier(roles);
  return RATE_LIMIT_TIER_CONFIGS[tier][operation];
}

/**
 * Human-readable labels for rate limit tiers
 */
export const RATE_LIMIT_TIER_LABELS: Record<RateLimitTier, string> = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
  unlimited: "Unlimited",
};

/**
 * Descriptions for each tier
 */
export const RATE_LIMIT_TIER_DESCRIPTIONS: Record<RateLimitTier, string> = {
  basic: "Restrictive limits for read-only access",
  standard: "Standard limits for regular users",
  premium: "Generous limits for staff and high-privilege users",
  unlimited: "Very high limits for administrators",
};
