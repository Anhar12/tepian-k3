/**
 * In-memory rate limiter storage (fallback when Redis is unavailable)
 */
import type {
  RateLimiterConfig,
  RateLimiterResult,
  IRateLimiterStorage,
} from "../types";

interface MemoryRecord {
  points: number;
  resetAt: number;
  requests?: Array<{ timestamp: number; points: number }>;
  tokens?: number;
  lastRefill?: number;
}

export class MemoryRateLimiterStorage implements IRateLimiterStorage {
  private storage: Map<string, MemoryRecord>;
  private config: Required<Omit<RateLimiterConfig, "useInMemoryFallback">>;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: Omit<RateLimiterConfig, "useInMemoryFallback">) {
    this.storage = new Map();
    this.config = {
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration ?? config.duration,
      keyPrefix: config.keyPrefix ?? "rate-limit",
      strategy: config.strategy ?? "sliding-window",
    };

    // Cleanup expired records every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Get the full key with prefix
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = Date.now();
    this.storage.forEach((record, key) => {
      if (record.resetAt < now) {
        this.storage.delete(key);
      }
    });
  }

  /**
   * Consume points using the configured strategy
   */
  async consume(key: string, points: number = 1): Promise<RateLimiterResult> {
    const strategy = this.config.strategy ?? "sliding-window";

    switch (strategy) {
      case "sliding-window":
        return this.consumeSlidingWindow(key, points);
      case "token-bucket":
        return this.consumeTokenBucket(key, points);
      case "fixed-window":
        return this.consumeFixedWindow(key, points);
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  /**
   * Sliding window rate limiter
   */
  private async consumeSlidingWindow(
    key: string,
    points: number,
  ): Promise<RateLimiterResult> {
    const fullKey = this.getKey(key);
    const now = Date.now();
    const windowStart = now - this.config.duration * 1000;

    let record = this.storage.get(fullKey);

    if (!record || !record.requests) {
      record = {
        points: 0,
        resetAt: now + this.config.duration * 1000,
        requests: [],
      };
      this.storage.set(fullKey, record);
    }

    // Remove old requests outside the window
    record.requests = record.requests!.filter((r) => r.timestamp > windowStart);

    // Calculate current points in window
    const currentPoints = record.requests!.reduce(
      (sum, r) => sum + r.points,
      0,
    );

    // Check if blocked
    if (record.resetAt > now && currentPoints >= this.config.points) {
      const resetMs = record.resetAt - now;
      return {
        allowed: false,
        remaining: 0,
        limit: this.config.points,
        resetMs,
        resetAt: new Date(record.resetAt),
        consumed: currentPoints,
        isMemoryFallback: true,
      };
    }

    // Check if adding points would exceed limit
    if (currentPoints + points > this.config.points) {
      record.resetAt = now + this.config.blockDuration * 1000;
      const resetMs = record.resetAt - now;
      return {
        allowed: false,
        remaining: 0,
        limit: this.config.points,
        resetMs,
        resetAt: new Date(record.resetAt),
        consumed: currentPoints,
        isMemoryFallback: true,
      };
    }

    // Add the request
    record.requests!.push({ timestamp: now, points });

    const newTotal = currentPoints + points;
    const remaining = this.config.points - newTotal;

    // Calculate reset time based on oldest request
    const oldestRequest = record.requests![0];
    const resetMs = oldestRequest
      ? Math.max(0, oldestRequest.timestamp + this.config.duration * 1000 - now)
      : this.config.duration * 1000;

    record.resetAt = now + resetMs;

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      limit: this.config.points,
      resetMs,
      resetAt: new Date(now + resetMs),
      consumed: newTotal,
      isMemoryFallback: true,
    };
  }

  /**
   * Token bucket rate limiter
   */
  private async consumeTokenBucket(
    key: string,
    points: number,
  ): Promise<RateLimiterResult> {
    const fullKey = this.getKey(key);
    const now = Date.now();
    const refillRate = this.config.points / this.config.duration;

    let record = this.storage.get(fullKey);

    if (!record || record.tokens === undefined) {
      record = {
        points: this.config.points,
        tokens: this.config.points,
        lastRefill: now,
        resetAt: now + this.config.duration * 1000,
      };
      this.storage.set(fullKey, record);
    }

    // Calculate tokens to add based on time elapsed
    const elapsed = (now - record.lastRefill!) / 1000;
    const tokensToAdd = elapsed * refillRate;
    record.tokens = Math.min(this.config.points, record.tokens! + tokensToAdd);
    record.lastRefill = now;

    // Check if we have enough tokens
    if (record.tokens >= points) {
      record.tokens -= points;
      record.resetAt = now + Math.ceil((points / refillRate) * 1000);

      const resetMs = Math.ceil(
        ((this.config.points - record.tokens) / refillRate) * 1000,
      );

      return {
        allowed: true,
        remaining: Math.floor(record.tokens),
        limit: this.config.points,
        resetMs,
        resetAt: new Date(now + resetMs),
        consumed: points,
        isMemoryFallback: true,
      };
    } else {
      const resetMs = Math.ceil(((points - record.tokens) / refillRate) * 1000);
      record.resetAt = now + resetMs;

      return {
        allowed: false,
        remaining: Math.floor(record.tokens),
        limit: this.config.points,
        resetMs,
        resetAt: new Date(now + resetMs),
        consumed: 0,
        isMemoryFallback: true,
      };
    }
  }

  /**
   * Fixed window rate limiter
   */
  private async consumeFixedWindow(
    key: string,
    points: number,
  ): Promise<RateLimiterResult> {
    const fullKey = this.getKey(key);
    const now = Date.now();
    const windowKey = Math.floor(now / (this.config.duration * 1000));
    const windowEnd = (windowKey + 1) * this.config.duration * 1000;
    const fullWindowKey = `${fullKey}:${windowKey}`;

    let record = this.storage.get(fullWindowKey);

    if (!record || record.resetAt < now) {
      record = {
        points: 0,
        resetAt: windowEnd,
      };
      this.storage.set(fullWindowKey, record);

      // Clean up old window
      const oldWindowKey = `${fullKey}:${windowKey - 1}`;
      this.storage.delete(oldWindowKey);
    }

    const currentPoints = record.points;

    if (currentPoints + points > this.config.points) {
      const resetMs = Math.max(0, windowEnd - now);
      return {
        allowed: false,
        remaining: Math.max(0, this.config.points - currentPoints),
        limit: this.config.points,
        resetMs,
        resetAt: new Date(windowEnd),
        consumed: currentPoints,
        isMemoryFallback: true,
      };
    }

    record.points += points;
    const remaining = this.config.points - record.points;
    const resetMs = Math.max(0, windowEnd - now);

    return {
      allowed: true,
      remaining: Math.max(0, remaining),
      limit: this.config.points,
      resetMs,
      resetAt: new Date(windowEnd),
      consumed: record.points,
      isMemoryFallback: true,
    };
  }

  /**
   * Get current rate limit status without consuming points
   */
  async get(key: string): Promise<RateLimiterResult | null> {
    const fullKey = this.getKey(key);
    const now = Date.now();

    const strategy = this.config.strategy ?? "sliding-window";

    if (strategy === "sliding-window") {
      const record = this.storage.get(fullKey);
      if (!record || !record.requests) {
        return {
          allowed: true,
          remaining: this.config.points,
          limit: this.config.points,
          resetMs: this.config.duration * 1000,
          resetAt: new Date(now + this.config.duration * 1000),
          consumed: 0,
          isMemoryFallback: true,
        };
      }

      const windowStart = now - this.config.duration * 1000;
      const validRequests = record.requests.filter(
        (r) => r.timestamp > windowStart,
      );
      const consumed = validRequests.reduce((sum, r) => sum + r.points, 0);
      const remaining = Math.max(0, this.config.points - consumed);
      const oldestRequest = validRequests[0];
      const resetMs = oldestRequest
        ? Math.max(
            0,
            oldestRequest.timestamp + this.config.duration * 1000 - now,
          )
        : this.config.duration * 1000;

      return {
        allowed: remaining > 0,
        remaining,
        limit: this.config.points,
        resetMs,
        resetAt: new Date(now + resetMs),
        consumed,
        isMemoryFallback: true,
      };
    } else if (strategy === "token-bucket") {
      const record = this.storage.get(fullKey);
      if (!record || record.tokens === undefined) {
        return {
          allowed: true,
          remaining: this.config.points,
          limit: this.config.points,
          resetMs: 0,
          resetAt: new Date(now),
          consumed: 0,
          isMemoryFallback: true,
        };
      }

      const refillRate = this.config.points / this.config.duration;
      const elapsed = (now - record.lastRefill!) / 1000;
      const tokensToAdd = elapsed * refillRate;
      const tokens = Math.min(this.config.points, record.tokens + tokensToAdd);
      const remaining = Math.floor(tokens);
      const resetMs = Math.ceil(
        ((this.config.points - tokens) / refillRate) * 1000,
      );

      return {
        allowed: remaining > 0,
        remaining,
        limit: this.config.points,
        resetMs,
        resetAt: new Date(now + resetMs),
        consumed: this.config.points - remaining,
        isMemoryFallback: true,
      };
    } else {
      // fixed-window
      const windowKey = Math.floor(now / (this.config.duration * 1000));
      const fullWindowKey = `${fullKey}:${windowKey}`;
      const record = this.storage.get(fullWindowKey);
      const consumed = record?.points ?? 0;
      const remaining = Math.max(0, this.config.points - consumed);
      const windowEnd = (windowKey + 1) * this.config.duration * 1000;
      const resetMs = Math.max(0, windowEnd - now);

      return {
        allowed: remaining > 0,
        remaining,
        limit: this.config.points,
        resetMs,
        resetAt: new Date(windowEnd),
        consumed,
        isMemoryFallback: true,
      };
    }
  }

  /**
   * Delete rate limit data for a key
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key);
    this.storage.delete(fullKey);

    // For fixed-window, also delete window keys
    const now = Date.now();
    const windowKey = Math.floor(now / (this.config.duration * 1000));
    this.storage.delete(`${fullKey}:${windowKey}`);
    this.storage.delete(`${fullKey}:${windowKey - 1}`);
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    await this.delete(key);
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.storage.clear();
  }
}
