import toolCodeSchema from "@tepian-k3/schema/pengujian/tool-code.schema";
import { createTRPCRouter, withPermission } from "../..";
import toolCodeQueries from "@tepian-k3/queries/pengujian/tool-code.queries";
import z from "zod";
import { runEffect } from "../../utils/run-effect";

export const toolCodeRouter = createTRPCRouter({
  getAllFlattenedToolCodes: withPermission("tool-codes.view").query(
    async () => await runEffect(toolCodeQueries.getAllFlattenedToolCodes()),
  ),

  getPaginatedToolCodes: withPermission("tool-codes.view")
    .input(toolCodeSchema.getAllToolCodesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        toolCodeQueries.getAllPaginatedToolCodes(input),
      );

      return { data, pageCount };
    }),

  getToolCodeById: withPermission("tool-codes.read")
    .input(z.object({ id: z.uuidv7() }))
    .query(async ({ input }) =>
      runEffect(toolCodeQueries.getToolCodeById(input.id)),
    ),

  createToolCode: withPermission("tool-codes.create")
    .input(toolCodeSchema.createToolCodeSchema)
    .mutation(async ({ input }) =>
      runEffect(toolCodeQueries.createToolCode(input)),
    ),

  updateToolCode: withPermission("tool-codes.update")
    .input(toolCodeSchema.updateToolCodeSchema)
    .mutation(async ({ input }) =>
      runEffect(toolCodeQueries.updateToolCode(input)),
    ),

  deleteToolCode: withPermission("tool-codes.delete")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(async ({ input }) =>
      runEffect(toolCodeQueries.deleteToolCode(input.id)),
    ),

  restoreToolCode: withPermission("tool-codes.delete")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(async ({ input }) =>
      runEffect(toolCodeQueries.restoreToolCode(input.id)),
    ),

  hardDeleteToolCode: withPermission("tool-codes.delete")
    .input(z.object({ id: z.uuidv7() }))
    .mutation(async ({ input }) =>
      runEffect(toolCodeQueries.hardDeleteToolCode(input.id)),
    ),
});
