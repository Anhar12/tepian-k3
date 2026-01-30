import parameterCategoriesSchema from "@tepian-k3/schema/parameter-categories.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "..";
import parameterCategoriesQueries from "@tepian-k3/queries/parameter-categories.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { cacheService } from "@tepian-k3/services/cache";
import { CACHE_KEYS, CACHE_TTL } from "@tepian-k3/constants";
import { withCache } from "../utils/cache-helper";

export const parameterCategoriesRouter = createTRPCRouter({
  getAllParameterCategories: withRateLimit(rateLimiters.moderate()).query(
    async () =>
      await withCache(CACHE_KEYS.PARAMETER_CATEGORIES_ALL, CACHE_TTL.LONG, () =>
        runEffect(parameterCategoriesQueries.getAllParameterCategories()),
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
    .mutation(async ({ input }) => {
      const result = await runEffect(
        parameterCategoriesQueries.createParameterCategory(input),
      );
      await cacheService.deleteByPrefix(CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX);
      return result;
    }),

  updateParameterCategory: withPermission("parameter-categories.update")
    .input(parameterCategoriesSchema.updateParameterCategorySchema)
    .mutation(async ({ input }) => {
      const result = await runEffect(
        parameterCategoriesQueries.updateParameterCategory(input),
      );
      await cacheService.deleteByPrefix(CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX);
      return result;
    }),

  deleteParameterCategory: withPermission("parameter-categories.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await runEffect(
        parameterCategoriesQueries.deleteParameterCategory(input.id),
      );
      await cacheService.deleteByPrefix(CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX);
      return result;
    }),

  restoreParameterCategory: withPermission("parameter-categories.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await runEffect(
        parameterCategoriesQueries.restoreParameterCategory(input.id),
      );
      await cacheService.deleteByPrefix(CACHE_KEYS.PARAMETER_CATEGORIES_PREFIX);
      return result;
    }),
});
