import { TRPCError } from "@trpc/server";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";
import { and, eq, sql } from "@tepian-k3/db";
import { order, testing, testingItem, worksheets } from "@tepian-k3/db/schema";
import { generateTestingNumberWithSequence } from "@tepian-k3/db/utils";
import orderStatusHistoryQueries from "./order-status-history.queries";
import { logCreate } from "../helpers/audit.helpers";
import type { TestingStatus } from "@tepian-k3/constants";

const testingQueries = {
  /**
   * Get testing by ID with all relations
   */
  getTestingById(testingId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.testing.findFirst({
          where: eq(testing.id, testingId),
          with: {
            order: {
              with: {
                company: true,
                user: true,
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
        }),
      catch: (error) => {
        logError("testingQueries.getTestingById", "Failed to fetch testing", {
          error,
          testingId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data testing",
        });
      },
    });
  },

  /**
   * Get all testings with pagination
   */
  getAllTestings(page: number = 1, limit: number = 10, search?: string) {
    return Effect.gen(function* () {
      const offset = (page - 1) * limit;

      const [items, totalCount] = yield* Effect.tryPromise({
        try: () =>
          Promise.all([
            db.query.testing.findMany({
              where: search
                ? sql`${testing.testingNumber} ILIKE ${`%${search}%`}`
                : undefined,
              limit,
              offset,
              orderBy: (testing, { desc }) => [desc(testing.createdAt)],
              with: {
                order: {
                  columns: {
                    id: true,
                    orderNumber: true,
                  },
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
            }),
            db
              .select({ count: sql<number>`count(*)` })
              .from(testing)
              .then((result) => result[0]?.count),
          ]),
        catch: (error) => {
          logError(
            "testingQueries.getAllTestings",
            "Failed to fetch testings",
            {
              error,
              page,
              limit,
              search,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil daftar testing",
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
   * Create testing from order with transaction
   * This is the main function called from the order router
   */
  createTestingFromOrder(orderId: string) {
    return Effect.gen(function* () {
      // Perform all operations in a transaction
      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // 1. Get order with items and validate
            const orderData = await tx.query.order.findFirst({
              where: and(
                eq(order.id, orderId),
                eq(order.paymentStatus, "paid"),
                eq(order.approvalStatus, "approved"),
              ),
              with: {
                items: {
                  with: {
                    parameter: true,
                    location: true,
                  },
                },
                company: true,
                user: true,
                documents: true,
              },
            });

            if (!orderData) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order tidak ditemukan atau belum disetujui/dibayar",
              });
            }
            // check if worksheet is created from kaji ulang
            const worksheetFromKajiUlang = await tx.query.worksheets.findFirst({
              where: eq(worksheets.orderId, orderId),
            });

            if (!worksheetFromKajiUlang) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Worksheet belum dibuat dari kaji ulang. Tidak dapat membuat testing.",
              });
            }

            // Testing may only be created after Tim Penjadwalan has confirmed the
            // schedule + personnel (isPersonnelDateSet) and the SPT has been issued
            // and uploaded. This keeps the milestone order: jadwal → SPT → pengujian.
            if (!worksheetFromKajiUlang.isPersonnelDateSet) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Jadwal dan personel belum ditetapkan oleh Tim Penjadwalan. Tidak dapat membuat testing.",
              });
            }

            const hasSPTDocument = orderData.documents.some(
              (doc) => doc.type === "assignment_letter",
            );

            if (!hasSPTDocument) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Dokumen SPT belum diunggah. Tidak dapat membuat testing.",
              });
            }

            // Check if testing already exists for this order
            const existingTesting = await tx.query.testing.findFirst({
              where: eq(testing.orderId, orderId),
            });

            if (existingTesting) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Testing sudah dibuat untuk order ini",
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
                message: "Order tidak memiliki item pengujian untuk testing",
              });
            }

            // Get the testing type (category) from the first item
            // All items should have the same category based on order creation logic
            const testingTypeId =
              pengujianItems[0]?.parameter?.parameterCategoryId;

            if (!testingTypeId) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "Parameter categoryId tidak ditemukan pada item pengujian pertama",
              });
            }

            // 2. Generate testing number
            const testingNumber = await generateTestingNumberWithSequence(
              tx,
              "TEST",
            );

            if (!orderData.companyId) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Order pengujian harus memiliki companyId",
              });
            }

            // 3. Create testing record
            const [newTesting] = await tx
              .insert(testing)
              .values({
                orderId: orderData.id,
                worksheetId: worksheetFromKajiUlang.id,
                userId: orderData.userId,
                companyId: orderData.companyId,
                testingNumber,
                testingType: testingTypeId,
                status: "start_testing",
                note: `Testing dibuat dari order ${orderData.orderNumber}`,
              })
              .returning();

            if (!newTesting) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat testing record",
              });
            }

            // 4. Create testing items from order items
            const testingItemsData = pengujianItems.map((item) => ({
              testingId: newTesting.id,
              orderItemId: item.id,
              parameterId: item.parameterId!,
              locationId: item.locationId!,
              quantity: item.quantity,
              price: item.price,
              subTotal: item.subTotal,
              result: null,
              note: null,
            }));

            const newTestingItems = await tx
              .insert(testingItem)
              .values(testingItemsData)
              .returning();

            // 5. Update order status to proses_pengambilan_sampel.
            // Scheduling + SPT are already done by this point (guarded above), so
            // creating the testing advances the order to sample collection.
            await tx
              .update(order)
              .set({
                status: "proses_pengambilan_sampel",
                updatedAt: sql`CURRENT_TIMESTAMP`,
              })
              .where(eq(order.id, orderId));

            // 6. Create order status history
            await Effect.runPromise(
              orderStatusHistoryQueries.createOrderStatusHistory(
                tx,
                orderId,
                "proses_pengambilan_sampel",
                orderData.userId,
                "Testing record created",
              ),
            );

            return {
              testing: newTesting,
              items: newTestingItems,
              order: orderData,
              linkedWorksheetId: worksheetFromKajiUlang.id,
            };
          }),
        catch: (error) => {
          logError(
            "testingQueries.createTestingFromOrder",
            "Failed to create testing from order",
            {
              error,
              orderId,
            },
          );

          // Re-throw TRPCError as-is, wrap others
          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat testing dari order",
          });
        },
      });

      // 8. Log audit for testing creation (deferred, don't block)
      yield* Effect.forkDaemon(
        logCreate(
          "testing",
          result.testing.id,
          result.testing as Record<string, unknown>,
          result.order.userId,
          undefined,
          {
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            itemCount: result.items.length,
            linkedWorksheetId: result.linkedWorksheetId,
          },
        ),
      );

      return result.testing;
    });
  },

  /**
   * Update testing status
   */
  updateTestingStatus(testingId: string, status: TestingStatus, note?: string) {
    return Effect.tryPromise({
      try: async () => {
        const [updatedTesting] = await db
          .update(testing)
          .set({
            status: status,
            note: note || sql`${testing.note}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(testing.id, testingId))
          .returning();

        if (!updatedTesting) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Testing tidak ditemukan",
          });
        }

        return updatedTesting;
      },
      catch: (error) => {
        logError(
          "testingQueries.updateTestingStatus",
          "Failed to update testing status",
          {
            error,
            testingId,
            status,
          },
        );

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui status testing",
        });
      },
    });
  },

  /**
   * Update testing item result
   */
  updateTestingItemResult(
    tx: DBorTx,
    itemId: string,
    result: string,
    note?: string,
  ) {
    return Effect.tryPromise({
      try: async () => {
        const [updatedItem] = await tx
          .update(testingItem)
          .set({
            result,
            note: note || sql`${testingItem.note}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(testingItem.id, itemId))
          .returning();

        if (!updatedItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Testing item tidak ditemukan",
          });
        }

        return updatedItem;
      },
      catch: (error) => {
        logError(
          "testingQueries.updateTestingItemResult",
          "Failed to update testing item result",
          {
            error,
            itemId,
            result,
          },
        );

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui hasil testing item",
        });
      },
    });
  },
};

export default testingQueries;
