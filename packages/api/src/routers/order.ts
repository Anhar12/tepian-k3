import orderQueries from "@tepian-k3/queries/order.queries";
import { createTRPCRouter, protectedProcedure } from "..";
import z from "zod";
import orderSchema from "@tepian-k3/schema/order.schema";
import { runEffect } from "../utils/run-effect";
import orderItemSchema from "@tepian-k3/schema/order-item.schema";
import { TRPCError } from "@trpc/server";
import { ORDER_STATUS } from "@tepian-k3/constants";
import { Effect } from "effect";
import { generateInvoicePdf } from "@tepian-k3/services/pdf";
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

  generateInvoice: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const order = yield* orderQueries.getOrderById(
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
            try: () => generateInvoicePdf(order),
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
