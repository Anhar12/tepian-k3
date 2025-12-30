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

  createUserCompany: withPermission("user-company.create")
    .input(userCompanySchema.createUserCompanySchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(userCompanyQueries.createUserCompany(input))
    ),

  updateUserCompany: withPermission("user-company.update")
    .input(userCompanySchema.updateUserCompanySchema)
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(userCompanyQueries.updateUserCompany(input))
    ),

  deleteUserCompany: withPermission("user-company.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(userCompanyQueries.deleteUserCompany(input.id))
    ),

  restoreUserCompany: withPermission("user-company.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input }) =>
        await Effect.runPromise(userCompanyQueries.restoreUserCompany(input.id))
    ),
});
