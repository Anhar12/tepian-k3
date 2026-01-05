import authSchema from "@tepian-k3/schema/auth.schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "..";
import usersQueries from "@tepian-k3/queries/users.queries";
import { TRPCError } from "@trpc/server";
import { verify } from "@node-rs/argon2";
import { encrypt } from "@tepian-k3/auth";
import userSchema from "@tepian-k3/schema/users.schema";
import otpSchema from "@tepian-k3/schema/otp.schema";
import { OTPService } from "@tepian-k3/auth/services/otp";
import { Effect } from "effect";
import permissionQueries from "@tepian-k3/queries/permission.queries";
import { storageService } from "@tepian-k3/services/storage";
import z from "zod";
import { PasswordResetService } from "@tepian-k3/auth/services/password-reset";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(authSchema.loginSchema)
    .mutation(async ({ input }) => {
      return Effect.runPromise(
        Effect.gen(function* () {
          const user = yield* usersQueries.getUserByEmail(input.email);

          const verifyPasswordResult = yield* Effect.tryPromise({
            try: () => verify(user.password, input.password),
            catch: (error) =>
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memverifikasi password.",
                cause: error,
              }),
          });

          if (!verifyPasswordResult) {
            return yield* Effect.fail(
              new TRPCError({
                code: "UNAUTHORIZED",
                message: "Username atau password salah.",
              })
            );
          }

          if (!user.emailVerified) {
            return yield* Effect.fail(
              new TRPCError({
                code: "FORBIDDEN",
                message: "Email belum terverifikasi.",
              })
            );
          }

          const permission = yield* permissionQueries.getUserWithPermissions(
            user.id
          );

          const token = yield* Effect.tryPromise({
            try: () =>
              encrypt({
                id: user.id,
                email: user.email,
                roles: permission?.roles.map((role) => role.name) || [],
                permissions: permission?.permissions || [],
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
                iat: Math.floor(Date.now() / 1000),
                jti: user.id,
              }),
            catch: (error) =>
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat token.",
                cause: error,
              }),
          });

          return {
            token,
            user: {
              ...permission,
              password: undefined,
            },
          };
        })
      );
    }),

  register: publicProcedure
    .input(userSchema.createUserSchema)
    .mutation(async ({ input }) => {
      return Effect.runPromise(usersQueries.createUser(input));
    }),

  sendOTP: publicProcedure
    .input(otpSchema.createOtpSchema)
    .mutation(async ({ input }) => {
      const result = await OTPService.createOTP(input);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  resendOTP: publicProcedure
    .input(otpSchema.createOtpSchema)
    .mutation(async ({ input }) => {
      const result = await OTPService.resendOTP(input);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  verifyOTP: publicProcedure
    .input(otpSchema.verifyOtpSchema)
    .mutation(async ({ input }) => {
      const result = await OTPService.verifyOTP(input);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  requestPasswordReset: publicProcedure
    .input(
      z.object({
        email: z.email(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await Effect.runPromise(
        PasswordResetService.requestReset(input.email)
      );

      if (!result.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  verifyResetToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const result = await Effect.runPromise(
        PasswordResetService.verifyResetToken(input.token)
      );

      if (!result.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await Effect.runPromise(
      permissionQueries.getUserWithPermissions(ctx.user.id)
    );

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pengguna tidak ditemukan",
      });
    }

    return {
      ...user,
      profilePictureUrl: user.profilePictureUrl
        ? storageService.getPublicUrl(user.profilePictureUrl)
        : null,
    };
  }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z
          .string()
          .min(8, "Password harus terdiri dari minimal 8 karakter"),
      })
    )
    .mutation(async ({ input }) => {
      const result = await Effect.runPromise(
        PasswordResetService.resetPassword(input.token, input.newPassword)
      );

      if (!result.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    const user = await Effect.runPromise(
      permissionQueries.getUserWithPermissions(ctx.user.id)
    );

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pengguna tidak ditemukan",
      });
    }

    return {
      ...user,
      profilePictureUrl: user.profilePictureUrl
        ? storageService.getPublicUrl(user.profilePictureUrl)
        : null,
    };
  }),
});
