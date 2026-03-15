import { cacheService } from "@tepian-k3/services/cache";

export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetcher: () => Promise<T>,
  onCacheHit?: () => void,
): Promise<T> {
  const cached = await cacheService.get<T>(cacheKey);
  if (cached) {
    onCacheHit?.();
    return cached;
  }

  const result = await fetcher();
  await cacheService.set(cacheKey, result, ttl);
  return result;
}

export async function withCacheInvalidation<T>(
  cachePrefix: string | string[],
  mutation: () => Promise<T>,
): Promise<T> {
  const result = await mutation();

  const prefixes = Array.isArray(cachePrefix) ? cachePrefix : [cachePrefix];
  await Promise.all(
    prefixes.map((prefix) => cacheService.deleteByPrefix(prefix)),
  );

  return result;
}
