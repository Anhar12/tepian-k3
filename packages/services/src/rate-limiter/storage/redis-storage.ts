/**
 * Redis-based rate limiter storage
 */
import Redis from "ioredis";
import type {
  RateLimiterConfig,
  RateLimiterResult,
  IRateLimiterStorage,
} from "../types";

export class RedisRateLimiterStorage implements IRateLimiterStorage {
  private redis: Redis;
  private config: Required<Omit<RateLimiterConfig, "useInMemoryFallback">>;

  constructor(
    redis: Redis,
    config: Omit<RateLimiterConfig, "useInMemoryFallback">,
  ) {
    this.redis = redis;
    this.config = {
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration ?? config.duration,
      keyPrefix: config.keyPrefix ?? "rate-limit",
      strategy: config.strategy ?? "sliding-window",
    };
  }

  /**
   * Get the full Redis key with prefix
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
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
   * Sliding window rate limiter (most accurate)
   */
  private async consumeSlidingWindow(
    key: string,
    points: number,
  ): Promise<RateLimiterResult> {
    const redisKey = this.getKey(key);
    const now = Date.now();
    const windowStart = now - this.config.duration * 1000;

    // Lua script for atomic sliding window operation
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local points = tonumber(ARGV[3])
      local max_points = tonumber(ARGV[4])
      local duration = tonumber(ARGV[5])
      local block_duration = tonumber(ARGV[6])

      -- Remove old entries outside the window
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

      -- Count current points in the window
      local current = redis.call('ZCOUNT', key, window_start, now)

      -- Check if blocked
      local block_key = key .. ':blocked'
      local blocked_until = redis.call('GET', block_key)
      if blocked_until and tonumber(blocked_until) > now then
        local reset_ms = tonumber(blocked_until) - now
        return {0, current, max_points, reset_ms, current}
      end

      -- Check if adding points would exceed limit
      if current + points > max_points then
        -- Block the key
        redis.call('SET', block_key, now + (block_duration * 1000), 'PX', block_duration * 1000)
        local reset_ms = block_duration * 1000
        return {0, 0, max_points, reset_ms, current}
      end

      -- Add the request
      redis.call('ZADD', key, now, now .. ':' .. math.random())
      redis.call('EXPIRE', key, duration)

      local remaining = max_points - current - points
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local reset_ms = duration * 1000
      if #oldest > 0 then
        local oldest_score = tonumber(oldest[2])
        reset_ms = math.max(0, oldest_score + (duration * 1000) - now)
      end

      return {1, remaining, max_points, reset_ms, current + points}
    `;

    const result = (await this.redis.eval(
      script,
      1,
      redisKey,
      now.toString(),
      windowStart.toString(),
      points.toString(),
      this.config.points.toString(),
      this.config.duration.toString(),
      this.config.blockDuration.toString(),
    )) as [number, number, number, number, number];

    const [allowed, remaining, limit, resetMs, consumed] = result;

    return {
      allowed: allowed === 1,
      remaining: Math.max(0, remaining),
      limit,
      resetMs,
      resetAt: new Date(now + resetMs),
      consumed,
    };
  }

  /**
   * Token bucket rate limiter (good for burst traffic)
   */
  private async consumeTokenBucket(
    key: string,
    points: number,
  ): Promise<RateLimiterResult> {
    const redisKey = this.getKey(key);
    const now = Date.now();

    // Lua script for atomic token bucket operation
    const script = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local points = tonumber(ARGV[2])
      local max_points = tonumber(ARGV[3])
      local duration = tonumber(ARGV[4])
      local refill_rate = max_points / duration

      -- Get current tokens and last refill time
      local data = redis.call('HMGET', key, 'tokens', 'last_refill')
      local tokens = tonumber(data[1]) or max_points
      local last_refill = tonumber(data[2]) or now

      -- Calculate tokens to add based on time elapsed
      local elapsed = (now - last_refill) / 1000
      local tokens_to_add = elapsed * refill_rate
      tokens = math.min(max_points, tokens + tokens_to_add)

      -- Check if we have enough tokens
      if tokens >= points then
        tokens = tokens - points
        redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
        redis.call('EXPIRE', key, duration * 2)

        local reset_ms = math.ceil((max_points - tokens) / refill_rate * 1000)
        return {1, math.floor(tokens), max_points, reset_ms, points}
      else
        local reset_ms = math.ceil((points - tokens) / refill_rate * 1000)
        return {0, math.floor(tokens), max_points, reset_ms, 0}
      end
    `;

    const result = (await this.redis.eval(
      script,
      1,
      redisKey,
      now.toString(),
      points.toString(),
      this.config.points.toString(),
      this.config.duration.toString(),
    )) as [number, number, number, number, number];

    const [allowed, remaining, limit, resetMs, consumed] = result;

    return {
      allowed: allowed === 1,
      remaining,
      limit,
      resetMs,
      resetAt: new Date(now + resetMs),
      consumed,
    };
  }

  /**
   * Fixed window rate limiter (simplest)
   */
  private async consumeFixedWindow(
    key: string,
    points: number,
  ): Promise<RateLimiterResult> {
    const redisKey = this.getKey(key);
    const now = Date.now();
    const windowKey = Math.floor(now / (this.config.duration * 1000));
    const fullKey = `${redisKey}:${windowKey}`;

    // Lua script for atomic fixed window operation
    const script = `
      local key = KEYS[1]
      local points = tonumber(ARGV[1])
      local max_points = tonumber(ARGV[2])
      local duration = tonumber(ARGV[3])
      local window_end = tonumber(ARGV[4])

      local current = tonumber(redis.call('GET', key)) or 0

      if current + points > max_points then
        local reset_ms = window_end - tonumber(ARGV[5])
        return {0, math.max(0, max_points - current), max_points, reset_ms, current}
      end

      local new_value = redis.call('INCRBY', key, points)
      redis.call('EXPIRE', key, duration)

      local remaining = max_points - new_value
      local reset_ms = window_end - tonumber(ARGV[5])

      return {1, math.max(0, remaining), max_points, reset_ms, new_value}
    `;

    const windowEnd = (windowKey + 1) * this.config.duration * 1000;
    const result = (await this.redis.eval(
      script,
      1,
      fullKey,
      points.toString(),
      this.config.points.toString(),
      this.config.duration.toString(),
      windowEnd.toString(),
      now.toString(),
    )) as [number, number, number, number, number];

    const [allowed, remaining, limit, resetMs, consumed] = result;

    return {
      allowed: allowed === 1,
      remaining,
      limit,
      resetMs: Math.max(0, resetMs),
      resetAt: new Date(now + Math.max(0, resetMs)),
      consumed,
    };
  }

  /**
   * Get current rate limit status without consuming points
   */
  async get(key: string): Promise<RateLimiterResult | null> {
    const redisKey = this.getKey(key);
    const now = Date.now();

    const strategy = this.config.strategy ?? "sliding-window";

    if (strategy === "sliding-window") {
      const windowStart = now - this.config.duration * 1000;
      await this.redis.zremrangebyscore(redisKey, 0, windowStart);
      const count = await this.redis.zcount(redisKey, windowStart, now);
      const remaining = Math.max(0, this.config.points - count);
      const oldest = await this.redis.zrange(redisKey, 0, 0, "WITHSCORES");
      let resetMs = this.config.duration * 1000;
      if (oldest.length > 1 && oldest[1]) {
        const oldestScore = parseInt(oldest[1]);
        resetMs = Math.max(0, oldestScore + this.config.duration * 1000 - now);
      }

      return {
        allowed: remaining > 0,
        remaining,
        limit: this.config.points,
        resetMs,
        resetAt: new Date(now + resetMs),
        consumed: count,
      };
    } else if (strategy === "token-bucket") {
      const data = await this.redis.hmget(redisKey, "tokens", "last_refill");
      const tokens = data[0] ? parseFloat(data[0]) : this.config.points;
      const remaining = Math.floor(tokens);
      const refillRate = this.config.points / this.config.duration;
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
      };
    } else {
      // fixed-window
      const windowKey = Math.floor(now / (this.config.duration * 1000));
      const fullKey = `${redisKey}:${windowKey}`;
      const count = await this.redis.get(fullKey);
      const consumed = count ? parseInt(count) : 0;
      const remaining = Math.max(0, this.config.points - consumed);
      const windowEnd = (windowKey + 1) * this.config.duration * 1000;
      const resetMs = Math.max(0, windowEnd - now);

      return {
        allowed: remaining > 0,
        remaining,
        limit: this.config.points,
        resetMs,
        resetAt: new Date(now + resetMs),
        consumed,
      };
    }
  }

  /**
   * Delete rate limit data for a key
   */
  async delete(key: string): Promise<void> {
    const redisKey = this.getKey(key);
    await this.redis.del(redisKey);
    await this.redis.del(`${redisKey}:blocked`);
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    await this.delete(key);
  }
}
