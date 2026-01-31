/**
 * Cache key prefixes and TTL configurations
 */

export const CACHE_KEYS = {
  BANNERS_ALL: "cache:banners:all",
  BANNERS_PREFIX: "cache:banners:",
  CLUSTERS_ALL: "cache:clusters:all",
  CLUSTERS_PREFIX: "cache:clusters:",
  PARAMETER_CATEGORIES_ALL: "cache:parameter-categories:all",
  PARAMETER_CATEGORIES_PREFIX: "cache:parameter-categories:",
  PROVINCES_ALL: "cache:provinces:all",
  PROVINCES_PREFIX: "cache:provinces:",
  REGENCIES_ALL: "cache:regencies:all",
  REGENCIES_BY_PROVINCE: "cache:regencies:by-province:",
  REGENCIES_PREFIX: "cache:regencies:",
  DISTRICTS_ALL: "cache:districts:all",
  DISTRICTS_BY_REGENCY: "cache:districts:by-regency:",
  DISTRICTS_PREFIX: "cache:districts:",
  VILLAGES_ALL: "cache:villages:all",
  VILLAGES_BY_DISTRICT: "cache:villages:by-district:",
  VILLAGES_PREFIX: "cache:villages:",
  KBLIS_ALL: "cache:kblis:all",
  KBLIS_PREFIX: "cache:kblis:",
  ROLES_ALL: "cache:roles:all",
  ROLES_PREFIX: "cache:roles:",
  PERMISSIONS_ALL: "cache:permissions:all",
  PERMISSIONS_PREFIX: "cache:permissions:",
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
