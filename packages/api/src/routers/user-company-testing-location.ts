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

  getAllUserCompanyTestingLocationsByCompanyIdAndUserId: withPermission(
    "user-company-testing-location.read"
  )
    .input(
      z.object({
        companyId: z.string().uuidv7(),
        showDeleted: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx: { user } }) => {
      return await Effect.runPromise(
        userCompanyTestingLocationQueries.getAllUserCompanyTestingLocationsByCompanyIdAndUserId(
          input.companyId,
          user.id,
          input.showDeleted ?? false
        )
      );
    }),

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

  userCreateUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.create"
  )
    .input(
      userCompanyTestingLocationSchema.createUserCompanyTestingLocationSchema
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await Effect.runPromise(
          userCompanyTestingLocationQueries.userCreateUserCompanyTestingLocation(
            user.id,
            input
          )
        )
    ),

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

  userUpdateUserCompanyTestingLocation: withPermission(
    "user-company-testing-location.update"
  )
    .input(
      userCompanyTestingLocationSchema.updateUserCompanyTestingLocationSchema
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await Effect.runPromise(
          userCompanyTestingLocationQueries.userUpdateUserCompanyTestingLocation(
            user.id,
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
        await Effect.runPromise(
          userCompanyTestingLocationQueries.userDeleteUserCompanyTestingLocation(
            user.id,
            input.id
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
        await Effect.runPromise(
          userCompanyTestingLocationQueries.userRestoreUserCompanyTestingLocation(
            user.id,
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
