import { eq, inArray } from "@tepian-k3/db";
import { type DBorTx } from "@tepian-k3/db/client";
import {
  orderItem,
  parameters,
  userCompanyTestingLocation,
} from "@tepian-k3/db/schema";
import type orderItemSchema from "@tepian-k3/schema/order-item.schema";
import logger from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";
import type z from "zod";

const orderItemQueries = {
  getOrderItemsByOrderId(tx: DBorTx, orderId: string) {
    return Effect.tryPromise({
      try: () =>
        tx.query.orderItem.findMany({
          where: eq(orderItem.orderId, orderId),
        }),
      catch: (error) => {
        logger.error("Failed to fetch order items", { error, orderId });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order items",
        });
      },
    });
  },

  createOrderItems(
    tx: DBorTx,
    orderId: string,
    orderItems: z.infer<typeof orderItemSchema.createOrderItem>[]
  ) {
    return Effect.gen(function* () {
      // 1. Check if orderItems is empty
      if (orderItems.length === 0) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Order items cannot be empty",
          })
        );
      }

      // 2. Validate quantities
      const invalidQuantity = orderItems.some((item) =>
        item.items.some((subItem) => subItem.quantity <= 0)
      );
      if (invalidQuantity) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Item quantities must be greater than 0",
          })
        );
      }

      // 3. Check for duplicate parameters within same location
      const duplicates = orderItems.some((location) => {
        const parameterIds = location.items.map((item) => item.parameterId);
        return new Set(parameterIds).size !== parameterIds.length;
      });
      if (duplicates) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Duplicate parameters found for the same location",
          })
        );
      }

      // 4. Validate locations exist
      const locationIds = orderItems.map((item) => item.id);
      const locations = yield* Effect.tryPromise({
        try: () =>
          tx.query.userCompanyTestingLocation.findMany({
            where: inArray(userCompanyTestingLocation.id, locationIds),
          }),
        catch: (error) => {
          logger.error("Failed to validate locations", { error, locationIds });
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
            message: "One or more locations not found",
          })
        );
      }

      // 5. Validate parameters and prices
      const parameterIds = orderItems.flatMap((item) =>
        item.items.map((subItem) => subItem.parameterId)
      );
      const params = yield* Effect.tryPromise({
        try: () =>
          tx.query.parameters.findMany({
            where: inArray(parameters.id, parameterIds),
          }),
        catch: (error) => {
          logger.error("Failed to validate parameters", {
            error,
            parameterIds,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to validate parameters",
          });
        },
      });

      if (params.length !== parameterIds.length) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more parameters not found",
          })
        );
      }

      // 6. Validate price matches
      const priceMap = new Map(params.map((p) => [p.id, p.price]));
      const invalidPrice = orderItems.some((item) =>
        item.items.some(
          (subItem) => priceMap.get(subItem.parameterId) !== subItem.price
        )
      );
      if (invalidPrice) {
        return yield* Effect.fail(
          new TRPCError({
            code: "BAD_REQUEST",
            message: "Price mismatch detected. Please refresh and try again.",
          })
        );
      }

      const mappedItems = orderItems.flatMap((item) =>
        item.items.map((subItem) => ({
          orderId,
          locationId: item.id,
          parameterId: subItem.parameterId,
          price: subItem.price,
          quantity: subItem.quantity,
          subTotal: subItem.price * subItem.quantity,
        }))
      );

      const insertedItems = yield* Effect.tryPromise({
        try: () => tx.insert(orderItem).values(mappedItems).returning(),
        catch: (error) => {
          logger.error("Failed to create order items", {
            error,
            orderId,
            mappedItems,
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create order items",
          });
        },
      });

      if (insertedItems.length === 0) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No order items were created",
          })
        );
      }

      return insertedItems;
    });
  },
};

export default orderItemQueries;
