import Redis from "ioredis";

/**
 * Clears all cache keys from Redis DB 1 after seeding.
 *
 * Seeding replaces data with new UUIDv7 primary keys. Any cached responses
 * pointing to old UUIDs will cause FK violations or stale UI data. This
 * flushes the entire cache DB so all data is re-fetched fresh after seeding.
 *
 * Gracefully no-ops if Redis is unavailable.
 */
export async function clearAllCache(): Promise<void> {
  const host = process.env.MEMURAI_HOST ?? "localhost";
  const port = Number(process.env.MEMURAI_PORT) || 6379;
  const password = process.env.MEMURAI_PASSWORD;

  const redis = new Redis({
    host,
    port,
    password,
    db: 1, // same DB as CacheService
    lazyConnect: true,
    connectTimeout: 3000,
  });

  try {
    await redis.connect();
    await redis.flushdb();
    console.log("🧹 All cache cleared");
  } catch (err) {
    console.warn(
      `⚠️  Could not clear cache (Redis unavailable): ${(err as Error).message}`,
    );
  } finally {
    redis.disconnect();
  }
}
