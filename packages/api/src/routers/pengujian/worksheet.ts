import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@tepian-k3/db/client";
import {
  employees,
  tools,
  worksheetItems,
  worksheetToolNeeded,
  worksheetTools,
} from "@tepian-k3/db/schema";
import { and, eq, inArray, sql } from "@tepian-k3/db";
import {
  createTRPCRouter,
  protectedProcedure,
  withPermission,
} from "../../index";
import worksheetQueries from "@tepian-k3/queries/pengujian/worksheet.queries";
import worksheetSchema from "@tepian-k3/schema/pengujian/worksheet.schema";
import { runEffect } from "../../utils/run-effect";
import { DOCUMENT_TYPES, WORKSHEET_STATUS } from "@tepian-k3/constants";
import { logError } from "@tepian-k3/services/logger";
import { logCreate, logUpdate } from "@tepian-k3/queries/helpers/audit.helpers";
import worksheetNoteQueries from "@tepian-k3/queries/pengujian/worksheet-note.queries";
import { EventTypes } from "@tepian-k3/schema/platform/event.schema";
import { handleTRPCError } from "@tepian-k3/utils/handle-trpc-error";
import orderQueries from "@tepian-k3/queries/pengujian/order.queries";
import { notificationsQueries } from "@tepian-k3/queries/platform/notifications.queries";
import employeeQueries from "@tepian-k3/queries/platform/employee.queries";

export const worksheetRouter = createTRPCRouter({
  /**
   * Get all worksheets with pagination (Admin)
   */
  getAllWorksheets: withPermission("worksheets.view")
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
   * Get worksheets that have an assignment_letter document (used by employee tools page)
   */
  getWorksheetsWithAssignmentLetter: withPermission("worksheet-tools.update")
    .input(worksheetSchema.getWorksheetsSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          worksheetQueries.getWorksheetsWithAssignmentLetter(
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
   * Get worksheet document
   */
  getWorksheetDocument: withPermission("worksheets.read")
    .input(
      z.object({
        worksheetId: z.uuidv7(),
        documentType: z.enum(DOCUMENT_TYPES),
      }),
    )
    .query(async ({ input }) =>
      runEffect(
        Effect.gen(function* () {
          const result = yield* worksheetQueries.getWorksheetDocument(
            input.worksheetId,
            input.documentType,
          );

          return result ? result : null;
        }),
      ),
    ),

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
   * Get worksheet certificate data by order ID.
   * Returns the worksheet with employee certifications and the latest tool calibration certificates.
   * Intended for the certificate/PPS page view.
   */
  getWorksheetWithCertificates: protectedProcedure
    .input(z.object({ orderId: z.uuidv7() }))
    .query(async ({ input }) => {
      const worksheet = await runEffect(
        worksheetQueries.getWorksheetWithCertificates(input.orderId),
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
   * Create worksheet from order (Admin - Kaji Ulang Phase)
   * This creates worksheet with testingId = NULL, to be linked later after payment
   */
  createFromOrder: withPermission("worksheets.create")
    .input(worksheetSchema.createWorksheetFromOrderSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const result = yield* worksheetQueries.createWorksheetFromOrder(
              input.orderId,
              ctx.user.id,
              input.mainSupervisorId,
              input.accompanyingSupervisorId,
            );

            yield* Effect.forkDaemon(
              notificationsQueries.create({
                userId: result.order.userId,
                title: "Order Sedang Dikaji Ulang",
                message: `Order dengan nomor ${result.order.orderNumber} sedang dikaji ulang oleh tim kami.`,
                type: "order_status_changed",
                orderId: result.order.id,
                metadata: {
                  worksheetId: result.worksheet.id,
                  orderStatus: "kaji_ulang",
                  orderNumber: result.order.orderNumber,
                },
              }),
            );

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
                orderId: result.order.id,
                orderNumber: result.order.orderNumber,
                userId: result.order.userId,
                newStatus: "kaji_ulang",
                oldStatus: "pending",
                triggeredBy: ctx.user.id,
              }),
            );

            return result.worksheet;
          }),
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
   * Revise worksheet (Coordinator action)
   * Changes status back to 'revision' and allows coordinator to add revision notes
   */
  requestRevision: withPermission("worksheets.verify")
    .input(worksheetSchema.reviseWorksheetSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.reviseWorksheet(
            input.worksheetId,
            ctx.user.id,
            input.revisionNotes,
          ),
        ),
    ),

  /**
   * Verify worksheet (Coordinator action)
   * Changes status from 'pending_verification' to 'verified'
   */
  verify: withPermission("worksheets.verify")
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
  updateStatus: withPermission("worksheets-status.update")
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
   * Update worksheet personnel date (used for schedule calendar)
   */
  updateWorksheetPersonnelDateSet: withPermission(
    "worksheets-personnel-assignments.update",
  )
    .input(worksheetSchema.updateWorksheetPersonnelDateSetSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.updateWorksheetPersonnelDateSet(
            input.worksheetId,
            input.isSet,
            ctx.user.id,
          ),
        ),
    ),

  /**
   * Update worksheet supervisors
   */
  updateSupervisors: withPermission("worksheets-personnel-assignments.update")
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
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const result = yield* worksheetQueries.updateWorksheetItemValue(
              db,
              input.itemId,
              input.value,
              input.note,
              input.isReady,
            );

            yield* Effect.forkDaemon(
              logUpdate(
                "worksheet_item",
                input.itemId,
                {},
                {
                  value: input.value,
                  note: input.note,
                  isReady: input.isReady,
                } as Record<string, unknown>,
                ctx.user.id,
              ),
            );

            return result;
          }),
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
  createEstimate: withPermission("worksheets-transaction-details.create")
    .input(worksheetSchema.createWorksheetEstimatedSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.createWorksheetEstimates(
            input.worksheetId,
            input.estimatedAmountOfMembers,
            input.estimatedAmountOfDays,
            ctx.user.id,
          ),
        ),
    ),

  /**
   * Assign tools to worksheet
   */
  assignTools: withPermission("worksheet-tools.update")
    .input(worksheetSchema.assignToolsToWorksheetSchema)
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

          // Assign tools in transaction (planning only — no availability change)
          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                // Delete all existing planned tools before re-assigning
                await tx
                  .delete(worksheetToolNeeded)
                  .where(
                    eq(worksheetToolNeeded.worksheetId, input.worksheetId),
                  );

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

          yield* Effect.forkDaemon(
            logUpdate(
              "worksheet_tool",
              input.worksheetId,
              {},
              { assignedCount: input.items.length } as Record<string, unknown>,
              ctx.user.id,
            ),
          );

          return results;
        }),
      );
    }),

  /**
   * Get borrowed tools for worksheet
   * Used by the equipment officer to display currently borrowed tools and return status on the employee tools detail page
   */
  getBorrowedTools: withPermission("worksheet-tools.update")
    .input(z.object({ worksheetId: z.uuidv7() }))
    .query(
      async ({ input }) =>
        await runEffect(
          worksheetQueries.getBorrowedToolsForWorksheet(input.worksheetId),
        ),
    ),

  /**
   * Borrow tools for worksheet — records assignment AND marks tools as dipinjam.
   * Called by the equipment officer from the employee tools detail page.
   */
  borrowTools: withPermission("worksheet-tools.update")
    .input(worksheetSchema.borrowToolsFromWorksheetSchema)
    .mutation(async ({ ctx, input }) => {
      return await runEffect(
        Effect.gen(function* () {
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

          const employee = yield* employeeQueries.getEmployeeByUserId(
            ctx.user.id,
          );

          if (!employee) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Data pegawai tidak ditemukan untuk pengguna ini",
              }),
            );
          }

          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                // Get current assigned tool IDs to reset availability for de-selected tools
                const currentToolRows = await tx
                  .select({ toolId: worksheetTools.toolId })
                  .from(worksheetTools)
                  .where(eq(worksheetTools.worksheetId, input.worksheetId));
                const currentToolIds = currentToolRows.map((r) => r.toolId);

                // Delete existing borrowed tools and re-insert
                await tx
                  .delete(worksheetTools)
                  .where(eq(worksheetTools.worksheetId, input.worksheetId));

                const assignedTools = await Promise.all(
                  input.items.map((item) =>
                    tx
                      .insert(worksheetTools)
                      .values({
                        worksheetId: input.worksheetId,
                        toolId: item.itemId,
                        borrowedBy: employee.id,
                      })
                      .returning(),
                  ),
                );

                // Update availability: reset removed tools → ready, mark new tools → dipinjam
                const newToolIds = [
                  ...new Set(input.items.map((item) => item.itemId)),
                ];
                const toolsToReset = currentToolIds.filter(
                  (id) => !newToolIds.includes(id),
                );

                if (toolsToReset.length > 0) {
                  await tx
                    .update(tools)
                    .set({ availability: "ready" })
                    .where(inArray(tools.id, toolsToReset));
                }

                if (newToolIds.length > 0) {
                  await tx
                    .update(tools)
                    .set({ availability: "dipinjam" })
                    .where(inArray(tools.id, newToolIds));
                }

                return assignedTools;
              }),
            catch: (error) => {
              logError(
                "worksheetRouter.borrowTools",
                "Failed to borrow tools for worksheet",
                { input, error },
              );

              return handleTRPCError(
                error,
                "Gagal meminjam alat untuk worksheet",
                "INTERNAL_SERVER_ERROR",
              );
            },
          });

          return results;
        }),
      );
    }),

  /**
   * Return a single borrowed tool — verifies it belongs to the worksheet, marks it returned, and restores availability.
   * Called by the equipment officer one tool at a time.
   */
  returnTools: withPermission("worksheet-tools.update")
    .input(worksheetSchema.returnToolsFromWorksheetSchema)
    .mutation(async ({ ctx, input }) => {
      return await runEffect(
        Effect.gen(function* () {
          const employee = yield* employeeQueries.getEmployeeByUserId(
            ctx.user.id,
          );

          if (!employee) {
            return yield* Effect.fail(
              new TRPCError({
                code: "NOT_FOUND",
                message: "Data pegawai tidak ditemukan untuk pengguna ini",
              }),
            );
          }

          const result = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                // Verify the worksheetTool belongs to the given worksheet
                const [worksheetTool] = await tx
                  .select({
                    id: worksheetTools.id,
                    toolId: worksheetTools.toolId,
                    returnedAt: worksheetTools.returnedAt,
                  })
                  .from(worksheetTools)
                  .where(
                    and(
                      eq(worksheetTools.id, input.worksheetToolId),
                      eq(worksheetTools.worksheetId, input.worksheetId),
                    ),
                  )
                  .limit(1);

                if (!worksheetTool) {
                  throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Data alat worksheet tidak ditemukan",
                  });
                }

                if (worksheetTool.returnedAt) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Alat sudah dikembalikan sebelumnya",
                  });
                }

                // Mark as returned with check results
                await tx
                  .update(worksheetTools)
                  .set({
                    returnedBy: employee.id,
                    returnedAt: sql`CURRENT_TIMESTAMP`,
                    checkAlatMenyala: input.checkAlatMenyala,
                    checkPenyimpangan: input.checkPenyimpangan,
                    checkKelengkapanAlat: input.checkKelengkapanAlat,
                    checkKondisiFisikAlat: input.checkKondisiFisikAlat,
                    checkConditionResult: input.checkConditionResult,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                  })
                  .where(eq(worksheetTools.id, input.worksheetToolId));

                // Restore availability and update condition based on check result
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
                  .where(eq(tools.id, worksheetTool.toolId));

                return {
                  worksheetToolId: worksheetTool.id,
                  toolId: worksheetTool.toolId,
                };
              }),
            catch: (error) => {
              if (error instanceof TRPCError) throw error;
              logError(
                "worksheetRouter.returnTools",
                "Failed to return tool for worksheet",
                { input, error },
              );

              return handleTRPCError(
                error,
                "Gagal mengembalikan alat untuk worksheet",
                "INTERNAL_SERVER_ERROR",
              );
            },
          });

          yield* Effect.forkDaemon(
            logUpdate(
              "worksheet_tool",
              input.worksheetToolId,
              {},
              { returnedBy: employee.id } as Record<string, unknown>,
              ctx.user.id,
            ),
          );

          return result;
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

          // check worksheet status
          if (worksheet.status !== "verified") {
            return yield* Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Karyawan hanya dapat diassign ke worksheet dengan status 'verified'",
              }),
            );
          }

          // check order payment status
          if (worksheet.order?.paymentStatus !== "paid") {
            return yield* Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Karyawan hanya dapat diassign ke worksheet dengan status 'verified' dan order dengan status 'paid'",
              }),
            );
          }

          // Validate employee statuses:
          // - "siap" employees can always be assigned
          // - "spt" employees can only be assigned if worksheet.startDate is in the future
          // - any other status (standby, cuti) is not allowed
          const assignedEmployees = yield* Effect.tryPromise({
            try: () =>
              db.query.employees.findMany({
                where: inArray(employees.id, input.employeeIds),
                columns: { id: true, status: true },
              }),
            catch: () =>
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memvalidasi status karyawan",
              }),
          });

          const worksheetStartDate = worksheet.startDate
            ? new Date(worksheet.startDate)
            : null;
          const isBeforeWorksheetStart = worksheetStartDate
            ? new Date() < worksheetStartDate
            : false;

          for (const emp of assignedEmployees) {
            if (emp.status === "siap") continue;
            if (emp.status === "spt" && isBeforeWorksheetStart) continue;
            return yield* Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message:
                  emp.status === "spt"
                    ? "Karyawan dengan status 'SPT' hanya dapat ditugaskan jika worksheet belum dimulai"
                    : `Karyawan tidak dapat ditugaskan karena memiliki status '${emp.status}'`,
              }),
            );
          }

          // Assign employees in transaction
          const results = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                const assigned = await runEffect(
                  worksheetQueries.assignEmployeesToWorksheet(
                    tx,
                    input.worksheetId,
                    input.employeeIds,
                    ctx.user.id,
                    input.startDate,
                    input.endDate,
                  ),
                );

                await Effect.runPromise(
                  orderQueries.updateOrderStatus(
                    worksheet.orderId,
                    "menunggu_penerbitan_spt_jadwal",
                  ),
                );

                return assigned;
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

          yield* Effect.forkDaemon(
            logUpdate(
              "worksheet_assignment",
              input.worksheetId,
              {},
              { employeeIds: input.employeeIds } as Record<string, unknown>,
              ctx.user.id,
            ),
          );

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

          yield* Effect.forkDaemon(
            logCreate(
              "worksheet_note",
              result.id,
              {
                worksheetId: input.worksheetId,
                note: input.note,
                severity: input.severity,
              } as Record<string, unknown>,
              ctx.user.id,
            ),
          );

          return result;
        }),
      );
    }),

  /**
   * Complete worksheet (marks status as completed and sets end date)
   */
  complete: withPermission("worksheets-status.update")
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

          // Deduct chemical material stock consumed by this worksheet
          yield* worksheetQueries.deductChemicalMaterialStock(
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
   * Koor. Admin marks the offering as ready for Admin to print.
   * Transitions order to `penawaran_diterbitkan`.
   */
  publishOffering: withPermission("worksheets-transaction-details.update")
    .input(z.object({ worksheetId: z.uuidv7() }))
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.publishOffering(input.worksheetId, ctx.user.id),
        ),
    ),

  /**
   * Bendahara Penerimaan issues the invoice/SPK.
   * Stores billing data and transitions order to `tagihan_diterbitkan`.
   */
  publishInvoice: withPermission("orders-payment.verify")
    .input(
      z.object({
        worksheetId: z.uuidv7(),
        billingCode: z.string().min(1).max(100),
        billingExpiryDate: z.string().min(1),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.publishInvoice(
            input.worksheetId,
            ctx.user.id,
            input.billingCode,
            input.billingExpiryDate,
          ),
        ),
    ),

  /**
   * Tim Penjadwalan confirms personnel and dates are ready.
   * Transitions order to `menunggu_penerbitan_spt_jadwal` so Admin can print the SPT.
   */
  publishSPT: withPermission("worksheets-personnel-assignments.update")
    .input(z.object({ worksheetId: z.uuidv7() }))
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          worksheetQueries.publishSPT(input.worksheetId, ctx.user.id),
        ),
    ),

  /**
   * Sync worksheet values to testing items manually
   */
  syncToTesting: withPermission("worksheets-status.update")
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
  saveOperationalCosts: withPermission("worksheets-transaction-details.update")
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
  saveChemicalMaterials: withPermission("worksheet-chemical-materials.update")
    .input(worksheetSchema.saveWorksheetChemicalMaterialsSchema)
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

          yield* Effect.forkDaemon(
            logUpdate(
              "worksheet",
              input.worksheetId,
              {},
              { materialsCount: input.materials.length } as Record<
                string,
                unknown
              >,
              ctx.user.id,
            ),
          );

          return results;
        }),
      );
    }),

  /**
   * Update single worksheet chemical material required quantity
   */
  updateChemicalMaterialRequired: withPermission(
    "worksheet-chemical-materials.update",
  )
    .input(worksheetSchema.updateWorksheetChemicalMaterialRequiredSchema)
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

          yield* Effect.forkDaemon(
            logUpdate(
              "worksheet",
              input.worksheetId,
              {},
              {
                chemicalMaterialId: input.chemicalMaterialId,
                required: input.required,
                requiredUnit: input.requiredUnit,
              } as Record<string, unknown>,
              ctx.user.id,
            ),
          );

          return result;
        }),
      );
    }),
});
