import districtSchema from "@tepian-k3/schema/platform/district.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "../..";
import districtQueries from "@tepian-k3/queries/platform/district.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";

export const districtRouter = createTRPCRouter({
  getAllDistricts: withRateLimit(rateLimiters.moderate()).query(
    async ({ ctx }) =>
      await withCache(
        CACHE_KEYS.DISTRICTS_ALL,
        CACHE_TTL.LONG,
        () => runEffect(districtQueries.getAllDistricts()),
        () => ctx.c.header("X-Data-Source", "cache"),
      ),
  ),

  getAllDistrictsByRegencyId: withRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        regencyId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await withCache(
          `${CACHE_KEYS.DISTRICTS_BY_REGENCY}${input.regencyId}`,
          CACHE_TTL.LONG,
          () =>
            runEffect(
              districtQueries.getAllDistrictsByRegencyId(input.regencyId),
            ),
        ),
    ),

  getPaginatedDistricts: withPermission("district.view")
    .input(districtSchema.getAllDistrictsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        districtQueries.getOffsetPaginatedDistricts(input),
      );

      return { data, pageCount };
    }),

  getDistrictById: withPermission("district.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const district = await runEffect(
        districtQueries.getDistrictById(input.id),
      );

      if (!district) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "District tidak ditemukan",
        });
      }

      return district;
    }),

  createDistrict: withPermission("district.create")
    .input(districtSchema.createDistrictSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.DISTRICTS_PREFIX, () =>
          runEffect(districtQueries.createDistrict(input)),
        ),
    ),

  updateDistrict: withPermission("district.update")
    .input(districtSchema.updateDistrictSchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.DISTRICTS_PREFIX, () =>
          runEffect(districtQueries.updateDistrict(input)),
        ),
    ),

  deleteDistrict: withPermission("district.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.DISTRICTS_PREFIX, () =>
          runEffect(districtQueries.deleteDistrict(input.id)),
        ),
    ),

  restoreDistrict: withPermission("district.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(CACHE_KEYS.DISTRICTS_PREFIX, () =>
          runEffect(districtQueries.restoreDistrict(input.id)),
        ),
    ),
});
