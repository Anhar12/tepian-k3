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
  clusters,
  parameterCategories,
  parameters,
} from "@tepian-k3/db/schema";
import { z } from "zod";
import parameterSchema from "@tepian-k3/schema/pengujian/parameter.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import parameterCategoriesQueries from "./parameter-categories.queries";

const parameterQueries = {
  getParameterById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.parameters.findFirst({
          where: and(eq(parameters.id, id), isNull(parameters.deletedAt)),
          with: {
            category: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "parameterQueries.getParameterById",
          "Failed to fetch parameter by ID",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil parameter berdasarkan ID.",
        });
      },
    }).pipe(
      Effect.flatMap((parameter) =>
        parameter ? Effect.succeed(parameter) : Effect.succeed(null),
      ),
    );
  },

  getDeletedParameterById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.parameters.findFirst({
          where: and(eq(parameters.id, id), isNotNull(parameters.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "parameterQueries.getDeletedParameterById",
          "Failed to fetch deleted parameter by ID",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil parameter yang dihapus berdasarkan ID.",
        });
      },
    }).pipe(
      Effect.flatMap((parameter) =>
        parameter ? Effect.succeed(parameter) : Effect.succeed(null),
      ),
    );
  },

  getOffsetPaginatedParametersByClusterIdAndCategoryId(
    input: z.infer<
      typeof parameterSchema.getByClusterAndParameterCategorySchema
    >,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;

      const where = and(
        input.clusterId
          ? eq(parameterCategories.clusterId, input.clusterId)
          : undefined,
        input.parameterCategoryId
          ? eq(parameters.parameterCategoryId, input.parameterCategoryId)
          : undefined,
        input.name ? ilike(parameters.name, `%${input.name}%`) : undefined,
        isNull(parameters.deletedAt),
      );

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select({
                ...getTableColumns(parameters),
                category: {
                  id: parameterCategories.id,
                  clusterId: parameterCategories.clusterId,
                  name: parameterCategories.name,
                },
                cluster: {
                  id: clusters.id,
                  name: clusters.name,
                },
              })
              .from(parameters)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .innerJoin(
                parameterCategories,
                eq(parameters.parameterCategoryId, parameterCategories.id),
              )
              .innerJoin(
                clusters,
                eq(parameterCategories.clusterId, clusters.id),
              )
              .orderBy(desc(parameters.createdAt));

            const total = await tx
              .select({
                count: count(),
              })
              .from(parameters)
              .innerJoin(
                parameterCategories,
                eq(parameters.parameterCategoryId, parameterCategories.id),
              )
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "parameterQueries.getOffsetPaginatedParametersByClusterIdAndCategoryId",
            "Failed to fetch paginated parameters by cluster and category",
            {
              error,
              input,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data parameter`,
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

  getOffsetPaginatedParameters(
    input: z.infer<typeof parameterSchema.getAllParametersSchema>,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: parameters,
            filters: input.filters as ExtendedColumnFilter<typeof parameters>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(parameters.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        parameters.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        parameters.createdAt,
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
              ? isNotNull(parameters.deletedAt)
              : isNull(parameters.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(parameters[item.id]) : asc(parameters[item.id]),
            )
          : [desc(parameters.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select({
                ...getTableColumns(parameters),
                category: {
                  id: parameterCategories.id,
                  name: parameterCategories.name,
                },
              })
              .from(parameters)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .innerJoin(
                parameterCategories,
                eq(parameters.parameterCategoryId, parameterCategories.id),
              )
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(parameters)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "parameterQueries.getOffsetPaginatedParameters",
            "Failed to fetch paginated parameters",
            { error, input },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data parameter`,
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

  createParameter(data: z.infer<typeof parameterSchema.createParameterSchema>) {
    return Effect.gen(function* () {
      const isCategoryExist =
        yield* parameterCategoriesQueries.getParameterCategoryById(
          data.parameterCategoryId,
        );

      if (!isCategoryExist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kategori parameter tidak ditemukan.",
        });
      }

      const [newParameter] = yield* Effect.tryPromise({
        try: () => db.insert(parameters).values(data).returning(),
        catch: (error) => {
          logError(
            "parameterQueries.createParameter",
            "Failed to create parameter",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat parameter baru.",
          });
        },
      });

      if (!newParameter) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat parameter baru.",
        });
      }

      return newParameter;
    });
  },

  updateParameter(data: z.infer<typeof parameterSchema.updateParameterSchema>) {
    return Effect.gen(function* () {
      const existingParameter = yield* parameterQueries.getParameterById(
        data.id,
      );

      if (!existingParameter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parameter tidak ditemukan.",
        });
      }

      const isCategoryExist =
        yield* parameterCategoriesQueries.getParameterCategoryById(
          data.parameterCategoryId,
        );

      if (!isCategoryExist) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kategori parameter tidak ditemukan.",
        });
      }

      const [updatedParameter] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(parameters)
            .set({
              name: data.name ?? existingParameter.name,
              parameterCategoryId:
                data.parameterCategoryId ??
                existingParameter.parameterCategoryId,
              price: data.price ?? existingParameter.price,
              reference: data.reference ?? existingParameter.reference,
              serviceType: data.serviceType ?? existingParameter.serviceType,
              unit: data.unit ?? existingParameter.unit,
            })
            .where(eq(parameters.id, data.id))
            .returning(),
        catch: (error) => {
          logError(
            "parameterQueries.updateParameter",
            "Failed to update parameter",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui parameter.",
          });
        },
      });

      if (!updatedParameter) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui parameter.",
        });
      }

      return updatedParameter;
    });
  },

  deleteParameter(id: string) {
    return Effect.gen(function* () {
      const existingParameter = yield* parameterQueries.getParameterById(id);

      if (!existingParameter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parameter tidak ditemukan.",
        });
      }

      const [deletedParameter] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(parameters)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(parameters.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "parameterQueries.deleteParameter",
            "Failed to delete parameter",
            { id, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus parameter.",
          });
        },
      });

      if (!deletedParameter) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus parameter.",
        });
      }

      return deletedParameter;
    });
  },

  restoreParameter(id: string) {
    return Effect.gen(function* () {
      const deletedParameter =
        yield* parameterQueries.getDeletedParameterById(id);

      if (!deletedParameter) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parameter yang dihapus tidak ditemukan.",
        });
      }

      const [restoredParameter] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(parameters)
            .set({ deletedAt: null })
            .where(eq(parameters.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "parameterQueries.restoreParameter",
            "Failed to restore parameter",
            { id, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan parameter.",
          });
        },
      });

      if (!restoredParameter) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan parameter.",
        });
      }

      return restoredParameter;
    });
  },

  hardDeleteParameter(id: string) {
    return Effect.tryPromise({
      try: () => db.delete(parameters).where(eq(parameters.id, id)).returning(),
      catch: (error) => {
        logError(
          "parameterQueries.hardDeleteParameter",
          "Failed to hard delete parameter",
          { id, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus permanen parameter",
        });
      },
    });
  },
};

export default parameterQueries;
