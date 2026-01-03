import userCompanySchema from "@tepian-k3/schema/user-company.schema";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  protectedProcedure,
  publicProcedure,
  withPermission,
} from "..";
import userCompanyQueries from "@tepian-k3/queries/user-company.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { storageService, type UploadResult } from "@tepian-k3/services/storage";
import { runEffect } from "../utils/run-effect";
import { Effect } from "effect";

export const userCompanyRouter = createTRPCRouter({
  getAllUserCompanies: publicProcedure.query(
    async () => await runEffect(userCompanyQueries.getAllUserCompanies())
  ),

  getPaginatedUserCompaniesByUserId: protectedProcedure
    .input(userCompanySchema.getAllUserCompaniesSchema)
    .query(async ({ input, ctx: { user } }) => {
      const { data, pageCount } = await runEffect(
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
      const { data, pageCount } = await runEffect(
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
      const userCompany = await runEffect(
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

  getUserCompanyByIdAndUserId: protectedProcedure
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .query(async ({ input, ctx: { user } }) => {
      const userCompany = await runEffect(
        userCompanyQueries.getUserCompanyDetailsByUserIdAndId(user.id, input.id)
      );

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perusahaan tidak ditemukan",
        });
      }

      return {
        ...userCompany,
        companyPictureUrl: userCompany.companyPictureUrl
          ? storageService.getPublicUrl(userCompany.companyPictureUrl)
          : null,
      };
    }),

  userCreateUserCompany: protectedProcedure
    .input(formDataInput)
    .use(formDataProcedure(userCompanySchema.createUserCompanySchema))
    .mutation(async ({ ctx }) =>
      runEffect(
        Effect.gen(function* () {
          // convert file to buffer
          const arrayBuffer = yield* Effect.tryPromise(() =>
            ctx.input.data.picture.arrayBuffer()
          );

          const buffer = Buffer.from(arrayBuffer);

          const uploadedFile = yield* storageService.upload(buffer, {
            filename: ctx.input.data.picture.name,
            folder: "company-pictures",
          });

          const result = yield* userCompanyQueries.userCreateUserCompany(
            ctx.user.id,
            ctx.input.data,
            uploadedFile.filename,
            uploadedFile.key
          );

          return result;
        })
      )
    ),

  userUpdateUserCompany: protectedProcedure
    .input(formDataInput)
    .use(formDataProcedure(userCompanySchema.updateUserCompanySchema))
    .mutation(async ({ ctx: { user, input } }) =>
      runEffect(
        Effect.gen(function* () {
          let uploadedFile: UploadResult | null = null;

          if (input.data.picture && input.data.picture !== undefined) {
            // convert file to buffer
            const arrayBuffer = yield* Effect.tryPromise(() =>
              input.data.picture!.arrayBuffer()
            );

            const buffer = Buffer.from(arrayBuffer);

            uploadedFile = yield* storageService.upload(buffer, {
              filename: input.data.picture.name,
              folder: "company-pictures",
            });
          }

          const result = yield* userCompanyQueries.userUpdateUserCompany(
            user.id,
            input.data,
            uploadedFile?.filename,
            uploadedFile?.key
          );

          return result;
        })
      )
    ),

  userDeleteUserCompany: protectedProcedure
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyQueries.userDeleteUserCompany(user.id, input.id)
        )
    ),

  userRestoreUserCompany: protectedProcedure
    .input(
      z.object({
        id: z.uuidv7(),
      })
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyQueries.userRestoreUserCompany(user.id, input.id)
        )
    ),
});
