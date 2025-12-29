import { hash } from "@node-rs/argon2";
import { and, eq, gt } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { passwordResets } from "@tepian-k3/db/schema";
import logger from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

const passwordResetsQueries = {
  hashResetToken(token: string) {
    return Effect.tryPromise({
      try: () => hash(token),
      catch: (error) => {
        logger.error("Failed to hash reset token", { token, error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memproses token pengaturan ulang kata sandi.",
          cause: error,
        });
      },
    });
  },

  createResetRecord(userId: string, token: string, expiresAt: string) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(passwordResets)
            .values({
              userId,
              token,
              expiresAt,
              used: false,
            })
            .returning(),
        catch: (error) => {
          logger.error("Failed to create password reset record", {
            userId,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat catatan pengaturan ulang kata sandi.",
            cause: error,
          });
        },
      });

      if (!result) {
        logger.error(
          "No result returned after creating password reset record",
          { userId }
        );
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat catatan pengaturan ulang kata sandi.",
          })
        );
      }

      return result;
    });
  },

  validateResetToken(token: string) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(passwordResets)
            .where(
              and(
                eq(passwordResets.token, token),
                eq(passwordResets.used, false),
                gt(passwordResets.expiresAt, new Date().toISOString())
              )
            )
            .limit(1),
        catch: (error) => {
          logger.error("Failed to validate password reset token", {
            token,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memvalidasi token pengaturan ulang kata sandi.",
            cause: error,
          });
        },
      });

      return result ? result.userId : null;
    });
  },

  markTokenAsUsed(token: string) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(passwordResets)
            .set({ used: true })
            .where(eq(passwordResets.token, token))
            .returning(),
        catch: (error) => {
          logger.error("Failed to mark password reset token as used", {
            token,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Gagal menandai token pengaturan ulang kata sandi sebagai terpakai.",
            cause: error,
          });
        },
      });

      if (!result) {
        logger.error("No result returned after marking reset token as used", {
          token,
        });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Gagal menandai token pengaturan ulang kata sandi sebagai terpakai.",
          })
        );
      }

      return result;
    });
  },

  deleteExpiredTokens() {
    return Effect.tryPromise({
      try: () =>
        db
          .delete(passwordResets)
          .where(gt(passwordResets.expiresAt, new Date().toISOString()))
          .returning(),
      catch: (error) => {
        logger.error("Failed to delete expired password reset tokens", {
          error,
        });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal menghapus token pengaturan ulang kata sandi yang kedaluwarsa.",
          cause: error,
        });
      },
    });
  },

  invalidateUserResets(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db
          .update(passwordResets)
          .set({ used: true })
          .where(eq(passwordResets.userId, userId))
          .returning(),
      catch: (error) => {
        logger.error("Failed to invalidate user's password reset tokens", {
          userId,
          error,
        });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal menonaktifkan token pengaturan ulang kata sandi pengguna.",
          cause: error,
        });
      },
    });
  },
};

export default passwordResetsQueries;
