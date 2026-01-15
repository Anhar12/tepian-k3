import parameterCategoriesSchema from "@tepian-k3/schema/parameter-categories.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import parameterCategoriesQueries from "@tepian-k3/queries/parameter-categories.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";

export const parameterCategoriesRouter = createTRPCRouter({
  getAllParameterCategories: publicProcedure.query(
    async () =>
      await runEffect(parameterCategoriesQueries.getAllParameterCategories())
  ),

  getPaginatedParameterCategories: withPermission("parameter-categories.view")
    .input(parameterCategoriesSchema.getAllParameterCategoriesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        parameterCategoriesQueries.getOffsetPaginatedParameterCategories(input)
      );

      return { data, pageCount };
    }),

  getParameterCategoryById: withPermission("parameter-categories.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const parameterCategory = await runEffect(
        parameterCategoriesQueries.getParameterCategoryById(input.id)
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
        await runEffect(
          parameterCategoriesQueries.createParameterCategory(input)
        )
    ),

  updateParameterCategory: withPermission("parameter-categories.update")
    .input(parameterCategoriesSchema.updateParameterCategorySchema)
    .mutation(
      async ({ input }) =>
        await runEffect(
          parameterCategoriesQueries.updateParameterCategory(input)
        )
    ),

  deleteParameterCategory: withPermission("parameter-categories.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          parameterCategoriesQueries.deleteParameterCategory(input.id)
        )
    ),

  restoreParameterCategory: withPermission("parameter-categories.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          parameterCategoriesQueries.restoreParameterCategory(input.id)
        )
    ),
});
