import userCompanySchema from "@tepian-k3/schema/user-company.schema";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  withPermission,
  withProtectedRateLimit,
} from "..";
import userCompanyQueries from "@tepian-k3/queries/user-company.queries";
import z from "zod";
import { TRPCError } from "@trpc/server";
import {
  storageService,
  assertValidFileBuffer,
  ALLOWED_MIME_TYPES,
  FILE_SIZE_LIMITS,
  type UploadResult,
} from "@tepian-k3/services/storage";
import { runEffect } from "../utils/run-effect";
import { Effect } from "effect";
import { imageService } from "@tepian-k3/services/image";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";

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
          // convert file to buffer
          const arrayBuffer = yield* Effect.tryPromise(() =>
            ctx.input.data.picture.arrayBuffer(),
          );

          const buffer = Buffer.from(arrayBuffer);

          // Validate image file
          yield* Effect.tryPromise(() =>
            assertValidFileBuffer(
              buffer,
              ctx.input.data.picture.name,
              ctx.input.data.picture.type,
              {
                maxSize: FILE_SIZE_LIMITS.IMAGE,
                allowedMimeTypes: ALLOWED_MIME_TYPES.IMAGE,
              },
            ),
          );

          const convertedImage = yield* imageService.convertToWebP(buffer, {
            quality: 80,
            effort: 4,
            filename: ctx.input.data.picture.name,
          });

          const uploadedFile = yield* storageService.upload(
            convertedImage.buffer,
            {
              filename: convertedImage.filename!,
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
          let uploadedFile: UploadResult | null = null;

          if (input.data.picture && input.data.picture !== undefined) {
            // convert file to buffer
            const arrayBuffer = yield* Effect.tryPromise(() =>
              input.data.picture!.arrayBuffer(),
            );

            const buffer = Buffer.from(arrayBuffer);

            // Validate image file
            yield* Effect.tryPromise(() =>
              assertValidFileBuffer(
                buffer,
                input.data.picture!.name,
                input.data.picture!.type,
                {
                  maxSize: FILE_SIZE_LIMITS.IMAGE,
                  allowedMimeTypes: ALLOWED_MIME_TYPES.IMAGE,
                },
              ),
            );

            const convertedImage = yield* imageService.convertToWebP(buffer, {
              quality: 80,
              effort: 4,
              filename: input.data.picture.name,
            });

            uploadedFile = yield* storageService.upload(convertedImage.buffer, {
              filename: convertedImage.filename!,
              folder: "company-pictures",
            });
          }

          const result = yield* userCompanyQueries.userUpdateUserCompany(
            user.id,
            input.data,
            uploadedFile?.key,
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
});
