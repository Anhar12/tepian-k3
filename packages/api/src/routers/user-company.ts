import userCompanySchema from "@tepian-k3/schema/user-company.schema";
import { createTRPCRouter, publicProcedure, withPermission } from "..";
import { Effect } from "effect";
import userCompanyQueries from "@tepian-k3/queries/user-company.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";

export const userCompanyRouter = createTRPCRouter({
  getAllUserCompanies: publicProcedure.query(
    async () =>
      await Effect.runPromise(userCompanyQueries.getAllUserCompanies())
  ),

  getPaginatedUserCompaniesByUserId: withPermission("user-company.create")
    .input(userCompanySchema.getAllUserCompaniesSchema)
    .query(async ({ input, ctx: { user } }) => {
      const { data, pageCount } = await Effect.runPromise(
        userCompanyQueries.getOffsetPaginatedUserCompaniesByUserId(
          user.id,
          input
        )
      );

      return { data, pageCount };
    }),

  getPaginatedUserCompanies: withPermission("user-company.read")
    .input(userCompanySchema.getAllUserCompaniesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await Effect.runPromise(
        userCompanyQueries.getOffsetPaginatedUserCompanies(input)
      );

      return { data, pageCount };
    }),

  getUserCompanyById: withPermission("user-company.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input }) => {
      const userCompany = await Effect.runPromise(
        userCompanyQueries.getUserCompanyById(input.id)
      );

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "UserCompany tidak ditemukan",
        });
      }

      return userCompany;
    }),

  getUserCompanyByIdAndUserId: withPermission("user-company.read")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input, ctx: { user } }) => {
      const userCompany = await Effect.runPromise(
        userCompanyQueries.getUserCompanyDetailsByUserIdAndId(user.id, input.id)
      );

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perusahaan tidak ditemukan",
        });
      }

      return userCompany;
    }),

  userCreateUserCompany: withPermission("user-company.create")
    .input(userCompanySchema.createUserCompanySchema)
    .mutation(
      async ({ input, ctx: { user } }) =>
        await Effect.runPromise(
          userCompanyQueries.userCreateUserCompany(user.id, input)
        )
    ),

  userUpdateUserCompany: withPermission("user-company.update")
    .input(userCompanySchema.updateUserCompanySchema)
    .mutation(
      async ({ input, ctx: { user } }) =>
        await Effect.runPromise(
          userCompanyQueries.userUpdateUserCompany(user.id, input)
        )
    ),

  userDeleteUserCompany: withPermission("user-company.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await Effect.runPromise(
          userCompanyQueries.userDeleteUserCompany(user.id, input.id)
        )
    ),

  userRestoreUserCompany: withPermission("user-company.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await Effect.runPromise(
          userCompanyQueries.userRestoreUserCompany(user.id, input.id)
        )
    ),
});
