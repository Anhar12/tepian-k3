import { db } from "@tepian-k3/db/client";
import { orderItem, pelatihanEnrollments } from "@tepian-k3/db/schema";
import { and, eq, isNotNull } from "@tepian-k3/db";
import { Effect } from "effect";
import { logError } from "@tepian-k3/services/logger";

const autoEnrollQueries = {
  /**
   * Processes all pelatihan items in an order and enrolls the user.
   * To be called when an order payment is verified/approved.
   *
   * @param orderId - The order UUID
   * @param userId - The user UUID
   */
  processPaidPelatihanOrder(orderId: string, userId: string) {
    return Effect.gen(function* () {
      // 1. Fetch all pelatihan items in the order
      const pelatihanItems = yield* Effect.tryPromise({
        try: () =>
          db.query.orderItem.findMany({
            where: and(
              eq(orderItem.orderId, orderId),
              eq(orderItem.type, "pelatihan"),
              isNotNull(orderItem.pelatihanId),
            ),
          }),
        catch: (error) => {
          logError(
            "autoEnrollQueries.processPaidPelatihanOrder",
            "Failed to fetch order items",
            { error, orderId },
          );
        },
      });

      if (!pelatihanItems || pelatihanItems.length === 0) {
        return; // No pelatihan items in this order
      }

      // 2. Insert into pelatihanEnrollments
      const enrollmentsData = pelatihanItems.map((item) => ({
        userId,
        pelatihanId: item.pelatihanId as string,
        orderId,
        status: "in_progress" as const,
        enrolledAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
      }));

      // Use a transaction or bulk insert, with onConflictDoNothing in case they are already enrolled
      yield* Effect.tryPromise({
        try: () =>
          db
            .insert(pelatihanEnrollments)
            .values(enrollmentsData)
            .onConflictDoNothing({
              target: [
                pelatihanEnrollments.userId,
                pelatihanEnrollments.pelatihanId,
              ],
            }),
        catch: (error) => {
          logError(
            "autoEnrollQueries.processPaidPelatihanOrder",
            "Failed to bulk insert enrollments",
            { error, orderId },
          );
        },
      });

      return true;
    });
  },
};

export default autoEnrollQueries;
