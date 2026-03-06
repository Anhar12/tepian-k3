import positionSchema from "@tepian-k3/schema/platform/position.schema";
import { createTRPCRouter, withPermission } from "../..";
import positionQueries from "@tepian-k3/queries/platform/position.queries";
import z from "zod";
import { runEffect } from "../../utils/run-effect";

export const positionRouter = createTRPCRouter({
  getAll: withPermission("positions.view").query(
    async () => await runEffect(positionQueries.getAllPositions()),
  ),

  getPositionPaginated: withPermission("positions.view")
    .input(positionSchema.getAllPositionsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        positionQueries.getOffsetPaginatedPositions(input),
      );

      return { data, pageCount };
    }),

  getPositionDetails: withPermission("positions.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(positionQueries.getPositionById(input.id)),
    ),

  createPosition: withPermission("positions.create")
    .input(positionSchema.createPositionSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(positionQueries.createPosition(input)),
    ),

  updatePosition: withPermission("positions.update")
    .input(positionSchema.updatePositionSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(positionQueries.updatePosition(input)),
    ),

  deletePosition: withPermission("positions.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(positionQueries.deletePosition(input.id)),
    ),

  restorePosition: withPermission("positions.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(positionQueries.restorePosition(input.id)),
    ),
});
