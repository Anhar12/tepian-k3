import provinceSchema from "@tepian-k3/schema/province.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import { Effect } from "effect";
import provinceQueries from "@tepian-k3/queries/province.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const provinceRouter = createTRPCRouter({
  getAllProvinces: publicProcedure.query(
    async () => await Effect.runPromise(provinceQueries.getAllProvinces())
  ),

  getPaginatedProvinces: withPermission("provinces.read")
    .input(provinceSchema.getAllProvincesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        provinceQueries.getOffsetPaginatedProvince(input)
      );

      return { data, pageCount };
    }),

  getProvinceById: withPermission("provinces.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const province = await Effect.runPromise(
        provinceQueries.getProvinceById(input.id)
      );

      if (!province) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Province tidak ditemukan",
        });
      }

      return province;
    }),

  createProvince: withPermission("provinces.create")
    .input(provinceSchema.createProvinceSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(provinceQueries.createProvince(input))
    ),

  updateProvince: withPermission("provinces.update")
    .input(provinceSchema.updateProvinceSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(provinceQueries.updateProvince(input))
    ),

  deleteProvince: withPermission("provinces.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(provinceQueries.deleteProvince(input.id))
    ),

  restoreProvince: withPermission("provinces.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(provinceQueries.restoreProvince(input.id))
    ),
});
