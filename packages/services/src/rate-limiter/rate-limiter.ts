/**
 * Rate limiter service with Redis and in-memory fallback
 */
import Redis from "ioredis";
import type { RateLimiterConfig, RateLimiterResult } from "./types";
import { RedisRateLimiterStorage } from "./storage/redis-storage";
import { MemoryRateLimiterStorage } from "./storage/memory-storage";

export class RateLimiter {
  private primaryStorage: RedisRateLimiterStorage | null = null;
  private fallbackStorage: MemoryRateLimiterStorage | null = null;
  private config: RateLimiterConfig;
  private useInMemoryFallback: boolean;
  private redis: Redis | null = null;

  constructor(config: RateLimiterConfig, redis?: Redis) {
    this.config = config;
    this.useInMemoryFallback = config.useInMemoryFallback ?? true;
    this.redis = redis ?? null;

    // Initialize primary storage (Redis)
    if (this.redis) {
      this.primaryStorage = new RedisRateLimiterStorage(this.redis, config);
    }

    // Initialize fallback storage (in-memory)
    if (this.useInMemoryFallback) {
      this.fallbackStorage = new MemoryRateLimiterStorage(config);
    }

    // If neither storage is available, throw error
    if (!this.primaryStorage && !this.fallbackStorage) {
      throw new Error(
        "Rate limiter requires either Redis connection or in-memory fallback enabled",
      );
    }
  }

  /**
   * Consume points from the rate limit
   * @param key - Unique identifier (e.g., userId, IP address, API key)
   * @param points - Number of points to consume (default: 1)
   * @returns Rate limiter result with allowed status and metadata
   */
  async consume(key: string, points: number = 1): Promise<RateLimiterResult> {
    try {
      // Try Redis first
      if (this.primaryStorage) {
        return await this.primaryStorage.consume(key, points);
      }

      // Fallback to memory storage
      if (this.fallbackStorage) {
        return await this.fallbackStorage.consume(key, points);
      }

      throw new Error("No storage available");
    } catch (error) {
      // If Redis fails and we have fallback, use it
      if (this.fallbackStorage && this.primaryStorage) {
        console.warn(
          `Rate limiter Redis error, falling back to memory: ${error}`,
        );
        return await this.fallbackStorage.consume(key, points);
      }

      throw error;
    }
  }

  /**
   * Get current rate limit status without consuming points
   * @param key - Unique identifier
   * @returns Current rate limit status or null if no data exists
   */
  async get(key: string): Promise<RateLimiterResult | null> {
    try {
      if (this.primaryStorage) {
        return await this.primaryStorage.get(key);
      }

      if (this.fallbackStorage) {
        return await this.fallbackStorage.get(key);
      }

      return null;
    } catch (error) {
      if (this.fallbackStorage && this.primaryStorage) {
        console.warn(
          `Rate limiter Redis error, falling back to memory: ${error}`,
        );
        return await this.fallbackStorage.get(key);
      }

      throw error;
    }
  }

  /**
   * Delete rate limit data for a key
   * @param key - Unique identifier
   */
  async delete(key: string): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.primaryStorage) {
      promises.push(this.primaryStorage.delete(key));
    }

    if (this.fallbackStorage) {
      promises.push(this.fallbackStorage.delete(key));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Reset rate limit for a key (alias for delete)
   * @param key - Unique identifier
   */
  async reset(key: string): Promise<void> {
    await this.delete(key);
  }

  /**
   * Penalty: Block a key for the configured block duration
   * @param key - Unique identifier
   */
  async penalty(key: string): Promise<void> {
    const blockPoints = this.config.points + 1;
    await this.consume(key, blockPoints);
  }

  /**
   * Reward: Add points back to the key's allowance
   * @param key - Unique identifier
   * @param points - Number of points to add back
   */
  async reward(key: string, points: number = 1): Promise<void> {
    // Consume negative points to add back
    await this.consume(key, -points);
  }

  /**
   * Check if a key is currently rate limited
   * @param key - Unique identifier
   * @returns True if rate limited, false otherwise
   */
  async isBlocked(key: string): Promise<boolean> {
    const status = await this.get(key);
    return status ? !status.allowed : false;
  }

  /**
   * Get remaining points for a key
   * @param key - Unique identifier
   * @returns Number of remaining points
   */
  async getRemaining(key: string): Promise<number> {
    const status = await this.get(key);
    return status?.remaining ?? this.config.points;
  }

  /**
   * Destroy the rate limiter and cleanup resources
   */
  destroy(): void {
    if (this.fallbackStorage) {
      this.fallbackStorage.destroy();
    }
  }
}
