import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { z } from "zod";
import orderSchema from "@tepian-k3/schema/order.schema";
import { Effect } from "effect";
import { logger } from "@tepian-k3/services/logger";
import { and, eq, inArray } from "@tepian-k3/db";
import {
  cart,
  order,
  userCompanies,
  userCompanyTestingLocation,
} from "@tepian-k3/db/schema";
import orderItemSchema from "@tepian-k3/schema/order-item.schema";
import { generateOrderNumberWithSequence } from "@tepian-k3/db/utils";
import orderItemQueries from "./order-item.queries";
import orderStatusHistoryQueries from "./order-status-history.queries";

const orderQueries = {
  getAllOrderByUserId(userId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.order.findMany({
          where: eq(order.userId, userId),
          orderBy: (order, { desc }) => [desc(order.createdAt)],
        }),
      catch: (error) => {
        logger.error("Failed to fetch orders", { error, userId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch orders",
        });
      },
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
          },
        }),
      catch: (error) => {
        logger.error("Failed to fetch order by ID", { error, orderId, userId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order by ID",
        });
      },
    });
  },

  createOrder(
    userId: string,
    orderData: z.infer<typeof orderSchema.createOrderSchema>,
    orderItems: z.infer<typeof orderItemSchema.createOrderItem>[]
  ) {
    return Effect.gen(function* () {
      // 1. Validate order items not empty
      if (orderItems.length === 0) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Order must contain at least one item",
          })
        );
      }

      // 2. Validate company ownership
      const company = yield* Effect.tryPromise({
        try: () =>
          db.query.userCompanies.findFirst({
            where: and(
              eq(userCompanies.id, orderData.companyId),
              eq(userCompanies.userId, userId)
            ),
          }),
        catch: (error) => {
          logger.error("Failed to validate company ownership", {
            error,
            userId,
            companyId: orderData.companyId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to validate company",
          });
        },
      });

      if (!company) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message: "Company not found or you don't have access",
          })
        );
      }

      // 3. Validate all locations belong to this company
      const locationIds = orderItems.map((item) => item.id);
      const locations = yield* Effect.tryPromise({
        try: () =>
          db.query.userCompanyTestingLocation.findMany({
            where: and(
              inArray(userCompanyTestingLocation.id, locationIds),
              eq(userCompanyTestingLocation.userCompanyId, orderData.companyId)
            ),
          }),
        catch: (error) => {
          logger.error("Failed to validate locations", {
            error,
            locationIds,
            companyId: orderData.companyId,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to validate locations",
          });
        },
      });

      if (locations.length !== locationIds.length) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more locations don't belong to this company",
          })
        );
      }

      // 4. Calculate total amount from order items
      const calculatedTotal = orderItems.reduce(
        (total, location) =>
          total +
          location.items.reduce(
            (locationTotal, item) => locationTotal + item.price * item.quantity,
            0
          ),
        0
      );

      // 5. Create order and order items in a transaction
      const result = yield* Effect.tryPromise({
        try: () =>
          db.transaction(async (tx) => {
            // Generate order number using sequence
            const orderNumber = await generateOrderNumberWithSequence(
              tx,
              "ORD"
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
              })
              .returning();

            if (!newOrder) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create order",
              });
            }

            // Create order items using the existing query
            const items = await Effect.runPromise(
              orderItemQueries.createOrderItems(tx, newOrder.id, orderItems)
            );

            // Clear cart items for this company
            await tx
              .delete(cart)
              .where(
                and(
                  eq(cart.userId, userId),
                  eq(cart.companyId, orderData.companyId)
                )
              );

            // create order status history - pending
            await Effect.runPromise(
              orderStatusHistoryQueries.createOrderStatusHistory(
                tx,
                newOrder.id,
                "pending",
                userId,
                "Order created and is pending approval"
              )
            );

            return { order: newOrder, items };
          }),
        catch: (error) => {
          logger.error("Failed to create order", {
            error,
            userId,
            orderData,
            orderItems,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create order",
          });
        },
      });

      return result;
    });
  },
};

export default orderQueries;
