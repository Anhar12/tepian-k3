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
import { districts } from "@tepian-k3/db/schema";
import { z } from "zod";
import districSchema from "@tepian-k3/schema/district.schema";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const districtQueries = {
  getAllDistricts() {
    return Effect.tryPromise({
      try: () =>
        db.query.districts.findMany({
          where: isNull(districts.deletedAt),
        }),
      catch: (error) => {
        logger.error("Error fetching districts", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch districts",
        });
      },
    });
  },

  getClusterById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.districts.findFirst({
          where: and((eq(districts.id, id), isNull(districts.deletedAt))),
        }),
      catch: (error) => {
        logger.error("Error fetching district by ID", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch district by ID",
        });
      },
    }).pipe(
      Effect.flatMap((district) =>
        district ? Effect.succeed(district) : Effect.succeed(null)
      )
    );
  },

  getDeletedClusterById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.districts.findFirst({
          where: and((eq(districts.id, id), isNotNull(districts.deletedAt))),
        }),
      catch: (error) => {
        logger.error("Error fetching deleted district by ID", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch deleted district by ID",
        });
      },
    }).pipe(
      Effect.flatMap((district) =>
        district ? Effect.succeed(district) : Effect.succeed(null)
      )
    );
  },

  getClusterByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.districts.findFirst({
          where: eq(districts.name, name),
        }),
      catch: (error) => {
        logger.error("Error fetching district by name", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch district by name",
        });
      },
    }).pipe(
      Effect.flatMap((district) =>
        district ? Effect.succeed(district) : Effect.succeed(null)
      )
    );
  },

  getOffsetPaginatedDistricts(
    input: z.infer<typeof districSchema.getAllDistrictsSchema>
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: districts,
            filters: input.filters as ExtendedColumnFilter<typeof districts>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(districts.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        districts.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        districts.createdAt,
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
              ? isNotNull(districts.deletedAt)
              : isNull(districts.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(districts[item.id]) : asc(districts[item.id])
            )
          : [desc(districts.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(districts)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(districts)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logger.error("Error fetching paginated districts", {
            error,
            input,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data district`,
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

  createDistrict(data: z.infer<typeof districSchema.createDistrictSchema>) {
    return Effect.gen(this, function* () {
      const isExisting = yield* districtQueries.getClusterByName(data.name);

      if (isExisting) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Daerah dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
        });
      }

      const [district] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(districts)
            .values({
              name: data.name,
              regencyId: data.regencyId,
              oldRegencyId: Number(data.oldRegencyId),
            })
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error creating district", { error, data });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data daerah",
          });
        },
      });

      if (!district) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat data daerah",
        });
      }

      return district;
    });
  },

  updateDistrict(data: z.infer<typeof districSchema.updateDistrictSchema>) {
    return Effect.gen(this, function* () {
      const existingDistrict = yield* districtQueries.getClusterById(data.id);

      if (!existingDistrict) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Daerah tidak ditemukan.",
        });
      }

      const [updatedDistrict] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(districts)
            .set({
              name: data.name ?? existingDistrict.name,
              regencyId: data.regencyId ?? existingDistrict.regencyId,
              oldRegencyId:
                data.oldRegencyId !== undefined
                  ? Number(data.oldRegencyId)
                  : existingDistrict.oldRegencyId,
            })
            .where(eq(districts.id, data.id))
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error updating district", { error, data });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data daerah",
          });
        },
      });

      if (!updatedDistrict) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui data daerah",
        });
      }

      return updatedDistrict;
    });
  },

  deleteDistrict(id: string) {
    return Effect.gen(this, function* () {
      const existingDistrict = yield* districtQueries.getClusterById(id);

      if (!existingDistrict) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Daerah tidak ditemukan.",
        });
      }

      const [deletedDistrict] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(districts)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(districts.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error deleting district", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data daerah",
          });
        },
      });

      if (!deletedDistrict) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus data daerah",
        });
      }

      return deletedDistrict;
    });
  },

  restoreDistrict(id: string) {
    return Effect.gen(this, function* () {
      const deletedDistrict = yield* districtQueries.getDeletedClusterById(id);

      if (!deletedDistrict) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Daerah yang dihapus tidak ditemukan.",
        });
      }

      const [restoredDistrict] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(districts)
            .set({ deletedAt: null })
            .where(eq(districts.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logger.error("Error restoring district", { error, id });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data daerah",
          });
        },
      });

      if (!restoredDistrict) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan data daerah",
        });
      }

      return restoredDistrict;
    });
  },
};

export default districtQueries;
