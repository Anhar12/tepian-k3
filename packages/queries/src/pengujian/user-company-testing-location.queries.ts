import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  isNull,
} from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { userCompanyTestingLocation } from "@tepian-k3/db/schema";
import userCompanyTestingLocationSchema from "@tepian-k3/schema/pengujian/user-company-testing-location.schema";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { z } from "zod";

const userCompanyTestingLocationQueries = {
  getAllUserCompanyTestingLocations() {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findMany({
          where: isNull(userCompanyTestingLocation.deletedAt),
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getAllUserCompanyTestingLocations",
          "Error fetching all user company testing locations",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data Lokasi Pengujian Perusahaan",
        });
      },
    });
  },

  getAllUserCompanyTestingLocationsByUserId(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findMany({
          where: and(
            eq(userCompanyTestingLocation.userId, userId),
            isNull(userCompanyTestingLocation.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getAllUserCompanyTestingLocationsByUserId",
          "Error fetching all user company testing locations by user ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Lokasi Pengujian Perusahaan berdasarkan User ID",
        });
      },
    });
  },

  getAllUserCompanyTestingLocationsByCompanyIdAndUserId(
    companyId: string,
    userId: string,
    showDeleted: boolean = false,
  ) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findMany({
          where: and(
            eq(userCompanyTestingLocation.userCompanyId, companyId),
            eq(userCompanyTestingLocation.userId, userId),
            showDeleted
              ? isNotNull(userCompanyTestingLocation.deletedAt)
              : isNull(userCompanyTestingLocation.deletedAt),
          ),
          with: {
            regency: {
              columns: {
                id: true,
                name: true,
              },
            },
            district: {
              columns: {
                id: true,
                name: true,
              },
            },
            userCompany: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getAllUserCompanyTestingLocationsByCompanyIdAndUserId",
          "Error fetching all user company testing locations by company ID and user ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Lokasi Pengujian Perusahaan berdasarkan Company ID dan User ID",
        });
      },
    });
  },

  getUserCompanyTestingLocationByUserIdAndCompanyId(
    userId: string,
    companyId: string,
  ) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findMany({
          where: and(
            eq(userCompanyTestingLocation.userId, userId),
            eq(userCompanyTestingLocation.userCompanyId, companyId),
            isNull(userCompanyTestingLocation.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getUserCompanyTestingLocationById",
          "Error fetching user company testing location by user ID and company ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Lokasi Pengujian Perusahaan berdasarkan ID",
        });
      },
    });
  },

  getUserCompanyTestingLocationById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findFirst({
          where: and(
            eq(userCompanyTestingLocation.id, id),
            isNull(userCompanyTestingLocation.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getUserCompanyTestingLocationById",
          "Error fetching user company testing location by ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Lokasi Pengujian Perusahaan berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((userCompanyTestingLocation) =>
        userCompanyTestingLocation
          ? Effect.succeed(userCompanyTestingLocation)
          : Effect.succeed(null),
      ),
    );
  },

  getDeletedUserCompanyTestingLocationById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findFirst({
          where: and(
            (eq(userCompanyTestingLocation.id, id),
            isNotNull(userCompanyTestingLocation.deletedAt)),
          ),
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getDeletedUserCompanyTestingLocationById",
          "Error fetching deleted user company testing location by ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Lokasi Pengujian Perusahaan yang sudah dihapus berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((userCompanyTestingLocation) =>
        userCompanyTestingLocation
          ? Effect.succeed(userCompanyTestingLocation)
          : Effect.succeed(null),
      ),
    );
  },

  getUserCompanyTestingLocationByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findFirst({
          where: eq(userCompanyTestingLocation.name, name),
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getUserCompanyTestingLocationByName",
          "Error fetching user company testing location by name",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Lokasi Pengujian Perusahaan berdasarkan nama",
        });
      },
    }).pipe(
      Effect.flatMap((userCompanyTestingLocation) =>
        userCompanyTestingLocation
          ? Effect.succeed(userCompanyTestingLocation)
          : Effect.succeed(null),
      ),
    );
  },

  getUserCompanyTestingLocationsNameByUserId(userId: string, name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findFirst({
          where: and(
            eq(userCompanyTestingLocation.userId, userId),
            eq(userCompanyTestingLocation.name, name),
          ),
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getUserCompanyTestingLocationsNameByUserId",
          "Error fetching user company testing location by user ID and name",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Lokasi Pengujian Perusahaan berdasarkan User ID dan nama",
        });
      },
    }).pipe(
      Effect.flatMap((userCompanyTestingLocation) =>
        userCompanyTestingLocation
          ? Effect.succeed(userCompanyTestingLocation)
          : Effect.succeed(null),
      ),
    );
  },

  getUserCompanyTestingLocationsNameByUserIdAndCompanyId(
    userId: string,
    companyId: string,
    name: string,
  ) {
    return Effect.tryPromise({
      try: () =>
        db.query.userCompanyTestingLocation.findFirst({
          where: and(
            eq(userCompanyTestingLocation.userId, userId),
            eq(userCompanyTestingLocation.userCompanyId, companyId),
            eq(userCompanyTestingLocation.name, name),
          ),
        }),
      catch: (error) => {
        logError(
          "userCompanyTestingLocationQueries.getUserCompanyTestingLocationsNameByUserIdAndCompanyId",
          "Error fetching user company testing location by user ID, company ID, and name",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Lokasi Pengujian Perusahaan berdasarkan User ID, Company ID, dan nama",
        });
      },
    }).pipe(
      Effect.flatMap((userCompanyTestingLocation) =>
        userCompanyTestingLocation
          ? Effect.succeed(userCompanyTestingLocation)
          : Effect.succeed(null),
      ),
    );
  },

  getOffsetPaginationUserCompanyTestingLocationsByUserIdAndCompanyId(
    userId: string,
    companyId: string,
    input: z.infer<
      typeof userCompanyTestingLocationSchema.getAllUserCompanyTestingLocationSchema
    >,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      // append userId and companyId to where clause at input.filters
      input.filters = [
        ...(input.filters || []),
        {
          id: "userId",
          operator: "equals",
          value: userId,
          filterId: "userId",
          variant: "text",
        },
        {
          id: "userCompanyId",
          operator: "equals",
          value: companyId,
          filterId: "userCompanyId",
          variant: "text",
        },
      ];

      const where = advancedTable
        ? filterColumns({
            table: userCompanyTestingLocation,
            filters: input.filters as ExtendedColumnFilter<
              typeof userCompanyTestingLocation
            >[],
            joinOperator: "and",
          })
        : and(
            input.name
              ? ilike(userCompanyTestingLocation.name, `%${input.name}%`)
              : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        userCompanyTestingLocation.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        userCompanyTestingLocation.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                )
              : undefined,
            input.showDeleted
              ? isNotNull(userCompanyTestingLocation.deletedAt)
              : isNull(userCompanyTestingLocation.deletedAt),
            eq(userCompanyTestingLocation.userId, userId),
            eq(userCompanyTestingLocation.userCompanyId, companyId),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(userCompanyTestingLocation[item.id])
                : asc(userCompanyTestingLocation[item.id]),
            )
          : [desc(userCompanyTestingLocation.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(userCompanyTestingLocation)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(userCompanyTestingLocation)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "userCompanyTestingLocationQueries.getOffsetPaginationUserCompanyTestingLocationsByUserIdAndCompanyId",
            "Error fetching paginated user company testing locations by user ID and company ID",
            {
              error,
              input,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data Kabupaten/Kota.`,
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

  getOffsetPaginationUserCompanyTestingLocations(
    input: z.infer<
      typeof userCompanyTestingLocationSchema.getAllUserCompanyTestingLocationSchema
    >,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: userCompanyTestingLocation,
            filters: input.filters as ExtendedColumnFilter<
              typeof userCompanyTestingLocation
            >[],
            joinOperator: "and",
          })
        : and(
            input.name
              ? ilike(userCompanyTestingLocation.name, `%${input.name}%`)
              : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        userCompanyTestingLocation.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        userCompanyTestingLocation.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[1]);
                          date.setHours(23, 59, 59, 999);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                )
              : undefined,
            input.showDeleted
              ? isNotNull(userCompanyTestingLocation.deletedAt)
              : isNull(userCompanyTestingLocation.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(userCompanyTestingLocation[item.id])
                : asc(userCompanyTestingLocation[item.id]),
            )
          : [desc(userCompanyTestingLocation.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(userCompanyTestingLocation)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(userCompanyTestingLocation)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "userCompanyTestingLocationQueries.getOffsetPaginationUserCompanyTestingLocations",
            "Error fetching paginated user company testing locations",
            { error, input },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data Kabupaten/Kota.`,
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

  userCreateUserCompanyTestingLocation(
    userId: string,
    data: z.infer<
      typeof userCompanyTestingLocationSchema.createUserCompanyTestingLocationSchema
    >,
  ) {
    return Effect.gen(this, function* () {
      const isExisting =
        yield* userCompanyTestingLocationQueries.getUserCompanyTestingLocationsNameByUserIdAndCompanyId(
          userId,
          data.userCompanyId,
          data.name,
        );

      if (isExisting) {
        return yield* Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message:
              "Kabupaten/Kota dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
          }),
        );
      }

      const [createdUserCompanyTestingLocation] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(userCompanyTestingLocation)
            .values({
              ...data,
              userId,
            })
            .returning(),
        catch: (error) => {
          logError(
            "userCompanyTestingLocationQueries.createUserCompanyTestingLocation",
            "Error creating user company testing location",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data Kabupaten/Kota.",
          });
        },
      });

      if (!createdUserCompanyTestingLocation) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data Kabupaten/Kota.",
          }),
        );
      }

      return createdUserCompanyTestingLocation;
    });
  },

  userUpdateUserCompanyTestingLocation(
    userId: string,
    data: z.infer<
      typeof userCompanyTestingLocationSchema.updateUserCompanyTestingLocationSchema
    >,
  ) {
    return Effect.gen(this, function* () {
      const existingUserCompanyTestingLocation =
        yield* userCompanyTestingLocationQueries.getUserCompanyTestingLocationById(
          data.id,
        );

      if (!existingUserCompanyTestingLocation) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kabupaten/Kota tidak ditemukan.",
          }),
        );
      }

      if (existingUserCompanyTestingLocation.userId !== userId) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message:
              "Anda tidak memiliki izin untuk memperbarui Kabupaten/Kota ini.",
          }),
        );
      }

      const [updatedUserCompanyTestingLocation] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanyTestingLocation)
            .set({
              ...data,
              userId,
            })
            .where(eq(userCompanyTestingLocation.id, data.id))
            .returning(),
        catch: (error) => {
          logError(
            "userCompanyTestingLocationQueries.updateUserCompanyTestingLocation",
            "Error updating user company testing location",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data Kabupaten/Kota.",
          });
        },
      });

      if (!updatedUserCompanyTestingLocation) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data Kabupaten/Kota.",
          }),
        );
      }

      return updatedUserCompanyTestingLocation;
    });
  },

  userDeleteUserCompanyTestingLocation(userId: string, id: string) {
    return Effect.gen(this, function* () {
      const existingUserCompanyTestingLocation =
        yield* userCompanyTestingLocationQueries.getUserCompanyTestingLocationById(
          id,
        );

      if (!existingUserCompanyTestingLocation) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kabupaten/Kota tidak ditemukan.",
          }),
        );
      }

      if (existingUserCompanyTestingLocation.userId !== userId) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message:
              "Anda tidak memiliki izin untuk menghapus Kabupaten/Kota ini.",
          }),
        );
      }

      const [deletedUserCompanyTestingLocation] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanyTestingLocation)
            .set({
              deletedAt: new Date().toISOString(),
            })
            .where(eq(userCompanyTestingLocation.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "userCompanyTestingLocationQueries.deleteUserCompanyTestingLocation",
            "Error deleting user company testing location",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data Kabupaten/Kota.",
          });
        },
      });

      if (!deletedUserCompanyTestingLocation) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data Kabupaten/Kota.",
          }),
        );
      }

      return deletedUserCompanyTestingLocation;
    });
  },

  userRestoreUserCompanyTestingLocation(userId: string, id: string) {
    return Effect.gen(this, function* () {
      const deletedUserCompanyTestingLocation =
        yield* userCompanyTestingLocationQueries.getDeletedUserCompanyTestingLocationById(
          id,
        );

      if (!deletedUserCompanyTestingLocation) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kabupaten/Kota yang dihapus tidak ditemukan.",
          }),
        );
      }

      if (deletedUserCompanyTestingLocation.userId !== userId) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message:
              "Anda tidak memiliki izin untuk mengembalikan Kabupaten/Kota ini.",
          }),
        );
      }

      const [restoredUserCompanyTestingLocation] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(userCompanyTestingLocation)
            .set({
              deletedAt: null,
            })
            .where(eq(userCompanyTestingLocation.id, id))
            .returning(),

        catch: (error) => {
          logError(
            "userCompanyTestingLocationQueries.restoreUserCompanyTestingLocation",
            "Error restoring user company testing location",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data Kabupaten/Kota yang dihapus.",
          });
        },
      });

      if (!restoredUserCompanyTestingLocation) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data Kabupaten/Kota yang dihapus.",
          }),
        );
      }

      return restoredUserCompanyTestingLocation;
    });
  },
};

export default userCompanyTestingLocationQueries;
