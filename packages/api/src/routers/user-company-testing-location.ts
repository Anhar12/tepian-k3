import userCompanyTestingLocationSchema from "@tepian-k3/schema/user-company-testing-location.schema";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  withPermission,
} from "..";
import userCompanyTestingLocationQueries from "@tepian-k3/queries/user-company-testing-location.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { runEffect } from "../utils/run-effect";

export const userCompanyTestingLocationRouter = createTRPCRouter({
  getAllUserCompanyTestingLocations: publicProcedure.query(
    async () =>
      await runEffect(
        userCompanyTestingLocationQueries.getAllUserCompanyTestingLocations()
      )
  ),

  getAllUserCompanyTestingLocationsByCompanyIdAndUserId: protectedProcedure
    .input(
      z.object({
        companyId: z.uuidv7(),
        showDeleted: z.boolean().optional(),
      })
    )
    .query(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyTestingLocationQueries.getAllUserCompanyTestingLocationsByCompanyIdAndUserId(
            input.companyId,
            user.id,
            input.showDeleted ?? false
          )
        )
    ),

  getPaginatedUserCompanyTestingLocations: withPermission(
    "user-company-testing-location.view"
  )
    .input(
      userCompanyTestingLocationSchema.getAllUserCompanyTestingLocationSchema
    )
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        userCompanyTestingLocationQueries.getOffsetPaginationUserCompanyTestingLocations(
          input
        )
      );

      return { data, pageCount };
    }),

  getUserCompanyTestingLocationByUserIdAndCompanyId: withPermission(
    "user-company-testing-location.view"
  )
    .input(
      z.object({
        companyId: z.uuidv7(),
      })
    )
    .query(async ({ input, ctx: { user } }) => {
      const userCompanyTestingLocation = await runEffect(
        userCompanyTestingLocationQueries.getUserCompanyTestingLocationByUserIdAndCompanyId(
          user.id,
          input.companyId
        )
      );

      return userCompanyTestingLocation;
    }),

  getUserCompanyTestingLocationById: withPermission(
    "user-company-testing-location.view"
  )
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const userCompanyTestingLocation = await runEffect(
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

  userCreateUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.create"
  )
    .input(
      userCompanyTestingLocationSchema.createUserCompanyTestingLocationSchema
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyTestingLocationQueries.userCreateUserCompanyTestingLocation(
            user.id,
            input
          )
        )
    ),

  userUpdateUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.update"
  )
    .input(
      userCompanyTestingLocationSchema.updateUserCompanyTestingLocationSchema
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyTestingLocationQueries.userUpdateUserCompanyTestingLocation(
            user.id,
            input
          )
        )
    ),

  userDeleteUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.delete"
  )
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyTestingLocationQueries.userDeleteUserCompanyTestingLocation(
            user.id,
            input.id
          )
        )
    ),

  userRestoreUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.delete"
  )
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyTestingLocationQueries.userRestoreUserCompanyTestingLocation(
            user.id,
            input.id
          )
        )
    ),
});
