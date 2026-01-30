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
