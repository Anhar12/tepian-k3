/**
 * Idempotency service types
 */

export interface IdempotencyRecord {
  /** Current status of the idempotent request */
  status: "processing" | "completed" | "failed";
  /** SuperJSON-serialized response (null while processing) */
  response: string | null;
  /** Serialized error info (null unless failed) */
  error: string | null;
  /** Timestamp when the request was first received */
  createdAt: number;
  /** Timestamp when processing finished (null while processing) */
  completedAt: number | null;
  /** tRPC procedure path (for debugging) */
  path: string;
  /** SHA-256 hash of the input to detect key reuse with different payloads */
  fingerprint: string;
}

export interface IdempotencyConfig {
  /** TTL in seconds for completed records. Default: 86400 (24h) */
  ttl: number;
  /** Key prefix for storage keys. Default: "idempotency" */
  keyPrefix: string;
  /** Whether to use in-memory fallback when Redis is unavailable. Default: true */
  useInMemoryFallback: boolean;
  /** Processing lock timeout in seconds (auto-expire stale locks). Default: 300 (5min) */
  lockTimeout: number;
}

export interface IIdempotencyStorage {
  /**
   * Get an existing idempotency record by key
   */
  get(key: string): Promise<IdempotencyRecord | null>;

  /**
   * Atomically set a processing lock. Returns true if lock was acquired,
   * false if the key already exists.
   */
  setProcessing(
    key: string,
    record: IdempotencyRecord,
    lockTimeoutSeconds: number,
  ): Promise<boolean>;

  /**
   * Mark a record as completed with the serialized response
   */
  setCompleted(
    key: string,
    response: string,
    ttlSeconds: number,
  ): Promise<void>;

  /**
   * Mark a record as failed with error info
   */
  setFailed(key: string, error: string, ttlSeconds: number): Promise<void>;

  /**
   * Delete a record
   */
  delete(key: string): Promise<void>;

  /**
   * Cleanup resources
   */
  destroy(): void;
}
