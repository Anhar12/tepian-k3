import parameterCategoriesSchema from "@tepian-k3/schema/pengujian/parameter-categories.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "../..";
import parameterCategoriesQueries from "@tepian-k3/queries/pengujian/parameter-categories.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache, withCacheInvalidation } from "../../utils/cache-helper";

export const parameterCategoriesRouter = createTRPCRouter({
  getAllParameterCategories: withRateLimit(rateLimiters.moderate()).query(
    async ({ ctx }) =>
      await withCache(
        CACHE_KEYS.PARAMETER_CATEGORIES_ALL,
        CACHE_TTL.LONG,
        () => runEffect(parameterCategoriesQueries.getAllParameterCategories()),
        () => ctx.c.header("X-Data-Source", "cache"),
      ),
  ),

  getPaginatedParameterCategories: withPermission("parameter-categories.view")
    .input(parameterCategoriesSchema.getAllParameterCategoriesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        parameterCategoriesQueries.getOffsetPaginatedParameterCategories(input),
      );

      return { data, pageCount };
    }),

  getParameterCategoryById: withPermission("parameter-categories.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const parameterCategory = await runEffect(
        parameterCategoriesQueries.getParameterCategoryById(input.id),
      );

      if (!parameterCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kategori parameter tidak ditemukan",
        });
      }

      return parameterCategory;
    }),

  createParameterCategory: withPermission("parameter-categories.create")
    .input(parameterCategoriesSchema.createParameterCategorySchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(
          CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX,
          () =>
            runEffect(
              parameterCategoriesQueries.createParameterCategory(input),
            ),
        ),
    ),

  updateParameterCategory: withPermission("parameter-categories.update")
    .input(parameterCategoriesSchema.updateParameterCategorySchema)
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(
          CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX,
          () =>
            runEffect(
              parameterCategoriesQueries.updateParameterCategory(input),
            ),
        ),
    ),

  deleteParameterCategory: withPermission("parameter-categories.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(
          CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX,
          () =>
            runEffect(
              parameterCategoriesQueries.deleteParameterCategory(input.id),
            ),
        ),
    ),

  restoreParameterCategory: withPermission("parameter-categories.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(
          CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX,
          () =>
            runEffect(
              parameterCategoriesQueries.restoreParameterCategory(input.id),
            ),
        ),
    ),

  hardDeleteParameterCategory: withPermission("parameter-categories.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await withCacheInvalidation(
          CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX,
          () =>
            runEffect(
              parameterCategoriesQueries.hardDeleteParameterCategory(input.id),
            ),
        ),
    ),
});
