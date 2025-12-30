import regencySchema from "@tepian-k3/schema/regency.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import { Effect } from "effect";
import regencyQueries from "@tepian-k3/queries/regency.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const regencyRouter = createTRPCRouter({
  getAllRegencies: publicProcedure.query(
    async () => await Effect.runPromise(regencyQueries.getAllRegencies())
  ),

  getPaginatedRegencies: withPermission("regency.read")
    .input(regencySchema.getAllRegenciesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        regencyQueries.getOffsetPaginationRegencies(input)
      );

      return { data, pageCount };
    }),

  getRegencyById: withPermission("regency.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const regency = await Effect.runPromise(
        regencyQueries.getRegencyById(input.id)
      );

      if (!regency) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "District tidak ditemukan",
        });
      }

      return regency;
    }),

  createRegency: withPermission("regency.create")
    .input(regencySchema.createRegencySchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(regencyQueries.createRegency(input))
    ),

  updateRegency: withPermission("regency.update")
    .input(regencySchema.updateRegencySchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(regencyQueries.updateRegency(input))
    ),

  deleteRegency: withPermission("regency.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(regencyQueries.deleteRegency(input.id))
    ),

  restoreRegency: withPermission("regency.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(regencyQueries.restoreRegency(input.id))
    ),
});
