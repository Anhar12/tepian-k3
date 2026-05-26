import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { and, eq, isNotNull, isNull, sql } from "@tepian-k3/db";
import { toolChecks, tools } from "@tepian-k3/db/schema";
import { z } from "zod";
import toolCheckSchema from "@tepian-k3/schema/pengujian/tool-check.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import toolsQueries from "./tools.queries";
import { getOffsetPaginated } from "../utils/get-offset-paginated";
import employeeQueries from "../platform/employee.queries";

const toolCheckQueries = {
  /**
   * Get all tool checks without pagination, used for export
   * @param toolId
   */
  getAllToolChecks: (toolId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolChecks.findMany({
          where: and(
            eq(toolChecks.toolId, toolId),
            isNull(toolChecks.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "toolCheckQueries.getAllToolChecks",
          "Failed to get all tool checks",
          { error, toolId },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendapatkan semua pemeriksaan alat",
        });
      },
    }),

  /**
   * Get tool check by ID
   * @param id
   * @return tool check data
   */
  getToolCheckById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolChecks.findFirst({
          where: and(eq(toolChecks.id, id), isNull(toolChecks.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "toolCheckQueries.getToolCheckById",
          "Failed to get tool check by id",
          { error, id },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendapatkan pemeriksaan alat berdasarkan ID",
        });
      },
    }),

  /**
   * Get deleted tool check by ID
   * @param id
   * @return tool check data
   */
  getDeletedToolCheckById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolChecks.findFirst({
          where: and(eq(toolChecks.id, id), isNotNull(toolChecks.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "toolCheckQueries.getDeletedToolCheckById",
          "Failed to get deleted tool check by id",
          { error, id },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mendapatkan pemeriksaan alat yang dihapus berdasarkan ID",
        });
      },
    }),

  /**
   * Get tool checks by tool id
   * @param toolId
   * @return tool check data
   */
  getToolChecksByToolId: (toolId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolChecks.findMany({
          where: and(
            eq(toolChecks.toolId, toolId),
            isNull(toolChecks.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "toolCheckQueries.getToolChecksByToolId",
          "Failed to get tool checks by tool id",
          { error, toolId },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendapatkan pemeriksaan alat berdasarkan ID alat",
        });
      },
    }),

  /**
   * Get paginated tool checks by tool id
   * @param toolId
   * @param input pagination and filter input
   * @return paginated tool check data
   */
  getPaginatedToolChecksByToolId: (
    toolId: string,
    input: z.infer<typeof toolCheckSchema.getAllToolChecksSchema>,
  ) =>
    getOffsetPaginated({
      table: toolChecks,
      input,
      searchConditions: [eq(toolChecks.toolId, toolId)],
      errorContext: {
        queryName: "toolCheckQueries.getPaginatedToolChecksByToolId",
        errorMessage: "Gagal mendapatkan pemeriksaan alat dengan paginasi",
      },
    }),

  /**
   * Create new tool check and update tool condition/availability.
   * @param userId ID of user performing the check, for audit purposes
   * @param input tool check data
   * @return created tool check data
   */
  createToolCheck: (
    userId: string,
    input: z.infer<typeof toolCheckSchema.createToolCheckSchema>,
  ) =>
    Effect.gen(function* () {
      yield* toolsQueries.getToolById(input.toolId);

      const employee = yield* employeeQueries.getEmployeeByUserId(userId);

      if (!employee) {
        logError(
          "toolCheckQueries.createToolCheck",
          "Failed to find employee for user performing tool check",
          { userId },
        );

        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Tidak dapat menemukan data pegawai untuk pengguna yang melakukan pemeriksaan alat",
        });
      }

      const createdToolCheck = yield* Effect.tryPromise({
        try: async () =>
          db.transaction(async (tx) => {
            const [toolCheck] = await tx
              .insert(toolChecks)
              .values({
                ...input,
                checkedBy: employee.id,
              })
              .returning();

            if (!toolCheck) {
              logError(
                "toolCheckQueries.createToolCheck",
                "Failed to create tool check, no data returned",
                { input },
              );

              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Gagal membuat pemeriksaan alat baru",
              });
            }

            // Damaged/off tools become not_ready, others become ready
            const damaged =
              input.checkConditionResult === "rusak" ||
              input.checkConditionResult === "tidak_menyala";

            await tx
              .update(tools)
              .set({
                condition: input.checkConditionResult,
                availability: damaged ? "not_ready" : "ready",
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(tools.id, input.toolId));

            return toolCheck;
          }),
        catch: (error) => {
          logError(
            "toolCheckQueries.createToolCheck",
            "Failed to create tool check",
            { error, input },
          );

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat pemeriksaan alat baru",
          });
        },
      });

      return createdToolCheck;
    }),

  /**
   * Update a tool check record and sync tool condition/availability.
   * @param input update data (id required)
   * @return updated tool check data
   */
  updateToolCheck: (
    input: z.infer<typeof toolCheckSchema.updateToolCheckSchema>,
  ) =>
    Effect.gen(function* () {
      const existing = yield* toolCheckQueries.getToolCheckById(input.id!);

      if (!existing) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Pemeriksaan alat tidak ditemukan",
          }),
        );
      }

      const toolExisting = yield* toolsQueries.getToolById(existing.toolId);

      if (!toolExisting) {
        logError(
          "toolCheckQueries.updateToolCheck",
          "Failed to find tool for existing tool check",
          { toolId: existing.toolId },
        );

        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Gagal menemukan data alat untuk pemeriksaan alat",
          }),
        );
      }

      const updated = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const [toolCheck] = await tx
              .update(toolChecks)
              .set({ ...input, updatedAt: sql`CURRENT_TIMESTAMP` })
              .where(eq(toolChecks.id, input.id!))
              .returning();

            if (!toolCheck) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memperbarui pemeriksaan alat",
              });
            }

            // Sync tool condition/availability if checkConditionResult changed
            if (input.checkConditionResult) {
              const damaged =
                input.checkConditionResult === "rusak" ||
                input.checkConditionResult === "tidak_menyala";

              await tx
                .update(tools)
                .set({
                  condition: input.checkConditionResult,
                  availability: damaged ? "not_ready" : "ready",
                  updatedAt: sql`CURRENT_TIMESTAMP`,
                })
                .where(eq(tools.id, existing.toolId));
            }

            return toolCheck;
          }),
        catch: (error) => {
          logError(
            "toolCheckQueries.updateToolCheck",
            "Failed to update tool check",
            { error, input },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pemeriksaan alat",
          });
        },
      });

      return updated;
    }),

  /**
   * Soft-delete a tool check record.
   * @param id tool check ID
   * @return deleted tool check data
   */
  deleteToolCheck: (id: string) =>
    Effect.gen(function* () {
      const existing = yield* toolCheckQueries.getToolCheckById(id);

      if (!existing) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Pemeriksaan alat tidak ditemukan",
          }),
        );
      }

      const [deleted] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(toolChecks)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(toolChecks.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "toolCheckQueries.deleteToolCheck",
            "Failed to delete tool check",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus pemeriksaan alat",
          });
        },
      });

      if (!deleted) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus pemeriksaan alat",
          }),
        );
      }

      return deleted;
    }),

  /**
   * Restore a soft-deleted tool check record.
   * @param id tool check ID
   * @return restored tool check data
   */
  restoreToolCheck: (id: string) =>
    Effect.gen(function* () {
      const existing = yield* toolCheckQueries.getDeletedToolCheckById(id);

      if (!existing) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Pemeriksaan alat yang dihapus tidak ditemukan",
          }),
        );
      }

      const [restored] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(toolChecks)
            .set({ deletedAt: null })
            .where(eq(toolChecks.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "toolCheckQueries.restoreToolCheck",
            "Failed to restore tool check",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan pemeriksaan alat",
          });
        },
      });

      if (!restored) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan pemeriksaan alat",
          }),
        );
      }

      return restored;
    }),

  /**
   * Hard delete a tool check record permanently.
   */
  hardDeleteToolCheck: (id: string) =>
    Effect.tryPromise({
      try: () => db.delete(toolChecks).where(eq(toolChecks.id, id)).returning(),
      catch: (error) => {
        logError(
          "toolCheckQueries.hardDeleteToolCheck",
          "Failed to hard delete tool check",
          { error, id },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus permanen pemeriksaan alat",
        });
      },
    }),
};

export default toolCheckQueries;
