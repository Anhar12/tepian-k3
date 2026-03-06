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
import districSchema from "@tepian-k3/schema/platform/district.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
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
        logError(
          "districtQueries.getAllDistricts",
          "Error fetching all districts",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kecamatan",
        });
      },
    });
  },

  getAllDistrictsByRegencyId(regencyId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.districts.findMany({
          where: and(
            eq(districts.regencyId, regencyId),
            isNull(districts.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "districtQueries.getAllDistrictsByRegencyId",
          "Error fetching districts by regency ID",
          { regencyId, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kecamatan berdasarkan kabupaten",
        });
      },
    });
  },

  getDistrictById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.districts.findFirst({
          where: and(eq(districts.id, id), isNull(districts.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "districtQueries.getDistrictById",
          "Error fetching district by ID",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kecamatan berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((district) =>
        district ? Effect.succeed(district) : Effect.succeed(null),
      ),
    );
  },

  getDeletedDistrictById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.districts.findFirst({
          where: and((eq(districts.id, id), isNotNull(districts.deletedAt))),
        }),
      catch: (error) => {
        logError(
          "districtQueries.getDeletedDistrictById",
          "Error fetching deleted district by ID",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kecamatan yang dihapus",
        });
      },
    }).pipe(
      Effect.flatMap((district) =>
        district ? Effect.succeed(district) : Effect.succeed(null),
      ),
    );
  },

  getDistrictByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.districts.findFirst({
          where: eq(districts.name, name),
        }),
      catch: (error) => {
        logError(
          "districtQueries.getDistrictByName",
          "Error fetching district by name",
          { name, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kecamatan berdasarkan nama",
        });
      },
    }).pipe(
      Effect.flatMap((district) =>
        district ? Effect.succeed(district) : Effect.succeed(null),
      ),
    );
  },

  getOffsetPaginatedDistricts(
    input: z.infer<typeof districSchema.getAllDistrictsSchema>,
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
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        districts.createdAt,
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
              ? isNotNull(districts.deletedAt)
              : isNull(districts.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(districts[item.id]) : asc(districts[item.id]),
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
          logError(
            "districtQueries.getOffsetPaginatedDistricts",
            "Error fetching paginated districts",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data kecamatan`,
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
      const isExisting = yield* districtQueries.getDistrictByName(data.name);

      if (isExisting) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Kecamatan dengan nama tersebut sudah ada atau sudah dihapus sebelumnya.",
        });
      }

      const [district] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(districts)
            .values({
              name: data.name,
              regencyId: data.regencyId,
            })
            .returning()
            .execute(),
        catch: (error) => {
          logError(
            "districtQueries.createDistrict",
            "Error creating district",
            {
              data,
              error,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data kecamatan",
          });
        },
      });

      if (!district) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat data kecamatan",
        });
      }

      return district;
    });
  },

  updateDistrict(data: z.infer<typeof districSchema.updateDistrictSchema>) {
    return Effect.gen(this, function* () {
      const existingDistrict = yield* districtQueries.getDistrictById(data.id);

      if (!existingDistrict) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kecamatan tidak ditemukan.",
        });
      }

      const [updatedDistrict] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(districts)
            .set({
              name: data.name ?? existingDistrict.name,
              regencyId: data.regencyId ?? existingDistrict.regencyId,
            })
            .where(eq(districts.id, data.id))
            .returning()
            .execute(),
        catch: (error) => {
          logError(
            "districtQueries.updateDistrict",
            "Error updating district",
            { data, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data kecamatan",
          });
        },
      });

      if (!updatedDistrict) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui data kecamatan",
        });
      }

      return updatedDistrict;
    });
  },

  deleteDistrict(id: string) {
    return Effect.gen(this, function* () {
      const existingDistrict = yield* districtQueries.getDistrictById(id);

      if (!existingDistrict) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kecamatan tidak ditemukan.",
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
          logError(
            "districtQueries.deleteDistrict",
            "Error deleting district",
            {
              error,
              id,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data kecamatan",
          });
        },
      });

      if (!deletedDistrict) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus data kecamatan",
        });
      }

      return deletedDistrict;
    });
  },

  restoreDistrict(id: string) {
    return Effect.gen(this, function* () {
      const deletedDistrict = yield* districtQueries.getDeletedDistrictById(id);

      if (!deletedDistrict) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kecamatan yang dihapus tidak ditemukan.",
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
          logError(
            "districtQueries.restoreDistrict",
            "Error restoring district",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data kecamatan",
          });
        },
      });

      if (!restoredDistrict) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan data kecamatan",
        });
      }

      return restoredDistrict;
    });
  },
};

export default districtQueries;
