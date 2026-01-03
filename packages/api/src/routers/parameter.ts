import parameterSchema from "@tepian-k3/schema/parameter.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import parameterQueries from "@tepian-k3/queries/parameter.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";

export const parameterRouter = createTRPCRouter({
  getOffsetPaginatedParametersByClusterIdAndCategoryId: publicProcedure
    .input(parameterSchema.getByClusterAndParameterCategorySchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        parameterQueries.getOffsetPaginatedParametersByClusterIdAndCategoryId(
          input
        )
      );

      return { data, pageCount };
    }),

  getPaginatedParameters: withPermission("parameters.read")
    .input(parameterSchema.getAllParametersSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
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
      const parameter = await runEffect(
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
        await runEffect(parameterQueries.createParameter(input))
    ),

  updateParameter: withPermission("parameters.update")
    .input(parameterSchema.updateParameterSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(parameterQueries.updateParameter(input))
    ),

  deleteParameter: withPermission("parameters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(parameterQueries.deleteParameter(input.id))
    ),

  restoreParameter: withPermission("parameters.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(parameterQueries.restoreParameter(input.id))
    ),
});
