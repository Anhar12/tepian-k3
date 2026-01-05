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
import { villages } from "@tepian-k3/db/schema";
import { z } from "zod";
import villageSchema from "@tepian-k3/schema/village.schema";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const villageQueries = {
  getAllVillages() {
    return Effect.tryPromise({
      try: () =>
        db.query.villages.findMany({
          where: isNull(villages.deletedAt),
        }),
      catch: (error) => {
        logger.error("villageQueries.getAllVillages", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data Desa",
        });
      },
    });
  },

  getAllVillagesByDistrictId(districtId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.villages.findMany({
          where: and(
            eq(villages.districtId, districtId),
            isNull(villages.deletedAt)
          ),
        }),
      catch: (error) => {
        logger.error("villageQueries.getAllVillagesByDistrictId", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data Desa berdasarkan Kecamatan",
        });
      },
    });
  },

  getVillageById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.villages.findFirst({
          where: and(eq(villages.id, id), isNull(villages.deletedAt)),
        }),
      catch: (error) => {
        logger.error("villageQueries.getVillageById", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data Desa berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((village) =>
        village ? Effect.succeed(village) : Effect.succeed(null)
      )
    );
  },

  getDeletedVillageById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.villages.findFirst({
          where: and((eq(villages.id, id), isNotNull(villages.deletedAt))),
        }),
      catch: (error) => {
        logger.error("villageQueries.getDeletedVillageById", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data Desa yang sudah dihapus berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((village) =>
        village ? Effect.succeed(village) : Effect.succeed(null)
      )
    );
  },

  getVillageByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.villages.findFirst({
          where: eq(villages.name, name),
        }),
      catch: (error) => {
        logger.error("villageQueries.getVillageByName", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data Desa berdasarkan nama",
        });
      },
    }).pipe(
      Effect.flatMap((village) =>
        village ? Effect.succeed(village) : Effect.succeed(null)
      )
    );
  },

  getOffsetPaginationVillages(
    input: z.infer<typeof villageSchema.getAllVillagesSchema>
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: villages,
            filters: input.filters as ExtendedColumnFilter<typeof villages>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(villages.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        villages.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        villages.createdAt,
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
              ? isNotNull(villages.deletedAt)
              : isNull(villages.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(villages[item.id]) : asc(villages[item.id])
            )
          : [desc(villages.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(villages)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(villages)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logger.error("Error fetching paginated villages", {
            error,
            input,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data Desa.`,
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

  createVillage(data: z.infer<typeof villageSchema.createVillageSchema>) {
    return Effect.gen(this, function* () {
      const isExisting = yield* villageQueries.getVillageByName(data.name);

      if (isExisting) {
        return yield* Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message:
              "Desa dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
          })
        );
      }

      const [createdVillage] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(villages)
            .values({
              name: data.name,
              districtId: data.districtId,
              oldDistrictId: Number(data.oldDistrictId),
            })
            .returning(),
        catch: (error) => {
          logger.error("villageQueries.createVillage", { error, data });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data Desa.",
          });
        },
      });

      if (!createdVillage) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data Desa.",
          })
        );
      }

      return createdVillage;
    });
  },

  updateVillage(data: z.infer<typeof villageSchema.updateVillageSchema>) {
    return Effect.gen(this, function* () {
      const existingVillage = yield* villageQueries.getVillageById(data.id);

      if (!existingVillage) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Desa tidak ditemukan.",
          })
        );
      }

      const [updatedVillage] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(villages)
            .set({
              name: data.name,
              districtId: data.districtId,
              oldDistrictId: data.oldDistrictId
                ? Number(data.oldDistrictId)
                : existingVillage.oldDistrictId,
            })
            .where(eq(villages.id, data.id))
            .returning(),
        catch: (error) => {
          logger.error("villageQueries.updateVillage", { error, data });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data Desa.",
          });
        },
      });

      if (!updatedVillage) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data Desa.",
          })
        );
      }

      return updatedVillage;
    });
  },

  deleteVillage(id: string) {
    return Effect.gen(this, function* () {
      const existingVillage = yield* villageQueries.getVillageById(id);

      if (!existingVillage) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Desa tidak ditemukan.",
          })
        );
      }

      const [deletedVillage] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(villages)
            .set({
              deletedAt: new Date().toISOString(),
            })
            .where(eq(villages.id, id))
            .returning(),
        catch: (error) => {
          logger.error("villageQueries.deleteVillage", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data Desa.",
          });
        },
      });

      if (!deletedVillage) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data Desa.",
          })
        );
      }

      return deletedVillage;
    });
  },

  restoreVillage(id: string) {
    return Effect.gen(this, function* () {
      const deletedVillage = yield* villageQueries.getDeletedVillageById(id);

      if (!deletedVillage) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Desa yang dihapus tidak ditemukan.",
          })
        );
      }

      const [restoredVillage] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(villages)
            .set({
              deletedAt: null,
            })
            .where(eq(villages.id, id))
            .returning(),

        catch: (error) => {
          logger.error("villageQueries.restoreVillage", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data Desa yang dihapus.",
          });
        },
      });

      if (!restoredVillage) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data Desa yang dihapus.",
          })
        );
      }

      return restoredVillage;
    });
  },
};

export default villageQueries;
