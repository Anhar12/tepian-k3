import orderQueries from "@tepian-k3/queries/order.queries";
import { createTRPCRouter, protectedProcedure } from "..";
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
import documentTransactionQueries from "@tepian-k3/queries/document-transaction.queries";
import { createDocumentSignature } from "@tepian-k3/services/document-signing";

export const orderRouter = createTRPCRouter({
  getAllOrders: protectedProcedure
    .input(
      z.object({
        status: z.enum(["all", ...ORDER_STATUS]).optional(),
      })
    )
    .query(
      async ({ input, ctx }) =>
        await runEffect(
          orderQueries.getAllOrderByUserId(ctx.user.id, input.status)
        )
    ),

  getOrderById: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const order = await runEffect(
        orderQueries.getOrderById(input.orderId, ctx.user.id)
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
      })
    )
    .query(async ({ input, ctx }) => {
      const order = await runEffect(
        orderQueries.getOrderWithDocuments(input.orderId, ctx.user.id)
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
      })
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Get order with company and items
            const order = yield* orderQueries.getOrderWithCompanyAndItems(
              input.orderId,
              ctx.user.id
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                })
              );
            }

            const filename = `offering-letter-${order.orderNumber}.pdf`;

            // Generate initial PDF
            const initialPdfBuffer = yield* Effect.tryPromise(() =>
              generateOfferingLetterPdf({
                order,
                letterNumber: input.letterNumber,
                referenceNumber: input.referenceNumber,
                referenceDate: input.referenceDate,
                adminEmail: "admin@balaik3samarinda.kemnaker.go.id",
                adminContact: "+62 812-3456-7890",
                logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
              })
            );

            // Upload initial PDF
            const uploadedFile = yield* storageService.upload(
              initialPdfBuffer as Buffer,
              {
                filename,
                folder: "offering-letters",
                contentType: "application/pdf",
              }
            );

            // Create document record
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

            // Create signature
            const signature = yield* createDocumentSignature(
              document.id,
              input.letterNumber,
              "order",
              order.id,
              "offering_document",
              uploadedFile.key,
              initialPdfBuffer as Buffer,
              ctx.user.id
            );

            // Store signature
            yield* documentQueries.updateDocumentSignature(document.id, {
              signatureData: signature.signatureData,
              verificationToken: signature.verificationToken,
            });

            // Generate QR code
            const { qrCodeDataURL, verificationURL } =
              yield* generateDocumentVerificationQRCode(
                signature.verificationToken
              );

            // Regenerate with QR code
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
              })
            );

            // Update file
            yield* storageService.upload(finalPdfBuffer as Buffer, {
              filename,
              folder: "offering-letters",
              contentType: "application/pdf",
            });

            return {
              documentId: document.id,
              url: storageService.getPublicUrl(uploadedFile.key),
              verificationURL,
            };
          })
        )
    ),

  generateInvoice: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const order = yield* orderQueries.getOrderWithCompanyAndItems(
              input.orderId,
              ctx.user.id
            );

            if (!order) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order tidak ditemukan",
              });
            }

            const invoiceNumber = `INV-${order.orderNumber}`;
            const filename = `invoice-${order.orderNumber}.pdf`;

            // Generate initial PDF (without QR code)
            const initialPdfBuffer = yield* Effect.tryPromise({
              try: () =>
                generateInvoicePdf({
                  order,
                  invoiceNumber,
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
                }),
              catch: (error) =>
                new Error(`Failed to generate PDF: ${String(error)}`),
            });

            // Upload initial PDF
            const uploadedFile = yield* storageService.upload(
              initialPdfBuffer as Buffer,
              {
                filename,
                folder: "invoices",
                contentType: "application/pdf",
              }
            );

            // Create document record in database
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

            // Create document signature
            const signature = yield* createDocumentSignature(
              document.id,
              invoiceNumber,
              "order",
              order.id,
              "invoice",
              uploadedFile.url,
              initialPdfBuffer as Buffer,
              ctx.user.id
            );

            // Store signature in database
            yield* documentQueries.updateDocumentSignature(document.id, {
              signatureData: signature.signatureData,
              verificationToken: signature.verificationToken,
            });

            // Generate QR code
            const { qrCodeDataURL, verificationURL } =
              yield* generateDocumentVerificationQRCode(
                signature.verificationToken,
                process.env.DOCUMENT_VERIFICATION_BASE_URL
              );

            // Regenerate PDF with QR code
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
                new Error(`Failed to regenerate PDF with QR: ${String(error)}`),
            });

            // Update uploaded file with final PDF
            yield* storageService.upload(finalPdfBuffer as Buffer, {
              filename,
              folder: "invoices",
              contentType: "application/pdf",
            });

            return {
              documentId: document.id,
              url: storageService.getPublicUrl(uploadedFile.key),
              verificationURL,
            };
          })
        )
    ),

  // Transactional version of generateInvoice
  generateInvoiceTransactional: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            const order = yield* orderQueries.getOrderWithCompanyAndItems(
              input.orderId,
              ctx.user.id
            );

            if (!order) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Order tidak ditemukan",
              });
            }

            const invoiceNumber = `INV-${order.orderNumber}`;
            const filename = `invoice-${order.orderNumber}.pdf`;

            // Generate initial PDF (without QR code)
            const initialPdfBuffer = yield* Effect.tryPromise({
              try: () =>
                generateInvoicePdf({
                  order,
                  invoiceNumber,
                  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
                }),
              catch: (error) =>
                new Error(`Failed to generate PDF: ${String(error)}`),
            });

            // Upload initial PDF
            const uploadedFile = yield* storageService.upload(
              initialPdfBuffer as Buffer,
              {
                filename,
                folder: "invoices",
                contentType: "application/pdf",
              }
            );

            // Create document signature (before transaction)
            const signature = yield* createDocumentSignature(
              "", // Temporary ID, will be replaced
              invoiceNumber,
              "order",
              order.id,
              "invoice",
              uploadedFile.url,
              initialPdfBuffer as Buffer,
              ctx.user.id
            );

            // Generate QR code (before transaction)
            const { qrCodeDataURL, verificationURL } =
              yield* generateDocumentVerificationQRCode(
                signature.verificationToken,
                process.env.DOCUMENT_VERIFICATION_BASE_URL
              );

            // Create document and update signature in a single transaction
            const document = yield* documentTransactionQueries.createSignedDocument({
              documentData: {
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
              },
              signatureData: {
                signatureData: signature.signatureData,
                verificationToken: signature.verificationToken,
                verificationUrl: verificationURL,
              },
              userId: ctx.user.id,
            });

            // Regenerate PDF with QR code
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
                new Error(`Failed to regenerate PDF with QR: ${String(error)}`),
            });

            // Update uploaded file with final PDF
            yield* storageService.upload(finalPdfBuffer as Buffer, {
              filename,
              folder: "invoices",
              contentType: "application/pdf",
            });

            return {
              documentId: document.id,
              url: storageService.getPublicUrl(uploadedFile.key),
              verificationURL,
            };
          })
        )
    ),

  // Transactional version of generateOfferingLetter
  generateOfferingLetterTransactional: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        letterNumber: z.string(),
        referenceNumber: z.string(),
        referenceDate: z.string(),
      })
    )
    .mutation(
      async ({ input, ctx }) =>
        await runEffect(
          Effect.gen(function* () {
            // Get order with company and items
            const order = yield* orderQueries.getOrderWithCompanyAndItems(
              input.orderId,
              ctx.user.id
            );

            if (!order) {
              return yield* Effect.fail(
                new TRPCError({
                  code: "NOT_FOUND",
                  message: "Order tidak ditemukan",
                })
              );
            }

            const filename = `offering-letter-${order.orderNumber}.pdf`;

            // Generate initial PDF
            const initialPdfBuffer = yield* Effect.tryPromise(() =>
              generateOfferingLetterPdf({
                order,
                letterNumber: input.letterNumber,
                referenceNumber: input.referenceNumber,
                referenceDate: input.referenceDate,
                adminEmail: "admin@balaik3samarinda.kemnaker.go.id",
                adminContact: "+62 812-3456-7890",
                logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
              })
            );

            // Upload initial PDF
            const uploadedFile = yield* storageService.upload(
              initialPdfBuffer as Buffer,
              {
                filename,
                folder: "offering-letters",
                contentType: "application/pdf",
              }
            );

            // Create signature (before transaction)
            const signature = yield* createDocumentSignature(
              "", // Temporary ID
              input.letterNumber,
              "order",
              order.id,
              "offering_document",
              uploadedFile.key,
              initialPdfBuffer as Buffer,
              ctx.user.id
            );

            // Generate QR code (before transaction)
            const { qrCodeDataURL, verificationURL } =
              yield* generateDocumentVerificationQRCode(
                signature.verificationToken
              );

            // Create document and update signature in a single transaction
            const document = yield* documentTransactionQueries.createSignedDocument({
              documentData: {
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
              },
              signatureData: {
                signatureData: signature.signatureData,
                verificationToken: signature.verificationToken,
                verificationUrl: verificationURL,
              },
              userId: ctx.user.id,
            });

            // Regenerate with QR code
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
              })
            );

            // Update file
            yield* storageService.upload(finalPdfBuffer as Buffer, {
              filename,
              folder: "offering-letters",
              contentType: "application/pdf",
            });

            return {
              documentId: document.id,
              url: storageService.getPublicUrl(uploadedFile.key),
              verificationURL,
            };
          })
        )
    ),

  createOrder: protectedProcedure
    .input(
      z.array(
        z.object({
          orderData: orderSchema.createOrderSchema,
          orderItems: z.array(orderItemSchema.createOrderItem),
        })
      )
    )
    .mutation(async ({ input, ctx }) =>
      input.map(
        async ({ orderData, orderItems }) =>
          await runEffect(
            orderQueries.createOrder(ctx.user.id, orderData, orderItems)
          )
      )
    ),
});
