import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
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
import { regencies } from "@tepian-k3/db/schema";
import { z } from "zod";
import regencySchema from "@tepian-k3/schema/platform/regency.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const regencyQueries = {
  getAllRegencies() {
    return Effect.tryPromise({
      try: () =>
        db.query.regencies.findMany({
          where: isNull(regencies.deletedAt),
        }),
      catch: (error) => {
        logError(
          "regencyQueries.getAllRegencies",
          "Failed to get all regencies",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data Kabupaten/Kota",
        });
      },
    });
  },

  getAllRegenciesByProvinceId(provinceId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.regencies.findMany({
          where: and(
            eq(regencies.provinceId, provinceId),
            isNull(regencies.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "regencyQueries.getAllRegenciesByProvinceId",
          "Failed to get all regencies by province ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Kabupaten/Kota berdasarkan ID Provinsi",
        });
      },
    });
  },

  getRegencyById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.regencies.findFirst({
          where: and(eq(regencies.id, id), isNull(regencies.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "regencyQueries.getRegencyById",
          "Failed to get regency by ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data Kabupaten/Kota berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((regency) =>
        regency ? Effect.succeed(regency) : Effect.succeed(null),
      ),
    );
  },

  getDeletedRegencyById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.regencies.findFirst({
          where: and((eq(regencies.id, id), isNotNull(regencies.deletedAt))),
        }),
      catch: (error) => {
        logError(
          "regencyQueries.getDeletedRegencyById",
          "Failed to get deleted regency by ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Kabupaten/Kota yang sudah dihapus berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((regency) =>
        regency ? Effect.succeed(regency) : Effect.succeed(null),
      ),
    );
  },

  getRegencyByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.regencies.findFirst({
          where: eq(regencies.name, name),
        }),
      catch: (error) => {
        logError(
          "regencyQueries.getRegencyByName",
          "Failed to get regency by name",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data Kabupaten/Kota berdasarkan nama",
        });
      },
    }).pipe(
      Effect.flatMap((regency) =>
        regency ? Effect.succeed(regency) : Effect.succeed(null),
      ),
    );
  },

  getOffsetPaginationRegencies(
    input: z.infer<typeof regencySchema.getAllRegenciesSchema>,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: regencies,
            filters: input.filters as ExtendedColumnFilter<typeof regencies>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(regencies.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        regencies.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        regencies.createdAt,
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
              ? isNotNull(regencies.deletedAt)
              : isNull(regencies.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(regencies[item.id]) : asc(regencies[item.id]),
            )
          : [desc(regencies.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(regencies)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(regencies)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "regencyQueries.getOffsetPaginationRegencies",
            "Error fetching paginated regencies",
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

  createRegency(data: z.infer<typeof regencySchema.createRegencySchema>) {
    return Effect.gen(this, function* () {
      const isExisting = yield* regencyQueries.getRegencyByName(data.name);

      if (isExisting) {
        return yield* Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message:
              "Kabupaten/Kota dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
          }),
        );
      }

      const [createdRegency] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(regencies)
            .values({
              name: data.name,
              provinceId: data.provinceId,
            })
            .returning(),
        catch: (error) => {
          logError("regencyQueries.createRegency", "Error creating regency", {
            error,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data Kabupaten/Kota.",
          });
        },
      });

      if (!createdRegency) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data Kabupaten/Kota.",
          }),
        );
      }

      return createdRegency;
    });
  },

  updateRegency(data: z.infer<typeof regencySchema.updateRegencySchema>) {
    return Effect.gen(this, function* () {
      const existingRegency = yield* regencyQueries.getRegencyById(data.id);

      if (!existingRegency) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kabupaten/Kota tidak ditemukan.",
          }),
        );
      }

      const [updatedRegency] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(regencies)
            .set({
              name: data.name,
              provinceId: data.provinceId,
            })
            .where(eq(regencies.id, data.id))
            .returning(),
        catch: (error) => {
          logError("regencyQueries.updateRegency", "Error updating regency", {
            error,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data Kabupaten/Kota.",
          });
        },
      });

      if (!updatedRegency) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data Kabupaten/Kota.",
          }),
        );
      }

      return updatedRegency;
    });
  },

  deleteRegency(id: string) {
    return Effect.gen(this, function* () {
      const existingRegency = yield* regencyQueries.getRegencyById(id);

      if (!existingRegency) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kabupaten/Kota tidak ditemukan.",
          }),
        );
      }

      const [deletedRegency] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(regencies)
            .set({
              deletedAt: new Date().toISOString(),
            })
            .where(eq(regencies.id, id))
            .returning(),
        catch: (error) => {
          logError("regencyQueries.deleteRegency", "Error deleting regency", {
            error,
            id,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data Kabupaten/Kota.",
          });
        },
      });

      if (!deletedRegency) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data Kabupaten/Kota.",
          }),
        );
      }

      return deletedRegency;
    });
  },

  restoreRegency(id: string) {
    return Effect.gen(this, function* () {
      const deletedRegency = yield* regencyQueries.getDeletedRegencyById(id);

      if (!deletedRegency) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kabupaten/Kota yang dihapus tidak ditemukan.",
          }),
        );
      }

      const [restoredRegency] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(regencies)
            .set({
              deletedAt: null,
            })
            .where(eq(regencies.id, id))
            .returning(),

        catch: (error) => {
          logError("regencyQueries.restoreRegency", "Error restoring regency", {
            error,
            id,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data Kabupaten/Kota yang dihapus.",
          });
        },
      });

      if (!restoredRegency) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data Kabupaten/Kota yang dihapus.",
          }),
        );
      }

      return restoredRegency;
    });
  },
};

export default regencyQueries;
