import orderQueries from "@tepian-k3/queries/order.queries";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  protectedProcedure,
  withPermission,
  withProtectedRateLimit,
} from "..";
import z from "zod";
import orderSchema from "@tepian-k3/schema/order.schema";
import { runEffect } from "../utils/run-effect";
import orderItemSchema from "@tepian-k3/schema/order-item.schema";
import { TRPCError } from "@trpc/server";
import { ORDER_STATUS } from "@tepian-k3/constants";
import { Effect } from "effect";
import {
  generateDocumentVerificationQRCode,
  generateInvoicePdf,
  generateOfferingLetterPdf,
} from "@tepian-k3/services/pdf";
import { storageService } from "@tepian-k3/services/storage";
import documentQueries from "@tepian-k3/queries/document.queries";
import {
  createDocumentSignature,
  documentSigningService,
} from "@tepian-k3/services/document-signing";
import { rateLimiters } from "@tepian-k3/services/rate-limiter";
import { EventTypes } from "@tepian-k3/schema/event.schema";
import { notificationsQueries } from "@tepian-k3/queries/notifications.queries";

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

  getAllOrdersPaginated: withPermission("orders.read")
    .input(orderSchema.getAllOrdersSchema)
    .query(
      async ({ input }) =>
        await runEffect(
          orderQueries.getAllOrdersPaginated(
            input.page,
            input.perPage,
            input.status,
            input.search,
          ),
        ),
    ),

  getOrderById: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        orderId: z.string(),
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
        orderId: z.string(),
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
        orderId: z.string(),
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

  generateOfferingLetter: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        letterNumber: z.string(),
        referenceNumber: z.string(),
        referenceDate: z.string(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // 1. Get order data
            const order = yield* orderQueries.getOrderWithCompanyAndItems(
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

            const filename = `offering-letter-${order.orderNumber}.pdf`;

            // 2. Generate verification token yang akan digunakan di QR code DAN final signature
            const verificationToken =
              yield* documentSigningService.generateVerificationToken();

            // 3. Generate QR code menggunakan token yang sama
            const { qrCodeDataURL, verificationURL } =
              yield* generateDocumentVerificationQRCode(verificationToken);

            // 4. Generate FINAL PDF dengan QR code
            const finalPdfBuffer = yield* Effect.tryPromise(() =>
              generateOfferingLetterPdf({
                order,
                letterNumber: input.letterNumber,
                referenceNumber: input.referenceNumber,
                referenceDate: input.referenceDate,
                adminEmail: "admin@balaik3samarinda.kemnaker.go.id",
                adminContact: "+62 812-3456-7890",
                logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
                qrCodeDataURL,
                verificationURL,
              }),
            );

            // 5. Upload FINAL PDF
            const uploadedFile = yield* storageService.upload(
              finalPdfBuffer as Buffer,
              {
                filename,
                folder: "offering-letters",
                contentType: "application/pdf",
              },
            );

            // 6. Create document record
            const document = yield* documentQueries.createDocument({
              documentNumber: input.letterNumber,
              entityType: "order",
              entityId: order.id,
              type: "offering_document",
              fileUrl: uploadedFile.key,
              fileName: uploadedFile.filename,
              uploadedByUserId: ctx.user.id,
              title: `Offering Letter for Order ${order.orderNumber}`,
              description: `Surat Penawaran untuk Pesanan ${order.orderNumber}`,
              fileSize: uploadedFile.size,
              mimeType: uploadedFile.contentType,
            });

            // 7. Sign dengan final PDF buffer menggunakan TOKEN YANG SAMA dengan QR code
            const finalSignature = yield* createDocumentSignature(
              document.id,
              input.letterNumber,
              "order",
              order.id,
              "offering_document",
              uploadedFile.key,
              finalPdfBuffer as Buffer,
              ctx.user.id,
              verificationToken, // Reuse the same token from step 2
            );

            // 8. Store signature ke database
            yield* documentQueries.updateDocumentSignature(document.id, {
              signatureData: finalSignature.signatureData,
              verificationToken: finalSignature.verificationToken,
            });

            return {
              documentId: document.id,
              url: storageService.getPublicUrl(uploadedFile.key),
              verificationURL,
            };
          }),
        ),
    ),

  generateInvoice: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // 1. Get order data
            const order = yield* orderQueries.getOrderWithCompanyAndItems(
              input.orderId,
              ctx.user.id,
            );

            if (!order) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order tidak ditemukan",
              });
            }

            const invoiceNumber = `INV-${order.orderNumber}`;
            const filename = `invoice-${order.orderNumber}.pdf`;

            // 2. Generate verification token yang akan digunakan di QR code DAN final signature
            const verificationToken =
              yield* documentSigningService.generateVerificationToken();

            // 3. Generate QR code menggunakan token yang sama
            const { qrCodeDataURL, verificationURL } =
              yield* generateDocumentVerificationQRCode(verificationToken);

            // 4. Generate FINAL PDF dengan QR code (sekali saja!)
            const finalPdfBuffer = yield* Effect.tryPromise({
              try: () =>
                generateInvoicePdf({
                  order,
                  invoiceNumber,
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
                  qrCodeDataURL,
                  verificationURL,
                }),
              catch: (error) =>
                new Error(`Failed to generate PDF: ${String(error)}`),
            });

            // 5. Upload FINAL PDF
            const uploadedFile = yield* storageService.upload(
              finalPdfBuffer as Buffer,
              {
                filename,
                folder: "invoices",
                contentType: "application/pdf",
              },
            );

            // 6. Create document record
            const document = yield* documentQueries.createDocument({
              documentNumber: invoiceNumber,
              entityType: "order",
              entityId: order.id,
              type: "invoice",
              fileUrl: uploadedFile.key,
              fileName: uploadedFile.filename,
              uploadedByUserId: ctx.user.id,
              title: `Invoice for Order ${order.orderNumber}`,
              description: `Faktur untuk Pesanan ${order.orderNumber}`,
              fileSize: uploadedFile.size,
              mimeType: uploadedFile.contentType,
            });

            // 7. Sign dengan final PDF buffer menggunakan TOKEN YANG SAMA dengan QR code
            const signature = yield* createDocumentSignature(
              document.id,
              invoiceNumber,
              "order",
              order.id,
              "invoice",
              uploadedFile.key,
              finalPdfBuffer as Buffer,
              ctx.user.id,
              verificationToken, // Reuse the same token from step 2
            );

            // 8. Store signature ke database
            yield* documentQueries.updateDocumentSignature(document.id, {
              signatureData: signature.signatureData,
              verificationToken: signature.verificationToken,
            });

            return {
              documentId: document.id,
              url: storageService.getPublicUrl(uploadedFile.key),
              verificationURL,
            };
          }),
        ),
    ),

  createOrder: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        coverTransportationIncluded: z.boolean(),
        coverAccommodationIncluded: z.boolean(),
        data: z.array(
          z.object({
            orderData: orderSchema.createOrderSchema,
            orderItems: z.array(orderItemSchema.createOrderItem),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await runEffect(
        Effect.gen(function* () {
          const createdOrders = yield* Effect.forEach(
            input.data,
            (orderPayload) =>
              orderQueries.createOrder(
                ctx.user.id,
                input.coverTransportationIncluded,
                input.coverAccommodationIncluded,
                orderPayload.orderData,
                orderPayload.orderItems,
              ),
          );
          return createdOrders;
        }),
      );

      return { success: true };
    }),

  acceptOffer: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        orderId: z.string(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(orderQueries.acceptOffer(input.orderId, ctx.user.id)),
    ),

  reviseOrder: withProtectedRateLimit(rateLimiters.moderate())
    .input(
      z.object({
        orderId: z.string(),
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
        orderId: z.string(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(orderQueries.cancelOrder(input.orderId, ctx.user.id)),
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
          orderId: z.string(),
          file: z.instanceof(File),
        }),
      ),
    )
    .mutation(
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

            return {
              documentId: document.id,
              url: storageService.getPublicUrl(uploadedFile.key),
            };
          }),
        ),
    ),

  uploadPaymentDocuments: protectedProcedure
    .input(formDataInput)
    .use(
      formDataProcedure(
        z.object({
          orderId: z.string(),
          paymentProof: z.file(),
          cooperationAgreement: z.file(),
        }),
      ),
    )
    .mutation(
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

            // TODO: UPDATE THIS TO TRANSACTION LATER
            // Create document record for payment proof
            const paymentProofDocument = yield* documentQueries.createDocument({
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
            });

            // Create document record for cooperation agreement
            const cooperationAgreementDocument =
              yield* documentQueries.createDocument({
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
              });

            // update order payment status to 'pending_verification'
            yield* orderQueries.updatePaymentStatus(
              order.id,
              "pending_verification",
            );

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

  // Admin procedures
  approveOrder: withPermission("orders.update")
    .input(
      z.object({
        orderId: z.string(),
        note: z.string().optional(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Update order approval status
            const order = yield* orderQueries.approveOrder(
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

  rejectOrderApproval: withPermission("orders.update")
    .input(
      z.object({
        orderId: z.string(),
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

  verifyPayment: withPermission("orders.update")
    .input(
      z.object({
        orderId: z.string(),
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
                orderStatus: "in_progress",
              },
            });

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.ORDER_STATUS_CHANGED, {
                orderId: order.id,
                userId: order.userId,
                newStatus: "in_progress",
                oldStatus: "pending",
                triggeredBy: ctx.user.id,
              }),
            );

            // update order status to in_progress
            yield* orderQueries.updateOrderStatus(order.id, "in_progress");

            return order;
          }),
        ),
    ),

  rejectPayment: withPermission("orders.update")
    .input(
      z.object({
        orderId: z.string(),
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
        orderId: z.string(),
      }),
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Get order with documents
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

            // Get document URLs
            const offeringLetter = order.documents.find(
              (doc) => doc.type === "offering_document",
            );
            const invoice = order.documents.find(
              (doc) => doc.type === "invoice",
            );

            if (!offeringLetter || !invoice) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Dokumen penagihan belum lengkap",
                }),
              );
            }

            // If order is in revision status, update it back to pending
            // so customer can review the revised documents
            const isRevision = order.status === "revision";
            if (isRevision) {
              yield* orderQueries.updateOrderStatus(order.id, "pending");
            }

            // Create notification
            const notificationTitle = isRevision
              ? "Dokumen Revisi Order Anda Telah Tersedia"
              : "Dokumen Order Anda Telah Tersedia";
            const notificationMessage = isRevision
              ? `Dokumen revisi penawaran dan faktur untuk Order #${order.orderNumber} telah tersedia. Silakan cek dokumen Anda.`
              : `Dokumen penawaran dan faktur untuk Order #${order.orderNumber} telah tersedia. Silakan cek dokumen Anda.`;

            yield* notificationsQueries.create({
              userId: order.userId,
              title: notificationTitle,
              message: notificationMessage,
              type: "document_ready",
              orderId: order.id,
              metadata: {
                offeringLetterUrl: storageService.getPublicUrl(
                  offeringLetter.fileUrl,
                ),
                invoiceUrl: storageService.getPublicUrl(invoice.fileUrl),
              },
            });

            yield* Effect.tryPromise(() =>
              ctx.eventBus.publish(EventTypes.NOTIFICATION, {
                userId: order.userId,
                message: notificationMessage,
                title: notificationTitle,
                type: "document_ready",
                orderId: order.id,
                metadata: {
                  offeringLetterUrl: storageService.getPublicUrl(
                    offeringLetter.fileUrl,
                  ),
                  invoiceUrl: storageService.getPublicUrl(invoice.fileUrl),
                },
              }),
            );

            return { success: true };
          }),
        ),
    ),

  createTesting: withPermission("testing.create")
    .input(
      z.object({
        orderId: z.string(),
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
