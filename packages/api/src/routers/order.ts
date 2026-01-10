import orderQueries from "@tepian-k3/queries/order.queries";
import { createTRPCRouter, protectedProcedure } from "..";
import z from "zod";
import orderSchema from "@tepian-k3/schema/order.schema";
import { runEffect } from "../utils/run-effect";
import orderItemSchema from "@tepian-k3/schema/order-item.schema";
import { TRPCError } from "@trpc/server";

export const orderRouter = createTRPCRouter({
  getAllOrders: protectedProcedure.query(
    async ({ ctx }) =>
      await runEffect(orderQueries.getAllOrderByUserId(ctx.user.id))
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
