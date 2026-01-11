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
  generateInvoicePdf,
  generateOfferingLetterPdf,
} from "@tepian-k3/services/pdf";
import { storageService } from "@tepian-k3/services/storage";

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

  generateOfferingLetter: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        letterNumber: z.string(),
        referenceNumber: z.string(),
        referenceDate: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) =>
      runEffect(
        Effect.gen(function* () {
          // Get order with company and items
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

          // Generate PDF
          const pdfBuffer = yield* Effect.tryPromise(() =>
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

          // Upload to storage
          const uploadedFile = yield* storageService.upload(
            pdfBuffer as Buffer,
            {
              filename: `offering-letter-${order.orderNumber}.pdf`,
              folder: "offering-letters",
              contentType: "application/pdf",
            }
          );

          // Update order
          yield* orderQueries.createOrderOfferingLetter(
            input.orderId,
            uploadedFile.key
          );

          return { url: uploadedFile.url };
        })
      )
    ),

  generateInvoice: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) =>
      runEffect(
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

          // Generate PDF
          const pdfBuffer = yield* Effect.tryPromise({
            try: () =>
              generateInvoicePdf({
                order,
                invoiceNumber: `INV-${order.orderNumber}`,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .split("T")[0], // 14 days from now
                logoUrl: storageService.getAssetUrl("assets/kemnaker.png"),
              }),
            catch: (error) =>
              new Error(`Gagal generate invoice: ${String(error)}`),
          });

          const uploadedFile = yield* storageService.upload(
            pdfBuffer as Buffer,
            {
              filename: `invoice-${order.orderNumber}.pdf`,
              folder: "invoices",
              contentType: "application/pdf",
            }
          );

          yield* orderQueries.createOrderInvoice(order.id, uploadedFile.key);

          return {
            url: storageService.getPublicUrl(uploadedFile.key),
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
