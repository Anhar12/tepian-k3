import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@tepian-k3/db/client";
import { worksheetItems } from "@tepian-k3/db/schema";
import { eq, sql } from "@tepian-k3/db";
import { createTRPCRouter, protectedProcedure, withPermission } from "../index";
import worksheetQueries from "@tepian-k3/queries/worksheet.queries";
import worksheetSchema from "@tepian-k3/schema/worksheet.schema";
import { runEffect } from "../utils/run-effect";
import { WORKSHEET_STATUS } from "@tepian-k3/constants";
import { logError } from "@tepian-k3/services/logger";
import worksheetNoteQueries from "@tepian-k3/queries/worksheet-note.queries";
import { EventTypes } from "@tepian-k3/schema/event.schema";
import { handleTRPCError } from "@tepian-k3/utils/handle-trpc-error";

export const worksheetRouter = createTRPCRouter({
  /**
   * Get all worksheets with pagination (Admin)
   */
  getAllWorksheets: withPermission("worksheets.read")
    .input(worksheetSchema.getWorksheetsSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          worksheetQueries.getAllWorksheets(
            input.page,
            input.perPage,
            input.status,
          ),
        ),
    ),

  /**
   * Get all worksheets for schedule calendar display
   */
  getWorksheetsForSchedule: withPermission("worksheets.read").query(
    async () => await runEffect(worksheetQueries.getWorksheetsForSchedule()),
  ),

  /**
   * Get worksheet by ID with all relations
   */
  getWorksheetById: withPermission("worksheets.read")
    .input(z.object({ worksheetId: z.uuidv7() }))
    .query(async ({ input }) => {
      const worksheet = await runEffect(
        worksheetQueries.getWorksheetById(input.worksheetId),
      );

      if (!worksheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Worksheet tidak ditemukan",
        });
      }

      return worksheet;
    }),

  /**
   * Get worksheet by order ID
   */
  getByOrderId: withPermission("worksheets.read")
    .input(z.object({ orderId: z.uuidv7() }))
    .query(
      async ({ input }) =>
        await runEffect(worksheetQueries.getWorksheetByOrderId(input.orderId)),
    ),

  /**
   * Create worksheet from order (Admin - Kaji Ulang Phase)
   * This creates worksheet with testingId = NULL, to be linked later after payment
   */
  createFromOrder: withPermission("worksheets.create")
    .input(worksheetSchema.createWorksheetFromOrderSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.createWorksheetFromOrder(
            input.orderId,
            ctx.user.id,
            input.mainSupervisorId,
            input.accompanyingSupervisorId,
          ),
        ),
    ),

  /**
   * Submit worksheet for coordinator verification
   * Changes status from 'draft' to 'pending_verification'
   */
  submitForVerification: withPermission("worksheets.update")
    .input(worksheetSchema.submitForVerificationSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.submitForVerification(
            input.worksheetId,
            ctx.user.id,
          ),
        ),
    ),

  /**
   * Verify worksheet (Coordinator action)
   * Changes status from 'pending_verification' to 'verified'
   */
  verify: withPermission("worksheets.update")
    .input(worksheetSchema.verifyWorksheetSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.verifyWorksheet(
            input.worksheetId,
            ctx.user.id,
            input.mainSupervisorId,
            input.accompanyingSupervisorId,
          ),
        ),
    ),

  /**
   * Update worksheet status
   */
  updateStatus: withPermission("worksheets.update")
    .input(worksheetSchema.updateWorksheetStatusSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.updateWorksheetStatus(
            input.worksheetId,
            input.status,
            ctx.user.id,
            input.endDate,
            input.result,
          ),
        ),
    ),

  /**
   * Update worksheet supervisors
   */
  updateSupervisors: withPermission("worksheets.update")
    .input(worksheetSchema.updateWorksheetSupervisorsSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.updateWorksheetSupervisors(
            input.worksheetId,
            input.mainSupervisorId ?? undefined,
            input.accompanyingSupervisorId ?? undefined,
            ctx.user.id,
          ),
        ),
    ),

  /**
   * Update single worksheet item value (Lab technician - Phase 7)
   */
  updateItemValue: withPermission("worksheet-items.update")
    .input(worksheetSchema.updateWorksheetItemValueSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(
          worksheetQueries.updateWorksheetItemValue(
            db,
            input.itemId,
            input.value,
            input.note,
            input.isReady,
          ),
        ),
    ),

  /**
   * Batch update worksheet items (Lab technician - Phase 7)
   */
  batchUpdateItems: withPermission("worksheet-items.update")
    .input(worksheetSchema.batchUpdateWorksheetItemsSchema)
    .mutation(async ({ input }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Verify worksheet exists
          const worksheet = yield* worksheetQueries.getWorksheetById(
            input.worksheetId,
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              }),
            );
          }

          // Update items in transaction
          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                const updates = await Promise.all(
                  input.items.map((item) =>
                    tx
                      .update(worksheetItems)
                      .set({
                        note: item.note,
                        isReady: item.isReady ?? false,
                        updatedAt: sql`CURRENT_TIMESTAMP`,
                      })
                      .where(eq(worksheetItems.id, item.itemId))
                      .returning(),
                  ),
                );

                // Flatten and filter out empty results
                return updates.map((result) => result[0]).filter(Boolean);
              }),
            catch: (error) => {
              logError(
                "worksheetRouter.batchUpdateItems",
                "Failed to update worksheet items",
                {
                  input,
                  error,
                },
              );
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memperbarui worksheet items",
              });
            },
          });

          return {
            updatedCount: results.length,
            items: results,
          };
        }),
      );
    }),

  /**
   * Create worksheet estimate
   */
  createEstimate: withPermission("worksheets.update")
    .input(worksheetSchema.createWorksheetEstimatedSchema)
    .mutation(
      async ({ input }) =>
        await runEffect(
          worksheetQueries.createWorksheetEstimates(
            input.worksheetId,
            input.estimatedAmountOfDays,
            input.estimatedAmountOfMembers,
          ),
        ),
    ),

  /**
   * Assign tools to worksheet
   */
  assignTools: withPermission("worksheet-tools.update")
    .input(worksheetSchema.assignToolsToWorksheetSchema)
    .mutation(async ({ input }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Verify worksheet exists
          const worksheet = yield* worksheetQueries.getWorksheetById(
            input.worksheetId,
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              }),
            );
          }

          // Assign tools in transaction
          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                const assignedTools = await Promise.all(
                  input.items.map((item) =>
                    runEffect(
                      worksheetQueries.assignToolsToWorksheet(
                        tx,
                        input.worksheetId,
                        item.itemId,
                        item.parameterId,
                        item.toolNeeded,
                      ),
                    ),
                  ),
                );

                return assignedTools;
              }),
            catch: (error) => {
              logError(
                "worksheetRouter.assignTools",
                "Failed to assign tools to worksheet",
                {
                  input,
                  error,
                },
              );

              return handleTRPCError(
                error,
                "Gagal mengassign alat ke worksheet",
                "INTERNAL_SERVER_ERROR",
              );
            },
          });

          return results;
        }),
      );
    }),

  /**
   * Assign employees to worksheet (with optional schedule dates)
   */
  assignEmployees: withPermission("worksheet-assignments.update")
    .input(worksheetSchema.assignEmployeesToWorksheetSchema)
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Verify worksheet exists
          const worksheet = yield* worksheetQueries.getWorksheetById(
            input.worksheetId,
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              }),
            );
          }

          // Assign employees in transaction
          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                return await runEffect(
                  worksheetQueries.assignEmployeesToWorksheet(
                    tx,
                    input.worksheetId,
                    input.employeeIds,
                    ctx.user.id,
                    input.startDate,
                    input.endDate,
                  ),
                );
              }),
            catch: (error) => {
              logError(
                "worksheetRouter.assignEmployees",
                "Failed to assign employees to worksheet",
                {
                  input,
                  error,
                },
              );
              return handleTRPCError(
                error,
                "Gagal mengassign karyawan ke worksheet",
                "INTERNAL_SERVER_ERROR",
              );
            },
          });

          return results;
        }),
      );
    }),

  /**
   * Get worksheet notes
   */
  getNotes: withPermission("worksheet-notes.read")
    .input(z.object({ worksheetId: z.uuidv7() }))
    .query(
      async ({ input }) =>
        await runEffect(
          worksheetNoteQueries.getWorksheetNoteByWorksheetId(input.worksheetId),
        ),
    ),

  /**
   * Add note to worksheet
   */
  addNote: withPermission("worksheet-notes.create")
    .input(worksheetSchema.addWorksheetNoteSchema)
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Verify worksheet exists
          const worksheet = yield* worksheetQueries.getWorksheetById(
            input.worksheetId,
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              }),
            );
          }

          // Add note in transaction
          const result = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                return await runEffect(
                  worksheetQueries.addWorksheetNote(
                    tx,
                    input.worksheetId,
                    input.note,
                    ctx.user.id,
                    input.severity,
                  ),
                );
              }),
            catch: (error) => {
              logError(
                "worksheetRouter.addNote",
                "Failed to add note to worksheet",
                { input, error },
              );
              return handleTRPCError(
                error,
                "Gagal menambahkan catatan",
                "INTERNAL_SERVER_ERROR",
              );
            },
          });

          yield* Effect.tryPromise(() =>
            ctx.eventBus.publish(EventTypes.WORKSHEET_NOTE_CREATED, {
              worksheetId: input.worksheetId,
              noteId: result.id,
              createdBy: ctx.user.id,
              content: input.note,
            }),
          );

          return result;
        }),
      );
    }),

  /**
   * Complete worksheet (marks status as completed and sets end date)
   */
  complete: withPermission("worksheets.update")
    .input(worksheetSchema.completeWorksheetSchema)
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Verify worksheet exists and is in_progress
          const worksheet = yield* worksheetQueries.getWorksheetById(
            input.worksheetId,
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              }),
            );
          }

          if (worksheet.status !== "in_progress") {
            return yield* Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Worksheet harus dalam status 'in_progress' untuk diselesaikan",
              }),
            );
          }

          // Check if all items are ready
          const allItemsReady = worksheet.items?.every((item) => item.isReady);

          if (!allItemsReady) {
            return yield* Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Semua item worksheet harus ditandai 'ready' sebelum menyelesaikan",
              }),
            );
          }

          // Sync worksheet values to testing items
          yield* worksheetQueries.syncWorksheetToTesting(
            input.worksheetId,
            ctx.user.id,
          );

          // Update status to completed
          const result = yield* worksheetQueries.updateWorksheetStatus(
            input.worksheetId,
            "completed",
            ctx.user.id,
            new Date().toISOString(),
            input.result,
          );

          // // Check if all worksheets for this testing are completed
          // // If so, update testing status to testing_completed
          // if (worksheet.testing?.id) {
          //   const allWorksheets =
          //     yield* worksheetQueries.getWorksheetsByTestingId(
          //       worksheet.testing.id,
          //     );

          //   const allCompleted = allWorksheets.every(
          //     (ws) => ws.id === input.worksheetId || ws.status === "completed",
          //   );

          //   if (allCompleted && allWorksheets.length > 0) {
          //     yield* testingQueries.updateTestingStatus(
          //       worksheet.testing.id,
          //       "completed",
          //       "Semua worksheet telah selesai",
          //     );
          //   }
          // }

          return result;
        }),
      );
    }),

  /**
   * Sync worksheet values to testing items manually
   */
  syncToTesting: withPermission("worksheets.update")
    .input(z.object({ worksheetId: z.uuidv7() }))
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        worksheetQueries.syncWorksheetToTesting(input.worksheetId, ctx.user.id),
      );
    }),

  /**
   * Get worksheets assigned to current user (for lab technicians)
   */
  getMyAssignedWorksheets: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        perPage: z.number().min(1).max(100).default(10),
        status: z.enum(WORKSHEET_STATUS).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Get worksheets where user is assigned as employee
          const result = yield* Effect.tryPromise({
            try: async () => {
              const offset = (input.page - 1) * input.perPage;

              // Query worksheets assigned to current user
              const assignedWorksheets =
                await db.query.worksheetAssignments.findMany({
                  where: (assignments, { eq }) => {
                    // We need to find assignments for this user's employee record
                    return eq(assignments.assignedBy, ctx.user.id); // This is a workaround - ideally should check employee.userId
                  },
                  with: {
                    worksheet: {
                      with: {
                        testing: {
                          with: {
                            order: {
                              with: {
                                company: {
                                  columns: { id: true, name: true },
                                },
                              },
                            },
                          },
                        },
                        items: true,
                        mainSupervisor: {
                          with: { user: { columns: { id: true, name: true } } },
                        },
                      },
                    },
                  },
                  limit: input.perPage,
                  offset,
                });

              // Extract unique worksheets
              const worksheets = assignedWorksheets.map((a) => a.worksheet);

              return {
                data: worksheets,
                pagination: {
                  page: input.page,
                  limit: input.perPage,
                  totalPages: Math.ceil(
                    assignedWorksheets.length / input.perPage,
                  ),
                  totalItems: assignedWorksheets.length,
                },
              };
            },
            catch: (error) => {
              logError(
                "worksheetRouter.getMyAssignedWorksheets",
                "Failed to get assigned worksheets for user",
                { input, userId: ctx.user.id, error },
              );
              return handleTRPCError(
                error,
                "Gagal mengambil worksheet yang ditugaskan",
                "INTERNAL_SERVER_ERROR",
              );
            },
          });

          return result;
        }),
      );
    }),

  /**
   * Get worksheet transaction detail for document generation
   * Returns worksheet with ready items, assignments, and operational costs
   */
  getTransactionDetail: withPermission("worksheets.read")
    .input(worksheetSchema.getWorksheetTransactionDetailSchema)
    .query(async ({ input }) => {
      const worksheet = await runEffect(
        worksheetQueries.getWorksheetTransactionDetail(input.worksheetId),
      );

      if (!worksheet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Worksheet tidak ditemukan",
        });
      }

      return worksheet;
    }),

  /**
   * Save operational costs for worksheet
   */
  saveOperationalCosts: withPermission("worksheets.update")
    .input(worksheetSchema.saveWorksheetOperationalCostsSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.saveWorksheetOperationalCosts(
            input.worksheetId,
            input.costs,
            ctx.user.id,
          ),
        ),
    ),

  /**
   * Get worksheet chemical materials with full material details
   */
  getChemicalMaterials: withPermission("worksheets.read")
    .input(worksheetSchema.getWorksheetChemicalMaterialsSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          worksheetQueries.getWorksheetChemicalMaterials(input.worksheetId),
        ),
    ),

  /**
   * Save worksheet chemical materials (batch upsert)
   */
  saveChemicalMaterials: withPermission("worksheets.update")
    .input(worksheetSchema.saveWorksheetChemicalMaterialsSchema)
    .mutation(async ({ input }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Verify worksheet exists
          const worksheet = yield* worksheetQueries.getWorksheetById(
            input.worksheetId,
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              }),
            );
          }

          // Save materials in transaction
          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                return await runEffect(
                  worksheetQueries.saveWorksheetChemicalMaterials(
                    tx,
                    input.worksheetId,
                    input.materials,
                  ),
                );
              }),
            catch: (error) => {
              logError(
                "worksheetRouter.saveChemicalMaterials",
                "Failed to save chemical materials to worksheet",
                {
                  input,
                  error,
                },
              );
              return handleTRPCError(
                error,
                "Gagal menyimpan bahan kimia ke worksheet",
                "INTERNAL_SERVER_ERROR",
              );
            },
          });

          return results;
        }),
      );
    }),

  /**
   * Update single worksheet chemical material required quantity
   */
  updateChemicalMaterialRequired: withPermission("worksheets.update")
    .input(worksheetSchema.updateWorksheetChemicalMaterialRequiredSchema)
    .mutation(async ({ input }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Verify worksheet exists
          const worksheet = yield* worksheetQueries.getWorksheetById(
            input.worksheetId,
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              }),
            );
          }

          // Update material in transaction
          const result = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                return await runEffect(
                  worksheetQueries.updateWorksheetChemicalMaterialRequired(
                    tx,
                    input.worksheetId,
                    input.chemicalMaterialId,
                    input.required,
                    input.requiredUnit,
                  ),
                );
              }),
            catch: (error) => {
              logError(
                "worksheetRouter.updateChemicalMaterialRequired",
                "Failed to update worksheet chemical material",
                {
                  input,
                  error,
                },
              );
              return handleTRPCError(
                error,
                "Gagal memperbarui kebutuhan bahan kimia",
                "INTERNAL_SERVER_ERROR",
              );
            },
          });

          return result;
        }),
      );
    }),
});
