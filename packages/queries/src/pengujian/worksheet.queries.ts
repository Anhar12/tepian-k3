import type {
  BahanUnit,
  DocumentType,
  WorksheetNoteStatus,
  WorksheetStatus,
} from "@tepian-k3/constants";
import { and, count, eq, inArray, isNull, sql } from "@tepian-k3/db";
import { db, type DBorTx } from "@tepian-k3/db/client";
import {
  chemicalMaterials,
  documents,
  employees,
  order,
  parameterTools,
  testingItem,
  worksheetAssignments,
  worksheetChemicalMaterials,
  worksheetItems,
  worksheetNotes,
  worksheetOperationalCosts,
  worksheets,
  worksheetToolNeeded,
  worksheetTools,
} from "@tepian-k3/db/schema";
import { logError } from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import { logCreate, logUpdate } from "../helpers/audit.helpers";
import orderQueries from "./order.queries";

/**
 * Throws a BAD_REQUEST if the worksheet has no saved operational cost rows.
 *
 * Operational costs (Rincian Operasional) can only be edited while the worksheet
 * is in 'draft'/'revision'. Any transition that locks the worksheet (submit for
 * verification, verify) must call this first so users can't lock themselves out
 * before filling them in. Counts persisted rows only — the UI shows default
 * cost rows that aren't saved until explicitly submitted.
 *
 * @param tx - Active transaction (or db) handle
 * @param worksheetId - The worksheet to check
 */
async function assertOperationalCostsSaved(tx: DBorTx, worksheetId: string) {
  const [opCost] = await tx
    .select({ value: count() })
    .from(worksheetOperationalCosts)
    .where(eq(worksheetOperationalCosts.worksheetId, worksheetId));

  if (!opCost || opCost.value === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Harap isi dan simpan Rincian Operasional terlebih dahulu sebelum mengajukan atau memverifikasi worksheet.",
    });
  }
}

const worksheetQueries = {
  /**
   * Get worksheet by ID with all relations
   */
  getWorksheetById(worksheetId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.worksheets.findFirst({
          where: eq(worksheets.id, worksheetId),
          with: {
            order: {
              with: {
                company: true,
              },
            },
            testing: {
              with: {
                items: {
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
                    location: true,
                  },
                },
              },
            },
            items: {
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
                location: true,
              },
            },
            tools: {
              with: {
                tool: true,
              },
            },
            plannedTools: {
              with: {
                tool: true,
              },
            },
            assignments: {
              with: {
                employee: {
                  with: {
                    user: true,
                  },
                },
              },
            },
            notes: {
              with: {
                createdBy: true,
              },
              orderBy: (notes, { desc }) => [desc(notes.createdAt)],
            },
            mainSupervisor: {
              with: {
                user: true,
                position: true,
              },
            },
            accompanyingSupervisor: {
              with: {
                user: true,
                position: true,
              },
            },
            createdBy: true,
          },
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getWorksheetById",
          "Failed to fetch worksheet",
          {
            error,
            worksheetId,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data worksheet",
        });
      },
    });
  },

  /**
   * Get all worksheets with pagination
   */
  getAllWorksheets(
    page: number = 1,
    limit: number = 10,
    status?: WorksheetStatus,
  ) {
    return Effect.gen(function* () {
      const offset = (page - 1) * limit;

      const [items, totalCount] = yield* Effect.tryPromise({
        try: () =>
          Promise.all([
            db.query.worksheets.findMany({
              where: status ? eq(worksheets.status, status) : undefined,
              limit,
              offset,
              orderBy: (worksheets, { desc }) => [desc(worksheets.createdAt)],
              with: {
                testing: {
                  with: {
                    order: {
                      with: {
                        company: {
                          columns: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
                mainSupervisor: {
                  with: {
                    user: {
                      columns: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            }),
            db
              .select({ count: sql<number>`count(*)` })
              .from(worksheets)
              .then((result) => result[0]?.count),
          ]),
        catch: (error) => {
          logError(
            "worksheetQueries.getAllWorksheets",
            "Failed to fetch worksheets",
            {
              error,
              page,
              limit,
              status,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil daftar worksheet",
          });
        },
      });

      return {
        data: items,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil((totalCount ?? 0) / limit),
          totalItems: totalCount,
        },
      };
    });
  },

  /**
   * Get worksheet document by type
   * Used for fetching specific documents like SPT (assignment_letter) or other worksheet-level documents
   */
  getWorksheetDocument(worksheetId: string, documentType: DocumentType) {
    return Effect.tryPromise({
      try: () =>
        db.query.documents.findFirst({
          where: and(
            eq(documents.entityType, "worksheet"),
            eq(documents.entityId, worksheetId),
            eq(documents.type, documentType),
          ),
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getWorksheetDocument",
          "Failed to fetch worksheet document",
          { error, worksheetId, documentType },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil dokumen worksheet",
        });
      },
    });
  },

  /**
   * Get worksheets that are verified and have an assignment_letter document.
   * Used by the employee tools management page.
   */
  getWorksheetsWithAssignmentLetter(
    page: number = 1,
    limit: number = 10,
    status?: WorksheetStatus,
  ) {
    return Effect.gen(function* () {
      const offset = (page - 1) * limit;

      // SPT (assignment_letter) documents are stored on the ORDER entity, so
      // collect the order IDs that already have an SPT, then match worksheets
      // by their orderId.
      const orderIdsWithSpt = yield* Effect.tryPromise({
        try: () =>
          db
            .select({ orderId: documents.entityId })
            .from(documents)
            .where(
              and(
                eq(documents.entityType, "order"),
                eq(documents.type, "assignment_letter"),
              ),
            ),
        catch: (error) => {
          logError(
            "worksheetQueries.getWorksheetsWithAssignmentLetter",
            "Failed to fetch assignment letter document IDs",
            { error },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data dokumen surat tugas",
          });
        },
      });

      if (!orderIdsWithSpt.length) {
        return {
          data: [],
          pagination: {
            page,
            limit,
            totalPages: 0,
            totalItems: 0,
          },
        };
      }

      const orderIds = orderIdsWithSpt.map((d) => d.orderId);

      const whereCondition = and(
        inArray(worksheets.orderId, orderIds),
        status ? eq(worksheets.status, status) : undefined,
      );

      const [items, totalCount] = yield* Effect.tryPromise({
        try: () =>
          Promise.all([
            db.query.worksheets.findMany({
              where: whereCondition,
              limit,
              offset,
              orderBy: (worksheets, { desc }) => [desc(worksheets.createdAt)],
              with: {
                order: {
                  with: {
                    company: {
                      columns: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                testing: {
                  with: {
                    order: {
                      with: {
                        company: {
                          columns: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
                mainSupervisor: {
                  with: {
                    user: {
                      columns: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            }),
            db
              .select({ count: sql<number>`count(*)` })
              .from(worksheets)
              .where(whereCondition)
              .then((result) => result[0]?.count),
          ]),
        catch: (error) => {
          logError(
            "worksheetQueries.getWorksheetsWithAssignmentLetter",
            "Failed to fetch worksheets with assignment letter",
            { error, page, limit, status },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil daftar worksheet",
          });
        },
      });

      return {
        data: items,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil((totalCount ?? 0) / limit),
          totalItems: totalCount,
        },
      };
    });
  },

  /**
   * Get all worksheets for schedule calendar display
   * Returns worksheets with schedule dates, company, location, and assignments
   */
  getWorksheetsForSchedule() {
    return Effect.tryPromise({
      try: () =>
        db.query.worksheets.findMany({
          columns: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
          },
          orderBy: (worksheets, { desc }) => [desc(worksheets.startDate)],
          with: {
            order: {
              with: {
                company: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            items: {
              columns: {
                id: true,
              },
              with: {
                location: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            assignments: {
              columns: {
                id: true,
              },
              with: {
                employee: {
                  columns: {
                    id: true,
                  },
                },
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getWorksheetsForSchedule",
          "Failed to fetch worksheets for schedule",
          { error },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil jadwal worksheet",
        });
      },
    });
  },

  /**
   * Get worksheet by order ID
   */
  getWorksheetByOrderId(orderId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.worksheets.findFirst({
          where: eq(worksheets.orderId, orderId),
          with: {
            items: {
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
                location: true,
              },
            },
            tools: {
              with: {
                tool: true,
              },
            },
            assignments: {
              with: {
                employee: {
                  with: {
                    user: true,
                  },
                },
              },
            },
            mainSupervisor: {
              with: {
                user: true,
              },
            },
            accompanyingSupervisor: {
              with: {
                user: true,
              },
            },
            createdBy: true,
            // Lightweight presence check so the UI can gate "Ajukan Verifikasi"
            // on operational costs being filled in.
            operationalCosts: {
              columns: { id: true },
            },
          },
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getWorksheetByOrderId",
          "Failed to fetch worksheet by order ID",
          {
            error,
            orderId,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil worksheet berdasarkan order",
        });
      },
    }).pipe(
      Effect.flatMap((worksheet) =>
        worksheet ? Effect.succeed(worksheet) : Effect.succeed(null),
      ),
    );
  },

  /**
   * Create worksheet from order (kaji ulang phase - before offering)
   * This creates worksheet with testingId = NULL, to be linked later
   */
  createWorksheetFromOrder(
    orderId: string,
    userId: string,
    mainSupervisorId?: string,
    accompanyingSupervisorId?: string,
  ) {
    return Effect.gen(function* () {
      // Perform all operations in a transaction
      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // 1. Get order with items and validate
            const orderData = await tx.query.order.findFirst({
              where: eq(order.id, orderId),
              with: {
                items: {
                  with: {
                    parameter: true,
                    location: true,
                  },
                },
              },
            });

            if (!orderData) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order tidak ditemukan",
              });
            }

            // Check if worksheet already exists for this order
            const existingWorksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.orderId, orderId),
            });

            if (existingWorksheet) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Worksheet sudah dibuat untuk order ini",
              });
            }

            // Filter only pengujian items
            const pengujianItems = orderData.items.filter(
              (item) => item.type === "pengujian",
            );

            // Validate order has items
            if (pengujianItems.length === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Order tidak memiliki item pengujian untuk worksheet",
              });
            }

            // 2. Create worksheet record (without testingId - will be linked later)
            const [newWorksheet] = await tx
              .insert(worksheets)
              .values({
                orderId: orderData.id,
                status: "draft",
                mainSupervisorId: mainSupervisorId || null,
                accompanyingSupervisorId: accompanyingSupervisorId || null,
                createdBy: userId,
                coverFlightIncluded: orderData.coverFlightIncluded,
                coverGroundTransportationIncluded:
                  orderData.coverGroundTransportationIncluded,
                coverGroundTransportationToAirportOrHarbour:
                  orderData.coverGroundTransportationToAirportOrHarbour,
                coverLodgingIncluded: orderData.coverLodgingIncluded,
                coverWaterTransportationIncluded:
                  orderData.coverWaterTransportationIncluded,
              })
              .returning();

            if (!newWorksheet) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat worksheet",
              });
            }

            // 3. Create worksheet items from order items
            const worksheetItemsData = pengujianItems.map((item) => ({
              worksheetId: newWorksheet.id,
              parameterId: item.parameterId!,
              locationId: item.locationId!,
              quantity: item.quantity,
              value: null,
              note: null,
              isReady: false,
            }));

            const newWorksheetItems = await tx
              .insert(worksheetItems)
              .values(worksheetItemsData)
              .returning();

            // Update order status to 'kaji_ulang' since worksheet is created
            await Effect.runPromise(
              orderQueries.updateOrderStatus(orderId, "kaji_ulang", tx),
            );

            return {
              worksheet: newWorksheet,
              items: newWorksheetItems,
              order: orderData,
            };
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.createWorksheetFromOrder",
            "Failed to create worksheet from order",
            {
              error,
              orderId,
              userId,
            },
          );

          // Re-throw TRPCError as-is, wrap others
          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat worksheet dari order",
          });
        },
      });

      // 4. Log audit for worksheet creation (deferred)
      yield* Effect.forkDaemon(
        logCreate(
          "worksheet",
          result.worksheet.id,
          result.worksheet as Record<string, unknown>,
          userId,
          undefined,
          {
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            itemCount: result.items.length,
          },
        ),
      );

      return result;
    });
  },

  /**
   * Create/update worksheet estimated members and days.
   * Allowed in draft, revision, and verified status.
   */
  createWorksheetEstimates(
    worksheetId: string,
    estimatedAmountOfMembers: number,
    estimatedAmountOfDays: number,
    userId?: string,
  ) {
    return Effect.gen(this, function* () {
      const isExisting = yield* this.getWorksheetById(worksheetId);

      if (!isExisting) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Worksheet tidak ditemukan",
          }),
        );
      }

      if (["draft", "revision"].includes(isExisting.status) === false) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Estimasi hanya dapat ditambahkan pada worksheet dengan status 'draft' atau 'revision'",
          }),
        );
      }

      const [updated] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(worksheets)
            .set({
              estimatedAmountOfDays,
              estimatedAmountOfMembers,
            })
            .where(eq(worksheets.id, worksheetId))
            .returning(),
        catch: (error) => {
          logError(
            "worksheetQueries.createWorksheetEstimates",
            "Failed to create worksheet estimates",
            {
              error,
              worksheetId,
              estimatedAmountOfMembers,
              estimatedAmountOfDays,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambahkan estimasi worksheet",
          });
        },
      });

      if (!updated) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambahkan estimasi worksheet",
          }),
        );
      }

      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          {},
          { estimatedAmountOfMembers, estimatedAmountOfDays } as Record<
            string,
            unknown
          >,
          userId,
        ),
      );

      return updated;
    });
  },

  /**
   * Create/update worksheet estimated members and days for detail transaksi.
   * Allowed in draft, revision, and verified status.
   */
  createWorksheetEstimateForDetailTransaksi(
    worksheetId: string,
    estimatedAmountOfMembers: number,
    estimatedAmountOfDays: number,
    userId?: string,
  ) {
    return Effect.gen(this, function* () {
      const isExisting = yield* this.getWorksheetById(worksheetId);

      if (!isExisting) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Worksheet tidak ditemukan",
          }),
        );
      }

      if (["verified"].includes(isExisting.status) === false) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Estimasi hanya dapat ditambahkan pada worksheet dengan status 'verified'",
          }),
        );
      }

      const [updated] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(worksheets)
            .set({
              estimatedAmountOfDays,
              estimatedAmountOfMembers,
            })
            .where(eq(worksheets.id, worksheetId))
            .returning(),
        catch: (error) => {
          logError(
            "worksheetQueries.createWorksheetEstimateForDetailTransaksi",
            "Failed to create worksheet estimate for detail transaksi",
            {
              error,
              worksheetId,
              estimatedAmountOfMembers,
              estimatedAmountOfDays,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Gagal menambahkan estimasi worksheet untuk detail transaksi",
          });
        },
      });

      if (!updated) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Gagal menambahkan estimasi worksheet untuk detail transaksi",
          }),
        );
      }

      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          {},
          { estimatedAmountOfMembers, estimatedAmountOfDays } as Record<
            string,
            unknown
          >,
          userId,
        ),
      );

      return updated;
    });
  },

  /**
   * Update worksheet status
   */
  updateWorksheetStatus(
    worksheetId: string,
    status: WorksheetStatus,
    userId: string,
    endDate?: string,
    result?: string,
  ) {
    return Effect.gen(function* () {
      const updated = yield* Effect.tryPromise({
        try: async () => {
          const [updatedWorksheet] = await db
            .update(worksheets)
            .set({
              status: status,
              endDate: endDate || sql`${worksheets.endDate}`,
              result: result || sql`${worksheets.result}`,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(worksheets.id, worksheetId))
            .returning();

          if (!updatedWorksheet) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Worksheet tidak ditemukan",
            });
          }

          return updatedWorksheet;
        },
        catch: (error) => {
          logError(
            "worksheetQueries.updateWorksheetStatus",
            "Failed to update worksheet status",
            {
              error,
              worksheetId,
              status,
            },
          );

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui status worksheet",
          });
        },
      });

      // Log audit
      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          { status },
          updated as Record<string, unknown>,
          userId,
          "status",
        ),
      );

      return updated;
    });
  },

  /**
   * Update worksheet item value with transaction
   */
  updateWorksheetItemValue(
    tx: DBorTx,
    itemId: string,
    value: number,
    note?: string,
    isReady?: boolean,
  ) {
    return Effect.tryPromise({
      try: async () => {
        const [updatedItem] = await tx
          .update(worksheetItems)
          .set({
            note: note || sql`${worksheetItems.note}`,
            isReady: isReady ?? sql`${worksheetItems.isReady}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(worksheetItems.id, itemId))
          .returning();

        if (!updatedItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Worksheet item tidak ditemukan",
          });
        }

        return updatedItem;
      },
      catch: (error) => {
        logError(
          "worksheetQueries.updateWorksheetItemValue",
          "Failed to update worksheet item value",
          {
            error,
            itemId,
            value,
          },
        );

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui nilai worksheet item",
        });
      },
    });
  },

  /**
   * Assign tools to worksheet with transaction
   */
  assignToolsToWorksheet(
    tx: DBorTx,
    worksheetId: string,
    toolId: string,
    parameterId: string[],
    toolNeeded: number,
  ) {
    return Effect.gen(function* () {
      // Validation first
      if (toolNeeded <= 0) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Jumlah alat yang dibutuhkan harus lebih dari 0",
          }),
        );
      }

      // Fetch tool parameters
      const toolParams = yield* Effect.tryPromise({
        try: () =>
          tx.query.parameterTools.findMany({
            where: and(
              eq(parameterTools.toolId, toolId),
              inArray(parameterTools.parameterId, parameterId),
            ),
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.assignToolsToWorksheet.findMany",
            "Failed to fetch tool parameters",
            { error, toolId, parameterId },
          );
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil data parameter alat",
          });
        },
      });

      // Validate tool parameters
      if (toolParams.length !== parameterId.length) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Alat tidak tersedia untuk semua parameter yang dipilih",
          }),
        );
      }

      // Insert ONE row per tool into worksheetToolNeeded (planning table)
      const newPlannedTool = yield* Effect.tryPromise({
        try: () =>
          tx
            .insert(worksheetToolNeeded)
            .values({ worksheetId, toolId, toolNeeded })
            .returning(),
        catch: (error) => {
          logError(
            "worksheetQueries.assignToolsToWorksheet.insert",
            "Failed to insert planned tool",
            { error, worksheetId, toolId, toolNeeded },
          );
          return new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengassign alat ke worksheet",
          });
        },
      });

      return newPlannedTool;
    });
  },

  /**
   * Get worksheet chemical materials with full material details
   */
  getWorksheetChemicalMaterials(worksheetId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.worksheetChemicalMaterials.findMany({
          where: eq(worksheetChemicalMaterials.worksheetId, worksheetId),
          with: {
            chemicalMaterial: true,
          },
          orderBy: (wcm, { asc }) => [asc(wcm.createdAt)],
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getWorksheetChemicalMaterials",
          "Failed to fetch worksheet chemical materials",
          {
            error,
            worksheetId,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data bahan kimia worksheet",
        });
      },
    });
  },

  /**
   * Save worksheet chemical materials (batch upsert)
   * This will replace all existing materials for the worksheet
   */
  saveWorksheetChemicalMaterials(
    tx: DBorTx,
    worksheetId: string,
    materials: Array<{
      chemicalMaterialId: string;
      required: number;
      requiredUnit?: BahanUnit | null;
    }>,
  ) {
    return Effect.tryPromise({
      try: async () => {
        // First, remove existing chemical materials
        await tx
          .delete(worksheetChemicalMaterials)
          .where(eq(worksheetChemicalMaterials.worksheetId, worksheetId));

        // Then, add new materials
        if (materials.length > 0) {
          const materialsData = materials.map((m) => ({
            worksheetId,
            chemicalMaterialId: m.chemicalMaterialId,
            required: m.required,
            requiredUnit: m.requiredUnit,
          }));

          const newMaterials = await tx
            .insert(worksheetChemicalMaterials)
            .values(materialsData)
            .returning();

          return newMaterials;
        }

        return [];
      },
      catch: (error) => {
        logError(
          "worksheetQueries.saveWorksheetChemicalMaterials",
          "Failed to save worksheet chemical materials",
          {
            error,
            worksheetId,
            materialsCount: materials.length,
          },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menyimpan bahan kimia worksheet",
        });
      },
    });
  },

  /**
   * Update single worksheet chemical material required quantity
   * Creates the record if it doesn't exist (upsert behavior)
   */
  updateWorksheetChemicalMaterialRequired(
    tx: DBorTx,
    worksheetId: string,
    chemicalMaterialId: string,
    required: number,
    requiredUnit?: BahanUnit | null,
  ) {
    return Effect.tryPromise({
      try: async () => {
        // Check if record exists
        const existing = await tx.query.worksheetChemicalMaterials.findFirst({
          where: (wcm, { and, eq }) =>
            and(
              eq(wcm.worksheetId, worksheetId),
              eq(wcm.chemicalMaterialId, chemicalMaterialId),
            ),
        });

        if (existing) {
          // Update existing record
          const [updated] = await tx
            .update(worksheetChemicalMaterials)
            .set({
              required,
              requiredUnit,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(worksheetChemicalMaterials.id, existing.id))
            .returning();

          return updated;
        } else {
          // Create new record
          const [created] = await tx
            .insert(worksheetChemicalMaterials)
            .values({
              worksheetId,
              chemicalMaterialId,
              required,
              requiredUnit,
            })
            .returning();

          return created;
        }
      },
      catch: (error) => {
        logError(
          "worksheetQueries.updateWorksheetChemicalMaterialRequired",
          "Failed to update worksheet chemical material",
          {
            error,
            worksheetId,
            chemicalMaterialId,
            required,
          },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui kebutuhan bahan kimia",
        });
      },
    });
  },

  /**
   * Assign employees to worksheet with transaction
   * Optionally updates startDate and endDate for scheduling
   */
  assignEmployeesToWorksheet(
    tx: DBorTx,
    worksheetId: string,
    employeeIds: string[],
    assignedBy: string,
    startDate?: string,
    endDate?: string,
  ) {
    return Effect.tryPromise({
      try: async () => {
        // Validate worksheet existence
        const worksheet = await tx.query.worksheets.findFirst({
          where: eq(worksheets.id, worksheetId),
        });
        if (!worksheet) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Worksheet tidak ditemukan",
          });
        }

        // Prevent changing assignments if personnel date is already set
        if (worksheet.isPersonnelDateSet) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Tanggal personil sudah ditetapkan, tidak dapat mengubah tanggal worksheet",
          });
        }

        // First, get existing assignments so we can revert their status
        const existingAssignments =
          await tx.query.worksheetAssignments.findMany({
            where: eq(worksheetAssignments.worksheetId, worksheetId),
          });

        // Revert previously assigned employees back to "siap"
        if (existingAssignments.length > 0) {
          const previousEmployeeIds = existingAssignments.map(
            (a) => a.employeeId,
          );
          await tx
            .update(employees)
            .set({ status: "siap", updatedAt: sql`CURRENT_TIMESTAMP` })
            .where(inArray(employees.id, previousEmployeeIds));
        }

        // Remove existing assignments
        await tx
          .delete(worksheetAssignments)
          .where(eq(worksheetAssignments.worksheetId, worksheetId));

        // Update worksheet dates if provided
        if (startDate !== undefined || endDate !== undefined) {
          await tx
            .update(worksheets)
            .set({
              ...(startDate !== undefined && { startDate }),
              ...(endDate !== undefined && { endDate }),
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(worksheets.id, worksheetId));
        }

        // Then, add new assignments and set employee status to "spt"
        if (employeeIds.length > 0) {
          const assignmentsData = employeeIds.map((employeeId) => ({
            worksheetId,
            employeeId,
            assignedBy,
          }));

          const newAssignments = await tx
            .insert(worksheetAssignments)
            .values(assignmentsData)
            .returning();

          // Update newly assigned employees status to "spt"
          await tx
            .update(employees)
            .set({ status: "spt", updatedAt: sql`CURRENT_TIMESTAMP` })
            .where(inArray(employees.id, employeeIds));

          return newAssignments;
        }

        return [];
      },
      catch: (error) => {
        logError(
          "worksheetQueries.assignEmployeesToWorksheet",
          "Failed to assign employees to worksheet",
          {
            error,
            worksheetId,
            employeeIds,
          },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengassign personil ke worksheet",
        });
      },
    });
  },

  /**
   * Add note to worksheet with transaction
   */
  addWorksheetNote(
    tx: DBorTx,
    worksheetId: string,
    note: string,
    createdBy: string,
    severity: WorksheetNoteStatus,
  ) {
    return Effect.tryPromise({
      try: async () => {
        const [newNote] = await tx
          .insert(worksheetNotes)
          .values({
            worksheetId,
            note,
            createdBy,
            severity,
          })
          .returning();

        if (!newNote) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambahkan catatan",
          });
        }

        return newNote;
      },
      catch: (error) => {
        logError(
          "worksheetQueries.addWorksheetNote",
          "Failed to add worksheet note",
          {
            error,
            worksheetId,
            note,
          },
        );

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan catatan worksheet",
        });
      },
    });
  },

  /**
   * Update worksheet supervisors
   */
  updateWorksheetSupervisors(
    worksheetId: string,
    mainSupervisorId?: string,
    accompanyingSupervisorId?: string,
    userId?: string,
  ) {
    return Effect.gen(function* () {
      const updated = yield* Effect.tryPromise({
        try: async () => {
          const [updatedWorksheet] = await db
            .update(worksheets)
            .set({
              mainSupervisorId: mainSupervisorId || null,
              accompanyingSupervisorId: accompanyingSupervisorId || null,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(worksheets.id, worksheetId))
            .returning();

          if (!updatedWorksheet) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Worksheet tidak ditemukan",
            });
          }

          return updatedWorksheet;
        },
        catch: (error) => {
          logError(
            "worksheetQueries.updateWorksheetSupervisors",
            "Failed to update worksheet supervisors",
            {
              error,
              worksheetId,
              mainSupervisorId,
              accompanyingSupervisorId,
            },
          );

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui supervisor worksheet",
          });
        },
      });

      // Log audit if userId provided
      if (userId) {
        yield* Effect.forkDaemon(
          logUpdate(
            "worksheet",
            worksheetId,
            { mainSupervisorId, accompanyingSupervisorId },
            updated as Record<string, unknown>,
            userId,
            "supervisors",
          ),
        );
      }

      return updated;
    });
  },

  /**
   * Sync worksheet item values to testing items
   * This should be called when worksheet is completed
   */
  syncWorksheetToTesting(worksheetId: string, userId: string) {
    return Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // 1. Get worksheet with items and testing info
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
              with: {
                items: {
                  with: {
                    parameter: true,
                    location: true,
                  },
                },
                testing: {
                  with: {
                    items: true,
                  },
                },
              },
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            if (!worksheet.testing) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Worksheet tidak terhubung ke testing",
              });
            }

            // 2. Match worksheet items to testing items by parameter and location
            const syncedItems = [];
            for (const worksheetItem of worksheet.items) {
              // Find matching testing item
              const matchingTestingItem = worksheet.testing.items.find(
                (ti) =>
                  ti.parameterId === worksheetItem.parameterId &&
                  ti.locationId === worksheetItem.locationId,
              );

              if (matchingTestingItem) {
                // Update testing item with worksheet value
                const [updated] = await tx
                  .update(testingItem)
                  .set({
                    note: worksheetItem.note,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                  })
                  .where(eq(testingItem.id, matchingTestingItem.id))
                  .returning();

                if (updated) {
                  syncedItems.push(updated);
                }
              }
            }

            return {
              worksheet,
              syncedCount: syncedItems.length,
              syncedItems,
            };
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.syncWorksheetToTesting",
            "Failed to sync worksheet to testing",
            {
              error,
              worksheetId,
            },
          );

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal sinkronisasi worksheet ke testing",
          });
        },
      });

      // Log audit
      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          { action: "sync_to_testing" },
          { syncedCount: result.syncedCount } as Record<string, unknown>,
          userId,
          "sync",
        ),
      );

      return result;
    });
  },

  /**
   * Submit worksheet for coordinator verification
   * Changes status from 'draft' to 'pending_verification'
   */
  submitForVerification(worksheetId: string, userId: string) {
    return Effect.gen(function* () {
      const updated = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // First check current status
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            const submissionAllowedStatuses: WorksheetStatus[] = [
              "draft",
              "revision",
            ];
            if (!submissionAllowedStatuses.includes(worksheet.status)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Worksheet harus dalam status 'draft' atau 'revision' untuk diajukan verifikasi",
              });
            }

            const [updatedWorksheet] = await tx
              .update(worksheets)
              .set({
                status: "pending_verification",
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(worksheets.id, worksheetId))
              .returning();

            if (!updatedWorksheet) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mengajukan worksheet untuk verifikasi",
              });
            }

            return updatedWorksheet;
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.submitForVerification",
            "Failed to submit worksheet for verification",
            {
              error,
              worksheetId,
            },
          );

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengajukan worksheet untuk verifikasi",
          });
        },
      });

      // Log audit
      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          { status: "pending_verification" },
          updated as Record<string, unknown>,
          userId,
          "submit_for_verification",
        ),
      );

      return updated;
    });
  },

  /**
   * Revise worksheet (coordinator action)
   * Changes status from 'pending_verification' to 'revision'
   */
  reviseWorksheet(worksheetId: string, userId: string, revisionNote: string) {
    return Effect.gen(function* () {
      const updated = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // First check current status
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            if (
              worksheet.status !== "draft" &&
              worksheet.status !== "pending_verification"
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Worksheet harus dalam status 'draft' atau 'pending_verification' untuk direvisi",
              });
            }

            const [updatedWorksheet] = await tx
              .update(worksheets)
              .set({
                status: "revision",
                revisionNotes: revisionNote,
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(worksheets.id, worksheetId))
              .returning();

            if (!updatedWorksheet) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal merevisi worksheet",
              });
            }

            return updatedWorksheet;
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.reviseWorksheet",
            "Failed to revise worksheet",
            {
              error,
              worksheetId,
            },
          );

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal merevisi worksheet",
          });
        },
      });

      // Log audit
      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          { status: "revision", revisionNote },
          updated as Record<string, unknown>,
          userId,
          "revise",
        ),
      );

      return updated;
    });
  },

  /**
   * Verify worksheet (coordinator action)
   * Changes status from 'draft'/'pending_verification' to 'verified', and
   * advances the associated order to 'kaji_ulang_disetujui' since verifying the
   * worksheet approves the technical review (kaji ulang).
   */
  verifyWorksheet(
    worksheetId: string,
    userId: string,
    mainSupervisorId?: string,
    accompanyingSupervisorId?: string,
  ) {
    return Effect.gen(function* () {
      const updated = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // First check current status
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            if (
              worksheet.status !== "draft" &&
              worksheet.status !== "pending_verification"
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Worksheet harus dalam status 'draft' atau 'pending_verification' untuk diverifikasi",
              });
            }

            const [updatedWorksheet] = await tx
              .update(worksheets)
              .set({
                status: "verified",
                mainSupervisorId:
                  mainSupervisorId ?? worksheet.mainSupervisorId ?? null,
                accompanyingSupervisorId:
                  accompanyingSupervisorId ??
                  worksheet.accompanyingSupervisorId ??
                  null,
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(worksheets.id, worksheetId))
              .returning();

            if (!updatedWorksheet) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memverifikasi worksheet",
              });
            }

            // Verifying the worksheet means the technical review (kaji ulang)
            // is approved, so advance the order to 'kaji_ulang_disetujui'.
            // This marks Kaji Ulang complete and makes Penawaran Diterbitkan the
            // active step on the customer timeline. Applies whether verifying
            // from 'draft' or 'pending_verification'.
            await Effect.runPromise(
              orderQueries.updateOrderStatus(
                worksheet.orderId,
                "kaji_ulang_disetujui",
                tx,
              ),
            );

            return updatedWorksheet;
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.verifyWorksheet",
            "Failed to verify worksheet",
            {
              error,
              worksheetId,
            },
          );

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memverifikasi worksheet",
          });
        },
      });

      // Log audit
      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          { status: "verified", mainSupervisorId, accompanyingSupervisorId },
          updated as Record<string, unknown>,
          userId,
          "verify",
        ),
      );

      return updated;
    });
  },

  /**
   * Get worksheet with employee certifications and tool calibration certificates.
   * Intended for the new certificate/PPS page, separate from the order detail view.
   *
   * @param orderId - The order ID to look up the associated worksheet.
   * @returns An Effect that resolves to the worksheet with its assignment certifications
   *          and the most recent tool calibration certificate, or undefined if not found.
   */
  getWorksheetWithCertificates(orderId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.worksheets.findFirst({
          where: eq(worksheets.orderId, orderId),
          with: {
            assignments: {
              with: {
                employee: {
                  with: {
                    certifications: true,
                  },
                },
              },
            },
            tools: {
              with: {
                tool: {
                  with: {
                    calibrations: {
                      with: {
                        certificate: true,
                      },
                      orderBy: (calibrations, { desc }) => [
                        desc(calibrations.calibrationDate),
                      ],
                      limit: 1,
                    },
                  },
                },
              },
            },
          },
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getWorksheetWithCertificates",
          "Failed to fetch worksheet with certificates",
          { error, orderId },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data sertifikat worksheet",
        });
      },
    });
  },

  /**
   * Get worksheet transaction detail for document generation
   * Returns worksheet with ready items, assignments, and operational costs
   */
  getWorksheetTransactionDetail(worksheetId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.worksheets.findFirst({
          where: eq(worksheets.id, worksheetId),
          with: {
            order: {
              with: {
                company: {
                  columns: {
                    id: true,
                    name: true,
                    companyBankAccount: true,
                    companyBankAccountName: true,
                    companyBankName: true,
                    address: true,
                    headOfCompany: true,
                    headOfCompanyPosition: true,
                  },
                  with: {
                    regency: {
                      columns: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                items: {
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
                    location: {
                      with: {
                        regency: true,
                        district: true,
                      },
                    },
                  },
                },
              },
            },
            items: {
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
                location: {
                  with: {
                    regency: true,
                    district: true,
                  },
                },
              },
            },
            assignments: {
              with: {
                employee: {
                  with: {
                    user: true,
                    position: true,
                  },
                },
              },
            },
            mainSupervisor: {
              with: {
                user: true,
                position: true,
              },
            },
            accompanyingSupervisor: {
              with: {
                user: true,
                position: true,
              },
            },
            operationalCosts: {
              orderBy: (costs, { asc }) => [asc(costs.sortOrder)],
            },
          },
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getWorksheetTransactionDetail",
          "Failed to fetch worksheet transaction detail",
          {
            error,
            worksheetId,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil detail transaksi worksheet",
        });
      },
    });
  },

  /**
   * Save operational costs for worksheet (batch upsert)
   * Deletes existing costs and inserts new ones
   */
  saveWorksheetOperationalCosts(
    worksheetId: string,
    costs: Array<{
      id?: string;
      item: string;
      unitCount: number;
      days: number;
      unitCost: number | null;
      note?: string | null;
      sortOrder: number;
    }>,
    userId: string,
  ) {
    return Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // 1. Verify worksheet exists
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            // 2. Check if worksheet status allows editing
            const editableStatuses = ["verified"];
            if (!editableStatuses.includes(worksheet.status)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Biaya operasional hanya dapat diubah jika status worksheet adalah 'draft' atau 'revision'",
              });
            }

            // 3. Check if operational costs are applicable
            // Only allow operational costs when at least one of transportation or accommodation
            // is covered by K3 Lab (value = true)
            const canHaveOperationalCosts =
              worksheet.coverFlightIncluded === true ||
              worksheet.coverGroundTransportationIncluded === true ||
              worksheet.coverGroundTransportationToAirportOrHarbour === true ||
              worksheet.coverLodgingIncluded === true ||
              worksheet.coverWaterTransportationIncluded === true;

            if (!canHaveOperationalCosts && costs.length > 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Biaya operasional tidak dapat ditambahkan karena transportasi dan akomodasi ditanggung oleh pemohon pengujian",
              });
            }

            // 4. Delete existing operational costs
            await tx
              .delete(worksheetOperationalCosts)
              .where(eq(worksheetOperationalCosts.worksheetId, worksheetId));

            // 5. Insert new operational costs
            if (costs.length > 0) {
              const costsData = costs.map((cost, index) => ({
                worksheetId,
                item: cost.item,
                unitCount: cost.unitCount,
                days: cost.days,
                unitCost: cost.unitCost,
                note: cost.note || null,
                sortOrder: cost.sortOrder ?? index,
              }));

              const newCosts = await tx
                .insert(worksheetOperationalCosts)
                .values(costsData)
                .returning();

              return newCosts;
            }

            return [];
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.saveWorksheetOperationalCosts",
            "Failed to save operational costs",
            {
              error,
              worksheetId,
              costsCount: costs.length,
            },
          );

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menyimpan biaya operasional",
          });
        },
      });

      // Log audit
      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          { action: "save_operational_costs" },
          { costsCount: result.length } as Record<string, unknown>,
          userId,
          "operational_costs",
        ),
      );

      return result;
    });
  },

  /**
   * Get the current worksheet assignment for a given user and worksheet.
   * Resolves via: users.id → employees.userId → worksheetAssignments.employeeId + worksheetId.
   * Throws NOT_FOUND if the user has no employee record or is not assigned to the worksheet.
   *
   * @param userId - The authenticated user's ID (from JWT context)
   * @param worksheetId - The worksheet ID to look up the assignment for
   */
  getAssignmentByUserAndWorksheet(userId: string, worksheetId: string) {
    return Effect.tryPromise({
      try: async () => {
        const employee = await db.query.employees.findFirst({
          where: eq(employees.userId, userId),
          columns: { id: true },
        });

        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Data pegawai tidak ditemukan",
          });
        }

        const assignment = await db.query.worksheetAssignments.findFirst({
          where: and(
            eq(worksheetAssignments.employeeId, employee.id),
            eq(worksheetAssignments.worksheetId, worksheetId),
          ),
        });

        if (!assignment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Penugasan worksheet tidak ditemukan",
          });
        }

        return assignment;
      },
      catch: (error) => {
        if (error instanceof TRPCError) throw error;
        logError(
          "worksheetQueries.getAssignmentByUserAndWorksheet",
          "Failed to fetch worksheet assignment",
          { error, userId, worksheetId },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data penugasan worksheet",
        });
      },
    });
  },

  /**
   * Update worksheet personnel date set flag
   * This is used to indicate whether the personnel assignment dates have been set, which affects scheduling and notifications
   */
  updateWorksheetPersonnelDateSet(
    worksheetId: string,
    isSet: boolean,
    userId: string,
  ) {
    return Effect.gen(function* () {
      const updated = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // First check if worksheet exists
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            // Check for valid worksheet status if needed (optional, depending on business rules)
            const editableStatuses = ["verified"];
            if (!editableStatuses.includes(worksheet.status)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Status worksheet tidak valid untuk memperbarui tanggal personil",
              });
            }

            const [updatedWorksheet] = await tx
              .update(worksheets)
              .set({
                isPersonnelDateSet: isSet,
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(worksheets.id, worksheetId))
              .returning();

            if (!updatedWorksheet) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memperbarui status tanggal personil worksheet",
              });
            }

            return updatedWorksheet;
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.updateWorksheetPersonnelDateSet",
            "Failed to update worksheet personnel date set flag",
            {
              error,
              worksheetId,
              isSet,
            },
          );
          if (error instanceof TRPCError) {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui status tanggal personil worksheet",
          });
        },
      });

      // Log audit
      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          { isPersonnelDateSet: isSet },
          updated as Record<string, unknown>,
          userId,
          "personnel_date_set",
        ),
      );

      return updated;
    });
  },

  /**
   * Deduct chemical material stock when a worksheet is completed.
   * Deducts `required` from `usedStock` first; any remainder comes from `sealedStock`.
   * Auto-updates the material status: `habis`, `hampir_habis`, or `tersedia`.
   * Materials with status `expired` or `dipesan` keep their status unchanged.
   *
   * @param worksheetId - ID of the completed worksheet
   * @param userId - ID of the user triggering completion
   */
  deductChemicalMaterialStock(worksheetId: string, userId: string) {
    return Effect.gen(function* () {
      const deducted = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const materials =
              await tx.query.worksheetChemicalMaterials.findMany({
                where: eq(worksheetChemicalMaterials.worksheetId, worksheetId),
                with: {
                  chemicalMaterial: true,
                },
              });

            if (materials.length === 0) return [];

            const results = [];

            for (const material of materials) {
              const { chemicalMaterial, required } = material;

              if (!chemicalMaterial || !required || required <= 0) continue;

              const currentUsed = chemicalMaterial.usedStock ?? 0;
              const currentSealed = chemicalMaterial.sealedStock ?? 0;

              // Deduct from usedStock first, carry remainder to sealedStock
              let newUsedStock: number;
              let newSealedStock: number;

              if (currentUsed >= required) {
                newUsedStock = currentUsed - required;
                newSealedStock = currentSealed;
              } else {
                const remainder = required - currentUsed;
                newUsedStock = 0;
                newSealedStock = Math.max(0, currentSealed - remainder);
              }

              const totalRemaining = newUsedStock + newSealedStock;

              // Auto-update status unless the material is expired or on-order
              let newStatus = chemicalMaterial.status;
              if (
                chemicalMaterial.status !== "expired" &&
                chemicalMaterial.status !== "dipesan"
              ) {
                if (totalRemaining <= 0) {
                  newStatus = "habis";
                } else if (
                  chemicalMaterial.monthlyUsage != null &&
                  chemicalMaterial.monthlyUsage > 0 &&
                  totalRemaining <= chemicalMaterial.monthlyUsage
                ) {
                  newStatus = "hampir_habis";
                } else {
                  newStatus = "tersedia";
                }
              }

              const [updated] = await tx
                .update(chemicalMaterials)
                .set({
                  usedStock: newUsedStock,
                  sealedStock: newSealedStock,
                  status: newStatus,
                  updatedAt: sql`CURRENT_TIMESTAMP`,
                })
                .where(eq(chemicalMaterials.id, chemicalMaterial.id))
                .returning();

              if (updated) results.push(updated);
            }

            return results;
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.deductChemicalMaterialStock",
            "Failed to deduct chemical material stock",
            { error, worksheetId },
          );

          if (error instanceof TRPCError) throw error;

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengurangi stok bahan kimia",
          });
        },
      });

      yield* Effect.forkDaemon(
        logUpdate(
          "chemical_material",
          worksheetId,
          { action: "deduct_stock" },
          { deductedCount: deducted.length } as Record<string, unknown>,
          userId,
        ),
      );

      return deducted;
    });
  },

  /**
   * Get all borrowed tools for a worksheet, including tool details.
   * Returns every `worksheetTools` record for the given worksheet that has not been soft-deleted,
   * along with the associated tool. The `returnedAt` field indicates whether each tool has been
   * returned; records where `returnedAt` is null are still on loan.
   *
   * @param worksheetId - The worksheet ID to query borrowed tools for
   */
  getBorrowedToolsForWorksheet(worksheetId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.worksheetTools.findMany({
          where: and(
            eq(worksheetTools.worksheetId, worksheetId),
            isNull(worksheetTools.deletedAt),
          ),
          with: {
            tool: true,
          },
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getBorrowedToolsForWorksheet",
          "Failed to get borrowed tools for worksheet",
          { error, worksheetId },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Gagal mendapatkan daftar alat yang dipinjam untuk worksheet",
        });
      },
    });
  },

  /**
   * Koor. Admin signals that the offering is ready for Admin to print.
   * Transitions the order from `kaji_ulang_disetujui` → `penawaran_diterbitkan`.
   * Requires the worksheet to be `verified` and to have saved operational costs.
   */
  publishOffering(worksheetId: string, userId: string) {
    return Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            if (worksheet.status !== "verified") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Worksheet harus berstatus 'verified' sebelum menerbitkan penawaran",
              });
            }

            await assertOperationalCostsSaved(tx, worksheetId);

            // Submit the offering for Kepala Balai review instead of issuing it
            // directly. The admin can only Cetak once the head approves
            // (→ penawaran_diterbitkan via orderQueries.approveOffering).
            await Effect.runPromise(
              orderQueries.updateOrderStatus(
                worksheet.orderId,
                "penawaran_review",
                tx,
              ),
            );
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.publishOffering",
            "Failed to publish offering",
            { error, worksheetId },
          );
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menerbitkan penawaran",
          });
        },
      });

      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          {},
          { action: "publish_offering" } as Record<string, unknown>,
          userId,
          "publish_offering",
        ),
      );
    });
  },

  /**
   * Persists the offering letter's number and issue date on the worksheet when
   * Admin generates (Cetak) the offering PDF. These columns gate the downstream
   * Invoice/SPK/SPT actions and pre-fill the Invoice's reference fields, so they
   * must be saved every time the offering is printed (the latest values win).
   *
   * @param worksheetId - Worksheet whose offering letter info is being saved
   * @param userId - Acting user, for the audit log
   * @param letterNumber - The offering letter number entered in the dialog
   */
  saveOfferingLetterInfo(
    worksheetId: string,
    userId: string,
    letterNumber: string,
  ) {
    return Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            await tx
              .update(worksheets)
              .set({
                offeringLetterNumber: letterNumber,
                offeringLetterDate: sql`CURRENT_TIMESTAMP`,
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(worksheets.id, worksheetId));
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.saveOfferingLetterInfo",
            "Failed to save offering letter info",
            { error, worksheetId },
          );
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menyimpan data surat penawaran",
          });
        },
      });

      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          {},
          { letterNumber, action: "save_offering_letter_info" } as Record<
            string,
            unknown
          >,
          userId,
          "save_offering_letter_info",
        ),
      );
    });
  },

  /**
   * Bendahara Penerimaan issues the invoice/SPK.
   * Stores billing data on the worksheet and transitions the order to `tagihan_diterbitkan`.
   */
  publishInvoice(
    worksheetId: string,
    userId: string,
    billingCode: string,
    billingExpiryDate: string,
  ) {
    return Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            await tx
              .update(worksheets)
              .set({
                billingCode,
                billingExpiryDate,
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(worksheets.id, worksheetId));

            await Effect.runPromise(
              orderQueries.updateOrderStatus(
                worksheet.orderId,
                "tagihan_diterbitkan",
                tx,
              ),
            );
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.publishInvoice",
            "Failed to publish invoice",
            { error, worksheetId },
          );
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menerbitkan tagihan",
          });
        },
      });

      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          {},
          { billingCode, action: "publish_invoice" } as Record<string, unknown>,
          userId,
          "publish_invoice",
        ),
      );
    });
  },

  /**
   * Tim Penjadwalan signals that personnel and dates are confirmed.
   * Transitions the order to `menunggu_penerbitan_spt_jadwal` so Admin can print the SPT.
   */
  publishSPT(worksheetId: string, userId: string) {
    return Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const worksheet = await tx.query.worksheets.findFirst({
              where: eq(worksheets.id, worksheetId),
              with: {
                assignments: { columns: { id: true }, limit: 1 },
              },
            });

            if (!worksheet) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              });
            }

            if (!worksheet.startDate || !worksheet.endDate) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Tanggal pengujian harus diisi sebelum menerbitkan SPT",
              });
            }

            if (!worksheet.assignments?.length) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Personel harus ditugaskan sebelum menerbitkan SPT",
              });
            }

            await Effect.runPromise(
              orderQueries.updateOrderStatus(
                worksheet.orderId,
                "menunggu_penerbitan_spt_jadwal",
                tx,
              ),
            );
          }),
        catch: (error) => {
          logError("worksheetQueries.publishSPT", "Failed to publish SPT", {
            error,
            worksheetId,
          });
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menerbitkan SPT",
          });
        },
      });

      yield* Effect.forkDaemon(
        logUpdate(
          "worksheet",
          worksheetId,
          {},
          { action: "publish_spt" } as Record<string, unknown>,
          userId,
          "publish_spt",
        ),
      );
    });
  },
};

export default worksheetQueries;
