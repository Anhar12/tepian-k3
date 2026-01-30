/**
 * Cache key prefixes and TTL configurations
 */

export const CACHE_KEYS = {
  CLUSTERS_ALL: "cache:clusters:all",
  CLUSTERS_PREFIX: "cache:clusters:",
  PARAMETER_CATEGORIES_ALL: "cache:parameter-categories:all",
  PARAMETER_CATEGORIES_PREFIX: "cache:parameter-categories:",
} as const;

export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS];

/** Cache TTL values in seconds */
export const CACHE_TTL = {
  /** 1 hour - for rarely changing reference data */
  LONG: 3600,
  /** 30 minutes - for moderately changing data */
  MEDIUM: 1800,
  /** 5 minutes - for frequently changing data */
  SHORT: 300,
} as const;

export type CacheTTL = (typeof CACHE_TTL)[keyof typeof CACHE_TTL];
