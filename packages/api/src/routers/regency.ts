import regencySchema from "@tepian-k3/schema/regency.schema";
import { createTRPCRouter, withPermission, withRateLimit } from "..";
import regencyQueries from "@tepian-k3/queries/regency.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

export const regencyRouter = createTRPCRouter({
  getAllRegencies: withRateLimit(rateLimiters.moderate()).query(
    async () => await runEffect(regencyQueries.getAllRegencies()),
  ),

  getAllRegenciesByProvinceId: withRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        provinceId: z.uuidv7(),
      }),
    )
    .query(
      async ({ input }) =>
        await runEffect(
          regencyQueries.getAllRegenciesByProvinceId(input.provinceId),
        ),
    ),

  getPaginatedRegencies: withPermission("regency.view")
    .input(regencySchema.getAllRegenciesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        regencyQueries.getOffsetPaginationRegencies(input),
      );

      return { data, pageCount };
    }),

  getRegencyById: withPermission("regency.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const regency = await runEffect(regencyQueries.getRegencyById(input.id));

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
      async ({ input }) => await runEffect(regencyQueries.createRegency(input)),
    ),

  updateRegency: withPermission("regency.update")
    .input(regencySchema.updateRegencySchema)
    .mutation(
      async ({ input }) => await runEffect(regencyQueries.updateRegency(input)),
    ),

  deleteRegency: withPermission("regency.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(regencyQueries.deleteRegency(input.id)),
    ),

  restoreRegency: withPermission("regency.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(regencyQueries.restoreRegency(input.id)),
    ),
});
