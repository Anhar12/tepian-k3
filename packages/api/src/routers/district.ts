import districtSchema from "@tepian-k3/schema/district.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import { Effect } from "effect";
import districtQueries from "@tepian-k3/queries/district.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const districtRouter = createTRPCRouter({
  getAllDistricts: publicProcedure.query(
    async () => await Effect.runPromise(districtQueries.getAllDistricts())
  ),

  getAllDistrictsByRegencyId: publicProcedure
    .input(
      z.object({
        regencyId: z.uuidv7(),
      })
    )
    .query(
      async ({ input }) =>
        await Effect.runPromise(
          districtQueries.getAllDistrictsByRegencyId(input.regencyId)
        )
    ),

  getPaginatedDistricts: withPermission("district.read")
    .input(districtSchema.getAllDistrictsSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        districtQueries.getOffsetPaginatedDistricts(input)
      );

      return { data, pageCount };
    }),

  getDistrictById: withPermission("district.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const district = await Effect.runPromise(
        districtQueries.getDistrictById(input.id)
      );

      if (!district) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "District tidak ditemukan",
        });
      }

      return district;
    }),

  createDistrict: withPermission("district.create")
    .input(districtSchema.createDistrictSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(districtQueries.createDistrict(input))
    ),

  updateDistrict: withPermission("district.update")
    .input(districtSchema.updateDistrictSchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(districtQueries.updateDistrict(input))
    ),

  deleteDistrict: withPermission("district.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(districtQueries.deleteDistrict(input.id))
    ),

  restoreDistrict: withPermission("district.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(districtQueries.restoreDistrict(input.id))
    ),
});
