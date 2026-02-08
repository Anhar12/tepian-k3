/**
 * Idempotency service
 * Provides request deduplication with Redis and in-memory fallback
 */
import Redis from "ioredis";
import { env } from "../../env";
import { logInfo, logWarn } from "../logger";
import { RedisIdempotencyStorage } from "./storage/redis-storage";
import { MemoryIdempotencyStorage } from "./storage/memory-storage";
import type {
  IdempotencyConfig,
  IdempotencyRecord,
  IIdempotencyStorage,
} from "./types";

export type { IdempotencyRecord, IdempotencyConfig };

const DEFAULT_CONFIG: IdempotencyConfig = {
  ttl: 86400, // 24 hours
  keyPrefix: "idempotency",
  useInMemoryFallback: true,
  lockTimeout: 300, // 5 minutes
};

export class IdempotencyService {
  private redis: Redis | null = null;
  private primaryStorage: RedisIdempotencyStorage | null = null;
  private fallbackStorage: MemoryIdempotencyStorage | null = null;
  private config: IdempotencyConfig;

  constructor(config?: Partial<IdempotencyConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    try {
      this.redis = new Redis({
        host: env.MEMURAI_HOST ?? "localhost",
        port: Number(env.MEMURAI_PORT) || 6379,
        password: env.MEMURAI_PASSWORD || undefined,
        db: 1, // Separate from rate-limiter (db 0)
        retryStrategy: (times: number) => {
          if (times > 3) {
            logWarn(
              "IdempotencyService.retryStrategy",
              "Exceeded maximum Redis reconnection attempts",
            );
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on("error", (err) => {
        logWarn("IdempotencyService.Redis", `Redis error: ${err.message}`);
      });

      this.redis.on("connect", () => {
        logInfo("IdempotencyService.Redis", "Connected to Redis server");
      });

      this.redis.connect().catch((err) => {
        logWarn(
          "IdempotencyService.Redis",
          `Failed to connect to Redis: ${err.message}`,
        );
      });

      this.primaryStorage = new RedisIdempotencyStorage(
        this.redis,
        this.config.keyPrefix,
      );
    } catch (error) {
      logWarn(
        "IdempotencyService",
        `Failed to initialize Redis: ${(error as Error).message}`,
      );
    }

    if (this.config.useInMemoryFallback) {
      this.fallbackStorage = new MemoryIdempotencyStorage();
    }
  }

  private getStorage(): IIdempotencyStorage | null {
    return this.primaryStorage ?? this.fallbackStorage ?? null;
  }

  /**
   * Try primary storage first, fall back to memory storage on failure
   */
  private async withFallback<T>(
    fn: (storage: IIdempotencyStorage) => Promise<T>,
  ): Promise<T | null> {
    // Try primary (Redis)
    if (this.primaryStorage) {
      try {
        return await fn(this.primaryStorage);
      } catch (error) {
        logWarn(
          "IdempotencyService",
          `Redis operation failed, ${this.fallbackStorage ? "using fallback" : "skipping"}: ${(error as Error).message}`,
        );
      }
    }

    // Fall back to memory
    if (this.fallbackStorage) {
      return await fn(this.fallbackStorage);
    }

    return null;
  }

  /**
   * Check for an existing idempotency record
   */
  async check(key: string): Promise<IdempotencyRecord | null> {
    return (await this.withFallback((s) => s.get(key))) ?? null;
  }

  /**
   * Attempt to acquire a processing lock. Returns true if acquired.
   */
  async acquireLock(key: string, record: IdempotencyRecord): Promise<boolean> {
    return (
      (await this.withFallback((s) =>
        s.setProcessing(key, record, this.config.lockTimeout),
      )) ?? false
    );
  }

  /**
   * Mark a request as completed with its serialized response
   */
  async markCompleted(key: string, response: string): Promise<void> {
    await this.withFallback((s) =>
      s.setCompleted(key, response, this.config.ttl),
    );
  }

  /**
   * Mark a request as failed (allows retry with same key)
   */
  async markFailed(key: string, error: string): Promise<void> {
    await this.withFallback((s) => s.setFailed(key, error, this.config.ttl));
  }

  /**
   * Delete an idempotency record
   */
  async delete(key: string): Promise<void> {
    await this.withFallback((s) => s.delete(key));
  }

  /**
   * Close all connections and cleanup
   */
  async close(): Promise<void> {
    this.primaryStorage?.destroy();
    this.fallbackStorage?.destroy();

    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Global singleton
let service: IdempotencyService | null = null;

/**
 * Get the global idempotency service instance
 */
export function getIdempotencyService(): IdempotencyService {
  if (!service) {
    service = new IdempotencyService();
  }
  return service;
}

/**
 * Shutdown the idempotency service (for graceful shutdown)
 */
export async function shutdownIdempotencyService(): Promise<void> {
  if (service) {
    await service.close();
    service = null;
  }
}
