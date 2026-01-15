import provinceSchema from "@tepian-k3/schema/province.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import provinceQueries from "@tepian-k3/queries/province.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";

export const provinceRouter = createTRPCRouter({
  getAllProvinces: publicProcedure.query(
    async () => await runEffect(provinceQueries.getAllProvinces())
  ),

  getPaginatedProvinces: withPermission("provinces.view")
    .input(provinceSchema.getAllProvincesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
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
      const province = await runEffect(
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
        await runEffect(provinceQueries.createProvince(input))
    ),

  updateProvince: withPermission("provinces.update")
    .input(provinceSchema.updateProvinceSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(provinceQueries.updateProvince(input))
    ),

  deleteProvince: withPermission("provinces.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(provinceQueries.deleteProvince(input.id))
    ),

  restoreProvince: withPermission("provinces.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await runEffect(provinceQueries.restoreProvince(input.id))
    ),
});
