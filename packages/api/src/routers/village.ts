import villageSchema from "@tepian-k3/schema/village.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import { Effect } from "effect";
import villageQueries from "@tepian-k3/queries/village.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const villageRouter = createTRPCRouter({
  getAllVillages: publicProcedure.query(
    async () => await Effect.runPromise(villageQueries.getAllVillages())
  ),

  getPaginatedVillages: withPermission("village.read")
    .input(villageSchema.getAllVillagesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        villageQueries.getOffsetPaginationVillages(input)
      );

      return { data, pageCount };
    }),

  getVillageById: withPermission("village.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const village = await Effect.runPromise(
        villageQueries.getVillageById(input.id)
      );

      if (!village) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "District tidak ditemukan",
        });
      }

      return village;
    }),

  createVillage: withPermission("village.create")
    .input(villageSchema.createVillageSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(villageQueries.createVillage(input))
    ),

  updateVillage: withPermission("village.update")
    .input(villageSchema.updateVillageSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(villageQueries.updateVillage(input))
    ),

  deleteVillage: withPermission("village.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(villageQueries.deleteVillage(input.id))
    ),

  restoreVillage: withPermission("village.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(villageQueries.restoreVillage(input.id))
    ),
});
