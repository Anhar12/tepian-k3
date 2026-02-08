import { TRPCError } from "@trpc/server";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { z } from "zod";
import orderSchema from "@tepian-k3/schema/order.schema";
import { Cause, Effect, Exit } from "effect";
import { logError } from "@tepian-k3/services/logger";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  sql,
  type SQL,
} from "@tepian-k3/db";
import type { ExtendedColumnFilter } from "@tepian-k3/types/data-table.types";
import { filterColumns } from "@tepian-k3/utils/filter-column";
import {
  cart,
  documents,
  order,
  userCompanies,
  userCompanyTestingLocation,
  worksheets,
} from "@tepian-k3/db/schema";
import orderItemSchema from "@tepian-k3/schema/order-item.schema";
import { generateOrderNumberWithSequence } from "@tepian-k3/db/utils";
import orderItemQueries from "./order-item.queries";
import orderStatusHistoryQueries from "./order-status-history.queries";
import { logCreate } from "./helpers/audit.helpers";
import type { OrderPaymentStatus, OrderStatus } from "@tepian-k3/constants";
import testingQueries from "./testing.queries";

const orderQueries = {
  getAllOrderByUserId(userId: string, status: OrderStatus | "all" = "all") {
    return Effect.tryPromise({
      try: () =>
        db.query.order.findMany({
          where: and(
            eq(order.userId, userId),
            status !== "all" ? eq(order.status, status) : undefined,
          ),
          orderBy: (order, { desc }) => [desc(order.createdAt)],
        }),
      catch: (error) => {
        logError("orderQueries.getAllOrderByUserId", "Failed to fetch orders", {
          error,
          userId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil pesanan",
        });
      },
    });
  },

  /**
   * Get all orders with pagination (Admin)
   */
  getOffsetPaginatedOrders(
    input: z.infer<typeof orderSchema.getAllOrdersSchema>,
  ) {
    return Effect.gen(function* () {
      const offset = (input.page - 1) * input.perPage;
      const advancedTable = input.filters && input.filters.length > 0;

      const where = advancedTable
        ? filterColumns({
            table: order,
            filters: input.filters as ExtendedColumnFilter<typeof order>[],
            joinOperator: input.joinOperator ?? "and",
          })
        : and(
            input.search
              ? ilike(order.orderNumber, `%${input.search}%`)
              : undefined,
            input.status ? eq(order.status, input.status) : undefined,
            input.createdAt.length > 0
              ? and(
                  input.createdAt[0]
                    ? gte(
                        order.createdAt,
                        (() => {
                          const date = new Date(input.createdAt[0]);
                          date.setHours(0, 0, 0, 0);
                          return date.toISOString();
                        })(),
                      )
                    : undefined,
                  input.createdAt[1]
                    ? lte(
                        order.createdAt,
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
              ? isNotNull(order.deletedAt)
              : isNull(order.deletedAt),
          );

      const orderBy =
        input.sort.length > 0
          ? input.sort.map((item) =>
              item.desc
                ? desc(
                    (order as unknown as Record<string, unknown>)[
                      item.id
                    ] as SQL,
                  )
                : asc(
                    (order as unknown as Record<string, unknown>)[
                      item.id
                    ] as SQL,
                  ),
            )
          : [desc(order.createdAt)];

      const { data, total } = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const data = await tx.query.order.findMany({
              where,
              limit: input.perPage,
              offset,
              orderBy,
              with: {
                company: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
                user: {
                  columns: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                testing: {
                  columns: {
                    id: true,
                    testingNumber: true,
                    status: true,
                  },
                },
              },
            });

            const total = await tx
              .select({ count: count() })
              .from(order)
              .where(where)
              .execute()
              .then((res) => res[0]?.count ?? 0);

            return { data, total };
          }),
        catch: (error) => {
          logError(
            "orderQueries.getOffsetPaginatedOrders",
            "Failed to fetch paginated orders",
            {
              error,
              input,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil daftar pesanan",
          });
        },
      });

      const pageCount = Math.ceil(total / input.perPage);

      return {
        data,
        pageCount,
      };
    });
  },

  getOrderById(orderId: string, userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.order.findFirst({
          where: and(eq(order.id, orderId), eq(order.userId, userId)),
          with: {
            items: true,
            statusHistory: true,
            surveyResponses: true,
            surveyFeedback: true,
          },
        }),
      catch: (error) => {
        logError("orderQueries.getOrderById", "Failed to fetch order by ID", {
          error,
          orderId,
          userId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil pesanan berdasarkan ID",
        });
      },
    });
  },

  getOrderWithCompanyAndItems(orderId: string, userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.order.findFirst({
          where: and(eq(order.id, orderId), eq(order.userId, userId)),
          with: {
            company: {
              columns: {
                id: true,
                name: true,
                address: true,
                responsibleTestingPersonPhone: true,
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
            statusHistory: true,
            items: {
              with: {
                parameter: {
                  columns: {
                    id: true,
                    name: true,
                    unit: true,
                  },
                  with: {
                    category: {
                      columns: {
                        id: true,
                        name: true,
                      },
                      with: {
                        cluster: {
                          columns: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      catch: (error) => {
        logError("orderQueries.getOrderById", "Failed to fetch order by ID", {
          error,
          orderId,
          userId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil pesanan berdasarkan ID",
        });
      },
    });
  },

  getOrderWithDocuments(orderId: string, userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.order.findFirst({
          where: and(eq(order.id, orderId), eq(order.userId, userId)),
          with: {
            company: {
              columns: {
                id: true,
                name: true,
              },
            },
            user: true,
            items: {
              with: {
                parameter: {
                  columns: {
                    id: true,
                    name: true,
                    unit: true,
                  },
                  with: {
                    category: {
                      columns: {
                        id: true,
                        name: true,
                      },
                      with: {
                        cluster: {
                          columns: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            testing: true,
            worksheet: true,
            statusHistory: {
              orderBy: (statusHistory, { desc }) => [
                desc(statusHistory.createdAt),
              ],
            },
            documents: {
              orderBy: (documents, { desc }) => [desc(documents.createdAt)],
            },
          },
        }),
      catch: (error) => {
        logError(
          "orderQueries.getOrderWithDocuments",
          "Failed to fetch order with documents",
          {
            error,
            orderId,
            userId,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil pesanan beserta dokumennya",
        });
      },
    });
  },

  getOrderWithDocumentsAdmin(orderId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.order.findFirst({
          where: eq(order.id, orderId),
          with: {
            company: {
              columns: {
                id: true,
                name: true,
              },
            },
            user: true,
            items: {
              with: {
                parameter: {
                  columns: {
                    id: true,
                    name: true,
                    unit: true,
                  },
                  with: {
                    category: {
                      columns: {
                        id: true,
                        name: true,
                      },
                      with: {
                        cluster: {
                          columns: {
                            id: true,
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            testing: true,
            worksheet: true,
            statusHistory: true,
            documents: {
              orderBy: (documents, { desc }) => [desc(documents.createdAt)],
            },
          },
        }),
      catch: (error) => {
        logError(
          "orderQueries.getOrderWithDocuments",
          "Failed to fetch order with documents",
          {
            error,
            orderId,
          },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil pesanan beserta dokumennya",
        });
      },
    });
  },

  createOrder(
    userId: string,
    coverTransportationIncluded: boolean,
    coverAccommodationIncluded: boolean,
    orderData: z.infer<typeof orderSchema.createOrderSchema>,
    orderItems: z.infer<typeof orderItemSchema.createOrderItem>[],
  ) {
    return Effect.gen(function* () {
      // 1. Validate order items not empty
      if (orderItems.length === 0) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan harus memiliki setidaknya satu item",
          }),
        );
      }

      // 2. Validate company ownership
      const company = yield* Effect.tryPromise({
        try: () =>
          db.query.userCompanies.findFirst({
            where: and(
              eq(userCompanies.id, orderData.companyId),
              eq(userCompanies.userId, userId),
            ),
          }),
        catch: (error) => {
          logError("orderQueries.createOrder", "Failed to validate company", {
            error,
            companyId: orderData.companyId,
            userId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memvalidasi perusahaan",
          });
        },
      });

      if (!company) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message:
              "Perusahaan tidak ditemukan atau Anda tidak memiliki akses",
          }),
        );
      }

      // 3. Validate all locations belong to this company
      const locationIds = orderItems.map((item) => item.id);
      const locations = yield* Effect.tryPromise({
        try: () =>
          db.query.userCompanyTestingLocation.findMany({
            where: and(
              inArray(userCompanyTestingLocation.id, locationIds),
              eq(userCompanyTestingLocation.userCompanyId, orderData.companyId),
            ),
          }),
        catch: (error) => {
          logError("orderQueries.createOrder", "Failed to validate locations", {
            error,
            locationIds,
            companyId: orderData.companyId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memvalidasi lokasi",
          });
        },
      });

      if (locations.length !== locationIds.length) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Satu atau lebih lokasi tidak ditemukan atau tidak dimiliki oleh perusahaan ini",
          }),
        );
      }

      // 4. Calculate total amount from order items
      const calculatedTotal = orderItems.reduce(
        (total, location) =>
          total +
          location.items.reduce(
            (locationTotal, item) => locationTotal + item.price * item.quantity,
            0,
          ),
        0,
      );

      // 5. Create order and order items in a transaction
      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // Generate order number using sequence
            const orderNumber = await generateOrderNumberWithSequence(
              tx,
              "ORD",
            );

            // Insert order
            const [newOrder] = await tx
              .insert(order)
              .values({
                userId,
                companyId: orderData.companyId,
                orderNumber,
                totalAmount: calculatedTotal,
                status: "pending",
                approvalStatus: "pending",
                paymentStatus: "unpaid",
                coverTransportationIncluded,
                coverAccommodationIncluded,
              })
              .returning();

            if (!newOrder) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal membuat pesanan",
              });
            }

            // Create order items using the existing query
            const items = await Effect.runPromiseExit(
              orderItemQueries.createOrderItems(tx, newOrder.id, orderItems),
            );

            if (Exit.isFailure(items)) {
              const error = Cause.squash(items.cause) as TRPCError;
              throw new TRPCError({
                code: error.code ?? "INTERNAL_SERVER_ERROR",
                message: error.message || "Gagal membuat item pesanan",
                cause: error,
              });
            }

            // Clear cart items for this company
            await tx
              .delete(cart)
              .where(
                and(
                  eq(cart.userId, userId),
                  eq(cart.companyId, orderData.companyId),
                ),
              );

            // create order status history - pending
            await Effect.runPromise(
              orderStatusHistoryQueries.createOrderStatusHistory(
                tx,
                newOrder.id,
                "pending",
                userId,
                "Order created and is pending approval",
              ),
            );

            return { order: newOrder, items };
          }),
        catch: (error) => {
          logError("orderQueries.createOrder", "Failed to create order", {
            error,
            userId,
            orderData,
            orderItems,
          });
          throw new TRPCError({
            code:
              error instanceof Error
                ? (error.cause as TRPCError)?.code || "INTERNAL_SERVER_ERROR"
                : "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error ? error.message : "Gagal membuat pesanan",
          });
        },
      });

      // Log audit for order creation

      yield* Effect.forkDaemon(
        logCreate(
          "order",
          result.order.id,
          result.order as Record<string, unknown>,
          userId,
          undefined,
          {
            orderType: "testing",
            createdFrom: "web_interface",
          },
        ),
      );

      return result;
    });
  },

  acceptOffer(orderId: string, userId: string) {
    return Effect.gen(function* () {
      // check if order exists and is in offered status
      const orderToAccept = yield* Effect.tryPromise({
        try: () =>
          db.query.order.findFirst({
            where: and(
              eq(order.id, orderId),
              eq(order.userId, userId),
              eq(order.status, "penawaran_diterbitkan"),
            ),
          }),
        catch: (error) => {
          logError("orderQueries.acceptOffer", "Failed to fetch order", {
            error,
            orderId,
            userId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil pesanan",
          });
        },
      });

      if (!orderToAccept) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Pesanan tidak ditemukan atau bukan dalam status ditawarkan",
          }),
        );
      }

      // check if order has offering document and invoice document
      const hasOfferingDocument = yield* Effect.tryPromise({
        try: () =>
          db.query.documents.findFirst({
            where: and(
              eq(documents.entityId, orderId),
              eq(documents.entityType, "order"),
              eq(documents.type, "offering_document"),
            ),
          }),
        catch: (error) => {
          logError(
            "orderQueries.offerRevision",
            "Failed to fetch order status history",
            {
              error,
              orderId,
              userId,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil riwayat status pesanan",
          });
        },
      });

      if (!hasOfferingDocument) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Dokumen penawaran tidak ditemukan untuk pesanan ini",
          }),
        );
      }

      // update order status to upload_surat_persetujuan (customer accepted offer, now needs to upload approval letter)
      const [updatedOrder] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(order)
            .set({
              status: "upload_surat_persetujuan",
              approvedAt: new Date().toISOString(),
            })
            .where(eq(order.id, orderId))
            .returning(),
        catch: (error) => {
          logError("orderQueries.acceptOffer", "Failed to update order", {
            error,
            orderId,
            userId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pesanan",
          });
        },
      });

      if (!updatedOrder) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menerima penawaran untuk pesanan",
          }),
        );
      }

      // create order status history - upload_surat_persetujuan
      yield* orderStatusHistoryQueries.createOrderStatusHistory(
        db,
        orderId,
        "upload_surat_persetujuan",
        userId,
        "Offer accepted by customer",
      );

      return updatedOrder;
    });
  },

  reviseOrder(orderId: string, userId: string, revisionNote: string) {
    return Effect.gen(function* () {
      // check if order exists and is in offered status
      const orderToRevise = yield* Effect.tryPromise({
        try: () =>
          db.query.order.findFirst({
            where: and(
              eq(order.id, orderId),
              eq(order.userId, userId),
              eq(order.status, "penawaran_diterbitkan"),
            ),
          }),
        catch: (error) => {
          logError("orderQueries.offerRevision", "Failed to fetch order", {
            error,
            orderId,
            userId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil pesanan",
          });
        },
      });

      if (!orderToRevise) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Pesanan tidak ditemukan atau bukan dalam status ditawarkan",
          }),
        );
      }

      const hasOfferingDocument = yield* Effect.tryPromise({
        try: () =>
          db.query.documents.findFirst({
            where: and(
              eq(documents.entityId, orderId),
              eq(documents.entityType, "order"),
              eq(documents.type, "offering_document"),
            ),
          }),
        catch: (error) => {
          logError(
            "orderQueries.offerRevision",
            "Failed to fetch order status history",
            {
              error,
              orderId,
              userId,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil riwayat status pesanan",
          });
        },
      });

      if (!hasOfferingDocument) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Dokumen penawaran tidak ditemukan untuk pesanan ini",
          }),
        );
      }

      const hasWorksheet = yield* Effect.tryPromise({
        try: () =>
          db.query.worksheets.findFirst({
            where: eq(worksheets.orderId, orderId),
          }),
        catch: (error) => {
          logError(
            "orderQueries.offerRevision",
            "Failed to fetch order worksheet",
            {
              error,
              orderId,
              userId,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil worksheet pesanan",
          });
        },
      });

      if (!hasWorksheet) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Worksheet tidak ditemukan untuk pesanan ini",
          }),
        );
      }

      // update order status to revision_offered
      const updatedOrder = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            const [updatedOrders] = await tx
              .update(order)
              .set({
                status: "revision",
                revisionNotes: revisionNote,
                revisionCount: sql`revision_count + 1`,
              })
              .where(eq(order.id, orderId))
              .returning();

            if (!updatedOrders) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Gagal memperbarui pesanan",
              });
            }

            // update worksheet status to revision_requested
            await tx
              .update(worksheets)
              .set({ status: "revision", updatedAt: new Date().toISOString() })
              .where(eq(worksheets.orderId, orderId));

            // add status history
            await Effect.runPromise(
              orderStatusHistoryQueries.createOrderStatusHistory(
                tx,
                orderId,
                "revision",
                userId,
                `Revision offered to customer. Note: ${revisionNote}`,
              ),
            );

            return updatedOrders;
          }),
        catch: (error) => {
          logError("orderQueries.offerRevision", "Failed to update order", {
            error,
            orderId,
            userId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pesanan",
          });
        },
      });

      // create order status history - revision_offered
      yield* orderStatusHistoryQueries.createOrderStatusHistory(
        db,
        orderId,
        "revision",
        userId,
        `Revision offered to customer. Note: ${revisionNote}`,
      );

      return updatedOrder;
    });
  },

  cancelOrder(orderId: string, userId: string) {
    return Effect.gen(function* () {
      // check if order exists and is cancellable
      const orderToCancel = yield* Effect.tryPromise({
        try: () =>
          db.query.order.findFirst({
            where: and(
              eq(order.id, orderId),
              eq(order.userId, userId),
              eq(order.status, "pending"),
            ),
          }),
        catch: (error) => {
          logError("orderQueries.cancelOrder", "Failed to fetch order", {
            error,
            orderId,
            userId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil pesanan",
          });
        },
      });

      if (!orderToCancel) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan tidak ditemukan atau tidak dapat dibatalkan",
          }),
        );
      }

      // update order status to cancelled
      const [updatedOrder] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(order)
            .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
            .where(eq(order.id, orderId))
            .returning(),
        catch: (error) => {
          logError("orderQueries.cancelOrder", "Failed to update order", {
            error,
            orderId,
            userId,
          });

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pesanan",
          });
        },
      });

      if (!updatedOrder) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membatalkan pesanan",
          }),
        );
      }

      // create order status history - cancelled
      yield* orderStatusHistoryQueries.createOrderStatusHistory(
        db,
        orderId,
        "cancelled",
        userId,
        "Order cancelled by customer",
      );

      return updatedOrder;
    });
  },

  approveOrder(orderId: string, adminId: string) {
    return Effect.gen(function* () {
      // check if order exists and is pending approval
      const orderToApprove = yield* Effect.tryPromise({
        try: () =>
          db.query.order.findFirst({
            where: and(
              eq(order.id, orderId),
              eq(order.approvalStatus, "pending"),
            ),
            with: {
              user: true,
            },
          }),
        catch: (error) => {
          logError("orderQueries.approveOrder", "Failed to fetch order", {
            error,
            orderId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil pesanan",
          });
        },
      });

      if (!orderToApprove) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan tidak ditemukan atau bukan dalam status pending",
          }),
        );
      }

      // update order approval status to approved
      const [updatedOrder] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(order)
            .set({ approvalStatus: "approved" })
            .where(eq(order.id, orderId))
            .returning(),
        catch: (error) => {
          logError("orderQueries.approveOrder", "Failed to update order", {
            error,
            orderId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pesanan",
          });
        },
      });

      if (!updatedOrder) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menyetujui pesanan",
          }),
        );
      }

      // create order status history - approved
      yield* orderStatusHistoryQueries.createOrderStatusHistory(
        db,
        orderId,
        "pending",
        adminId,
        "Order approved by admin and is waiting for payment document to be uploaded",
      );

      return {
        ...updatedOrder,
        user: orderToApprove.user,
      };
    });
  },

  rejectOrderApproval(orderId: string, adminId: string, reason: string) {
    return Effect.gen(function* () {
      // check if order exists and is pending approval
      const orderToReject = yield* Effect.tryPromise({
        try: () =>
          db.query.order.findFirst({
            where: and(
              eq(order.id, orderId),
              eq(order.approvalStatus, "pending"),
            ),
            with: {
              user: true,
            },
          }),
        catch: (error) => {
          logError(
            "orderQueries.rejectOrderApproval",
            "Failed to fetch order",
            {
              error,
              orderId,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil pesanan",
          });
        },
      });

      if (!orderToReject) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan tidak ditemukan atau bukan dalam status pending",
          }),
        );
      }

      // update order approval status to rejected
      const [updatedOrder] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(order)
            .set({ approvalStatus: "rejected", approvalRejectReason: reason })
            .where(eq(order.id, orderId))
            .returning(),
        catch: (error) => {
          logError(
            "orderQueries.rejectOrderApproval",
            "Failed to update order",
            {
              error,
              orderId,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pesanan",
          });
        },
      });

      if (!updatedOrder) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menolak persetujuan pesanan",
          }),
        );
      }

      // create order status history - rejected
      yield* orderStatusHistoryQueries.createOrderStatusHistory(
        db,
        orderId,
        "rejected",
        adminId,
        `Order approval rejected by admin. Reason: ${reason}`,
      );

      return { ...updatedOrder, user: orderToReject.user };
    });
  },

  verifyPayment(orderId: string, adminId: string) {
    return Effect.gen(function* () {
      // check if order exists and is pending verification
      const orderToVerify = yield* Effect.tryPromise({
        try: () =>
          db.query.order.findFirst({
            where: and(
              eq(order.id, orderId),
              eq(order.paymentStatus, "pending_verification"),
            ),
            with: {
              user: true,
            },
          }),
        catch: (error) => {
          logError("orderQueries.verifyPayment", "Failed to fetch order", {
            error,
            orderId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil pesanan",
          });
        },
      });

      if (!orderToVerify) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan tidak ditemukan atau sudah terverifikasi",
          }),
        );
      }

      // update order payment status to paid
      const [updatedOrder] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(order)
            .set({ paymentStatus: "paid", paidAt: new Date().toISOString() })
            .where(eq(order.id, orderId))
            .returning(),
        catch: (error) => {
          logError("orderQueries.verifyPayment", "Failed to update order", {
            error,
            orderId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pesanan",
          });
        },
      });

      if (!updatedOrder) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memverifikasi pembayaran pesanan",
          }),
        );
      }

      // create order status history - pembayaran_diterima
      yield* orderStatusHistoryQueries.createOrderStatusHistory(
        db,
        orderId,
        "pembayaran_diterima",
        adminId,
        "Order payment verified by admin",
      );

      return { ...updatedOrder, user: orderToVerify.user };
    });
  },

  rejectPayment(orderId: string, adminId: string, reason: string) {
    return Effect.gen(function* () {
      // check if order exists and is unpaid
      const orderToReject = yield* Effect.tryPromise({
        try: () =>
          db.query.order.findFirst({
            where: and(
              eq(order.id, orderId),
              eq(order.paymentStatus, "unpaid"),
            ),
            with: {
              user: true,
            },
          }),
        catch: (error) => {
          logError("orderQueries.rejectPayment", "Failed to fetch order", {
            error,
            orderId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengambil pesanan",
          });
        },
      });

      if (!orderToReject) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Pesanan tidak ditemukan atau sudah terverifikasi",
          }),
        );
      }

      const [updatedOrder] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(order)
            .set({ paymentStatus: "rejected", paymentRejectedReason: reason })
            .where(eq(order.id, orderId))
            .returning(),
        catch: (error) => {
          logError("orderQueries.rejectPayment", "Failed to update order", {
            error,
            orderId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui pesanan",
          });
        },
      });

      if (!updatedOrder) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menolak pembayaran pesanan",
          }),
        );
      }

      // create order status history - payment rejected
      yield* orderStatusHistoryQueries.createOrderStatusHistory(
        db,
        orderId,
        "rejected",
        adminId,
        `Order payment rejected by admin. Reason: ${reason}`,
      );

      return { ...orderToReject };
    });
  },

  /**
   * Update order status
   * Used when admin completes revision and sends documents back to customer
   */
  updateOrderStatus(orderId: string, status: OrderStatus, tx: DBorTx = db) {
    return Effect.gen(function* () {
      const [updatedOrder] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(order)
            .set({ status })
            .where(eq(order.id, orderId))
            .returning(),
        catch: (error) => {
          logError(
            "orderQueries.updateOrderStatus",
            "Failed to update order status",
            {
              error,
              orderId,
              status,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui status pesanan",
          });
        },
      });

      if (!updatedOrder) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui status pesanan",
          }),
        );
      }

      // Create order status history
      yield* orderStatusHistoryQueries.createOrderStatusHistory(
        db,
        orderId,
        status,
        updatedOrder.userId,
        `Order status updated to ${status}`,
      );

      return updatedOrder;
    });
  },

  /**
   * Update payment status
   * Used when admin verifies or rejects payment
   * Used for updating payment status to 'pending_verification' when user uploads payment proof
   */
  updatePaymentStatus(
    orderId: string,
    paymentStatus: OrderPaymentStatus,
    tx: DBorTx = db,
  ) {
    return Effect.gen(function* () {
      const [updatedOrder] = yield* Effect.tryPromise({
        try: () =>
          tx
            .update(order)
            .set({ paymentStatus })
            .where(eq(order.id, orderId))
            .returning(),
        catch: (error) => {
          logError(
            "orderQueries.updatePaymentStatus",
            "Failed to update order payment status",
            {
              error,
              orderId,
              paymentStatus,
            },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui status pembayaran pesanan",
          });
        },
      });

      if (!updatedOrder) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui status pembayaran pesanan",
          }),
        );
      }
      return updatedOrder;
    });
  },

  /**
   * Create testing from order
   * Delegates to testingQueries.createTestingFromOrder
   */
  createTestingFromOrder(orderId: string) {
    // Import here to avoid circular dependency
    // The actual implementation is in testing.queries.ts
    return Effect.tryPromise({
      try: async () => {
        return Effect.runPromise(
          testingQueries.createTestingFromOrder(orderId),
        );
      },
      catch: (error) => {
        logError(
          "orderQueries.createTestingFromOrder",
          "Failed to create testing from order",
          {
            error,
            orderId,
          },
        );

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat testing dari order",
        });
      },
    });
  },
};

export default orderQueries;
