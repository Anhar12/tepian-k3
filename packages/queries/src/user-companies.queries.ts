import { and, eq, isNull } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { userCompanies } from "@tepian-k3/db/schema";
import { TRPCError } from "@trpc/server";
import userCompaniesSchema from "@tepian-k3/schema/user-companies.schema";
import type z from "zod";
import { Effect } from "effect";
import logger from "@tepian-k3/services/logger";

const userCompaniesQueries = {
  getAllUserCompanies() {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanies.findMany({
          where: isNull(userCompanies.deletedAt),
        }),
      catch: (error) => {
        logger.error("Error fetching all user companies", { error });

        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data perusahaan.",
          cause: error,
        });
      },
    });
  },

  getDetailUserCompany(companyId: string) {
    return Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          db.query.userCompanies.findFirst({
            where: and(
              eq(userCompanies.id, companyId),
              isNull(userCompanies.deletedAt)
            ),
          }),
        catch: (error) => {
          logger.error("Error fetching user company detail", { error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil detail perusahaan.",
            cause: error,
          });
        },
      });

      if (!result) {
        logger.error("User company not found", { companyId });
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Perusahaan tidak ditemukan.`,
          })
        );
      }

      return Effect.succeed(result);
    });
  },

  getAllUserCompanyByUserId(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanies.findMany({
          where: and(
            eq(userCompanies.userId, userId),
            isNull(userCompanies.deletedAt)
          ),
        }),
      catch: (error) => {
        logger.error("Error fetching user companies by user ID", {
          userId,
          error,
        });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data perusahaan pengguna.",
          cause: error,
        });
      },
    });
  },

  createUserCompany(
    userId: string,
    data: z.infer<typeof userCompaniesSchema.createUserCompanySchema>
  ) {
    return Effect.gen(function* () {
      const [newCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(userCompanies)
            .values({
              ...data,
              userId,
            })
            .returning(),
        catch: (error) => {
          logger.error("Error creating user company", { userId, data, error });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat perusahaan pengguna.",
            cause: error,
          });
        },
      });

      if (!newCompany) {
        logger.error("Failed to create user company", { userId, data });
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat perusahaan pengguna.",
          })
        );
      }

      return Effect.succeed(newCompany);
    });
  },

  updateUserCompany(
    companyId: string,
    userId: string,
    data: z.infer<typeof userCompaniesSchema.updateUserCompanySchema>
  ) {
    return Effect.gen(function* () {
      const existingCompany = yield* Effect.tryPromise({
        try: () =>
          db.query.userCompanies.findFirst({
            where: and(
              eq(userCompanies.id, companyId),
              isNull(userCompanies.deletedAt)
            ),
          }),
        catch: (error) => {
          logger.error("Error fetching user company for update", {
            companyId,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui perusahaan.",
            cause: error,
          });
        },
      });

      if (!existingCompany) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Perusahaan tidak ditemukan.`,
          })
        );
      }

      if (existingCompany.userId !== userId) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message: `Anda tidak memiliki izin untuk memperbarui perusahaan ini.`,
          })
        );
      }

      const [updatedCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanies)
            .set(data)
            .where(eq(userCompanies.id, companyId))
            .returning(),
        catch: (error) => {
          logger.error("Error updating user company", {
            companyId,
            data,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui perusahaan.",
            cause: error,
          });
        },
      });

      if (!updatedCompany) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui perusahaan.",
          })
        );
      }

      return Effect.succeed(updatedCompany);
    });
  },

  deleteUserCompany(companyuserId: string, id: string) {
    return Effect.gen(function* () {
      const existingCompany = yield* Effect.tryPromise({
        try: () =>
          db.query.userCompanies.findFirst({
            where: and(
              eq(userCompanies.id, companyId),
              isNull(userCompanies.deletedAt)
            ),
          }),

        catch: (error) => {
          logger.error("Error fetching user company for deletion", {
            companyId,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal menghapus perusahaan.`,
            cause: error,
          });
        },
      });

      if (!existingCompany) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: `Perusahaan tidak ditemukan.`,
          })
        );
      }

      if (existingCompany.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Anda tidak memiliki izin untuk menghapus perusahaan ini.`,
        });
      }

      const [deletedCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanies)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(userCompanies.id, companyId))
            .returning(),
        catch: (error) => {
          logger.error("Error deleting user company", {
            companyId,
            userId,
            error,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal menghapus perusahaan.`,
            cause: error,
          });
        },
      });

      if (!deletedCompany) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal menghapus perusahaan.`,
          })
        );
      }

      return Effect.succeed(deletedCompany);
    });
  },
};

export default userCompaniesQueries;
