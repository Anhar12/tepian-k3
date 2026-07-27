import userCompanySchema from "@tepian-k3/schema/pengujian/user-company.schema";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  withPermission,
  withProtectedRateLimit,
} from "../..";
import userCompanyQueries from "@tepian-k3/queries/pengujian/user-company.queries";
import auditQueries from "@tepian-k3/queries/platform/audit.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { storageService } from "@tepian-k3/services/storage";
import { runEffect } from "../../utils/run-effect";
import { Effect } from "effect";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import {
  processAndUploadImage,
  processAndUploadImageIfPresent,
} from "../../utils/image-upload";

export const userCompanyRouter = createTRPCRouter({
  getAllUserCompaniesByUserId: withProtectedRateLimit(
    rateLimiters.moderate(),
  ).query(
    async ({ ctx: { user } }) =>
      await runEffect(userCompanyQueries.getAllUserCompaniesByUserId(user.id)),
  ),

  getPaginatedUserCompaniesByUserId: withProtectedRateLimit(
    rateLimiters.moderate(),
  )
    .input(userCompanySchema.getAllUserCompaniesSchema)
    .query(async ({ input, ctx: { user } }) => {
      const { data, pageCount } = await runEffect(
        userCompanyQueries.getOffsetPaginatedUserCompaniesByUserId(
          user.id,
          input,
        ),
      );

      return { data, pageCount };
    }),

  getPaginatedUserCompanies: withPermission("user-company.view")
    .input(userCompanySchema.getAllUserCompaniesSchema)
    .query(async ({ input }) => {
      const { data, pageCount } = await runEffect(
        userCompanyQueries.getOffsetPaginatedUserCompanies(input),
      );

      return { data, pageCount };
    }),

  getUserCompanyById: withPermission("user-company.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const userCompany = await runEffect(
        userCompanyQueries.getUserCompanyById(input.id),
      );

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "UserCompany tidak ditemukan",
        });
      }

      return userCompany;
    }),

  getUnmaskedUserCompanyById: withPermission("user-company.read")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input, ctx: { user } }) => {
      const userCompany = await runEffect(
        userCompanyQueries.getUserCompanyById(input.id, { unmask: true }),
      );

      if (!userCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "UserCompany tidak ditemukan",
        });
      }

      await runEffect(
        auditQueries.createAuditLog({
          userId: user.id,
          action: "read",
          entityType: "user_company",
          entityId: input.id,
          metadata: {
            reason: "User requested unmasked sensitive data",
          },
        }),
      );

      return {
        ...userCompany,
        companyPictureUrl: userCompany.companyPictureUrl
          ? storageService.getPublicUrl(userCompany.companyPictureUrl)
          : null,
      };
    }),

  getUserCompanyByIdAndUserId: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .query(async ({ input, ctx: { user } }) => {
      const userCompany = await runEffect(
        userCompanyQueries.getUserCompanyDetailsByUserIdAndId(
          user.id,
          input.id,
        ),
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

  userCreateUserCompany: withProtectedRateLimit(rateLimiters.moderate())
    .input(formDataInput)
    .use(formDataProcedure(userCompanySchema.createUserCompanySchema))
    .mutation(async ({ ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const uploadedFile = yield* processAndUploadImage(
            ctx.input.data.picture,
            {
              folder: "company-pictures",
            },
          );

          const result = yield* userCompanyQueries.userCreateUserCompany(
            ctx.user.id,
            ctx.input.data,
            uploadedFile.key,
          );

          return result;
        }),
      ),
    ),

  userUpdateUserCompany: withProtectedRateLimit(rateLimiters.moderate())
    .input(formDataInput)
    .use(formDataProcedure(userCompanySchema.updateUserCompanySchema))
    .mutation(async ({ ctx: { user, input } }) =>
      runEffect(
        Effect.gen(function* () {
          const uploadedFile = yield* processAndUploadImageIfPresent(
            input.data.picture,
            {
              folder: "company-pictures",
            },
          );

          const result = yield* userCompanyQueries.userUpdateUserCompany(
            user.id,
            input.data,
            uploadedFile,
          );

          return result;
        }),
      ),
    ),

  userDeleteUserCompany: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyQueries.userDeleteUserCompany(user.id, input.id),
        ),
    ),

  userRestoreUserCompany: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input, ctx: { user } }) =>
        await runEffect(
          userCompanyQueries.userRestoreUserCompany(user.id, input.id),
        ),
    ),

  hardDeleteUserCompany: withPermission("user-company.delete")
    .input(
      z.object({
        id: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(userCompanyQueries.hardDeleteUserCompany(input.id)),
    ),
});
