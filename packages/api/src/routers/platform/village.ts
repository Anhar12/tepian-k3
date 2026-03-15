import villageSchema from "@tepian-k3/schema/platform/village.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "../..";
import villageQueries from "@tepian-k3/queries/platform/village.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";

export const villageRouter = createTRPCRouter({
  getAllVillages: withRateLimit(rateLimiters.moderate()).query(
    async ({ ctx }) =>
      await withCache(
        CACHE_KEYS.VILLAGES_ALL,
        CACHE_TTL.LONG,
        () => runEffect(villageQueries.getAllVillages()),
        () => ctx.c.header("X-Data-Source", "cache"),
      ),
  ),

  getAllVillagesByDistrictId: withRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        districtId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await withCache(
          `${CACHE_KEYS.VILLAGES_BY_DISTRICT}${input.districtId}`,
          CACHE_TTL.LONG,
          () =>
            runEffect(
              villageQueries.getAllVillagesByDistrictId(input.districtId),
            ),
        ),
    ),

  getPaginatedVillages: withPermission("village.read")
    .input(villageSchema.getAllVillagesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        villageQueries.getOffsetPaginationVillages(input),
      );

      return { data, pageCount };
    }),

  getVillageById: withPermission("village.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const village = await runEffect(villageQueries.getVillageById(input.id));

      if (!village) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "District tidak ditemukan",
        });
      }

      return village;
    }),

  createVillage: withPermission("village.create")
    .input(villageSchema.createVillageSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.VILLAGES_PREFIX, () =>
          runEffect(villageQueries.createVillage(input)),
        ),
    ),

  updateVillage: withPermission("village.update")
    .input(villageSchema.updateVillageSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.VILLAGES_PREFIX, () =>
          runEffect(villageQueries.updateVillage(input)),
        ),
    ),

  deleteVillage: withPermission("village.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.VILLAGES_PREFIX, () =>
          runEffect(villageQueries.deleteVillage(input.id)),
        ),
    ),

  restoreVillage: withPermission("village.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.VILLAGES_PREFIX, () =>
          runEffect(villageQueries.restoreVillage(input.id)),
        ),
    ),
});
