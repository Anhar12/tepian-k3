import landingRegionQueries from "@tepian-k3/queries/platform/landing-region.queries";
import landingRegionSchema from "@tepian-k3/schema/platform/landing-region.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "../..";
import { runEffect } from "../../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";
import { CACHE_TTL } from "@tepian-k3/constants";
import z from "zod";

export const landingRegionRouter = createTRPCRouter({
  getAll: withRateLimit(rateLimiters.moderate()).query(
    async ({ ctx }) =>
      await withCache(
        "landing_regions:all",
        CACHE_TTL.LONG,
        () => runEffect(landingRegionQueries.getAllLandingRegions()),
        () => ctx.c.header("X-Data-Source", "cache"),
      ),
  ),

  create: withPermission("banners.create")
    .input(landingRegionSchema.createLandingRegionSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation("landing_regions:", () =>
          runEffect(landingRegionQueries.createLandingRegion(input)),
        ),
    ),

  update: withPermission("banners.update")
    .input(landingRegionSchema.updateLandingRegionSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation("landing_regions:", () =>
          runEffect(landingRegionQueries.updateLandingRegion(input)),
        ),
    ),

  delete: withPermission("banners.delete")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation("landing_regions:", () =>
          runEffect(landingRegionQueries.deleteLandingRegion(input.id)),
        ),
    ),
});
