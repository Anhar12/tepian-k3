import parameterCategoriesSchema from "@tepian-k3/schema/parameter-categories.schema";
import { createTRPCRouter, withPermission } from "..";
import { Effect } from "effect";
import parameterCategoriesQueries from "@tepian-k3/queries/parameter-categories.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const parameterCategoriesRouter = createTRPCRouter({
  getPaginatedParameterCategories: withPermission("parameter-categories.read")
    .input(parameterCategoriesSchema.getAllParameterCategoriesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
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
      const parameterCategory = await Effect.runPromise(
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
        await Effect.runPromise(
          parameterCategoriesQueries.createParameterCategory(input)
        )
    ),

  updateParameterCategory: withPermission("parameter-categories.update")
    .input(parameterCategoriesSchema.updateParameterCategorySchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
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
        await Effect.runPromise(
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
        await Effect.runPromise(
          parameterCategoriesQueries.restoreParameterCategory(input.id)
        )
    ),
});
