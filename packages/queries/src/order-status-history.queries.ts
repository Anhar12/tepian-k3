import type { OrderStatus } from "@tepian-k3/constants";
import { eq } from "@tepian-k3/db";
import { db, type DBorTx } from "@tepian-k3/db/client";
import { orderStatusHistory } from "@tepian-k3/db/schema";
import logger from "@tepian-k3/services/logger";
import { TRPCError } from "@trpc/server";
import { Effect } from "effect";

const orderStatusHistoryQueries = {
  getOrderStatusHistoriesByOrderId(orderId: string) {
    return Effect.tryPromise({
      try: () =>
        db.query.orderStatusHistory.findMany({
          where: eq(orderStatusHistory.orderId, orderId),
        }),
      catch: (error) => {
        logger.error("Failed to fetch order status histories", {
          error,
          orderId,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order status histories",
        });
      },
    });
  },

  createOrderStatusHistory(
    tx: DBorTx,
    orderId: string,
    status: OrderStatus,
    changedBy: string,
    note?: string
  ) {
    return Effect.tryPromise({
      try: () =>
        tx
          .insert(orderStatusHistory)
          .values({
            orderId,
            status,
            changedBy,
            note,
          })
          .returning(),
      catch: (error) => {
        logger.error("Failed to create order status history", {
          error,
          orderId,
          status,
          changedBy,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order status history",
        });
      },
    }).pipe(
      Effect.flatMap((result) =>
        result.length > 0 && result[0]
          ? Effect.succeed(result[0])
          : Effect.fail(
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create order status history",
              })
            )
      )
    );
  },
};

export default orderStatusHistoryQueries;
