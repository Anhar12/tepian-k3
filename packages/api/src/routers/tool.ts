import toolsSchema from "@tepian-k3/schema/tools.schema";
import { createTRPCRouter, withPermission } from "..";
import toolsQureies from "@tepian-k3/queries/tools.queries";
import z from "zod";
import { runEffect } from "../utils/run-effect";

export const toolRouter = createTRPCRouter({
  getAllUnassignedTools: withPermission("tools.view").query(
    async () => await runEffect(toolsQureies.getAllUnassignedTools())
  ),

  getToolPaginated: withPermission("tools.view")
    .input(toolsSchema.getAllToolsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        toolsQureies.getOffsetPaginatedTools(input)
      );

      return { data, pageCount };
    }),

  getToolDetails: withPermission("tools.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) => await runEffect(toolsQureies.getToolById(input.id))
    ),

  createTool: withPermission("tools.create")
    .input(toolsSchema.createToolSchema)
    .mutation(
      async ({ input }) => await runEffect(toolsQureies.createTool(input))
    ),

  updateTool: withPermission("tools.update")
    .input(toolsSchema.updateToolSchema)
    .mutation(
      async ({ input }) => await runEffect(toolsQureies.updateTool(input))
    ),

  deleteTool: withPermission("tools.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) => await runEffect(toolsQureies.deleteTool(input.id))
    ),

  restoreTool: withPermission("tools.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) => await runEffect(toolsQureies.restoreTool(input.id))
    ),
});
