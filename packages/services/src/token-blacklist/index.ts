/**
 * Token Blacklist Service
 *
 * Manages a Redis-backed blacklist of revoked JWT tokens.
 * Used to invalidate tokens before their natural expiration.
 */

import Redis from "ioredis";
import { logInfo, logError, logWarn } from "../logger";

// Blacklist key prefix
const BLACKLIST_PREFIX = "token:blacklist:";

// Default TTL for blacklisted tokens (in seconds)
// Set to match the maximum token expiry (refresh token = 30 days)
const DEFAULT_TTL = 30 * 24 * 60 * 60; // 30 days

let redisClient: Redis | null = null;
let isConnected = false;

/**
 * Initialize the token blacklist service with Redis connection
 */
export function initializeTokenBlacklist(config: {
  host: string;
  port: number;
  password?: string;
}): void {
  if (redisClient) {
    logWarn("TokenBlacklist", "Already initialized, skipping");
    return;
  }

  try {
    redisClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000,
      retryStrategy: (times: number) => {
        if (times > 10) {
          logError("TokenBlacklist", "Max retries reached, giving up");
          return null;
        }
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
    });

    redisClient.on("connect", () => {
      isConnected = true;
      logInfo("TokenBlacklist", "Connected to Redis");
    });

    redisClient.on("error", (error: Error) => {
      isConnected = false;
      logError("TokenBlacklist", "Redis connection error", { error });
    });

    redisClient.on("close", () => {
      isConnected = false;
      logWarn("TokenBlacklist", "Redis connection closed");
    });
  } catch (error) {
    logError("TokenBlacklist", "Failed to initialize", { error });
  }
}

/**
 * Check if the blacklist service is ready
 */
export function isBlacklistReady(): boolean {
  return isConnected && redisClient !== null;
}

/**
 * Add a token's JTI to the blacklist
 *
 * @param jti - The JWT ID (unique token identifier)
 * @param expiresIn - Time in seconds until the token expires naturally
 * @param reason - Optional reason for blacklisting
 */
export async function blacklistToken(
  jti: string,
  expiresIn?: number,
  reason?: string,
): Promise<boolean> {
  if (!isBlacklistReady() || !redisClient) {
    logWarn(
      "TokenBlacklist",
      "Redis not available, token not blacklisted (security risk)",
    );
    // Return true to prevent blocking operations, but log the security risk
    return false;
  }

  try {
    const key = `${BLACKLIST_PREFIX}${jti}`;
    const ttl = expiresIn || DEFAULT_TTL;
    const value = JSON.stringify({
      blacklistedAt: new Date().toISOString(),
      reason: reason || "logout",
    });

    await redisClient.setex(key, ttl, value);

    logInfo("TokenBlacklist", "Token blacklisted", {
      jti: jti.slice(0, 8) + "...",
      ttl,
      reason,
    });

    return true;
  } catch (error) {
    logError("TokenBlacklist", "Failed to blacklist token", { error });
    return false;
  }
}

/**
 * Check if a token's JTI is blacklisted
 *
 * @param jti - The JWT ID to check
 * @returns true if the token is blacklisted, false otherwise
 */
export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  if (!isBlacklistReady() || !redisClient) {
    // If Redis is not available, we cannot verify blacklist status
    // For security, we should be cautious but not block all operations
    logWarn("TokenBlacklist", "Redis not available, cannot verify blacklist");
    return false;
  }

  try {
    const key = `${BLACKLIST_PREFIX}${jti}`;
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logError("TokenBlacklist", "Failed to check blacklist", { error });
    // On error, fail open to prevent blocking legitimate users
    return false;
  }
}

/**
 * Blacklist all tokens for a user by storing a "blacklist-before" timestamp
 * Any token issued before this timestamp should be considered invalid
 *
 * @param userId - The user ID
 * @param ttl - How long to keep this record (default: 30 days)
 */
export async function blacklistAllUserTokens(
  userId: string,
  ttl: number = DEFAULT_TTL,
): Promise<boolean> {
  if (!isBlacklistReady() || !redisClient) {
    logWarn(
      "TokenBlacklist",
      "Redis not available, user tokens not blacklisted",
    );
    return false;
  }

  try {
    const key = `${BLACKLIST_PREFIX}user:${userId}:invalidate_before`;
    const timestamp = Date.now();

    await redisClient.setex(key, ttl, timestamp.toString());

    logInfo("TokenBlacklist", "All user tokens blacklisted", {
      userId: userId.slice(0, 8) + "...",
    });

    return true;
  } catch (error) {
    logError("TokenBlacklist", "Failed to blacklist user tokens", { error });
    return false;
  }
}

/**
 * Check if a token was issued before the user's blacklist timestamp
 *
 * @param userId - The user ID
 * @param issuedAt - The token's issued-at timestamp (in milliseconds)
 * @returns true if the token should be considered blacklisted
 */
export async function isTokenIssuedBeforeBlacklist(
  userId: string,
  issuedAt: number,
): Promise<boolean> {
  if (!isBlacklistReady() || !redisClient) {
    return false;
  }

  try {
    const key = `${BLACKLIST_PREFIX}user:${userId}:invalidate_before`;
    const blacklistTimestamp = await redisClient.get(key);

    if (!blacklistTimestamp) {
      return false;
    }

    const blacklistTime = parseInt(blacklistTimestamp, 10);
    return issuedAt < blacklistTime;
  } catch (error) {
    logError("TokenBlacklist", "Failed to check user blacklist timestamp", {
      error,
    });
    return false;
  }
}

/**
 * Shutdown the token blacklist service
 */
export async function shutdownTokenBlacklist(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logInfo("TokenBlacklist", "Shutdown complete");
  }
}

export default {
  initializeTokenBlacklist,
  isBlacklistReady,
  blacklistToken,
  isTokenBlacklisted,
  blacklistAllUserTokens,
  isTokenIssuedBeforeBlacklist,
  shutdownTokenBlacklist,
};
