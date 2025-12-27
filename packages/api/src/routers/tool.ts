import toolsSchema from "@tepian-k3/schema/tools.schema";
import { createTRPCRouter, withPermission } from "..";
import { Effect } from "effect";
import toolsQureies from "@tepian-k3/queries/tools.queries";
import z from "zod";

export const toolRouter = createTRPCRouter({
  getToolPaginated: withPermission("tools.read")
    .input(toolsSchema.getAllToolsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
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
      async ({ input }) =>
        await Effect.runPromise(toolsQureies.getToolById(input.id))
    ),

  createTool: withPermission("tools.create")
    .input(toolsSchema.createToolSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(toolsQureies.createTool(input))
    ),

  updateTool: withPermission("tools.update")
    .input(toolsSchema.updateToolSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(toolsQureies.updateTool(input))
    ),

  deleteTool: withPermission("tools.delete")
    .input(
      z.object({
        id: z.string().uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(toolsQureies.deleteTool(input.id))
    ),

  restoreTool: withPermission("tools.delete")
    .input(
      z.object({
        id: z.string().uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(toolsQureies.restoreTool(input.id))
    ),
});
