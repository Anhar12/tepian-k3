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
import {
  createDocumentSignature,
  documentSigningService,
} from "@tepian-k3/services/document-signing";

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
            // 1. Get order data
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
              })
            );

            // 5. Upload FINAL PDF
            const uploadedFile = yield* storageService.upload(
              finalPdfBuffer as Buffer,
              {
                filename,
                folder: "offering-letters",
                contentType: "application/pdf",
              }
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
              verificationToken // Reuse the same token from step 2
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
            // 1. Get order data
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
              }
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
              verificationToken // Reuse the same token from step 2
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
