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
  sql,
} from "@tepian-k3/db";
import { parameterTools, tools } from "@tepian-k3/db/schema";
import { z } from "zod";
import toolsSchema from "@tepian-k3/schema/tools.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";

const toolsQueries = {
  getAllUnassignedTools() {
    return Effect.tryPromise({
      try: () =>
        db
          .select({
            ...getTableColumns(tools),
          })
          .from(tools)
          .where(
            and(
              sql`NOT EXISTS (
              SELECT 1 FROM ${parameterTools} 
              WHERE ${parameterTools.toolId} = ${tools.id}
            )`,
              isNull(tools.deletedAt)
            )
          ),
      catch: (error) => {
        logError(
          "toolsQueries.getAllUnassignedTools",
          "Error fetching unassigned tools",
          {
            error,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data alat yang belum ditugaskan.",
        });
      },
    });
  },

  getToolById(toolId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.tools.findFirst({
          where: and(eq(tools.id, toolId), isNull(tools.deletedAt)),
        }),
      catch: (error) => {
        logError("toolsQueries.getToolById", "Error fetching tool by ID", {
          error,
          toolId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data alat",
        });
      },
    }).pipe(
      Effect.flatMap((tool) =>
        tool
          ? Effect.succeed(tool)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Alat tidak ditemukan",
              })
            )
      )
    );
  },

  getDeletedToolById(toolId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.tools.findFirst({
          where: and(eq(tools.id, toolId), isNotNull(tools.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "toolsQueries.getDeletedToolById",
          "Error fetching deleted tool by ID",
          {
            error,
            toolId,
          }
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data alat yang dihapus",
        });
      },
    }).pipe(
      Effect.flatMap((tool) =>
        tool
          ? Effect.succeed(tool)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Alat yang dihapus tidak ditemukan",
              })
            )
      )
    );
  },

  getToolByCode(toolCode: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.tools.findFirst({
          where: and(eq(tools.toolCode, toolCode), isNull(tools.deletedAt)),
        }),
      catch: (error) => {
        logError("toolsQueries.getToolByCode", "Error fetching tool by code", {
          error,
          toolCode,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data alat",
        });
      },
    }).pipe(
      Effect.flatMap((tool) =>
        tool ? Effect.succeed(tool) : Effect.succeed(null)
      )
    );
  },

  getOffsetPaginatedTools(
    input: z.infer<typeof toolsSchema.getAllToolsSchema>
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: tools,
            filters: input.filters as ExtendedColumnFilter<typeof tools>[],
            joinOperator: "and",
          })
        : and(
            input.toolName
              ? ilike(tools.toolName, `%${input.toolName}%`)
              : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        tools.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })()
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        tools.createdAt,
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
              ? isNotNull(tools.deletedAt)
              : isNull(tools.deletedAt)
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc ? desc(tools[item.id]) : asc(tools[item.id])
            )
          : [desc(tools.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(tools)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(tools)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "toolsQueries.getOffsetPaginatedTools",
            "Error fetching paginated tools",
            {
              error,
              input,
            }
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Gagal mengambil data alat`,
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

  createTool(data: z.infer<typeof toolsSchema.createToolSchema>) {
    return Effect.gen(this, function* () {
      const tool = yield* this.getToolByCode(data.toolCode);

      if (tool) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Alat dengan kode tersebut sudah ada.",
        });
      }

      const [newTool] = yield* Effect.tryPromise({
        try: () => db.insert(tools).values(data).returning().execute(),
        catch: (error) => {
          logError("toolsQueries.createTool", "Error creating tool", {
            error,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat alat baru.",
            cause: error,
          });
        },
      });

      if (!newTool) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat alat baru.",
          })
        );
      }

      return newTool;
    });
  },

  updateTool(data: z.infer<typeof toolsSchema.updateToolSchema>) {
    return Effect.gen(this, function* () {
      const existingTool = yield* this.getToolById(data.id);

      if (!existingTool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alat tidak ditemukan.",
        });
      }

      const [updatedTool] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(tools)
            .set(data)
            .where(eq(tools.id, data.id))
            .returning()
            .execute(),
        catch: (error) => {
          logError("toolsQueries.updateTool", "Error updating tool", {
            error,
            data,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui alat.",
            cause: error,
          });
        },
      });

      if (!updatedTool) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui alat.",
          })
        );
      }

      return updatedTool;
    });
  },

  deleteTool(toolId: string) {
    return Effect.gen(this, function* () {
      yield* this.getToolById(toolId);

      const [deletedTool] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(tools)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(tools.id, toolId))
            .returning()
            .execute(),
        catch: (error) => {
          logError("toolsQueries.deleteTool", "Error deleting tool", {
            error,
            toolId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus alat.",
            cause: error,
          });
        },
      });

      if (!deletedTool) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus alat.",
          })
        );
      }

      return deletedTool;
    });
  },

  restoreTool(toolId: string) {
    return Effect.gen(this, function* () {
      yield* this.getDeletedToolById(toolId);

      const [restoredTool] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(tools)
            .set({ deletedAt: null })
            .where(eq(tools.id, toolId))
            .returning()
            .execute(),
        catch: (error) => {
          logError("toolsQueries.restoreTool", "Error restoring tool", {
            error,
            toolId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan alat.",
            cause: error,
          });
        },
      });

      if (!restoredTool) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan alat.",
          })
        );
      }

      return restoredTool;
    });
  },
};

export default toolsQueries;
