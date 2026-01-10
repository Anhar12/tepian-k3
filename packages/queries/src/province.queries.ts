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
import { provinces } from "@tepian-k3/db/schema";
import { z } from "zod";
import provinceSchema from "@tepian-k3/schema/province.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const provinceQueries = {
  getAllProvinces() {
    return Effect.tryPromise({
      try: () =>
        db.query.provinces.findMany({
          where: isNull(provinces.deletedAt),
        }),
      catch: (error) => {
        logError("provinceQueries.getAllProvinces", "Failed to get provinces", {
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data provinsi",
        });
      },
    });
  },

  getProvinceById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.provinces.findFirst({
          where: and(eq(provinces.id, id), isNull(provinces.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "provinceQueries.getProvinceById",
          "Failed to get province by ID",
          {
            id,
            error,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data provinsi berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((province) =>
        province ? Effect.succeed(province) : Effect.succeed(null)
      )
    );
  },

  getDeletedProvinceById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.provinces.findFirst({
          where: and(eq(provinces.id, id), isNotNull(provinces.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "provinceQueries.getDeletedProvinceById",
          "Failed to get deleted province by ID",
          {
            id,
            error,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data provinsi terhapus berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((province) =>
        province ? Effect.succeed(province) : Effect.succeed(null)
      )
    );
  },

  getProvinceByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.provinces.findFirst({
          where: eq(provinces.name, name),
        }),
      catch: (error) => {
        logError(
          "provinceQueries.getProvinceByName",
          "Failed to get province by name",
          { name, error }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data provinsi berdasarkan nama",
        });
      },
    }).pipe(
      Effect.flatMap((province) =>
        province ? Effect.succeed(province) : Effect.succeed(null)
      )
    );
  },

  getOffsetPaginatedProvince(
    input: z.infer<typeof provinceSchema.getAllProvincesSchema>
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: provinces,
            filters: input.filters as ExtendedColumnFilter<typeof provinces>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(provinces.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        provinces.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        provinces.createdAt,
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
              ? isNotNull(provinces.deletedAt)
              : isNull(provinces.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(provinces[item.id]) : asc(provinces[item.id])
            )
          : [desc(provinces.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(provinces)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(provinces)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "provinceQueries.getOffsetPaginatedProvince",
            "Failed to get paginated provinces",
            {
              error,
              input,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data provinsi`,
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

  createProvince(data: z.infer<typeof provinceSchema.createProvinceSchema>) {
    return Effect.gen(this, function* () {
      const isExisting = yield* this.getProvinceByName(data.name);

      if (isExisting) {
        return yield* Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message:
              "Provinsi dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
          })
        );
      }

      const [province] = yield* Effect.tryPromise({
        try: () => db.insert(provinces).values(data).returning(),
        catch: (error) => {
          logError(
            "provinceQueries.createProvince",
            "Error creating province",
            {
              error,
              data,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data provinsi",
          });
        },
      });

      if (!province) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data provinsi",
          })
        );
      }

      return province;
    });
  },

  updateProvince(data: z.infer<typeof provinceSchema.updateProvinceSchema>) {
    return Effect.gen(this, function* () {
      const province = yield* this.getProvinceById(data.id);

      if (!province) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Provinsi tidak ditemukan",
          })
        );
      }

      const [updatedProvince] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(provinces)
            .set(data)
            .where(eq(provinces.id, data.id))
            .returning(),
        catch: (error) => {
          logError(
            "provinceQueries.updateProvince",
            "Error updating province",
            {
              error,
              data,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data provinsi",
          });
        },
      });

      if (!updatedProvince) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data provinsi",
          })
        );
      }

      return updatedProvince;
    });
  },

  deleteProvince(id: string) {
    return Effect.gen(this, function* () {
      const province = yield* this.getProvinceById(id);

      if (!province) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Provinsi tidak ditemukan",
          })
        );
      }

      const [deletedProvince] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(provinces)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(provinces.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "provinceQueries.deleteProvince",
            "Error deleting province",
            {
              error,
              id,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data provinsi",
          });
        },
      });

      if (!deletedProvince) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data provinsi",
          })
        );
      }

      return deletedProvince;
    });
  },

  restoreProvince(id: string) {
    return Effect.gen(this, function* () {
      const province = yield* this.getDeletedProvinceById(id);

      if (!province) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Provinsi terhapus tidak ditemukan",
          })
        );
      }

      const [restoredProvince] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(provinces)
            .set({ deletedAt: null })
            .where(eq(provinces.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "provinceQueries.restoreProvince",
            "Error restoring province",
            {
              error,
              id,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data provinsi",
          });
        },
      });

      if (!restoredProvince) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data provinsi",
          })
        );
      }
      return restoredProvince;
    });
  },
};

export default provinceQueries;
