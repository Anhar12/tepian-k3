/**
 * In-memory idempotency storage (fallback when Redis is unavailable)
 */
import type { IdempotencyRecord, IIdempotencyStorage } from "../types";

interface MemoryEntry {
  record: IdempotencyRecord;
  expiresAt: number;
}

export class MemoryIdempotencyStorage implements IIdempotencyStorage {
  private storage: Map<string, MemoryEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired records every 60 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60_000);
  }

  private cleanup(): void {
    const now = Date.now();
    this.storage.forEach((entry, key) => {
      if (entry.expiresAt < now) {
        this.storage.delete(key);
      }
    });
  }

  async get(key: string): Promise<IdempotencyRecord | null> {
    const entry = this.storage.get(key);
    if (!entry) return null;

    // Check expiry
    if (entry.expiresAt < Date.now()) {
      this.storage.delete(key);
      return null;
    }

    return entry.record;
  }

  /**
   * Set processing lock. In single-process Node.js, this is naturally atomic.
   * Returns true if lock was acquired, false if key already exists.
   */
  async setProcessing(
    key: string,
    record: IdempotencyRecord,
    lockTimeoutSeconds: number,
  ): Promise<boolean> {
    const existing = this.storage.get(key);
    if (existing && existing.expiresAt >= Date.now()) {
      return false;
    }

    this.storage.set(key, {
      record,
      expiresAt: Date.now() + lockTimeoutSeconds * 1000,
    });
    return true;
  }

  async setCompleted(
    key: string,
    response: string,
    ttlSeconds: number,
  ): Promise<void> {
    const existing = this.storage.get(key);
    if (!existing) return;

    existing.record.status = "completed";
    existing.record.response = response;
    existing.record.completedAt = Date.now();
    existing.expiresAt = Date.now() + ttlSeconds * 1000;
  }

  async setFailed(
    key: string,
    error: string,
    ttlSeconds: number,
  ): Promise<void> {
    const existing = this.storage.get(key);
    if (!existing) return;

    existing.record.status = "failed";
    existing.record.error = error;
    existing.record.completedAt = Date.now();
    // Shorter TTL for failed records
    const failedTtl = Math.min(ttlSeconds, 300);
    existing.expiresAt = Date.now() + failedTtl * 1000;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.storage.clear();
  }
}
