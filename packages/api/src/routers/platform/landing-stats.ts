import landingStatsQueries from "@tepian-k3/queries/platform/landing-stats.queries";
import landingStatsSchema from "@tepian-k3/schema/platform/landing-stats.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "../..";
import { runEffect } from "../../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";
import { CACHE_TTL } from "@tepian-k3/constants";

export const landingStatsRouter = createTRPCRouter({
  getAll: withRateLimit(rateLimiters.moderate()).query(
    async ({ ctx }) =>
      await withCache(
        "landing_stats:all",
        CACHE_TTL.LONG,
        () => runEffect(landingStatsQueries.getAllLandingStats()),
        () => ctx.c.header("X-Data-Source", "cache"),
      ),
  ),

  upsert: withPermission("banners.create")
    .input(landingStatsSchema.upsertLandingStatSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation("landing_stats:", () =>
          runEffect(landingStatsQueries.upsertLandingStat(input)),
        ),
    ),
});
