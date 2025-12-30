import userCompanyTestingLocationSchema from "@tepian-k3/schema/user-company-testing-location.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import { Effect } from "effect";
import userCompanyTestingLocationQueries from "@tepian-k3/queries/user-company-testing-location.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const userCompanyTestingLocationRouter = createTRPCRouter({
  getAllUserCompanyTestingLocations: publicProcedure.query(
    async () =>
      await Effect.runPromise(
        userCompanyTestingLocationQueries.getAllUserCompanyTestingLocations()
      )
  ),

  getPaginatedUserCompanyTestingLocations: withPermission(
    "user-company-testing-location.read"
  )
    .input(
      userCompanyTestingLocationSchema.getAllUserCompanyTestingLocationSchema
    )
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        userCompanyTestingLocationQueries.getOffsetPaginationUserCompanyTestingLocations(
          input
        )
      );

      return { data, pageCount };
    }),

  getUserCompanyTestingLocationById: withPermission(
    "user-company-testing-location.read"
  )
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const userCompanyTestingLocation = await Effect.runPromise(
        userCompanyTestingLocationQueries.getUserCompanyTestingLocationById(
          input.id
        )
      );

      if (!userCompanyTestingLocation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "UserCompanyTestingLocation tidak ditemukan",
        });
      }

      return userCompanyTestingLocation;
    }),

  createUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.create"
  )
    .input(
      userCompanyTestingLocationSchema.createUserCompanyTestingLocationSchema
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          userCompanyTestingLocationQueries.createUserCompanyTestingLocation(
            input
          )
        )
    ),

  updateUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.update"
  )
    .input(
      userCompanyTestingLocationSchema.updateUserCompanyTestingLocationSchema
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          userCompanyTestingLocationQueries.updateUserCompanyTestingLocation(
            input
          )
        )
    ),

  deleteUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.delete"
  )
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          userCompanyTestingLocationQueries.deleteUserCompanyTestingLocation(
            input.id
          )
        )
    ),

  restoreUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.delete"
  )
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(
          userCompanyTestingLocationQueries.restoreUserCompanyTestingLocation(
            input.id
          )
        )
    ),
});
