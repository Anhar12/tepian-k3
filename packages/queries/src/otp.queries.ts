import { and, eq, gt, gte } from "@tepian-k3/db";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { otpCodes } from "@tepian-k3/db/schema";
import type z from "zod";
import otpSchema from "@tepian-k3/schema/otp.schema";
import { TRPCError } from "@trpc/server";
import { Effect, Option } from "effect";
import { logError } from "@tepian-k3/services/logger";

const otpQueries = {
  invalidateOTPsByEmail(email: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () => {
        const res = tx
          .update(otpCodes)
          .set({ verified: true })
          .where(and(eq(otpCodes.email, email), eq(otpCodes.verified, false)))
          .returning();

        return res;
      },
      catch: (error) => {
        logError(
          "otpQueries.invalidateOTPsByEmail",
          "Failed to invalidate OTPs",
          { email, error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menonaktifkan kode OTP.",
          cause: error,
        });
      },
    });
  },

  createOTP(data: z.infer<typeof otpSchema.insertOtpSchema>, tx: DBorTx = db) {
    return Effect.gen(function* () {
      const [result] = yield* Effect.tryPromise({
        try: () => tx.insert(otpCodes).values(data).returning(),
        catch: (error) => {
          logError("otpQueries.createOTP", "Failed to create OTP", {
            data,
            error,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat kode OTP.",
            cause: error,
          });
        },
      });

      if (!result) {
        logError("otpQueries.createOTP", "No OTP result returned", { data });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat kode OTP.",
          })
        );
      }

      return result;
    });
  },

  findValidOTP(email: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.otpCodes.findFirst({
          where: and(
            eq(otpCodes.email, email),
            eq(otpCodes.verified, false),
            gte(otpCodes.expiresAt, new Date().toISOString())
          ),
        }),
      catch: (error) => {
        logError("otpQueries.findValidOTP", "Failed to find valid OTP", {
          email,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil kode OTP yang valid.",
          cause: error,
        });
      },
    }).pipe(Effect.map((otp) => (otp ? Option.some(otp) : Option.none())));
  },

  findLastOTPByEmail(email: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.otpCodes.findFirst({
          where: eq(otpCodes.email, email),
          orderBy: (otpCodes, { desc }) => [desc(otpCodes.createdAt)],
        }),
      catch: (error) => {
        logError(
          "otpQueries.findLastOTPByEmail",
          "Failed to find last OTP by email",
          {
            email,
            error,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil kode OTP terakhir.",
          cause: error,
        });
      },
    }).pipe(Effect.map((otp) => (otp ? Option.some(otp) : Option.none())));
  },

  incrementOTPAttempts(id: string, currentAttempt: number) {
    return Effect.gen(function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(otpCodes)
            .set({ attempts: currentAttempt + 1 })
            .where(eq(otpCodes.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "otpQueries.incrementOTPAttempts",
            "Failed to increment OTP attempts",
            {
              id,
              currentAttempt,
              error,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambah percobaan kode OTP.",
            cause: error,
          });
        },
      });

      if (!result) {
        logError(
          "otpQueries.incrementOTPAttempts",
          "No result returned when incrementing OTP attempts",
          { id, currentAttempt }
        );
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambah percobaan kode OTP.",
          })
        );
      }

      return Effect.succeed(result);
    });
  },

  markOTPAsVerified(id: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () => {
        const res = tx
          .update(otpCodes)
          .set({ verified: true })
          .where(eq(otpCodes.id, id))
          .returning();
        return res;
      },
      catch: (error) => {
        logError(
          "otpQueries.markOTPAsVerified",
          "Failed to mark OTP as verified",
          { id, error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menandai kode OTP sebagai terverifikasi.",
          cause: error,
        });
      },
    });
  },

  deleteExpiredOTPs() {
    return Effect.tryPromise({
      try: () => {
        const res = db
          .delete(otpCodes)
          .where(gt(otpCodes.expiresAt, new Date().toISOString()))
          .returning();

        return res;
      },
      catch: (error) => {
        logError(
          "otpQueries.deleteExpiredOTPs",
          "Failed to delete expired OTPs",
          { error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus kode OTP yang kedaluwarsa.",
          cause: error,
        });
      },
    });
  },

  deleteOTPsByEmail(email: string) {
    return Effect.tryPromise({
      try: () => {
        const res = db
          .delete(otpCodes)
          .where(and(eq(otpCodes.email, email), eq(otpCodes.verified, false)))
          .returning();

        return res;
      },
      catch: (error) => {
        logError("otpQueries.deleteOTPsByEmail", "Failed to delete OTPs", {
          email,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus kode OTP.",
          cause: error,
        });
      },
    });
  },
};

export default otpQueries;
