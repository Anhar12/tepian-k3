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
  inArray,
  isNotNull,
  isNull,
  sql,
} from "@tepian-k3/db";
import {
  chemicalMaterials,
  parameterChemicalMaterials,
  parameters,
} from "@tepian-k3/db/schema";
import { z } from "zod";
import chemicalMaterialSchema from "@tepian-k3/schema/chemical-material.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const chemicalMaterialQueries = {
  /**
   * Get all chemical materials (without pagination)
   */
  getAllChemicalMaterials() {
    return Effect.tryPromise({
      try: () =>
        db.query.chemicalMaterials.findMany({
          where: isNull(chemicalMaterials.deletedAt),
          orderBy: [asc(chemicalMaterials.name)],
        }),
      catch: (error) => {
        logError(
          "chemicalMaterialQueries.getAllChemicalMaterials",
          "Error fetching all chemical materials",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia",
        });
      },
    });
  },

  /**
   * Get chemical material by ID
   */
  getChemicalMaterialById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.chemicalMaterials.findFirst({
          where: and(
            eq(chemicalMaterials.id, id),
            isNull(chemicalMaterials.deletedAt),
          ),
          with: {
            parameters: {
              with: {
                parameter: {
                  with: {
                    category: {
                      with: {
                        cluster: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "chemicalMaterialQueries.getChemicalMaterialById",
          "Error fetching chemical material by ID",
          { error, id },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia",
        });
      },
    }).pipe(
      Effect.flatMap((material) =>
        material
          ? Effect.succeed(material)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Bahan kimia tidak ditemukan",
              }),
            ),
      ),
    );
  },

  /**
   * Get deleted chemical material by ID
   */
  getDeletedChemicalMaterialById(id: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.chemicalMaterials.findFirst({
          where: and(
            eq(chemicalMaterials.id, id),
            isNotNull(chemicalMaterials.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "chemicalMaterialQueries.getDeletedChemicalMaterialById",
          "Error fetching deleted chemical material by ID",
          { error, id },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia yang dihapus",
        });
      },
    }).pipe(
      Effect.flatMap((material) =>
        material
          ? Effect.succeed(material)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Bahan kimia yang dihapus tidak ditemukan",
              }),
            ),
      ),
    );
  },

  /**
   * Get chemical material by code
   */
  getChemicalMaterialByCode(code: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.chemicalMaterials.findFirst({
          where: and(
            eq(chemicalMaterials.code, code),
            isNull(chemicalMaterials.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "chemicalMaterialQueries.getChemicalMaterialByCode",
          "Error fetching chemical material by code",
          { error, code },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia",
        });
      },
    }).pipe(
      Effect.flatMap((material) =>
        material ? Effect.succeed(material) : Effect.succeed(null),
      ),
    );
  },

  /**
   * Get paginated chemical materials
   */
  getOffsetPaginatedChemicalMaterials(
    input: z.infer<typeof chemicalMaterialSchema.getAllChemicalMaterialsSchema>,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: chemicalMaterials,
            filters: input.filters as ExtendedColumnFilter<
              typeof chemicalMaterials
            >[],
            joinOperator: "and",
          })
        : and(
            input.name
              ? ilike(chemicalMaterials.name, `%${input.name}%`)
              : undefined,
            input.code
              ? ilike(chemicalMaterials.code, `%${input.code}%`)
              : undefined,
            input.status
              ? eq(chemicalMaterials.status, input.status)
              : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        chemicalMaterials.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        chemicalMaterials.createdAt,
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
              ? isNotNull(chemicalMaterials.deletedAt)
              : isNull(chemicalMaterials.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(chemicalMaterials[item.id])
                : asc(chemicalMaterials[item.id]),
            )
          : [desc(chemicalMaterials.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(chemicalMaterials)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(chemicalMaterials)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "chemicalMaterialQueries.getOffsetPaginatedChemicalMaterials",
            "Error fetching paginated chemical materials",
            { error, input },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data bahan kimia",
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

  /**
   * Get chemical materials by parameter IDs
   * Used in worksheet to show relevant chemical materials
   */
  getChemicalMaterialsByParameterIds(parameterIds: string[]) {
    return Effect.tryPromise({
      try: async () => {
        if (parameterIds.length === 0) return [];

        // Get chemical materials linked to the given parameters
        const results = await db
          .select({
            ...getTableColumns(chemicalMaterials),
            parameterId: parameterChemicalMaterials.parameterId,
          })
          .from(chemicalMaterials)
          .innerJoin(
            parameterChemicalMaterials,
            eq(
              chemicalMaterials.id,
              parameterChemicalMaterials.chemicalMaterialId,
            ),
          )
          .where(
            and(
              inArray(parameterChemicalMaterials.parameterId, parameterIds),
              isNull(chemicalMaterials.deletedAt),
            ),
          )
          .orderBy(asc(chemicalMaterials.name));

        return results;
      },
      catch: (error) => {
        logError(
          "chemicalMaterialQueries.getChemicalMaterialsByParameterIds",
          "Error fetching chemical materials by parameter IDs",
          { error, parameterIds },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia berdasarkan parameter",
        });
      },
    });
  },

  /**
   * Get chemical materials for worksheet
   * Returns chemical materials related to parameters in the worksheet
   */
  getChemicalMaterialsForWorksheet(worksheetId: string) {
    return Effect.tryPromise({
      try: async () => {
        // First get worksheet items to get parameter IDs
        const worksheetItems = await db.query.worksheetItems.findMany({
          where: (items, { eq }) => eq(items.worksheetId, worksheetId),
          columns: {
            parameterId: true,
          },
        });

        const parameterIds = worksheetItems.map((item) => item.parameterId);

        if (parameterIds.length === 0) return [];

        // Get chemical materials linked to these parameters with parameter name
        const results = await db
          .select({
            ...getTableColumns(chemicalMaterials),
            parameterName: parameters.name,
          })
          .from(chemicalMaterials)
          .innerJoin(
            parameterChemicalMaterials,
            eq(
              chemicalMaterials.id,
              parameterChemicalMaterials.chemicalMaterialId,
            ),
          )
          .innerJoin(
            parameters,
            eq(parameterChemicalMaterials.parameterId, parameters.id),
          )
          .where(
            and(
              inArray(parameterChemicalMaterials.parameterId, parameterIds),
              isNull(chemicalMaterials.deletedAt),
            ),
          )
          .orderBy(asc(chemicalMaterials.name), asc(parameters.name));

        return results;
      },
      catch: (error) => {
        logError(
          "chemicalMaterialQueries.getChemicalMaterialsForWorksheet",
          "Error fetching chemical materials for worksheet",
          { error, worksheetId },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia untuk worksheet",
        });
      },
    });
  },

  /**
   * Create chemical material
   */
  createChemicalMaterial(
    data: z.infer<typeof chemicalMaterialSchema.createChemicalMaterialSchema>,
  ) {
    return Effect.gen(this, function* () {
      const existingMaterial = yield* this.getChemicalMaterialByCode(data.code);

      if (existingMaterial) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Bahan kimia dengan kode tersebut sudah ada",
        });
      }

      const [newMaterial] = yield* Effect.tryPromise({
        try: () =>
          db.insert(chemicalMaterials).values(data).returning().execute(),
        catch: (error) => {
          logError(
            "chemicalMaterialQueries.createChemicalMaterial",
            "Error creating chemical material",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat bahan kimia baru",
            cause: error,
          });
        },
      });

      if (!newMaterial) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat bahan kimia baru",
          }),
        );
      }

      return newMaterial;
    });
  },

  /**
   * Update chemical material
   */
  updateChemicalMaterial(
    data: z.infer<typeof chemicalMaterialSchema.updateChemicalMaterialSchema>,
  ) {
    return Effect.gen(this, function* () {
      yield* this.getChemicalMaterialById(data.id);

      const [updatedMaterial] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(chemicalMaterials)
            .set({
              ...data,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(chemicalMaterials.id, data.id))
            .returning()
            .execute(),
        catch: (error) => {
          logError(
            "chemicalMaterialQueries.updateChemicalMaterial",
            "Error updating chemical material",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui bahan kimia",
            cause: error,
          });
        },
      });

      if (!updatedMaterial) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui bahan kimia",
          }),
        );
      }

      return updatedMaterial;
    });
  },

  /**
   * Delete chemical material (soft delete)
   */
  deleteChemicalMaterial(id: string) {
    return Effect.gen(this, function* () {
      yield* this.getChemicalMaterialById(id);

      const [deletedMaterial] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(chemicalMaterials)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(chemicalMaterials.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logError(
            "chemicalMaterialQueries.deleteChemicalMaterial",
            "Error deleting chemical material",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus bahan kimia",
            cause: error,
          });
        },
      });

      if (!deletedMaterial) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus bahan kimia",
          }),
        );
      }

      return deletedMaterial;
    });
  },

  /**
   * Restore chemical material
   */
  restoreChemicalMaterial(id: string) {
    return Effect.gen(this, function* () {
      yield* this.getDeletedChemicalMaterialById(id);

      const [restoredMaterial] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(chemicalMaterials)
            .set({ deletedAt: null })
            .where(eq(chemicalMaterials.id, id))
            .returning()
            .execute(),
        catch: (error) => {
          logError(
            "chemicalMaterialQueries.restoreChemicalMaterial",
            "Error restoring chemical material",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan bahan kimia",
            cause: error,
          });
        },
      });

      if (!restoredMaterial) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan bahan kimia",
          }),
        );
      }

      return restoredMaterial;
    });
  },
};

export default chemicalMaterialQueries;
