import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  isNotNull,
  isNull,
} from "@tepian-k3/db";
import {
  districts,
  kblis,
  provinces,
  regencies,
  userCompanies,
  villages,
} from "@tepian-k3/db/schema";
import { z } from "zod";
import userCompanySchema from "@tepian-k3/schema/user-company.schema";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import { storageService } from "@tepian-k3/services/storage";

const userCompanyQueries = {
  getAllUserCompanies() {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanies.findMany({
          where: isNull(userCompanies.deletedAt),
        }),
      catch: (error) => {
        logger.error("Error fetching userCompanies", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch userCompanies",
        });
      },
    });
  },

  getUserCompanyById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanies.findFirst({
          where: and(eq(userCompanies.id, id), isNull(userCompanies.deletedAt)),
        }),
      catch: (error) => {
        logger.error("Error fetching userCompany by ID", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch userCompany by ID",
        });
      },
    }).pipe(
      Effect.flatMap((userCompany) =>
        userCompany ? Effect.succeed(userCompany) : Effect.succeed(null)
      )
    );
  },

  getUserCompanyDetailsByUserIdAndId(userId: string, id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanies.findFirst({
          where: and(
            eq(userCompanies.id, id),
            eq(userCompanies.userId, userId),
            isNull(userCompanies.deletedAt)
          ),
          with: {
            district: {
              columns: {
                id: true,
                name: true,
              },
            },
            kbli: {
              columns: {
                id: true,
                name: true,
              },
            },
            province: {
              columns: {
                id: true,
                name: true,
              },
            },
            regency: {
              columns: {
                id: true,
                name: true,
              },
            },
            village: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        }),
      catch: (error) => {
        logger.error("Error fetching userCompany details by userId and ID", {
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch userCompany details by userId and ID",
        });
      },
    }).pipe(
      Effect.flatMap((userCompany) =>
        userCompany ? Effect.succeed(userCompany) : Effect.succeed(null)
      )
    );
  },

  getDeletedUserCompanyById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanies.findFirst({
          where: and(
            (eq(userCompanies.id, id), isNotNull(userCompanies.deletedAt))
          ),
        }),
      catch: (error) => {
        logger.error("Error fetching deleted userCompany by ID", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch deleted userCompany by ID",
        });
      },
    }).pipe(
      Effect.flatMap((userCompany) =>
        userCompany ? Effect.succeed(userCompany) : Effect.succeed(null)
      )
    );
  },

  getUserCompanyByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanies.findFirst({
          where: eq(userCompanies.name, name),
        }),
      catch: (error) => {
        logger.error("Error fetching userCompany by name", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch userCompany by name",
        });
      },
    }).pipe(
      Effect.flatMap((userCompany) =>
        userCompany ? Effect.succeed(userCompany) : Effect.succeed(null)
      )
    );
  },

  getUserCompanyNameByUserId(userId: string, name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanies.findFirst({
          where: and(
            eq(userCompanies.userId, userId),
            eq(userCompanies.name, name)
          ),
          columns: { name: true, id: true },
        }),
      catch: (error) => {
        logger.error("Error fetching userCompany names by userId", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch userCompany names by userId",
        });
      },
    });
  },

  getOffsetPaginatedUserCompaniesByUserId(
    userId: string,
    input: z.infer<typeof userCompanySchema.getAllUserCompaniesSchema>
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      // append userId filter at advanced table filters
      input.filters.push({
        id: "userId",
        value: userId,
        operator: "equals",
        variant: "string",
        filterId: "userId",
      });

      const where = advancedTable
        ? filterColumns({
            table: userCompanies,
            filters: input.filters as ExtendedColumnFilter<
              typeof userCompanies
            >[],
            joinOperator: "and",
          })
        : and(
            input.name
              ? ilike(userCompanies.name, `%${input.name}%`)
              : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        userCompanies.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        userCompanies.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })()
                      )
                    : undefined
                )
              : undefined,
            input.showDeleted
              ? isNotNull(userCompanies.deletedAt)
              : isNull(userCompanies.deletedAt),
            eq(userCompanies.userId, userId)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(userCompanies[item.id])
                : asc(userCompanies[item.id])
            )
          : [desc(userCompanies.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select({
                ...getTableColumns(userCompanies),
                kbli: {
                  id: kblis.id,
                  name: kblis.name,
                },
                province: {
                  id: provinces.id,
                  name: provinces.name,
                },
                regency: {
                  id: regencies.id,
                  name: regencies.name,
                },
                district: {
                  id: districts.id,
                  name: districts.name,
                },
                village: {
                  id: villages.id,
                  name: villages.name,
                },
              })
              .from(userCompanies)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .leftJoin(kblis, eq(userCompanies.kbliId, kblis.id))
              .leftJoin(provinces, eq(userCompanies.provinceId, provinces.id))
              .leftJoin(districts, eq(userCompanies.districtId, districts.id))
              .leftJoin(regencies, eq(userCompanies.regencyId, regencies.id))
              .leftJoin(villages, eq(userCompanies.villageId, villages.id))
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(userCompanies)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logger.error("Error fetching paginated userCompanies", {
            error,
            input,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data userCompany`,
            cause: error,
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return {
        data,
        pageCount,
      };
    });
  },

  getOffsetPaginatedUserCompanies(
    input: z.infer<typeof userCompanySchema.getAllUserCompaniesSchema>
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: userCompanies,
            filters: input.filters as ExtendedColumnFilter<
              typeof userCompanies
            >[],
            joinOperator: "and",
          })
        : and(
            input.name
              ? ilike(userCompanies.name, `%${input.name}%`)
              : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        userCompanies.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        userCompanies.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })()
                      )
                    : undefined
                )
              : undefined,
            input.showDeleted
              ? isNotNull(userCompanies.deletedAt)
              : isNull(userCompanies.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(userCompanies[item.id])
                : asc(userCompanies[item.id])
            )
          : [desc(userCompanies.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(userCompanies)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(userCompanies)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logger.error("Error fetching paginated userCompanies", {
            error,
            input,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data userCompany`,
            cause: error,
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return {
        data,
        pageCount,
      };
    });
  },

  userCreateUserCompany(
    userId: string,
    data: z.infer<typeof userCompanySchema.createUserCompanySchema>,
    filename: string,
    url: string
  ) {
    return Effect.gen(this, function* () {
      const isExisting = yield* userCompanyQueries.getUserCompanyNameByUserId(
        userId,
        data.name
      );

      if (isExisting) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Perusahaan dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
        });
      }

      const [userCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(userCompanies)
            .values({
              address: data.address,
              email: data.email,
              districtId: data.districtId,
              kbliId: data.kbliId,
              maleWorkers: Number(data.maleWorkers),
              femaleWorkers: Number(data.femaleWorkers),
              name: data.name,
              provinceId: data.provinceId,
              regencyId: data.regencyId,
              userId,
              villageId: data.villageId,
              healthFacilityAvailable: data.healthFacilityAvailable,
              wlkpStatus: data.wlkpStatus,
              wlkp: data.wlkp,
              responsibleTestingPerson: data.responsibleTestingPerson,
              responsibleTestingPersonEmail: data.responsibleTestingPersonEmail,
              responsibleTestingPersonPhone: data.responsibleTestingPersonPhone,
              companyPictureFileName: filename,
              companyPictureUrl: url,
            })
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error creating userCompany", { error, data });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data perusahaan",
          });
        },
      });

      if (!userCompany) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat data perusahaan",
        });
      }

      return userCompany;
    });
  },

  userUpdateUserCompany(
    userId: string,
    data: z.infer<typeof userCompanySchema.updateUserCompanySchema>,
    filename?: string,
    url?: string
  ) {
    return Effect.gen(this, function* () {
      const existingUserCompany = yield* userCompanyQueries.getUserCompanyById(
        data.id
      );

      if (!existingUserCompany) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Perusahaan tidak ditemukan.",
          })
        );
      }

      if (data.name && data.name !== existingUserCompany.name) {
        const isExisting = yield* userCompanyQueries.getUserCompanyNameByUserId(
          userId,
          data.name
        );

        if (isExisting) {
          return yield* Effect.fail(
            new TRPCError({
              code: "CONFLICT",
              message:
                "Perusahaan dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
            })
          );
        }
      }

      if (existingUserCompany.userId !== userId) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message:
              "Anda tidak memiliki izin untuk memperbarui perusahaan ini.",
          })
        );
      }

      if (
        existingUserCompany.companyPictureFileName &&
        existingUserCompany.companyPictureUrl
      ) {
        yield* storageService.delete(
          `company-pictures/${existingUserCompany.companyPictureFileName}`
        );
      }

      const [updatedUserCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanies)
            .set({
              address: data.address ?? existingUserCompany.address,
              email: data.email ?? existingUserCompany.email,
              districtId: data.districtId ?? existingUserCompany.districtId,
              kbliId: data.kbliId ?? existingUserCompany.kbliId,
              maleWorkers:
                data.maleWorkers !== undefined
                  ? Number(data.maleWorkers)
                  : existingUserCompany.maleWorkers,
              femaleWorkers:
                data.femaleWorkers !== undefined
                  ? Number(data.femaleWorkers)
                  : existingUserCompany.femaleWorkers,
              name: data.name ?? existingUserCompany.name,
              provinceId: data.provinceId ?? existingUserCompany.provinceId,
              regencyId: data.regencyId ?? existingUserCompany.regencyId,
              userId: existingUserCompany.userId,
              villageId: data.villageId ?? existingUserCompany.villageId,
              healthFacilityAvailable:
                data.healthFacilityAvailable ??
                existingUserCompany.healthFacilityAvailable,
              wlkpStatus: data.wlkpStatus ?? existingUserCompany.wlkpStatus,
              wlkp: data.wlkp ?? existingUserCompany.wlkp,
              responsibleTestingPerson:
                data.responsibleTestingPerson ??
                existingUserCompany.responsibleTestingPerson,
              responsibleTestingPersonEmail:
                data.responsibleTestingPersonEmail ??
                existingUserCompany.responsibleTestingPersonEmail,
              responsibleTestingPersonPhone:
                data.responsibleTestingPersonPhone ??
                existingUserCompany.responsibleTestingPersonPhone,
              companyPictureFileName:
                filename ?? existingUserCompany.companyPictureFileName,
              companyPictureUrl: url ?? existingUserCompany.companyPictureUrl,
            })
            .where(eq(userCompanies.id, data.id))
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error updating userCompany", { error, data });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data perusahaan",
          });
        },
      });

      if (!updatedUserCompany) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui data perusahaan",
        });
      }

      return updatedUserCompany;
    });
  },

  userDeleteUserCompany(userId: string, id: string) {
    return Effect.gen(this, function* () {
      const existingUserCompany = yield* userCompanyQueries.getUserCompanyById(
        id
      );

      if (!existingUserCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perusahaan tidak ditemukan.",
        });
      }

      if (existingUserCompany.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Anda tidak memiliki izin untuk menghapus perusahaan ini.",
        });
      }

      const [deletedUserCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanies)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(userCompanies.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error deleting userCompany", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data perusahaan",
          });
        },
      });

      if (!deletedUserCompany) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus data perusahaan",
        });
      }

      return deletedUserCompany;
    });
  },

  deleteUserCompany(id: string) {
    return Effect.gen(this, function* () {
      const existingUserCompany = yield* userCompanyQueries.getUserCompanyById(
        id
      );

      if (!existingUserCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perusahaan tidak ditemukan.",
        });
      }

      const [deletedUserCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanies)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(userCompanies.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error deleting userCompany", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data perusahaan",
          });
        },
      });

      if (!deletedUserCompany) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus data perusahaan",
        });
      }

      return deletedUserCompany;
    });
  },

  userRestoreUserCompany(userId: string, id: string) {
    return Effect.gen(this, function* () {
      const deletedUserCompany =
        yield* userCompanyQueries.getDeletedUserCompanyById(id);

      if (!deletedUserCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perusahaan yang dihapus tidak ditemukan.",
        });
      }

      if (deletedUserCompany.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Anda tidak memiliki izin untuk mengembalikan perusahaan ini.",
        });
      }

      const [restoredUserCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanies)
            .set({ deletedAt: null })
            .where(eq(userCompanies.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error restoring userCompany", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data perusahaan",
          });
        },
      });

      if (!restoredUserCompany) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan data perusahaan",
        });
      }

      return restoredUserCompany;
    });
  },

  restoreUserCompany(id: string) {
    return Effect.gen(this, function* () {
      const deletedUserCompany =
        yield* userCompanyQueries.getDeletedUserCompanyById(id);

      if (!deletedUserCompany) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Perusahaan yang dihapus tidak ditemukan.",
        });
      }

      const [restoredUserCompany] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanies)
            .set({ deletedAt: null })
            .where(eq(userCompanies.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error restoring userCompany", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data perusahaan",
          });
        },
      });

      if (!restoredUserCompany) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan data perusahaan",
        });
      }

      return restoredUserCompany;
    });
  },
};

export default userCompanyQueries;
