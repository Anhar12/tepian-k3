import { DOCUMENT_TYPES, ORDER_STATUS } from "@tepian-k3/constants";
import { db } from "@tepian-k3/db/client";
import orderQueries from "@tepian-k3/queries/pengujian/order.queries";
import documentQueries from "@tepian-k3/queries/platform/document.queries";
import { notificationsQueries } from "@tepian-k3/queries/platform/notifications.queries";
import orderItemSchema from "@tepian-k3/schema/pengujian/order-item.schema";
import orderSchema from "@tepian-k3/schema/pengujian/order.schema";
import { EventTypes } from "@tepian-k3/schema/platform/event.schema";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import {
  ALLOWED_MIME_TYPES,
  assertValidFileBuffer,
  FILE_SIZE_LIMITS,
  storageService,
} from "@tepian-k3/services/storage";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import z from "zod";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  protectedProcedure,
  withIdempotency,
  withPermission,
  withProtectedRateLimit,
} from "../..";
import { runEffect } from "../../utils/run-effect";
import { DOCUMENT_NOTIFICATION_CONFIG } from "./order.notification-config";

export const orderRouter = createTRPCRouter({
  getAllOrders: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        status: z.enum(["all", ...ORDER_STATUS]).optional(),
      }),
    )
    .query(
      async ({ input, ctx }) =>
        await runEffect(
          orderQueries.getAllOrderByUserId(ctx.user.id, input.status),
        ),
    ),

  getAllOrdersPaginated: withPermission("orders.view")
    .input(orderSchema.getAllOrdersSchema)
    .query(
      async ({ input }) =>
        await runEffect(orderQueries.getOffsetPaginatedOrders(input)),
    ),

  getOrderById: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        orderId: z.uuidv7(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const order = await runEffect(
        orderQueries.getOrderById(input.orderId, ctx.user.id),
      );

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order tidak ditemukan",
        });
      }

      return order;
    }),

  getOrderWithDocuments: protectedProcedure
    .input(
      z.object({
        orderId: z.uuidv7(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const order = await runEffect(
        orderQueries.getOrderWithDocuments(input.orderId, ctx.user.id),
      );

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order tidak ditemukan",
        });
      }

      return order;
    }),

  getOrderWithDocumentsAdmin: withPermission("orders.read")
    .input(
      z.object({
        orderId: z.uuidv7(),
      }),
    )
    .query(async ({ input }) => {
      const order = await runEffect(
        orderQueries.getOrderWithDocumentsAdmin(input.orderId),
      );

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order tidak ditemukan",
        });
      }

      return order;
    }),

  createOrder: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        coverFlightIncluded: z.boolean(),
        coverGroundTransportationIncluded: z.boolean(),
        coverGroundTransportationToAirportOrHarbour: z.boolean(),
        coverLodgingIncluded: z.boolean(),
        coverWaterTransportationIncluded: z.boolean(),
        customerNote: z.string().optional(),
        data: z.array(
          z.object({
            orderData: orderSchema.createOrderSchema,
            orderItems: z.array(orderItemSchema.createOrderItem),
          }),
        ),
      }),
    )
    .mutation(
      withIdempotency(async ({ input, ctx }) => {
        await runEffect(
          Effect.gen(function* () {
            const createdOrders = yield* Effect.forEach(
              input.data,
              (orderPayload) =>
                orderQueries.createOrder(
                  ctx.user.id,
                  input.coverFlightIncluded,
                  input.coverGroundTransportationIncluded,
                  input.coverGroundTransportationToAirportOrHarbour,
                  input.coverLodgingIncluded,
                  input.coverWaterTransportationIncluded,
                  input.customerNote,
                  orderPayload.orderData,
                  orderPayload.orderItems,
                ),
            );
            return createdOrders;
          }),
        );

        return { success: true };
      }),
    ),

  acceptOffer: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        orderId: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(orderQueries.acceptOffer(input.orderId, ctx.user.id)),
    ),

  reviseOrder: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        orderId: z.uuidv7(),
        revisionNotes: z.string().min(10, "Catatan revisi minimal 10 karakter"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await runEffect(
        orderQueries.reviseOrder(
          input.orderId,
          ctx.user.id,
          input.revisionNotes,
        ),
      );
    }),

  cancelOrder: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        orderId: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(orderQueries.cancelOrder(input.orderId, ctx.user.id)),
    ),

  /**
   * Customer create arrival and depature date for their order. This is used for admin to verify the arrival date and prepare the necessary arrangements
   */
  createArrivalDepartureDate: withProtectedRateLimit(rateLimiters.moderate())
    .input(orderSchema.createArrivalDepartureDateSchema)
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          orderQueries.createArrivalDepatureDate(ctx.user.id, input),
        ),
    ),

  /**
   * Customer uploads their signed approval letter (Surat Persetujuan)
   * This is uploaded after they approve the offering and admin has provided the template
   */
  uploadApprovalLetter: protectedProcedure
    .input(formDataInput)
    .use(
      formDataProcedure(
        z.object({
          orderId: z.uuidv7(),
          file: z.instanceof(File),
        }),
      ),
    )
    .mutation(
      withIdempotency(
        async ({ ctx }) =>
          await runEffect(
            Effect.gen(function* () {
              const { orderId, file } = ctx.input.data;

              // Verify the order belongs to the user and is in confirmed status
              const order = yield* orderQueries.getOrderWithDocuments(
                orderId,
                ctx.user.id,
              );

              if (!order) {
                return yield* Effect.fail(
                  new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order tidak ditemukan",
                  }),
                );
              }

              // Check if order is confirmed (customer has approved the offer)
              if (!order.approvedAt) {
                return yield* Effect.fail(
                  new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Order belum disetujui",
                  }),
                );
              }

              // Convert file to buffer
              const arrayBuffer = yield* Effect.tryPromise(() =>
                file.arrayBuffer(),
              );
              const buffer = Buffer.from(arrayBuffer);

              // Validate file (approval letters must be PDF or document)
              yield* Effect.tryPromise(() =>
                assertValidFileBuffer(buffer, file.name, file.type, {
                  maxSize: FILE_SIZE_LIMITS.DOCUMENT,
                  allowedMimeTypes: ALLOWED_MIME_TYPES.DOCUMENT,
                }),
              );

              // Upload file to storage
              const filename = `approval-letter-${order.orderNumber}-${Date.now()}.pdf`;
              const uploadedFile = yield* storageService.upload(buffer, {
                filename,
                folder: "approval-letters",
                contentType: file.type,
              });

              // Generate document number
              const documentNumber = `APR-${order.orderNumber}-${Date.now()}`;

              // Create document record
              const document = yield* documentQueries.createDocument({
                documentNumber,
                type: "approval_letter_user",
                title: `Surat Persetujuan - Order ${order.orderNumber}`,
                description: `Surat Persetujuan yang ditandatangani pelanggan untuk Order ${order.orderNumber}`,
                entityType: "order",
                entityId: orderId,
                fileUrl: uploadedFile.key,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                uploadedByUserId: ctx.user.id,
              });

              // Create notification for admin
              yield* notificationsQueries.create({
                userId: order.userId,
                title: "Surat Persetujuan Diunggah",
                message: `Surat persetujuan untuk Order #${order.orderNumber} telah diunggah.`,
                type: "document_ready",
                orderId: order.id,
                metadata: {
                  documentType: "offering_user_document",
                },
              });

              // Update order status to 'persetujuan_disetujui'
              yield* orderQueries.updateOrderStatus(
                order.id,
                "persetujuan_disetujui",
              );

              return {
                documentId: document.id,
                url: storageService.getPublicUrl(uploadedFile.key),
              };
            }),
          ),
      ),
    ),

  uploadPaymentDocuments: protectedProcedure
    .input(formDataInput)
    .use(
      formDataProcedure(
        z.object({
          orderId: z.uuidv7(),
          paymentProof: z.file().max(5 * 1024 * 1024),
          cooperationAgreement: z.file().max(5 * 1024 * 1024),
        }),
      ),
    )
    .mutation(
      withIdempotency(
        async ({ ctx }) =>
          await runEffect(
            Effect.gen(function* () {
              const { orderId, paymentProof, cooperationAgreement } =
                ctx.input.data;

              // Verify the order belongs to the user
              const order = yield* orderQueries.getOrderById(
                orderId,
                ctx.user.id,
              );

              if (!order) {
                return yield* Effect.fail(
                  new TRPCError({
                    code: "NOT_FOUND",
                    message: "Order tidak ditemukan",
                  }),
                );
              }

              // Convert files to buffers
              const paymentProofBuffer = Buffer.from(
                yield* Effect.tryPromise(() => paymentProof.arrayBuffer()),
              );
              const cooperationAgreementBuffer = Buffer.from(
                yield* Effect.tryPromise(() =>
                  cooperationAgreement.arrayBuffer(),
                ),
              );

              // Validate payment proof (allow images and PDFs)
              yield* Effect.tryPromise(() =>
                assertValidFileBuffer(
                  paymentProofBuffer,
                  paymentProof.name,
                  paymentProof.type,
                  {
                    maxSize: FILE_SIZE_LIMITS.IMAGE,
                    allowedMimeTypes: ALLOWED_MIME_TYPES.GENERAL,
                  },
                ),
              );

              // Validate cooperation agreement (must be document)
              yield* Effect.tryPromise(() =>
                assertValidFileBuffer(
                  cooperationAgreementBuffer,
                  cooperationAgreement.name,
                  cooperationAgreement.type,
                  {
                    maxSize: FILE_SIZE_LIMITS.DOCUMENT,
                    allowedMimeTypes: ALLOWED_MIME_TYPES.DOCUMENT,
                  },
                ),
              );

              // Upload payment proof
              const paymentProofFilename = `payment-proof-${order.orderNumber}-${Date.now()}-${paymentProof.name}`;
              const uploadedPaymentProof = yield* storageService.upload(
                paymentProofBuffer,
                {
                  filename: paymentProofFilename,
                  folder: "payment-proofs",
                  contentType: paymentProof.type,
                },
              );

              // Upload cooperation agreement
              const cooperationAgreementFilename = `cooperation-agreement-${order.orderNumber}-${Date.now()}-${cooperationAgreement.name}`;
              const uploadedCooperationAgreement = yield* storageService.upload(
                cooperationAgreementBuffer,
                {
                  filename: cooperationAgreementFilename,
                  folder: "cooperation-agreements",
                  contentType: cooperationAgreement.type,
                },
              );

              const { paymentProofDocument, cooperationAgreementDocument } =
                yield* Effect.tryPromise({
                  try: () =>
                    db.transaction(async (tx) => {
                      // Create document record for payment proof
                      const paymentProofDocument = await Effect.runPromise(
                        documentQueries.createDocument(
                          {
                            documentNumber: `PAY-${order.orderNumber}-${Date.now()}`,
                            type: "proof_of_payment",
                            title: `Bukti Pembayaran - Order ${order.orderNumber}`,
                            description: `Bukti pembayaran untuk Order ${order.orderNumber}`,
                            entityType: "order",
                            entityId: orderId,
                            fileUrl: uploadedPaymentProof.key,
                            fileName: paymentProof.name,
                            fileSize: paymentProof.size,
                            mimeType: paymentProof.type,
                            uploadedByUserId: ctx.user.id,
                          },
                          tx,
                        ),
                      );

                      // Create document record for cooperation agreement
                      const cooperationAgreementDocument =
                        await Effect.runPromise(
                          documentQueries.createDocument(
                            {
                              documentNumber: `AGR-${order.orderNumber}-${Date.now()}`,
                              type: "cooperation_agreement",
                              title: `Surat Perjanjian Kerjasama - Order ${order.orderNumber}`,
                              description: `Surat perjanjian kerjasama untuk Order ${order.orderNumber}`,
                              entityType: "order",
                              entityId: orderId,
                              fileUrl: uploadedCooperationAgreement.key,
                              fileName: cooperationAgreement.name,
                              fileSize: cooperationAgreement.size,
                              mimeType: cooperationAgreement.type,
                              uploadedByUserId: ctx.user.id,
                            },
                            tx,
                          ),
                        );

                      // Update order status to 'proses_validasi_pembayaran'
                      await Effect.runPromise(
                        orderQueries.updateOrderStatus(
                          order.id,
                          "proses_validasi_pembayaran",
                        ),
                      );
                      // update order payment status to 'pending_verification'
                      await Effect.runPromise(
                        orderQueries.updatePaymentStatus(
                          order.id,
                          "pending_verification",
                          tx,
                        ),
                      );

                      return {
                        paymentProofDocument,
                        cooperationAgreementDocument,
                      };
                    }),
                  catch: (error) => {
                    if (error instanceof TRPCError) return error;
                    return new TRPCError({
                      code: "INTERNAL_SERVER_ERROR",
                      message:
                        "Gagal menyimpan dokumen pembayaran dan perjanjian kerjasama.",
                      cause: error,
                    });
                  },
                });

              return {
                paymentProofDocumentId: paymentProofDocument.id,
                paymentProofUrl: storageService.getPublicUrl(
                  uploadedPaymentProof.key,
                ),
                cooperationAgreementDocumentId: cooperationAgreementDocument.id,
                cooperationAgreementUrl: storageService.getPublicUrl(
                  uploadedCooperationAgreement.key,
                ),
              };
            }),
          ),
      ),
    ),

  // Admin procedures
  approveOrder: withPermission("orders-approval.update")
    .input(
      z.object({
        orderId: z.uuidv7(),
        note: z.string().optional(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Update order approval status
            const order = yield* orderQueries.approveOrder(input.orderId);

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                }),
              );
            }

            yield* notificationsQueries.create({
              userId: order.userId,
              title: "Order Disetujui",
              message: `Order #${order.orderNumber} telah disetujui oleh admin.`,
              type: "order_status_changed",
              orderId: order.id,
              metadata: {
                orderStatus: "approved",
              },
            });

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                newStatus: order.status,
                oldStatus: order.status, // since status is updated in the same transaction, we can use the same value for old and new status
                triggeredBy: ctx.user.id,
              }),
            );

            return order;
          }),
        ),
    ),

  rejectOrderApproval: withPermission("orders-approval.update")
    .input(
      z.object({
        orderId: z.uuidv7(),
        reason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Update order approval status to rejected
            const order = yield* orderQueries.rejectOrderApproval(
              input.orderId,
              ctx.user.id,
              input.reason,
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                }),
              );
            }

            yield* notificationsQueries.create({
              userId: order.userId,
              title: "Order Ditolak",
              message: `Order #${order.orderNumber} telah ditolak oleh admin. Alasan: ${input.reason}`,
              type: "order_status_changed",
              orderId: order.id,
              metadata: {
                orderStatus: "rejected",
              },
            });

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                newStatus: "rejected",
                oldStatus: "pending",
                triggeredBy: ctx.user.id,
              }),
            );

            return order;
          }),
        ),
    ),

  requestApprovalRevision: withPermission("orders-approval.update")
    .input(
      z.object({
        orderId: z.uuidv7(),
        revisionNote: z
          .string()
          .min(10, "Catatan revisi minimal 10 karakter")
          .max(500, "Catatan revisi maksimal 500 karakter"),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const order = yield* orderQueries.requestApprovalRevision(
              input.orderId,
              ctx.user.id,
              input.revisionNote,
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                }),
              );
            }

            yield* notificationsQueries.create({
              userId: order.userId,
              title: "Order Memerlukan Koreksi Data",
              message: `Order #${order.orderNumber} memerlukan koreksi data kontak. Catatan admin: ${input.revisionNote}`,
              type: "order_status_changed",
              orderId: order.id,
              metadata: { approvalStatus: "revision" },
            });

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                newStatus: "pending",
                oldStatus: "pending",
                triggeredBy: ctx.user.id,
              }),
            );

            return order;
          }),
        ),
    ),

  adminRevertRevisionToPending: withPermission("orders-approval.update")
    .input(z.object({ orderId: z.uuidv7() }))
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const order = yield* orderQueries.adminRevertRevisionToPending(
              input.orderId,
              ctx.user.id,
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                }),
              );
            }

            yield* notificationsQueries.create({
              userId: order.userId,
              title: "Order Dikembalikan ke Antrean Persetujuan",
              message: `Order #${order.orderNumber} telah dikembalikan ke status menunggu persetujuan oleh admin.`,
              type: "order_status_changed",
              orderId: order.id,
              metadata: { approvalStatus: "pending" },
            });

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                newStatus: "pending",
                oldStatus: "revision",
                triggeredBy: ctx.user.id,
              }),
            );

            return order;
          }),
        ),
    ),

  resubmitForApproval: protectedProcedure
    .input(z.object({ orderId: z.uuidv7() }))
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const order = yield* orderQueries.resubmitForApproval(
              input.orderId,
              ctx.user.id,
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                }),
              );
            }

            return order;
          }),
        ),
    ),

  verifyPayment: withPermission("orders-payment.update")
    .input(
      z.object({
        orderId: z.uuidv7(),
        note: z.string().optional(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Update payment status to paid
            const order = yield* orderQueries.verifyPayment(
              input.orderId,
              ctx.user.id,
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                }),
              );
            }

            yield* notificationsQueries.create({
              userId: order.userId,
              title: "Pembayaran Diverifikasi",
              message: `Pembayaran untuk Order #${order.orderNumber} telah diverifikasi.`,
              type: "order_status_changed",
              orderId: order.id,
              metadata: {
                orderStatus: "pembayaran_diterima",
              },
            });

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                newStatus: "pembayaran_diterima",
                oldStatus: "proses_validasi_pembayaran",
                triggeredBy: ctx.user.id,
              }),
            );

            // update payment status to 'paid'
            yield* orderQueries.updatePaymentStatus(order.id, "paid");

            // update order status to pembayaran_diterima
            yield* orderQueries.updateOrderStatus(
              order.id,
              "menunggu_penerbitan_spt_jadwal",
            );

            return order;
          }),
        ),
    ),

  rejectPayment: withPermission("orders-payment.update")
    .input(
      z.object({
        orderId: z.uuidv7(),
        reason: z.string().min(10, "Alasan penolakan minimal 10 karakter"),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Update payment status to rejected
            const order = yield* orderQueries.rejectPayment(
              input.orderId,
              ctx.user.id,
              input.reason,
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                }),
              );
            }

            yield* notificationsQueries.create({
              userId: order.userId,
              title: "Pembayaran Ditolak",
              message: `Pembayaran untuk Order #${order.orderNumber} telah ditolak. Alasan: ${input.reason}`,
              type: "order_status_changed",
              orderId: order.id,
              metadata: {
                orderStatus: "payment_rejected",
              },
            });

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
                orderId: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                newStatus: "rejected",
                oldStatus: "pending",
                triggeredBy: ctx.user.id,
              }),
            );

            return order;
          }),
        ),
    ),

  notifyCustomer: withPermission("notifications.create")
    .input(
      z.object({
        orderId: z.uuidv7(),
        documentType: z.enum(DOCUMENT_TYPES),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const config = DOCUMENT_NOTIFICATION_CONFIG[input.documentType];
            if (!config) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "BAD_REQUEST",
                  message: `Tipe dokumen '${input.documentType}' tidak mendukung notifikasi pelanggan`,
                }),
              );
            }

            const order = yield* orderQueries.getOrderWithDocumentsAdmin(
              input.orderId,
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                }),
              );
            }

            const doc = order.documents.find(
              (d) => d.type === config.findDocType,
            );
            if (!doc) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "BAD_REQUEST",
                  message: `Dokumen '${input.documentType}' belum diunggah`,
                }),
              );
            }

            // Some document types (e.g. offering_document) need to move the
            // order out of revision status before notifying the customer.
            const isRevision =
              (config.revisionAware ?? false) && order.status === "revision";
            if (isRevision) {
              yield* orderQueries.updateOrderStatus(order.id, "pending");
            }

            const docUrl = storageService.getPublicUrl(doc.fileUrl);
            const title = config.buildTitle(order, isRevision);
            const message = config.buildMessage(order, isRevision);
            const metadata = config.buildMetadata(docUrl);

            yield* notificationsQueries.create({
              userId: order.userId,
              title,
              message,
              type: "document_ready",
              orderId: order.id,
              metadata,
            });

            yield* Effect.tryPromise({
              try: () =>
                ctx.eventBus.publish(EventTypes.NOTIFICATION, {
                  userId: order.userId,
                  title,
                  message,
                  type: "document_ready",
                  orderId: order.id,
                  metadata,
                }),
              catch: (error) => {
                console.error("Failed to publish notification event", error);
                if (error instanceof TRPCError) return error;
                return new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Gagal mengirim notifikasi ke pelanggan",
                  cause: error,
                });
              },
            });

            return { success: true };
          }),
        ),
    ),

  createTesting: withPermission("testing.create")
    .input(
      z.object({
        orderId: z.uuidv7(),
      }),
    )
    .mutation(
      async ({ input }) =>
        await runEffect(
          Effect.gen(function* () {
            // Create testing record from order
            const testing = yield* orderQueries.createTestingFromOrder(
              input.orderId,
            );

            if (!testing) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Gagal membuat testing record",
                }),
              );
            }

            return testing;
          }),
        ),
    ),
});
