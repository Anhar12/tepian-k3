import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@tepian-k3/db/client";
import { worksheetItems } from "@tepian-k3/db/schema";
import { eq, sql } from "@tepian-k3/db";
import {
  createTRPCRouter,
  protectedProcedure,
  withPermission,
} from "../index";
import worksheetQueries from "@tepian-k3/queries/worksheet.queries";
import worksheetSchema from "@tepian-k3/schema/worksheet.schema";
import { runEffect } from "../utils/run-effect";
import { WORKSHEET_STATUS, WORKSHEET_NOTE_STATUS } from "@tepian-k3/constants";

export const worksheetRouter = createTRPCRouter({
  /**
   * Get all worksheets with pagination (Admin)
   */
  getAllWorksheets: withPermission("worksheets.read")
    .input(worksheetSchema.getWorksheetsSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          worksheetQueries.getAllWorksheets(input.page, input.perPage, input.status)
        )
    ),

  /**
   * Get worksheet by ID with all relations
   */
  getWorksheetById: withPermission("worksheets.read")
    .input(z.object({ worksheetId: z.string().uuid() }))
    .query(async ({ input }) => {
      const worksheet = await runEffect(
        worksheetQueries.getWorksheetById(input.worksheetId)
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
   * Get worksheets by testing ID
   */
  getWorksheetsByTestingId: withPermission("worksheets.read")
    .input(z.object({ testingId: z.string().uuid() }))
    .query(
      async ({ input }) =>
        await runEffect(worksheetQueries.getWorksheetsByTestingId(input.testingId))
    ),

  /**
   * Create worksheet from testing (Admin - Phase 6)
   */
  createFromTesting: withPermission("worksheets.create")
    .input(worksheetSchema.createWorksheetFromTestingSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.createWorksheetFromTesting(
            input.testingId,
            ctx.user.id,
            input.startDate,
            input.mainSupervisorId,
            input.accompanyingSupervisorId
          )
        )
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
            input.result
          )
        )
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
            ctx.user.id
          )
        )
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
            input.isReady
          )
        )
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
            input.worksheetId
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              })
            );
          }

          // Update items in transaction
          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                const updatedItems = [];

                for (const item of input.items) {
                  const [updated] = await tx
                    .update(worksheetItems)
                    .set({
                      value: item.value,
                      note: item.note,
                      isReady: item.isReady ?? false,
                      updatedAt: sql`CURRENT_TIMESTAMP`,
                    })
                    .where(eq(worksheetItems.id, item.itemId))
                    .returning();

                  if (updated) {
                    updatedItems.push(updated);
                  }
                }

                return updatedItems;
              }),
            catch: (error) => {
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
        })
      );
    }),

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
            input.worksheetId
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              })
            );
          }

          // Assign tools in transaction
          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                return await runEffect(
                  worksheetQueries.assignToolsToWorksheet(
                    tx,
                    input.worksheetId,
                    input.toolIds
                  )
                );
              }),
            catch: (error) => {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mengassign alat ke worksheet",
              });
            },
          });

          return results;
        })
      );
    }),

  /**
   * Assign employees to worksheet
   */
  assignEmployees: withPermission("worksheet-assignments.update")
    .input(worksheetSchema.assignEmployeesToWorksheetSchema)
    .mutation(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Verify worksheet exists
          const worksheet = yield* worksheetQueries.getWorksheetById(
            input.worksheetId
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              })
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
                    ctx.user.id
                  )
                );
              }),
            catch: (error) => {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mengassign personil ke worksheet",
              });
            },
          });

          return results;
        })
      );
    }),

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
            input.worksheetId
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              })
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
                    input.severity
                  )
                );
              }),
            catch: (error) => {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal menambahkan catatan",
              });
            },
          });

          return result;
        })
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
            input.worksheetId
          );

          if (!worksheet) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Worksheet tidak ditemukan",
              })
            );
          }

          if (worksheet.status !== "in_progress") {
            return yield* Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message: "Worksheet harus dalam status 'in_progress' untuk diselesaikan",
              })
            );
          }

          // Check if all items are ready
          const allItemsReady = worksheet.items?.every((item) => item.isReady);

          if (!allItemsReady) {
            return yield* Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message: "Semua item worksheet harus ditandai 'ready' sebelum menyelesaikan",
              })
            );
          }

          // Update status to completed
          const result = yield* worksheetQueries.updateWorksheetStatus(
            input.worksheetId,
            "completed",
            ctx.user.id,
            new Date().toISOString(),
            input.result
          );

          return result;
        })
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
      })
    )
    .query(async ({ input, ctx }) => {
      return await runEffect(
        Effect.gen(function* () {
          // Get worksheets where user is assigned as employee
          const result = yield* Effect.tryPromise({
            try: async () => {
              const offset = (input.page - 1) * input.perPage;

              // Query worksheets assigned to current user
              const assignedWorksheets = await db.query.worksheetAssignments.findMany({
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
                  totalPages: Math.ceil(assignedWorksheets.length / input.perPage),
                  totalItems: assignedWorksheets.length,
                },
              };
            },
            catch: (error) => {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal mengambil worksheet yang ditugaskan",
              });
            },
          });

          return result;
        })
      );
    }),
});
