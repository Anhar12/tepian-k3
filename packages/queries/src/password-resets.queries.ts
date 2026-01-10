import { hash } from "@node-rs/argon2";
import { and, eq, gt } from "@tepian-k3/db";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { passwordResets } from "@tepian-k3/db/schema";
import { logError } from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

const passwordResetsQueries = {
  hashResetToken(token: string) {
    return Effect.tryPromise({
      try: () => hash(token),
      catch: (error) => {
        logError(
          "passwordResetsQueries.hashResetToken",
          "Failed to hash password reset token",
          { token, error }
        );
        throw new TRPCError({
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
          logError(
            "passwordResetsQueries.createResetRecord",
            "Failed to create password reset record",
            { userId, token, expiresAt, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat catatan pengaturan ulang kata sandi.",
            cause: error,
          });
        },
      });

      if (!result) {
        logError(
          "passwordResetsQueries.createResetRecord",
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

  validateResetToken(token: string, tx: DBorTx = db) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          tx
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
          logError(
            "passwordResetsQueries.validateResetToken",
            "Failed to validate password reset token",
            { token, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memvalidasi token pengaturan ulang kata sandi.",
            cause: error,
          });
        },
      });

      return result ? result.userId : null;
    });
  },

  markTokenAsUsed(token: string, tx: DBorTx = db) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(passwordResets)
            .set({ used: true })
            .where(eq(passwordResets.token, token))
            .returning(),
        catch: (error) => {
          logError(
            "passwordResetsQueries.markTokenAsUsed",
            "Failed to mark password reset token as used",
            { token, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Gagal menandai token pengaturan ulang kata sandi sebagai terpakai.",
            cause: error,
          });
        },
      });

      if (!result) {
        logError(
          "passwordResetsQueries.markTokenAsUsed",
          "No result returned after marking reset token as used",
          { token }
        );
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
        logError(
          "passwordResetsQueries.deleteExpiredTokens",
          "Failed to delete expired password reset tokens",
          { error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal menghapus token pengaturan ulang kata sandi yang kedaluwarsa.",
          cause: error,
        });
      },
    });
  },

  invalidateUserResets(userId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () =>
        tx
          .update(passwordResets)
          .set({ used: true })
          .where(eq(passwordResets.userId, userId))
          .returning(),
      catch: (error) => {
        logError(
          "passwordResetsQueries.invalidateUserResets",
          "Failed to invalidate user's password reset tokens",
          { userId, error }
        );
        throw new TRPCError({
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
