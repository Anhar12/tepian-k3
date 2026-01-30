/**
 * Cache service
 * Provides caching with Redis and in-memory fallback
 */
import Redis from "ioredis";
import { env } from "../../env";
import { logInfo, logWarn } from "../logger";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private redis: Redis | null = null;
  private memoryStore: Map<string, CacheEntry<unknown>> = new Map();

  constructor() {
    try {
      this.redis = new Redis({
        host: env.MEMURAI_HOST ?? "localhost",
        port: Number(env.MEMURAI_PORT) ?? 6379,
        password: env.MEMURAI_PASSWORD,
        db: 1, // Use separate DB from rate limiter (db 0)
        retryStrategy: (times: number) => {
          if (times > 3) {
            logWarn(
              "CacheService.retryStrategy",
              "Exceeded maximum Redis reconnection attempts",
            );
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on("error", (err) => {
        logWarn("CacheService.Redis", `Redis error: ${err.message}`);
      });

      this.redis.on("connect", () => {
        logInfo("CacheService.Redis", "Connected to Redis server");
      });

      this.redis.connect().catch((err) => {
        logWarn(
          "CacheService.Redis",
          `Failed to connect to Redis: ${err.message}`,
        );
      });
    } catch (error) {
      logWarn(
        "CacheService",
        `Failed to initialize Redis: ${(error as Error).message}`,
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data) as T;
        }
        return null;
      } catch {
        // Fallback to memory
      }
    }

    const entry = this.memoryStore.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    if (entry) {
      this.memoryStore.delete(key);
    }
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
        return;
      } catch {
        // Fallback to memory
      }
    }

    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch {
        // Fallback to memory
      }
    }

    this.memoryStore.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return;
      } catch {
        // Fallback to memory
      }
    }

    for (const key of this.memoryStore.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryStore.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();
