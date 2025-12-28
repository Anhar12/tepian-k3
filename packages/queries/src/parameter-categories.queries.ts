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
import { parameterCategories } from "@tepian-k3/db/schema";
import { z } from "zod";
import parameterCategoriesSchema from "@tepian-k3/schema/parameter-categories.schema";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const parameterCategoriesQueries = {
  getParameterCategoryById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.parameterCategories.findFirst({
          where: eq(parameterCategories.id, id),
        }),
      catch: (error) => {
        logger.error("Error fetching parameter category by ID", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kategori parameter berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((parameterCategory) =>
        parameterCategory
          ? Effect.succeed(parameterCategory)
          : Effect.succeed(null)
      )
    );
  },

  getDeletedParameterCategoryById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.parameterCategories.findFirst({
          where: and(
            eq(parameterCategories.id, id),
            isNotNull(parameterCategories.deletedAt)
          ),
        }),
      catch: (error) => {
        logger.error("Error fetching deleted parameter category by ID", {
          error,
        });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mengambil data kategori parameter terhapus berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((parameterCategory) =>
        parameterCategory
          ? Effect.succeed(parameterCategory)
          : Effect.succeed(null)
      )
    );
  },

  getParameterCategoryByName(name: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.parameterCategories.findFirst({
          where: eq(parameterCategories.name, name),
        }),
      catch: (error) => {
        logger.error("Error fetching parameter category by name", { error });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kategori parameter berdasarkan nama",
        });
      },
    }).pipe(
      Effect.flatMap((parameterCategory) =>
        parameterCategory
          ? Effect.succeed(parameterCategory)
          : Effect.succeed(null)
      )
    );
  },

  getOffsetPaginatedParameterCategories(
    input: z.infer<
      typeof parameterCategoriesSchema.getAllParameterCategoriesSchema
    >
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: parameterCategories,
            filters: input.filters as ExtendedColumnFilter<
              typeof parameterCategories
            >[],
            joinOperator: "and",
          })
        : and(
            input.name
              ? ilike(parameterCategories.name, `%${input.name}%`)
              : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        parameterCategories.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        parameterCategories.createdAt,
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
              ? isNotNull(parameterCategories.deletedAt)
              : isNull(parameterCategories.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(parameterCategories[item.id])
                : asc(parameterCategories[item.id])
            )
          : [desc(parameterCategories.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(parameterCategories)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(parameterCategories)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logger.error("Error fetching paginated clusters", {
            error,
            input,
          });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data cluster`,
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

  createParameterCategory(
    data: z.infer<
      typeof parameterCategoriesSchema.createParameterCategorySchema
    >
  ) {
    return Effect.gen(this, function* () {
      const isExisting = yield* this.getParameterCategoryByName(data.name);

      if (isExisting) {
        return Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message: "Kategori parameter dengan nama tersebut sudah ada.",
          })
        );
      }

      const [parameterCategory] = yield* Effect.tryPromise({
        try: () => db.insert(parameterCategories).values(data).returning(),
        catch: (error) => {
          logger.error("Error creating parameter category", { error, data });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat kategori parameter baru",
          });
        },
      });

      if (!parameterCategory) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat kategori parameter baru",
          })
        );
      }

      return parameterCategory;
    });
  },

  updateParameterCategory(
    data: z.infer<
      typeof parameterCategoriesSchema.updateParameterCategorySchema
    >
  ) {
    return Effect.gen(this, function* () {
      const parameterCategory = yield* this.getParameterCategoryById(data.id);

      if (!parameterCategory) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kategori parameter tidak ditemukan.",
          })
        );
      }

      if (data.name && data.name !== parameterCategory.name) {
        const isNameTaken = yield* this.getParameterCategoryByName(data.name);

        if (isNameTaken) {
          return Effect.fail(
            new TRPCError({
              code: "CONFLICT",
              message: "Kategori parameter dengan nama tersebut sudah ada.",
            })
          );
        }
      }

      const [updatedParameterCategory] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(parameterCategories)
            .set({
              name: data.name ?? parameterCategory.name,
              description: data.description ?? parameterCategory.description,
            })
            .where(eq(parameterCategories.id, data.id))
            .returning(),
        catch: (error) => {
          logger.error("Error updating parameter category", { error, data });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui kategori parameter",
          });
        },
      });

      if (!updatedParameterCategory) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui kategori parameter",
          })
        );
      }

      return updatedParameterCategory;
    });
  },

  deleteParameterCategory(id: string) {
    return Effect.gen(this, function* () {
      const isExisting = yield* this.getParameterCategoryById(id);

      if (!isExisting) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kategori parameter tidak ditemukan.",
          })
        );
      }

      const [deletedParameterCategory] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(parameterCategories)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(parameterCategories.id, id))
            .returning(),
        catch: (error) => {
          logger.error("Error deleting parameter category", { error, id });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus kategori parameter",
          });
        },
      });

      if (!deletedParameterCategory) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus kategori parameter",
          })
        );
      }

      return deletedParameterCategory;
    });
  },

  restoreParameterCategory(id: string) {
    return Effect.gen(this, function* () {
      const isExisting = yield* this.getDeletedParameterCategoryById(id);

      if (!isExisting) {
        return Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kategori parameter terhapus tidak ditemukan.",
          })
        );
      }

      const [restoredParameterCategory] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(parameterCategories)
            .set({ deletedAt: null })
            .where(eq(parameterCategories.id, id))
            .returning(),
        catch: (error) => {
          logger.error("Error restoring parameter category", { error, id });
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan kategori parameter",
          });
        },
      });

      if (!restoredParameterCategory) {
        return Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan kategori parameter",
          })
        );
      }

      return restoredParameterCategory;
    });
  },
};

export default parameterCategoriesQueries;
