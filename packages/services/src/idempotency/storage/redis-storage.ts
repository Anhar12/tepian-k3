/**
 * Redis-backed idempotency storage
 */
import type Redis from "ioredis";
import type { IdempotencyRecord, IIdempotencyStorage } from "../types";

export class RedisIdempotencyStorage implements IIdempotencyStorage {
  private redis: Redis;
  private keyPrefix: string;

  constructor(redis: Redis, keyPrefix: string) {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const data = await this.redis.get(this.getKey(key));
    if (!data) return null;
    return JSON.parse(data) as IdempotencyRecord;
  }

  /**
   * Atomically set a processing lock using a Lua script (SET-if-not-exists).
   * Returns true if the lock was acquired, false if the key already exists.
   */
  async setProcessing(
    key: string,
    record: IdempotencyRecord,
    lockTimeoutSeconds: number,
  ): Promise<boolean> {
    const script = `
      local key = KEYS[1]
      local existing = redis.call('GET', key)
      if existing then
        return 0
      end
      redis.call('SET', key, ARGV[1], 'EX', ARGV[2])
      return 1
    `;

    const result = await this.redis.eval(
      script,
      1,
      this.getKey(key),
      JSON.stringify(record),
      lockTimeoutSeconds,
    );

    return result === 1;
  }

  async setCompleted(
    key: string,
    response: string,
    ttlSeconds: number,
  ): Promise<void> {
    const fullKey = this.getKey(key);
    const existing = await this.redis.get(fullKey);
    if (!existing) return;

    const record = JSON.parse(existing) as IdempotencyRecord;
    record.status = "completed";
    record.response = response;
    record.completedAt = Date.now();

    await this.redis.set(fullKey, JSON.stringify(record), "EX", ttlSeconds);
  }

  async setFailed(
    key: string,
    error: string,
    ttlSeconds: number,
  ): Promise<void> {
    const fullKey = this.getKey(key);
    const existing = await this.redis.get(fullKey);
    if (!existing) return;

    const record = JSON.parse(existing) as IdempotencyRecord;
    record.status = "failed";
    record.error = error;
    record.completedAt = Date.now();

    // Use shorter TTL for failed records so retries can happen sooner
    const failedTtl = Math.min(ttlSeconds, 300); // Max 5 min for failed records
    await this.redis.set(fullKey, JSON.stringify(record), "EX", failedTtl);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(this.getKey(key));
  }

  destroy(): void {
    // Redis connection is managed by the service, not the storage
  }
}
