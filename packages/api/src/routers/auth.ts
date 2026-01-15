import authSchema from "@tepian-k3/schema/auth.schema";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "..";
import usersQueries from "@tepian-k3/queries/users.queries";
import { TRPCError } from "@trpc/server";
import { verify } from "@node-rs/argon2";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "@tepian-k3/auth";
import userSchema from "@tepian-k3/schema/users.schema";
import otpSchema from "@tepian-k3/schema/otp.schema";
import { OTPService } from "@tepian-k3/auth/services/otp";
import { Effect } from "effect";
import permissionQueries from "@tepian-k3/queries/permission.queries";
import { storageService } from "@tepian-k3/services/storage";
import z from "zod";
import { PasswordResetService } from "@tepian-k3/auth/services/password-reset";
import { runEffect } from "../utils/run-effect";
import refreshTokensQueries from "@tepian-k3/queries/refresh-tokens.queries";
import { v7 as uuidv7 } from "uuid";

export const authRouter = createTRPCRouter({
  login: publicProcedure.input(authSchema.loginSchema).mutation(
    async ({ input, ctx }) =>
      await runEffect(
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

          // Create access token with short expiry
          const accessToken = yield* Effect.tryPromise({
            try: () =>
              createAccessToken({
                id: user.id,
                email: user.email,
                roles: permission?.roles.map((role) => role.name) || [],
                permissions: permission?.permissions || [],
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              }),
            catch: (error) =>
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat access token.",
                cause: error,
              }),
          });

          // Create refresh token with long expiry
          const sessionId = uuidv7();
          const refreshTokenJWT = yield* Effect.tryPromise({
            try: () =>
              createRefreshToken({
                id: user.id,
                sessionId,
                type: "refresh",
              }),
            catch: (error) =>
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat refresh token.",
                cause: error,
              }),
          });

          // Store refresh token in database
          const refreshTokenExpiry = new Date();
          refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days

          yield* refreshTokensQueries.createRefreshToken({
            userId: user.id,
            token: refreshTokenJWT,
            expiresAt: refreshTokenExpiry.toISOString(),
            deviceInfo: ctx.userAgent || undefined,
            ipAddress: ctx.ip || undefined,
            userAgent: ctx.userAgent || undefined,
          });

          return {
            accessToken,
            refreshToken: refreshTokenJWT,
            user: {
              ...permission,
              password: undefined,
            },
          };
        })
      )
  ),

  register: publicProcedure
    .input(userSchema.createUserSchema)
    .mutation(async ({ input }) => {
      return runEffect(usersQueries.createUser(input));
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
      const result = await runEffect(
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
      const result = await runEffect(
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
    const user = await runEffect(
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
      const result = await runEffect(
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

    const user = await runEffect(
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

  refresh: publicProcedure.input(authSchema.refreshTokenSchema).mutation(
    async ({ input, ctx }) =>
      await runEffect(
        Effect.gen(function* () {
          // Verify refresh token JWT
          yield* Effect.tryPromise({
            try: async () => {
              const result = await verifyRefreshToken(input.refreshToken);
              if (!result) {
                throw new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "Refresh token tidak valid.",
                });
              }
              return result;
            },
            catch: (error) =>
              error instanceof TRPCError
                ? error
                : new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Refresh token tidak valid.",
                    cause: error,
                  }),
          });

          // Validate refresh token in database
          const storedToken = yield* refreshTokensQueries.validateRefreshToken(
            input.refreshToken
          );

          if (!storedToken) {
            return yield* Effect.fail(
              new TRPCError({
                code: "UNAUTHORIZED",
                message: "Refresh token tidak valid atau telah kedaluwarsa.",
              })
            );
          }

          // Get user with permissions
          const permission = yield* permissionQueries.getUserWithPermissions(
            storedToken.userId
          );

          if (!permission) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Pengguna tidak ditemukan.",
              })
            );
          }

          // Create new access token
          const accessToken = yield* Effect.tryPromise({
            try: () =>
              createAccessToken({
                id: permission.id,
                email: permission.email,
                roles: permission.roles.map((role) => role.name),
                permissions: permission.permissions,
                createdAt: permission.createdAt,
                updatedAt: permission.updatedAt,
              }),
            catch: (error) =>
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat access token baru.",
                cause: error,
              }),
          });

          // Create new refresh token (rotation)
          const sessionId = uuidv7();
          const newRefreshTokenJWT = yield* Effect.tryPromise({
            try: () =>
              createRefreshToken({
                id: permission.id,
                sessionId,
                type: "refresh",
              }),
            catch: (error) =>
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat refresh token baru.",
                cause: error,
              }),
          });

          // Revoke old refresh token
          yield* refreshTokensQueries.revokeToken(input.refreshToken);

          // Store new refresh token
          const refreshTokenExpiry = new Date();
          refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30);

          yield* refreshTokensQueries.createRefreshToken({
            userId: permission.id,
            token: newRefreshTokenJWT,
            expiresAt: refreshTokenExpiry.toISOString(),
            deviceInfo: ctx.userAgent || undefined,
            ipAddress: ctx.ip || undefined,
            userAgent: ctx.userAgent || undefined,
          });

          // Update last used timestamp
          yield* refreshTokensQueries.updateLastUsed(newRefreshTokenJWT);

          return {
            accessToken,
            refreshToken: newRefreshTokenJWT,
          };
        })
      )
  ),

  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await runEffect(
      refreshTokensQueries.getUserActiveSessions(ctx.user.id)
    );

    return sessions;
  }),

  revokeSession: protectedProcedure
    .input(authSchema.revokeSessionSchema)
    .mutation(async ({ input }) => {
      await runEffect(refreshTokensQueries.revokeTokenById(input.sessionId));

      return {
        success: true,
        message: "Sesi berhasil dicabut.",
      };
    }),

  revokeAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
    await runEffect(refreshTokensQueries.revokeAllUserTokens(ctx.user.id));

    return {
      success: true,
      message: "Semua sesi berhasil dicabut.",
    };
  }),
});
