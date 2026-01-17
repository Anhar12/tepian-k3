import type z from "zod";
import otpSchema from "@tepian-k3/schema/otp.schema";
import userQueries from "@tepian-k3/queries/users.queries";
import otpQueries from "@tepian-k3/queries/otp.queries";
import { emailService } from "@tepian-k3/services/email";
import usersQueries from "@tepian-k3/queries/users.queries";
import { createAccessToken, createRefreshToken } from "..";
import { logError, logInfo } from "@tepian-k3/services/logger";
import { Data, Effect, Option } from "effect";
import permissionQueries from "@tepian-k3/queries/permission.queries";
import { db } from "@tepian-k3/db/client";
import refreshTokensQueries from "@tepian-k3/queries/refresh-tokens.queries";
import { v7 as uuidv7 } from "uuid";

class OTPError extends Data.TaggedError("OTPError")<{
  status: boolean;
  message: string;
}> {}

export class OTPService {
  private static OTP_EXPIRY_MINUTES = 10;
  private static MAX_ATTEMPTS = 5;

  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async createOTP(input: z.infer<typeof otpSchema.createOtpSchema>) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const { email } = input;

        const user = yield* userQueries.getUserByEmail(email);

        const code = OTPService.generateOTP();
        const expiresAt = new Date(
          Date.now() + OTPService.OTP_EXPIRY_MINUTES * 60 * 1000
        ).toISOString();

        yield* Effect.tryPromise({
          try: () =>
            db.transaction(async (tx) => {
              await Effect.runPromise(
                otpQueries.invalidateOTPsByEmail(email, tx)
              );

              await Effect.runPromise(
                otpQueries.createOTP(
                  {
                    userId: user.id,
                    code,
                    email,
                    expiresAt,
                    attempts: 0,
                    verified: false,
                  },
                  tx
                )
              );
            }),
          catch: (error) => {
            logError(
              "OTPService.createOTP",
              "Failed to create OTP in transaction",
              {
                email,
                error,
              }
            );
            return new OTPError({
              status: false,
              message: "Gagal membuat kode OTP.",
            });
          },
        });

        yield* Effect.tryPromise({
          try: () =>
            emailService.sendOTP({
              email,
              code,
              expiresInMinutes: OTPService.OTP_EXPIRY_MINUTES,
            }),
          catch: (error) => {
            logError("OTPService.createOTP", "Failed to send OTP email", {
              email,
              error,
            });
            return new OTPError({
              status: false,
              message: "Gagal mengirim email OTP.",
            });
          },
        });

        logInfo("OTPService.createOTP", `OTP created and sent to ${email}`);

        return {
          success: true,
          message: "OTP berhasil dibuat dan dikirim ke email.",
        };
      })
    );
  }

  static async verifyOTP(
    input: z.infer<typeof otpSchema.verifyOtpSchema>,
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      os?: string;
      version?: string;
    }
  ) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const { email, code } = input;

        const otpOption = yield* otpQueries.findValidOTP(email);

        if (Option.isNone(otpOption)) {
          return yield* Effect.fail(
            new OTPError({
              status: false,
              message: "OTP tidak ditemukan atau sudah kedaluwarsa.",
            })
          );
        }

        const otp = otpOption.value;

        if (otp.attempts >= OTPService.MAX_ATTEMPTS) {
          return yield* Effect.fail(
            new OTPError({
              status: false,
              message: "Jumlah percobaan OTP telah melebihi batas.",
            })
          );
        }

        if (otp.code !== code) {
          yield* otpQueries.incrementOTPAttempts(otp.id, otp.attempts);
          return yield* Effect.fail(
            new OTPError({
              status: false,
              message: "Kode OTP salah.",
            })
          );
        }

        yield* Effect.tryPromise({
          try: () =>
            db.transaction(async (tx) => {
              await Effect.runPromise(otpQueries.markOTPAsVerified(otp.id, tx));

              await Effect.runPromise(
                usersQueries.markUserEmailAsVerified(otp.userId, tx)
              );
            }),
          catch: (error) => {
            logError(
              "OTPService.verifyOTP",
              "Failed to verify OTP in transaction",
              {
                otpId: otp.id,
                userId: otp.userId,
                error,
              }
            );
            return new OTPError({
              status: false,
              message: "Gagal memverifikasi kode OTP.",
            });
          },
        });

        const user = yield* permissionQueries.getUserWithPermissions(
          otp.userId
        );

        if (!user) {
          return yield* Effect.fail(
            new OTPError({
              status: false,
              message: "Pengguna tidak ditemukan.",
            })
          );
        }

        // Create access token with short expiry
        const accessToken = yield* Effect.tryPromise({
          try: () =>
            createAccessToken({
              id: user.id,
              email: user.email,
              roles: user.roles.map((role) => role.name),
              permissions: user.permissions,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            }),
          catch: (error) => {
            logError("OTPService.verifyOTP", "Failed to create access token", {
              userId: user.id,
              error,
            });
            return new OTPError({
              status: false,
              message: "Gagal membuat access token.",
            });
          },
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
          catch: (error) => {
            logError(
              "OTPService.verifyOTP",
              "Failed to create refresh token",
              {
                userId: user.id,
                error,
              }
            );
            return new OTPError({
              status: false,
              message: "Gagal membuat refresh token.",
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
          deviceInfo: deviceInfo?.userAgent,
          ipAddress: deviceInfo?.ipAddress,
          userAgent: deviceInfo?.userAgent,
          os: deviceInfo?.os,
          version: deviceInfo?.version,
        });

        logInfo(
          "OTPService.verifyOTP",
          `OTP verified and tokens generated for ${email}`
        );

        return {
          success: true,
          message: "OTP berhasil diverifikasi.",
          userId: otp.userId,
          accessToken,
          refreshToken: refreshTokenJWT,
        };
      })
    );
  }

  static async resendOTP(input: z.infer<typeof otpSchema.createOtpSchema>) {
    return Effect.runPromise(
      Effect.gen(function* () {
        const { email } = input;

        const user = yield* userQueries.getUserByEmail(email);

        yield* otpQueries.deleteOTPsByEmail(email);

        const lastOTPOption = yield* otpQueries.findLastOTPByEmail(email);

        if (Option.isSome(lastOTPOption)) {
          const lastOTP = lastOTPOption.value;
          const timeSinceLastOTP =
            Date.now() - new Date(lastOTP.createdAt).getTime();
          const MIN_RESEND_INTERVAL = 60 * 1000;

          if (timeSinceLastOTP < MIN_RESEND_INTERVAL) {
            const waitTime = Math.ceil(
              (MIN_RESEND_INTERVAL - timeSinceLastOTP) / 1000
            );
            return yield* Effect.fail(
              new OTPError({
                status: false,
                message: `Silakan tunggu ${waitTime} detik sebelum mengirim ulang OTP.`,
              })
            );
          }
        }

        const code = OTPService.generateOTP();
        const expiresAt = new Date(
          Date.now() + OTPService.OTP_EXPIRY_MINUTES * 60 * 1000
        ).toISOString();

        yield* Effect.tryPromise({
          try: () =>
            db.transaction(async (tx) => {
              await Effect.runPromise(otpQueries.invalidateOTPsByEmail(email));

              await Effect.runPromise(
                otpQueries.createOTP(
                  {
                    userId: user.id,
                    code,
                    email,
                    expiresAt,
                    attempts: 0,
                    verified: false,
                  },
                  tx
                )
              );
            }),
          catch: (error) => {
            logError(
              "OTPService.resendOTP",
              "Failed to create OTP in transaction",
              {
                email,
                error,
              }
            );
            return new OTPError({
              status: false,
              message: "Gagal membuat kode OTP.",
            });
          },
        });

        yield* Effect.tryPromise({
          try: () =>
            emailService.sendOTP({
              email,
              code,
              expiresInMinutes: OTPService.OTP_EXPIRY_MINUTES,
            }),
          catch: (error) => {
            logError("OTPService.resendOTP", "Failed to send OTP email", {
              email,
              error,
            });
            return new OTPError({
              status: false,
              message: "Gagal mengirim email OTP.",
            });
          },
        });

        return {
          success: true,
          message: "Kode OTP baru berhasil dikirim.",
        };
      })
    );
  }

  static async cleanupExpiredOTPs(): Promise<void> {
    await Effect.runPromise(otpQueries.deleteExpiredOTPs()).catch((error) => {
      logError("OTPService.cleanupExpiredOTPs", "Error cleaning up OTPs", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    });
  }
}
