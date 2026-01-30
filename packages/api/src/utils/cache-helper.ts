import { cacheService } from "@tepian-k3/services/cache";

export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheService.get<T>(cacheKey);
  if (cached) return cached;

  const result = await fetcher();
  await cacheService.set(cacheKey, result, ttl);
  return result;
}

export async function withCacheInvalidation<T>(
  cacheKeys: string | string[],
  mutation: () => Promise<T>,
): Promise<T> {
  const result = await mutation();

  const keys = Array.isArray(cacheKeys) ? cacheKeys : [cacheKeys];
  await Promise.all(
    keys.map((key) =>
      key.endsWith("*") || key.includes("PREFIX")
        ? cacheService.deleteByPrefix(
            key.replace("*", "").replace("_PREFIX", ""),
          )
        : cacheService.delete(key),
    ),
  );

  return result;
}
