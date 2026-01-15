import { and, desc, eq, gt, sql } from "@tepian-k3/db";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { refreshTokens } from "@tepian-k3/db/schema";
import { logError } from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

interface CreateRefreshTokenInput {
  userId: string;
  token: string;
  expiresAt: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

const refreshTokensQueries = {
  createRefreshToken(input: CreateRefreshTokenInput, tx: DBorTx = db) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          tx
            .insert(refreshTokens)
            .values({
              userId: input.userId,
              token: input.token,
              expiresAt: input.expiresAt,
              deviceInfo: input.deviceInfo,
              ipAddress: input.ipAddress,
              userAgent: input.userAgent,
              revoked: false,
            })
            .returning(),
        catch: (error) => {
          logError(
            "refreshTokensQueries.createRefreshToken",
            "Failed to create refresh token",
            { input, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat refresh token.",
            cause: error,
          });
        },
      });

      if (!result) {
        logError(
          "refreshTokensQueries.createRefreshToken",
          "No result returned after creating refresh token",
          { input }
        );
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat refresh token.",
          })
        );
      }

      return result;
    });
  },

  validateRefreshToken(token: string, tx: DBorTx = db) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          tx
            .select()
            .from(refreshTokens)
            .where(
              and(
                eq(refreshTokens.token, token),
                eq(refreshTokens.revoked, false),
                gt(refreshTokens.expiresAt, new Date().toISOString())
              )
            )
            .limit(1),
        catch: (error) => {
          logError(
            "refreshTokensQueries.validateRefreshToken",
            "Failed to validate refresh token",
            { token, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memvalidasi refresh token.",
            cause: error,
          });
        },
      });

      return result || null;
    });
  },

  updateLastUsed(token: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () =>
        tx
          .update(refreshTokens)
          .set({ lastUsedAt: sql`CURRENT_TIMESTAMP` })
          .where(eq(refreshTokens.token, token))
          .returning(),
      catch: (error) => {
        logError(
          "refreshTokensQueries.updateLastUsed",
          "Failed to update refresh token last used timestamp",
          { token, error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui waktu penggunaan terakhir refresh token.",
          cause: error,
        });
      },
    });
  },

  revokeToken(token: string, tx: DBorTx = db) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(refreshTokens)
            .set({
              revoked: true,
              revokedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(refreshTokens.token, token))
            .returning(),
        catch: (error) => {
          logError(
            "refreshTokensQueries.revokeToken",
            "Failed to revoke refresh token",
            { token, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mencabut refresh token.",
            cause: error,
          });
        },
      });

      if (!result) {
        logError(
          "refreshTokensQueries.revokeToken",
          "No result returned after revoking refresh token",
          { token }
        );
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Refresh token tidak ditemukan.",
          })
        );
      }

      return result;
    });
  },

  revokeTokenById(id: string, tx: DBorTx = db) {
    return Effect.gen(this, function* () {
      const [result] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(refreshTokens)
            .set({
              revoked: true,
              revokedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(refreshTokens.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "refreshTokensQueries.revokeTokenById",
            "Failed to revoke refresh token by ID",
            { id, error }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mencabut refresh token.",
            cause: error,
          });
        },
      });

      if (!result) {
        logError(
          "refreshTokensQueries.revokeTokenById",
          "No result returned after revoking refresh token by ID",
          { id }
        );
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Refresh token tidak ditemukan.",
          })
        );
      }

      return result;
    });
  },

  revokeAllUserTokens(userId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () =>
        tx
          .update(refreshTokens)
          .set({
            revoked: true,
            revokedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(
            and(
              eq(refreshTokens.userId, userId),
              eq(refreshTokens.revoked, false)
            )
          )
          .returning(),
      catch: (error) => {
        logError(
          "refreshTokensQueries.revokeAllUserTokens",
          "Failed to revoke all user's refresh tokens",
          { userId, error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mencabut semua refresh token pengguna.",
          cause: error,
        });
      },
    });
  },

  getUserActiveSessions(userId: string, tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () =>
        tx
          .select({
            id: refreshTokens.id,
            deviceInfo: refreshTokens.deviceInfo,
            ipAddress: refreshTokens.ipAddress,
            userAgent: refreshTokens.userAgent,
            lastUsedAt: refreshTokens.lastUsedAt,
            createdAt: refreshTokens.createdAt,
            expiresAt: refreshTokens.expiresAt,
          })
          .from(refreshTokens)
          .where(
            and(
              eq(refreshTokens.userId, userId),
              eq(refreshTokens.revoked, false),
              gt(refreshTokens.expiresAt, new Date().toISOString())
            )
          )
          .orderBy(desc(refreshTokens.lastUsedAt)),
      catch: (error) => {
        logError(
          "refreshTokensQueries.getUserActiveSessions",
          "Failed to get user's active sessions",
          { userId, error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendapatkan sesi aktif pengguna.",
          cause: error,
        });
      },
    });
  },

  deleteExpiredTokens(tx: DBorTx = db) {
    return Effect.tryPromise({
      try: () =>
        tx
          .delete(refreshTokens)
          .where(
            sql`${refreshTokens.expiresAt} < CURRENT_TIMESTAMP OR ${refreshTokens.revoked} = true`
          )
          .returning(),
      catch: (error) => {
        logError(
          "refreshTokensQueries.deleteExpiredTokens",
          "Failed to delete expired refresh tokens",
          { error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus refresh token yang kedaluwarsa.",
          cause: error,
        });
      },
    });
  },
};

export default refreshTokensQueries;
