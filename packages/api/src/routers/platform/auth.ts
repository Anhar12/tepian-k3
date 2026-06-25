import authSchema from "@tepian-k3/schema/platform/auth.schema";
import { createTRPCRouter, withProtectedRateLimit, withRateLimit } from "../..";
import usersQueries from "@tepian-k3/queries/platform/users.queries";
import { notificationsQueries } from "@tepian-k3/queries/platform/notifications.queries";
import { TRPCError } from "@trpc/server";
import { verify } from "@node-rs/argon2";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  blacklistAllUserTokens,
} from "@tepian-k3/auth";
import userSchema from "@tepian-k3/schema/platform/users.schema";
import otpSchema from "@tepian-k3/schema/platform/otp.schema";
import { Effect } from "effect";
import permissionQueries from "@tepian-k3/queries/platform/permission.queries";
import { storageService } from "@tepian-k3/services/storage";
import z from "zod";
import { PasswordResetService } from "@tepian-k3/auth/services/password-reset";
import { runEffect } from "../../utils/run-effect";
import refreshTokensQueries from "@tepian-k3/queries/platform/refresh-tokens.queries";
import { v7 as uuidv7 } from "uuid";
import { logError } from "@tepian-k3/services/logger";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { strongPasswordSchema } from "@tepian-k3/schema/platform/password.schema";

export const authRouter = createTRPCRouter({
  login: withRateLimit(rateLimiters.auth())
    .input(authSchema.loginSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const user = yield* usersQueries.getUserByEmail(input.email);

            const verifyPasswordResult = yield* Effect.tryPromise({
              try: () => verify(user.password, input.password),
              catch: (error) => {
                logError("authRouter.login", "Password verification failed", {
                  email: input.email,
                  error: error instanceof Error ? error.message : String(error),
                });
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Gagal memverifikasi password.",
                  cause: error,
                });
              },
            });

            if (!verifyPasswordResult) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "Username atau password salah.",
                }),
              );
            }

            if (user.verificationStatus === "rejected") {
              return yield* Effect.fail(
                new TRPCError({
                  code: "FORBIDDEN",
                  message: `Pendaftaran akun Anda ditolak oleh Administrator. Alasan: ${user.verificationRejectionReason ?? "Tidak ada alasan spesifik."}`,
                }),
              );
            }

            if (user.verificationStatus === "pending") {
              return yield* Effect.fail(
                new TRPCError({
                  code: "FORBIDDEN",
                  message:
                    "Akun Anda sedang menunggu verifikasi dari Administrator.",
                }),
              );
            }

            if (!user.emailVerified) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "FORBIDDEN",
                  message: "Email belum terverifikasi.",
                }),
              );
            }

            const permission = yield* permissionQueries.getUserWithPermissions(
              user.id,
            );
            // Generate a single session ID to use for both access and refresh tokens
            const sessionId = uuidv7();

            // Create access token with short expiry
            const accessToken = yield* Effect.tryPromise({
              try: () =>
                createAccessToken({
                  id: user.id,
                  sessionId,
                  email: user.email,
                  roles: permission?.roles.map((role) => role.name) || [],
                  createdAt: user.createdAt,
                  updatedAt: user.updatedAt,
                }),
              catch: (error) => {
                logError("authRouter.login", "Failed to create access token", {
                  userId: user.id,
                  error: error instanceof Error ? error.message : String(error),
                });
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Gagal membuat access token.",
                  cause: error,
                });
              },
            });

            // Create refresh token with long expiry
            const refreshTokenJWT = yield* Effect.tryPromise({
              try: () =>
                createRefreshToken({
                  id: user.id,
                  sessionId,
                  type: "refresh",
                }),
              catch: (error) => {
                logError("authRouter.login", "Failed to create refresh token", {
                  userId: user.id,
                  error: error instanceof Error ? error.message : String(error),
                });
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Gagal membuat refresh token.",
                  cause: error,
                });
              },
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
              os: ctx.osName || undefined,
              version: ctx.osVersion || undefined,
            });

            return {
              accessToken,
              refreshToken: refreshTokenJWT,
              user: {
                ...permission,
                password: undefined,
              },
            };
          }),
        ),
    ),

  register: withRateLimit(rateLimiters.auth())
    .input(userSchema.createUserSchema)
    .mutation(async ({ input }) => {
      // ##################
      // authored (generated by claude, Jun 12 2026 16:30 WITA)
      // ##################
      const user = await runEffect(
        Effect.gen(function* () {
          const newUser = yield* usersQueries.createUser(input);

          // Query all administrators
          const admins = yield* usersQueries.getAdmins();

          // Insert a notification for each administrator
          for (const admin of admins) {
            yield* notificationsQueries.create({
              userId: admin.id,
              type: "general",
              title: "Registrasi Pengguna Baru",
              message: `Pengguna baru ${newUser.name} (${newUser.email}) telah mendaftar dan menunggu verifikasi.`,
            });
          }

          return newUser;
        }),
      );

      return user;
      // ##################
      // end authored
      // ##################
    }),

  sendOTP: withRateLimit(rateLimiters.otp())
    .input(otpSchema.createOtpSchema)
    .mutation(() => {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Fitur OTP dinonaktifkan sementara. Verifikasi harus disetujui oleh Administrator.",
      });
    }),

  resendOTP: withRateLimit(rateLimiters.otp())
    .input(otpSchema.createOtpSchema)
    .mutation(() => {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Fitur OTP dinonaktifkan sementara. Verifikasi harus disetujui oleh Administrator.",
      });
    }),

  verifyOTP: withRateLimit(rateLimiters.otp())
    .input(otpSchema.verifyOtpSchema)
    .mutation(() => {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Fitur OTP dinonaktifkan sementara. Verifikasi harus disetujui oleh Administrator.",
      });
    }),

  requestPasswordReset: withRateLimit(rateLimiters.email())
    .input(
      z.object({
        email: z.email(),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await runEffect(
        PasswordResetService.requestReset(input.email),
      );

      if (!result.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  verifyResetToken: withRateLimit<{ token: string }>(
    rateLimiters.api(),
    (_, input) => `verify-reset:${input?.token || "unknown"}`,
  )
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const result = await runEffect(
        PasswordResetService.verifyResetToken(input.token),
      );

      if (!result.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  profile: withProtectedRateLimit(
    rateLimiters.api(),
    (ctx) => `profile:${ctx.user.id}`,
  ).query(async ({ ctx }) => {
    const user = await runEffect(
      permissionQueries.getUserWithPermissions(ctx.user.id),
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

  resetPassword: withRateLimit(rateLimiters.passwordReset())
    .input(
      z.object({
        token: z.string(),
        newPassword: strongPasswordSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const result = await runEffect(
        PasswordResetService.resetPassword(input.token, input.newPassword),
      );

      if (!result.status) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.message,
        });
      }

      return result;
    }),

  me: withRateLimit(rateLimiters.api(), (ctx) =>
    ctx.user?.id ? `me:user:${ctx.user.id}` : `me:ip:${ctx.ip}`,
  ).query(async ({ ctx }) => {
    // If no user and no auth header, return null (unauthenticated visitor)
    if (!ctx.user && !ctx.hasAuthHeader) {
      return null;
    }

    // If auth header present but no user, token is invalid/expired
    if (!ctx.user && ctx.hasAuthHeader) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Token tidak valid atau telah kedaluwarsa.",
      });
    }

    const user = await runEffect(
      permissionQueries.getUserWithPermissions(ctx.user!.id),
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

  refresh: withRateLimit(rateLimiters.authRefresh())
    .input(authSchema.refreshTokenSchema)
    .mutation(
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
            const storedToken =
              yield* refreshTokensQueries.validateRefreshToken(
                input.refreshToken,
              );

            if (!storedToken) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "UNAUTHORIZED",
                  message: "Refresh token tidak valid atau telah kedaluwarsa.",
                }),
              );
            }

            // Get user with permissions
            const permission = yield* permissionQueries.getUserWithPermissions(
              storedToken.userId,
            );

            if (!permission) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Pengguna tidak ditemukan.",
                }),
              );
            }
            // Generate a single session ID for the new tokens
            const sessionId = uuidv7();

            // Create new access token
            const accessToken = yield* Effect.tryPromise({
              try: () =>
                createAccessToken({
                  id: permission.id,
                  sessionId,
                  email: permission.email,
                  roles: permission.roles.map((role) => role.name),
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
              os: ctx.osName || undefined,
              version: ctx.osVersion || undefined,
            });

            // Update last used timestamp
            yield* refreshTokensQueries.updateLastUsed(newRefreshTokenJWT);

            return {
              accessToken,
              refreshToken: newRefreshTokenJWT,
            };
          }),
        ),
    ),

  getSessions: withProtectedRateLimit(
    rateLimiters.api(),
    (ctx) => `sessions:${ctx.user.id}`,
  ).query(async ({ ctx }) => {
    const sessions = await runEffect(
      refreshTokensQueries.getUserActiveSessions(ctx.user.id),
    );

    return sessions;
  }),

  revokeSession: withProtectedRateLimit(
    rateLimiters.api(),
    (ctx) => `revoke-session:${ctx.user.id}`,
  )
    .input(authSchema.revokeSessionSchema)
    .mutation(async ({ input }) => {
      await runEffect(refreshTokensQueries.revokeTokenById(input.sessionId));

      // Blacklist the session's access token (30 days TTL to match token expiry)
      await blacklistToken(
        input.sessionId,
        30 * 24 * 60 * 60,
        "session_revoked",
      );

      return {
        success: true,
        message: "Sesi berhasil dicabut.",
      };
    }),

  revokeAllSessions: withProtectedRateLimit(
    rateLimiters.api(),
    (ctx) => `revoke-all-sessions:${ctx.user.id}`,
  ).mutation(async ({ ctx }) => {
    await runEffect(refreshTokensQueries.revokeAllUserTokens(ctx.user.id));

    // Blacklist all tokens for this user (30 days TTL)
    await blacklistAllUserTokens(ctx.user.id, 30 * 24 * 60 * 60);

    return {
      success: true,
      message: "Semua sesi berhasil dicabut.",
    };
  }),

  logout: withProtectedRateLimit(
    rateLimiters.api(),
    (ctx) => `logout:${ctx.user.id}`,
  )
    .input(authSchema.refreshTokenSchema)
    .mutation(async ({ input, ctx }) => {
      await runEffect(refreshTokensQueries.revokeToken(input.refreshToken));

      // Blacklist the current access token (use session.id which is the JWT's jti)
      if (ctx.session?.id) {
        await blacklistToken(ctx.session.id, 30 * 24 * 60 * 60, "logout");
      }

      return {
        success: true,
        message: "Logout berhasil.",
      };
    }),

  getVerificationStatus: withRateLimit(rateLimiters.api())
    .input(
      z.object({
        email: z.string().email("Format email tidak valid"),
      }),
    )
    .query(async ({ input }) => {
      // ##################
      // authored (generated by claude, Jun 12 2026 16:30 WITA)
      // ##################
      const result = await runEffect(
        usersQueries.getVerificationStatusByEmail(input.email),
      );
      return result;
      // ##################
      // end authored
      // ##################
    }),
});
