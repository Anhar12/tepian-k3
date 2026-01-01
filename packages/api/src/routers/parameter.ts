import parameterSchema from "@tepian-k3/schema/parameter.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import { Effect } from "effect";
import parameterQueries from "@tepian-k3/queries/parameter.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const parameterRouter = createTRPCRouter({
  getOffsetPaginatedParametersByClusterIdAndCategoryId: publicProcedure
    .input(parameterSchema.getByClusterAndParameterCategorySchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        parameterQueries.getOffsetPaginatedParametersByClusterIdAndCategoryId(
          input
        )
      );

      return { data, pageCount };
    }),

  getPaginatedParameters: withPermission("parameters.read")
    .input(parameterSchema.getAllParametersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        parameterQueries.getOffsetPaginatedParameters(input)
      );

      return { data, pageCount };
    }),

  getParameterById: withPermission("parameters.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const parameter = await Effect.runPromise(
        parameterQueries.getParameterById(input.id)
      );

      if (!parameter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parameter tidak ditemukan",
        });
      }

      return parameter;
    }),

  createParameter: withPermission("parameters.create")
    .input(parameterSchema.createParameterSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(parameterQueries.createParameter(input))
    ),

  updateParameter: withPermission("parameters.update")
    .input(parameterSchema.updateParameterSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(parameterQueries.updateParameter(input))
    ),

  deleteParameter: withPermission("parameters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(parameterQueries.deleteParameter(input.id))
    ),

  restoreParameter: withPermission("parameters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(parameterQueries.restoreParameter(input.id))
    ),
});
