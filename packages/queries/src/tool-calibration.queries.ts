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
import {
  toolCalibrationCertificates,
  toolCalibrationDocumentations,
  toolCalibrations,
} from "@tepian-k3/db/schema";
import { z } from "zod";
import toolCalibrationSchema from "@tepian-k3/schema/tool-calibration.schema";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import toolsQueries from "./tools.queries";
import { storageService } from "@tepian-k3/services/storage";

const toolCalibrationQueries = {
  /**
   * Get all tool calibrations without pagination
   */
  getAllToolCalibrations: () =>
    Effect.tryPromise({
      try: () => db.query.toolCalibrations.findMany(),
      catch: (error) => {
        logError(
          "toolCalibrationQueries.getAllToolCalibrations",
          "Error fetching all tool calibrations",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendapatkan data kalibrasi alat",
        });
      },
    }),

  /**
   * Get tool calibrations by ID
   */
  getToolCalibrationById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCalibrations.findFirst({
          where: eq(toolCalibrations.id, id),
          with: {
            certificate: true,
            documentations: true,
          },
        }),
      catch: (error) => {
        logError(
          "toolCalibrationQueries.getToolCalibrationById",
          "Error fetching tool calibration by ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendapatkan data kalibrasi alat berdasarkan ID",
        });
      },
    }),

  /**
   * Get deleted tool calibration by ID
   */
  getDeletedToolCalibrationById: (id: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCalibrations.findFirst({
          where: and(
            eq(toolCalibrations.id, id),
            isNotNull(toolCalibrations.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "toolCalibrationQueries.getDeletedToolCalibrationById",
          "Error fetching deleted tool calibration by ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mendapatkan data kalibrasi alat terhapus berdasarkan ID",
        });
      },
    }),

  /**
   * Get tool calibrations by Tool ID
   */
  getToolCalibrationsByToolId: (toolId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCalibrations.findMany({
          where: eq(toolCalibrations.toolId, toolId),
        }),
      catch: (error) => {
        logError(
          "toolCalibrationQueries.getToolCalibrationsByToolId",
          "Error fetching tool calibrations by Tool ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mendapatkan data kalibrasi alat berdasarkan ID Alat",
        });
      },
    }),

  /**
   * Get tool calibrations certificates by calibration Tool ID
   * @param calibrationId string
   */
  getToolCalibrationCertificatesById: (calibrationId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCalibrationCertificates.findFirst({
          where: eq(
            toolCalibrationCertificates.toolCalibrationId,
            calibrationId,
          ),
          with: {
            toolCalibration: true,
          },
        }),
      catch: (error) => {
        logError(
          "toolCalibrationQueries.getToolCalibrationCertificatesByToolId",
          "Error fetching tool calibration certificates by Tool ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mendapatkan data sertifikat kalibrasi alat berdasarkan ID Kalibrasi",
        });
      },
    }).pipe(
      Effect.flatMap((certificate) =>
        certificate ? Effect.succeed(certificate) : Effect.succeed(null),
      ),
    ),

  /**
   * Get tool calibrations documentations by calibration Tool ID
   * @param calibrationId string
   */
  getToolCalibrationDocumentationsById: (calibrationId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCalibrationDocumentations.findMany({
          where: eq(
            toolCalibrationDocumentations.toolCalibrationId,
            calibrationId,
          ),
          with: {
            toolCalibration: true,
          },
        }),
      catch: (error) => {
        logError(
          "toolCalibrationQueries.getToolCalibrationDocumentationsByToolId",
          "Error fetching tool calibration documentations by Tool ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mendapatkan data dokumentasi kalibrasi alat berdasarkan ID Kalibrasi",
        });
      },
    }),

  /**
   * Get tool calibration documentation by calibration documentation ID
   * @param documentationId string
   */
  getToolCalibrationDocumentationById: (documentationId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.toolCalibrationDocumentations.findFirst({
          where: eq(toolCalibrationDocumentations.id, documentationId),
          with: {
            toolCalibration: true,
          },
        }),
      catch: (error) => {
        logError(
          "toolCalibrationQueries.getToolCalibrationDocumentationById",
          "Error fetching tool calibration documentation by documentation ID",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mendapatkan data dokumentasi kalibrasi alat berdasarkan ID Dokumentasi",
        });
      },
    }).pipe(
      Effect.flatMap((documentation) =>
        documentation
          ? Effect.succeed(documentation)
          : Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: `Dokumentasi kalibrasi alat dengan ID ${documentationId} tidak ditemukan`,
              }),
            ),
      ),
    ),

  /**
   * Get paginated tool calibrations
   */
  getPaginatedToolCalibrations: (
    toolId: string,
    input: z.infer<typeof toolCalibrationSchema.getAllToolCalibrationsSchema>,
  ) =>
    Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: toolCalibrations,
            filters: input.filters as ExtendedColumnFilter<
              typeof toolCalibrations
            >[],
            joinOperator: "and",
          })
        : and(
            input.note
              ? ilike(toolCalibrations.note, `%${input.note}%`)
              : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        toolCalibrations.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? gte(
                        toolCalibrations.createdAt,
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
              ? isNotNull(toolCalibrations.deletedAt)
              : isNull(toolCalibrations.deletedAt),
            eq(toolCalibrations.toolId, toolId),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(toolCalibrations[item.id])
                : asc(toolCalibrations[item.id]),
            )
          : [desc(toolCalibrations.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx
              .select()
              .from(toolCalibrations)
              .limit(input.perPage)
              .offset(offset)
              .where(where)
              .orderBy(...orderBy);

            const total = await tx
              .select({
                count: count(),
              })
              .from(toolCalibrations)
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
    }),

  /**
   * Create tool calibration
   *
   * File uploads should be handled at the router level using upload helpers.
   * This query only receives storage keys.
   */
  createToolCalibration: (data: {
    toolId: string;
    calibrationDate: string;
    note: string;
    certificateKey?: string;
    documentationKeys?: string[];
  }) =>
    Effect.gen(function* () {
      yield* toolsQueries.getToolById(data.toolId);

      const newToolCalibration = yield* Effect.tryPromise({
        try: async () =>
          db.transaction(async (tx) => {
            const [insertedToolCalibration] = await tx
              .insert(toolCalibrations)
              .values({
                toolId: data.toolId,
                calibrationDate: data.calibrationDate,
                note: data.note,
              })
              .returning();

            if (!insertedToolCalibration) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat data kalibrasi alat",
              });
            }

            if (data.certificateKey) {
              await tx.insert(toolCalibrationCertificates).values({
                toolCalibrationId: insertedToolCalibration.id,
                certificateFileUrl: data.certificateKey,
              });
            }

            if (data.documentationKeys && data.documentationKeys.length > 0) {
              await tx.insert(toolCalibrationDocumentations).values(
                data.documentationKeys.map((key) => ({
                  toolCalibrationId: insertedToolCalibration.id,
                  documentationFileUrl: key,
                })),
              );
            }

            return insertedToolCalibration;
          }),
        catch: (error) => {
          logError(
            "toolCalibrationQueries.createToolCalibration",
            "Error creating tool calibration",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat data kalibrasi alat",
            cause: error,
          });
        },
      });

      return newToolCalibration;
    }),

  /**
   * Create tool calibration certificate
   */
  createToolCalibrationCertificate: (data: {
    toolCalibrationId: string;
    key: string;
  }) =>
    Effect.gen(function* () {
      const isExistingToolCalibration =
        yield* toolCalibrationQueries.getToolCalibrationById(
          data.toolCalibrationId,
        );

      if (!isExistingToolCalibration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data kalibrasi alat tidak ditemukan",
        });
      }

      const [newCertificateFile] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(toolCalibrationCertificates)
            .values({
              toolCalibrationId: data.toolCalibrationId,
              certificateFileUrl: data.key,
            })
            .returning(),
        catch: (error) => {
          logError(
            "toolCalibrationQueries.createToolCalibrationCertificateFile",
            "Error creating tool calibration certificate file",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat file sertifikat kalibrasi alat",
            cause: error,
          });
        },
      });

      if (!newCertificateFile) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat file sertifikat kalibrasi alat",
        });
      }

      return newCertificateFile;
    }),

  /**
   * Create tool calibration documentation
   */
  createToolCalibrationDocumentation: (data: {
    toolCalibrationId: string;
    key: string[];
  }) =>
    Effect.gen(function* () {
      const isExistingToolCalibration =
        yield* toolCalibrationQueries.getToolCalibrationById(
          data.toolCalibrationId,
        );

      if (!isExistingToolCalibration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data kalibrasi alat tidak ditemukan",
        });
      }

      const newDocumentationFiles = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(toolCalibrationDocumentations)
            .values(
              data.key.map((fileKey) => ({
                toolCalibrationId: data.toolCalibrationId,
                documentationFileUrl: fileKey,
              })),
            )
            .returning(),
        catch: (error) => {
          logError(
            "toolCalibrationQueries.createToolCalibrationDocumentationFile",
            "Error creating tool calibration documentation files",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat file dokumentasi kalibrasi alat",
            cause: error,
          });
        },
      });

      // check if the insertion was successful and length matches
      if (newDocumentationFiles.length !== data.key.length) {
        data.key.forEach(async (fileKey) => {
          await Effect.runPromise(storageService.delete(fileKey));
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat beberapa file dokumentasi kalibrasi alat",
        });
      }

      return newDocumentationFiles;
    }),

  /**
   * Update tool calibration
   *
   * File uploads should be handled at the router level using upload helpers.
   * This query only receives storage keys.
   */
  updateToolCalibration: (data: {
    id: string;
    calibrationDate?: string;
    note?: string;
    certificateKey?: string;
  }) =>
    Effect.gen(function* () {
      const existingToolCalibration =
        yield* toolCalibrationQueries.getToolCalibrationById(data.id);

      if (!existingToolCalibration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data kalibrasi alat tidak ditemukan",
        });
      }

      const updatedToolCalibration = yield* Effect.tryPromise({
        try: async () =>
          db.transaction(async (tx) => {
            const [updated] = await tx
              .update(toolCalibrations)
              .set({
                calibrationDate:
                  data.calibrationDate ??
                  existingToolCalibration.calibrationDate,
                note: data.note ?? existingToolCalibration.note,
              })
              .where(eq(toolCalibrations.id, data.id))
              .returning();

            if (!updated) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memperbarui data kalibrasi alat",
              });
            }

            // Replace certificate if a new key is provided
            if (data.certificateKey) {
              const existingCertificate =
                await tx.query.toolCalibrationCertificates.findFirst({
                  where: eq(
                    toolCalibrationCertificates.toolCalibrationId,
                    data.id,
                  ),
                });

              if (existingCertificate) {
                await tx
                  .delete(toolCalibrationCertificates)
                  .where(
                    eq(toolCalibrationCertificates.id, existingCertificate.id),
                  );

                // Delete old file from storage
                if (existingCertificate.certificateFileUrl) {
                  await Effect.runPromise(
                    storageService.delete(
                      existingCertificate.certificateFileUrl,
                    ),
                  );
                }
              }

              await tx.insert(toolCalibrationCertificates).values({
                toolCalibrationId: data.id,
                certificateFileUrl: data.certificateKey,
              });
            }

            return updated;
          }),
        catch: (error) => {
          logError(
            "toolCalibrationQueries.updateToolCalibration",
            "Error updating tool calibration",
            { error, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui data kalibrasi alat",
            cause: error,
          });
        },
      });

      return updatedToolCalibration;
    }),

  /**
   * Delete tool calibration by ID
   */
  deleteToolCalibration: (id: string) =>
    Effect.gen(function* () {
      const existingToolCalibration =
        yield* toolCalibrationQueries.getToolCalibrationById(id);

      if (!existingToolCalibration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data kalibrasi alat tidak ditemukan",
        });
      }

      const [result] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(toolCalibrations)
            .set({ deletedAt: new Date().toISOString() })
            .where(eq(toolCalibrations.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "toolCalibrationQueries.deleteToolCalibrationById",
            "Error deleting tool calibration by ID",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus data kalibrasi alat",
            cause: error,
          });
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus data kalibrasi alat",
        });
      }

      return result;
    }),

  /**
   * Restore deleted tool calibration by ID
   */
  restoreToolCalibration: (id: string) =>
    Effect.gen(function* () {
      const existingToolCalibration =
        yield* toolCalibrationQueries.getDeletedToolCalibrationById(id);

      if (!existingToolCalibration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Data kalibrasi alat terhapus tidak ditemukan",
        });
      }

      const [restoredToolCalibration] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(toolCalibrations)
            .set({ deletedAt: null })
            .where(eq(toolCalibrations.id, id))
            .returning(),
        catch: (error) => {
          logError(
            "toolCalibrationQueries.restoreToolCalibrationById",
            "Error restoring deleted tool calibration by ID",
            { error, id },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengembalikan data kalibrasi alat terhapus",
            cause: error,
          });
        },
      });

      if (!restoredToolCalibration) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengembalikan data kalibrasi alat terhapus",
        });
      }

      return restoredToolCalibration;
    }),
};

export default toolCalibrationQueries;
