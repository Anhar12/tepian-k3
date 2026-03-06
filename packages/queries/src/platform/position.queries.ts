import { TRPCError } from "@tepian-k3/utils/error";
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
import { positions } from "@tepian-k3/db/schema";
import { z } from "zod";
import positionSchema from "@tepian-k3/schema/platform/position.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";

const positionQueries = {
  /**
   * Fetch all positions without pagination
   */
  getAllPositions: () =>
    Effect.tryPromise({
      try: () =>
        db.query.positions.findMany({
          where: isNull(positions.deletedAt),
        }),
      catch: (error) => {
        logError(
          "positionQueries.getAllPositions",
          "Failed to fetch all positions",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil semua data posisi",
        });
      },
    }),

  /**
   * Fetch position by name
   * @param name - Position name
   * @return Position data or undefined if not found
   */
  getPositionByName: (name: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.positions.findFirst({
          where: ilike(positions.name, name),
        }),
      catch: (error) => {
        logError(
          "positionQueries.getPositionByName",
          `Failed to fetch position with name: ${name}`,
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data posisi dengan nama: ${name}`,
        });
      },
    }),

  /**
   * Fetch position by ID
   * @param id - Position ID
   * @return Position data or undefined if not found
   */
  getPositionById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.positions.findFirst({
          where: and(eq(positions.id, id), isNull(positions.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "positionQueries.getPositionById",
          `Failed to fetch position with ID: ${id}`,
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data posisi dengan ID: ${id}`,
        });
      },
    }),

  /**
   * Fetch deleted by ID
   * @param id - Position ID
   * @return Position data or undefined if not found
   */
  getDeletedPositionById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.positions.findFirst({
          where: and(eq(positions.id, id), isNotNull(positions.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "positionQueries.getDeletedPositionById",
          `Failed to fetch deleted position with ID: ${id}`,
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal mengambil data posisi terhapus dengan ID: ${id}`,
        });
      },
    }),

  /**
   * Fetch positions with pagination, sorting, and filtering
   * @param input - Input parameters for fetching positions
   * @return Paginated list of positions
   */
  getOffsetPaginatedPositions: (
    input: z.infer<typeof positionSchema.getAllPositionsSchema>,
  ) =>
    Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: positions,
            filters: input.filters as ExtendedColumnFilter<typeof positions>[],
            joinOperator: "and",
          })
        : and(
            input.name ? ilike(positions.name, `%${input.name}%`) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        positions.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        positions.createdAt,
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
              ? isNotNull(positions.deletedAt)
              : isNull(positions.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(positions[item.id]) : asc(positions[item.id]),
            )
          : [desc(positions.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(positions)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(positions)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "positionQueries.getOffsetPaginatedPositions",
            "Failed to get all positions with pagination",
            { input, error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data posisi.`,
            cause: error,
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return {
        data,
        pageCount,
      };
    }),

  /**
   * Create a new position
   * @param input - Position data to create
   * @return Created position data
   */
  createPosition: (
    input: z.infer<typeof positionSchema.createPositionSchema>,
  ) =>
    Effect.gen(function* () {
      const isExist = yield* positionQueries.getPositionByName(input.name);

      if (isExist) {
        const errorMessage = isExist.deletedAt
          ? `Posisi dengan nama ${input.name} sudah dihapus. Silakan pulihkan terlebih dahulu.`
          : `Posisi dengan nama ${input.name} sudah ada.`;

        throw new TRPCError({
          code: "CONFLICT",
          message: errorMessage,
        });
      }

      const [result] = yield* Effect.tryPromise({
        try: () => db.insert(positions).values(input).returning(),
        catch: (error) => {
          logError(
            "positionQueries.createPosition",
            `Failed to create position with name: ${input.name}`,
            { error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal membuat posisi dengan nama: ${input.name}`,
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal membuat posisi dengan nama: ${input.name}`,
        });
      }

      return result;
    }),

  /**
   * Update an existing position
   * @param input - Position data to update
   * @return Updated position data
   */
  updatePosition: (
    input: z.infer<typeof positionSchema.updatePositionSchema>,
  ) =>
    Effect.gen(function* () {
      const isExist = yield* positionQueries.getPositionById(input.id);

      if (!isExist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Posisi dengan ID ${input.id} tidak ditemukan.`,
        });
      }

      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(positions)
            .set(input)
            .where(eq(positions.id, input.id))
            .returning(),
        catch: (error) => {
          logError(
            "positionQueries.updatePosition",
            `Failed to update position with ID: ${input.id}`,
            { error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memperbarui posisi dengan ID: ${input.id}`,
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal memperbarui posisi dengan ID: ${input.id}`,
        });
      }

      return result;
    }),

  /**
   * Delete a position by ID (soft delete)
   * @param id - Position ID to delete
   * @return Deleted position data
   */
  deletePosition: (id: string) =>
    Effect.gen(function* () {
      const isExist = yield* positionQueries.getPositionById(id);

      if (!isExist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Posisi dengan ID ${id} tidak ditemukan.`,
        });
      }

      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(positions)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(positions.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "positionQueries.deletePosition",
            `Failed to delete position with ID: ${id}`,
            { error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal menghapus posisi dengan ID: ${id}`,
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal menghapus posisi dengan ID: ${id}`,
        });
      }

      return result;
    }),

  /**
   * Restore a deleted position by ID
   * @param id - Position ID to restore
   * @return Restored position data
   */
  restorePosition: (id: string) =>
    Effect.gen(function* () {
      const isExist = yield* positionQueries.getDeletedPositionById(id);

      if (!isExist) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Posisi dengan ID ${id} tidak ditemukan atau tidak terhapus.`,
        });
      }

      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(positions)
            .set({ deletedAt: null })
            .where(eq(positions.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "positionQueries.restorePosition",
            `Failed to restore position with ID: ${id}`,
            { error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal memulihkan posisi dengan ID: ${id}`,
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Gagal memulihkan posisi dengan ID: ${id}`,
        });
      }

      return result;
    }),
};

export default positionQueries;
