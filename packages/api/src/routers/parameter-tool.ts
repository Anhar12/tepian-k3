import parameterToolSchema from "@tepian-k3/schema/parameter-tool.schema";
import { createTRPCRouter, withPermission } from "..";
import parameterToolQueries from "@tepian-k3/queries/parameter-tool.queries";
import z from "zod";
import { runEffect } from "../utils/run-effect";

export const parameterToolRouter = createTRPCRouter({
  getAllParameterToolsByParameterId: withPermission("parameter-tool.view")
    .input(
      z.object({
        parameterId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          parameterToolQueries.getAllToolsByParameterId(input.parameterId),
        ),
    ),

  getParameterToolById: withPermission("parameter-tool.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(parameterToolQueries.getParameterToolById(input.id)),
    ),

  assignToolsToParameter: withPermission("parameter-tool.create")
    .input(parameterToolSchema.createParameterToolSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(parameterToolQueries.assignToolToParameter(input)),
    ),

  updateParameterTool: withPermission("parameter-tool.update")
    .input(parameterToolSchema.updateParameterToolSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(parameterToolQueries.updateParameterTool(input)),
    ),

  deleteParameterTool: withPermission("parameter-tool.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(parameterToolQueries.removeToolFromParameter(input.id)),
    ),
});
