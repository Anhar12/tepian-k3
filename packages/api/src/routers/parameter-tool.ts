import parameterToolSchema from "@tepian-k3/schema/parameter-tool.schema";
import { createTRPCRouter, withPermission } from "..";
import { Effect } from "effect";
import parameterToolQueries from "@tepian-k3/queries/parameter-tool.queries";
import z from "zod";

export const parameterToolRouter = createTRPCRouter({
  getAllParameterToolsByParameterId: withPermission("parameter-tools.read")
    .input(
      z.object({
        parameterId: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await Effect.runPromise(
          parameterToolQueries.getAllToolsByParameterId(input.parameterId)
        )
    ),

  getParameterToolById: withPermission("parameter-tools.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await Effect.runPromise(
          parameterToolQueries.getParameterToolById(input.id)
        )
    ),

  assignToolsToParameter: withPermission("parameter-tools.create")
    .input(parameterToolSchema.createParameterToolSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          parameterToolQueries.assignToolToParameter(input)
        )
    ),

  updateParameterTool: withPermission("parameter-tools.update")
    .input(parameterToolSchema.updateParameterToolSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(parameterToolQueries.updateParameterTool(input))
    ),

  deleteParameterTool: withPermission("parameter-tools.delete")
    .input(
      z.object({
        id: z.string().uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          parameterToolQueries.removeToolFromParameter(input.id)
        )
    ),
});
