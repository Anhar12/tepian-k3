import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { and, count, eq, ilike, isNotNull, isNull } from "@tepian-k3/db";
import { toolCodes } from "@tepian-k3/db/schema";
import { z } from "zod";
import toolCodeSchema from "@tepian-k3/schema/pengujian/tool-code.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { getOffsetPaginated } from "../utils/get-offset-paginated";

const toolCodeQueries = {
  /**
   * Get all active tool codes without pagination
   * @return An array of all active tool codes
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error fetching tool codes
   */
  getAllFlattenedToolCodes: () =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCodes.findMany({
          where: and(eq(toolCodes.isActive, true), isNull(toolCodes.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "getAllFlattenedToolCodes",
          "Error fetching all flattened tool codes",
          {
            error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil daftar kode alat",
        });
      },
    }),

  /**
   * Get all tool codes with pagination, sorting, and filtering
   * @param params - The parameters for fetching tool codes
   * @return An object containing the total count and an array of tool codes
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error fetching tool codes
   */
  getAllPaginatedToolCodes: (
    input: z.infer<typeof toolCodeSchema.getAllToolCodesSchema>,
  ) =>
    getOffsetPaginated({
      table: toolCodes,
      input,
      searchConditions: [
        input.code ? ilike(toolCodes.code, `%${input.code}%`) : undefined,
        input.isActive ? eq(toolCodes.isActive, input.isActive) : undefined,
      ],
      errorContext: {
        queryName: "getAllToolCodes",
        errorMessage: "Gagal mengambil daftar kode alat",
      },
    }),

  /**
   * Get an active tool code by its code
   * @param code - The code of the tool code to fetch
   * @return The active tool code with the specified code, or null if not found
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error fetching the tool code
   */
  getActiveToolByCode: (code: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCodes.findFirst({
          where: and(eq(toolCodes.code, code), eq(toolCodes.isActive, true)),
        }),
      catch: (error) => {
        logError(
          "getActiveToolByCode",
          "Error fetching active tool code by code",
          { code, error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil tool berdasarkan kode",
        });
      },
    }),

  /**
   * Get a tool code by its ID
   * @param id - The ID of the tool code to fetch
   * @return The tool code with the specified ID, or null if not found
   *  @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error fetching the tool code
   * @throws TRPCError with code "NOT_FOUND" if no tool code is found with the specified ID
   */
  getToolCodeById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCodes.findFirst({
          where: and(eq(toolCodes.id, id), isNull(toolCodes.deletedAt)),
        }),
      catch: (error) => {
        logError("getToolCodeById", "Error fetching tool code by ID", {
          id,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil kode alat berdasarkan ID",
        });
      },
    }).pipe(
      Effect.flatMap((toolCode) =>
        toolCode
          ? Effect.succeed(toolCode)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Kode alat tidak ditemukan",
              }),
            ),
      ),
    ),

  /**
   * Get a deleted tool code by its ID
   * @param id - The ID of the deleted tool code to fetch
   * @return The deleted tool code with the specified ID, or null if not found
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error fetching the deleted tool code
   * @throws TRPCError with code "NOT_FOUND" if no deleted tool code is found with the specified ID
   */
  getDeletedToolCodeById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCodes.findFirst({
          where: and(eq(toolCodes.id, id), isNotNull(toolCodes.deletedAt)),
        }),
      catch: (error) => {
        logError(
          "getDeletedToolCodeById",
          "Error fetching deleted tool code by ID",
          {
            id,
            error,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil kode alat yang dihapus",
        });
      },
    }).pipe(
      Effect.flatMap((toolCode) =>
        toolCode
          ? Effect.succeed(toolCode)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Kode alat yang dihapus tidak ditemukan",
              }),
            ),
      ),
    ),

  /**
   * Create a new tool code
   * @param params - The parameters for creating a tool code
   * @return The created tool code
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error creating the tool code
   * @throws TRPCError with code "CONFLICT" if a tool code with the same code already exists
   * @throws TRPCError with code "BAD_REQUEST" if the input data is invalid
   */
  createToolCode: (data: z.infer<typeof toolCodeSchema.createToolCodeSchema>) =>
    Effect.gen(function* () {
      const existingToolCode = yield* toolCodeQueries.getActiveToolByCode(
        data.code,
      );

      if (existingToolCode) {
        return yield* Effect.fail(
          new TRPCError({
            code: "CONFLICT",
            message: "Kode alat sudah digunakan",
          }),
        );
      }

      const [createdToolCode] = yield* Effect.tryPromise({
        try: () => db.insert(toolCodes).values(data).returning(),
        catch: (error) => {
          logError("createToolCode", "Error creating tool code", {
            data,
            error,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat kode alat",
          });
        },
      });

      if (!createdToolCode) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat kode alat",
          }),
        );
      }

      return createdToolCode;
    }),

  /**
   * Update an existing tool code
   * @param params - The parameters for updating a tool code
   * @return The updated tool code
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error updating the tool code
   * @throws TRPCError with code "NOT_FOUND" if no tool code is found with the specified ID
   * @throws TRPCError with code "CONFLICT" if a tool code with the same code already exists
   * @throws TRPCError with code "BAD_REQUEST" if the input data is invalid
   */
  updateToolCode: (data: z.infer<typeof toolCodeSchema.updateToolCodeSchema>) =>
    Effect.gen(function* () {
      const existingToolCode = yield* toolCodeQueries.getToolCodeById(data.id);

      if (!existingToolCode) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kode alat tidak ditemukan",
          }),
        );
      }

      if (data.code && data.code !== existingToolCode.code) {
        const anotherToolCode = yield* toolCodeQueries.getActiveToolByCode(
          data.code,
        );

        if (anotherToolCode) {
          return yield* Effect.fail(
            new TRPCError({
              code: "CONFLICT",
              message: "Kode alat sudah digunakan",
            }),
          );
        }
      }

      const [updatedToolCode] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(toolCodes)
            .set({
              code: data.code,
              description: data.description,
              isActive: data.isActive,
            })
            .where(eq(toolCodes.id, data.id))
            .returning(),
        catch: (error) => {
          logError("updateToolCode", "Error updating tool code", {
            data,
            error,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui kode alat",
          });
        },
      });

      if (!updatedToolCode) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui kode alat",
          }),
        );
      }

      return updatedToolCode;
    }),

  /**
   * Delete a tool code by its ID (soft delete)
   * @param id - The ID of the tool code to delete
   * @return The deleted tool code
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error deleting the tool code
   * @throws TRPCError with code "NOT_FOUND" if no tool code is found with the specified ID
   */
  deleteToolCode: (id: string) =>
    Effect.gen(function* () {
      const existingToolCode = yield* toolCodeQueries.getToolCodeById(id);

      if (!existingToolCode) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kode alat tidak ditemukan",
          }),
        );
      }

      const [deletedToolCode] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(toolCodes)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(toolCodes.id, id))
            .returning(),
        catch: (error) => {
          logError("deleteToolCode", "Error deleting tool code", {
            id,
            error,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus kode alat",
          });
        },
      });

      if (!deletedToolCode) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus kode alat",
          }),
        );
      }

      return deletedToolCode;
    }),

  /**
   * Restore a deleted tool code by its ID
   * @param id - The ID of the tool code to restore
   * @return The restored tool code
   * @throws TRPCError with code "INTERNAL_SERVER_ERROR" if there is an error restoring the tool code
   * @throws TRPCError with code "NOT_FOUND" if no deleted tool code is found with the specified ID
   */
  restoreToolCode: (id: string) =>
    Effect.gen(function* () {
      const deletedToolCode = yield* toolCodeQueries.getDeletedToolCodeById(id);

      if (!deletedToolCode) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Kode alat yang dihapus tidak ditemukan",
          }),
        );
      }

      const [restoredToolCode] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(toolCodes)
            .set({ deletedAt: null })
            .where(eq(toolCodes.id, id))
            .returning(),
        catch: (error) => {
          logError("restoreToolCode", "Error restoring tool code", {
            id,
            error,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memulihkan kode alat",
          });
        },
      });

      if (!restoredToolCode) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memulihkan kode alat",
          }),
        );
      }

      return restoredToolCode;
    }),

  /**
   * Hard delete a tool code permanently
   */
  hardDeleteToolCode: (id: string) =>
    Effect.tryPromise({
      try: () => db.delete(toolCodes).where(eq(toolCodes.id, id)).returning(),
      catch: (error) => {
        logError("hardDeleteToolCode", "Error hard deleting tool code", {
          id,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus permanen kode alat",
        });
      },
    }),
};

export default toolCodeQueries;
