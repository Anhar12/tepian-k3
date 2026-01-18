import { TRPCError } from "@trpc/server";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { eq, sql } from "@tepian-k3/db";
import {
  worksheets,
  worksheetItems,
  worksheetTools,
  worksheetAssignments,
  worksheetNotes,
  testing,
  testingItem,
} from "@tepian-k3/db/schema";
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
            testing: {
              with: {
                order: {
                  with: {
                    company: true,
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
   * Get worksheets by testing ID
   */
  getWorksheetsByTestingId(testingId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.worksheets.findMany({
          where: eq(worksheets.testingId, testingId),
          orderBy: (worksheets, { desc }) => [desc(worksheets.createdAt)],
          with: {
            items: true,
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
          },
        }),
      catch: (error) => {
        logError(
          "worksheetQueries.getWorksheetsByTestingId",
          "Failed to fetch worksheets by testing ID",
          {
            error,
            testingId,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil worksheet berdasarkan testing",
        });
      },
    });
  },

  /**
   * Create worksheet from testing with transaction
   */
  createWorksheetFromTesting(
    testingId: string,
    userId: string,
    startDate: string,
    mainSupervisorId?: string,
    accompanyingSupervisorId?: string,
  ) {
    return Effect.gen(function* () {
      // Perform all operations in a transaction
      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // 1. Get testing with items and validate
            const testingData = await tx.query.testing.findFirst({
              where: eq(testing.id, testingId),
              with: {
                items: {
                  with: {
                    parameter: true,
                    location: true,
                  },
                },
                order: true,
              },
            });

            if (!testingData) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Testing tidak ditemukan",
              });
            }

            // Validate testing has items
            if (testingData.items.length === 0) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Testing tidak memiliki item untuk worksheet",
              });
            }

            // 2. Create worksheet record
            const [newWorksheet] = await tx
              .insert(worksheets)
              .values({
                testingId: testingData.id,
                status: "in_progress",
                startDate,
                mainSupervisorId: mainSupervisorId || null,
                accompanyingSupervisorId: accompanyingSupervisorId || null,
                createdBy: userId,
              })
              .returning();

            if (!newWorksheet) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat worksheet",
              });
            }

            // 3. Create worksheet items from testing items
            const worksheetItemsData = testingData.items.map((item) => ({
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
              testing: testingData,
            };
          }),
        catch: (error) => {
          logError(
            "worksheetQueries.createWorksheetFromTesting",
            "Failed to create worksheet from testing",
            {
              error,
              testingId,
              userId,
            },
          );

          // Re-throw TRPCError as-is, wrap others
          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat worksheet dari testing",
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
            testingId: result.testing.id,
            testingNumber: result.testing.testingNumber,
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
   * Assign employees to worksheet with transaction
   */
  assignEmployeesToWorksheet(
    tx: DBorTx,
    worksheetId: string,
    employeeIds: string[],
    assignedBy: string,
  ) {
    return Effect.tryPromise({
      try: async () => {
        // First, remove existing assignments
        await tx
          .delete(worksheetAssignments)
          .where(eq(worksheetAssignments.worksheetId, worksheetId));

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
};

export default worksheetQueries;
