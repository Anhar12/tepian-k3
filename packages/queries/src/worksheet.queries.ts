import { TRPCError } from "@trpc/server";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { eq, sql } from "@tepian-k3/db";
import {
  worksheets,
  worksheetItems,
  worksheetTools,
  worksheetChemicalMaterials,
  worksheetAssignments,
  worksheetNotes,
  worksheetOperationalCosts,
  testingItem,
  order,
} from "@tepian-k3/db/schema";
import type { BahanUnit } from "@tepian-k3/constants";
import { logCreate, logUpdate } from "./helpers/audit.helpers";
import type { WorksheetNoteStatus } from "@tepian-k3/constants";

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
  getAllWorksheets(page: number = 1, limit: number = 10, status?: string) {
    return Effect.gen(function* () {
      const offset = (page - 1) * limit;

      const [items, totalCount] = yield* Effect.tryPromise({
        try: () =>
          Promise.all([
            db.query.worksheets.findMany({
              where: status ? eq(worksheets.status, status as any) : undefined,
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
            testing: {
              with: {
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
                  limit: 1,
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

            // Validate order has items
            if (orderData.items.length === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Order tidak memiliki item untuk worksheet",
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
                coverAccommodationIncluded:
                  orderData.coverAccommodationIncluded,
                coverTransportationIncluded:
                  orderData.coverTransportationIncluded,
              })
              .returning();

            if (!newWorksheet) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat worksheet",
              });
            }

            // 3. Create worksheet items from order items
            const worksheetItemsData = orderData.items.map((item) => ({
              worksheetId: newWorksheet.id,
              parameterId: item.parameterId,
              locationId: item.locationId,
              quantity: item.quantity,
              value: null,
              note: null,
              isReady: false,
            }));

            const newWorksheetItems = await tx
              .insert(worksheetItems)
              .values(worksheetItemsData)
              .returning();

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

      return result.worksheet;
    });
  },

  /**
   * Update worksheet status
   */
  updateWorksheetStatus(
    worksheetId: string,
    status: string,
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
              status: status as any,
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
            value,
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
  assignToolsToWorksheet(tx: DBorTx, worksheetId: string, toolIds: string[]) {
    return Effect.tryPromise({
      try: async () => {
        // First, remove existing tools
        await tx
          .delete(worksheetTools)
          .where(eq(worksheetTools.worksheetId, worksheetId));

        // Then, add new tools
        if (toolIds.length > 0) {
          const toolsData = toolIds.map((toolId) => ({
            worksheetId,
            toolId,
          }));

          const newTools = await tx
            .insert(worksheetTools)
            .values(toolsData)
            .returning();

          return newTools;
        }

        return [];
      },
      catch: (error) => {
        logError(
          "worksheetQueries.assignToolsToWorksheet",
          "Failed to assign tools to worksheet",
          {
            error,
            worksheetId,
            toolIds,
          },
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengassign alat ke worksheet",
        });
      },
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
        // First, remove existing assignments
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

        // Then, add new assignments
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

              if (matchingTestingItem && worksheetItem.value !== null) {
                // Update testing item with worksheet value
                const [updated] = await tx
                  .update(testingItem)
                  .set({
                    result: String(worksheetItem.value),
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
        try: async () => {
          // First check current status
          const worksheet = await db.query.worksheets.findFirst({
            where: eq(worksheets.id, worksheetId),
          });

          if (!worksheet) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Worksheet tidak ditemukan",
            });
          }

          if (worksheet.status !== "draft") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Worksheet harus dalam status 'draft' untuk diajukan verifikasi",
            });
          }

          const [updatedWorksheet] = await db
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
        },
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
   * Verify worksheet (coordinator action)
   * Changes status from 'pending_verification' to 'verified'
   */
  verifyWorksheet(
    worksheetId: string,
    userId: string,
    mainSupervisorId?: string,
    accompanyingSupervisorId?: string,
  ) {
    return Effect.gen(function* () {
      const updated = yield* Effect.tryPromise({
        try: async () => {
          // First check current status
          const worksheet = await db.query.worksheets.findFirst({
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

          const [updatedWorksheet] = await db
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

          return updatedWorksheet;
        },
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
            const editableStatuses = ["draft", "revision"];
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
              worksheet.coverTransportationIncluded === true ||
              worksheet.coverAccommodationIncluded === true;

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
};

export default worksheetQueries;
