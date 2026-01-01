import kbliSchema from "@tepian-k3/schema/kbli.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import { Effect } from "effect";
import kbliQueries from "@tepian-k3/queries/kbli.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const kbliRouter = createTRPCRouter({
  getAllKblis: publicProcedure.query(
    async () => await Effect.runPromise(kbliQueries.getAllKblis())
  ),

  getPaginatedKblis: withPermission("kbli.read")
    .input(kbliSchema.getAllKBLISchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        kbliQueries.getOffsetPaginatedKblis(input)
      );

      return { data, pageCount };
    }),

  getKbliById: withPermission("kbli.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const kbli = await Effect.runPromise(kbliQueries.getKbliById(input.id));

      if (!kbli) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kbli tidak ditemukan",
        });
      }

      return kbli;
    }),

  createKbli: withPermission("kbli.create")
    .input(kbliSchema.createKBLISchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(kbliQueries.createKbli(input))
    ),

  updateKbli: withPermission("kbli.update")
    .input(kbliSchema.updateKBLISchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(kbliQueries.updateKbli(input))
    ),

  deleteKbli: withPermission("kbli.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(kbliQueries.deleteKbli(input.id))
    ),

  restoreKbli: withPermission("kbli.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(kbliQueries.restoreKbli(input.id))
    ),
});
