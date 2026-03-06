import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { db } from "@tepian-k3/db/client";
import { notifications } from "@tepian-k3/db/schema";
import { and, desc, eq, isNull, lt, sql } from "@tepian-k3/db";
import { logError } from "@tepian-k3/services/logger";
import type {
  CreateNotificationInput,
  GetNotificationsInput,
  GetCursorPaginatedNotificationsInput,
} from "@tepian-k3/schema/platform/notification.schema";

export const notificationsQueries = {
  /**
   * Create a new notification
   */
  create: (input: CreateNotificationInput) =>
    Effect.tryPromise({
      try: async () => {
        const [notification] = await db
          .insert(notifications)
          .values(input)
          .returning();

        if (!notification) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create notification",
          });
        }

        return notification;
      },
      catch: (error) => {
        if (error instanceof TRPCError) {
          return error;
        }
        logError("notificationsQueries.create", "Error creating notification", {
          input,
          error,
        });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create notification",
          cause: error,
        });
      },
    }),

  /**
   * Get paginated notifications for a user
   */
  getPaginated: (userId: string, input: GetNotificationsInput) =>
    Effect.tryPromise({
      try: async () => {
        const { page, limit, isRead, type } = input;
        const offset = (page - 1) * limit;

        const conditions = [
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt),
        ];

        if (isRead !== undefined) {
          conditions.push(eq(notifications.isRead, isRead));
        }

        if (type) {
          conditions.push(eq(notifications.type, type));
        }

        const whereClause = and(...conditions);

        const [items, totalCount] = await Promise.all([
          db.query.notifications.findMany({
            where: whereClause,
            orderBy: [desc(notifications.createdAt)],
            limit,
            offset,
          }),
          db
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(whereClause),
        ]);

        const count = totalCount[0]?.count ?? 0;

        return {
          data: items,
          pagination: {
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
          },
        };
      },
      catch: (error) => {
        logError(
          "notificationsQueries.getPaginated",
          "Error fetching notifications",
          { userId, input, error },
        );
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notifications",
          cause: error,
        });
      },
    }),

  /**
   * Get cursor paginated notifications for a user (for infinite scroll)
   */
  getCursorPaginated: (
    userId: string,
    input: GetCursorPaginatedNotificationsInput,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const { cursor, limit, isRead, type } = input;

        const conditions = [
          eq(notifications.userId, userId),
          isNull(notifications.deletedAt),
        ];

        // Cursor condition - get items with ID less than cursor (since we sort by createdAt desc)
        // UUIDv7 is time-sortable, so we can use ID for cursor
        if (cursor) {
          conditions.push(lt(notifications.id, cursor));
        }

        if (isRead !== undefined) {
          conditions.push(eq(notifications.isRead, isRead));
        }

        if (type) {
          conditions.push(eq(notifications.type, type));
        }

        const whereClause = and(...conditions);

        // Fetch limit + 1 to determine if there are more results
        const items = await db.query.notifications.findMany({
          where: whereClause,
          orderBy: [desc(notifications.createdAt), desc(notifications.id)],
          limit: limit + 1,
        });

        // Check if there are more results
        const hasMore = items.length > limit;

        // Remove the extra item if it exists
        const data = hasMore ? items.slice(0, limit) : items;

        // Get the cursor for the next page (the ID of the last item)
        const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

        return {
          data,
          nextCursor,
          hasMore,
        };
      },
      catch: (error) => {
        logError(
          "notificationsQueries.getCursorPaginated",
          "Error fetching cursor paginated notifications",
          { userId, input, error },
        );
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch notifications",
          cause: error,
        });
      },
    }),

  /**
   * Mark a notification as read
   */
  markAsRead: (id: string, userId: string) =>
    Effect.tryPromise({
      try: async () => {
        const [notification] = await db
          .update(notifications)
          .set({
            isRead: true,
            readAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(
            and(
              eq(notifications.id, id),
              eq(notifications.userId, userId),
              isNull(notifications.deletedAt),
            ),
          )
          .returning();

        if (!notification) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notification not found",
          });
        }

        return notification;
      },
      catch: (error) => {
        if (error instanceof TRPCError) {
          return error;
        }
        logError(
          "notificationsQueries.markAsRead",
          "Error marking notification as read",
          { id, userId, error },
        );
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark notification as read",
          cause: error,
        });
      },
    }),

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: (userId: string) =>
    Effect.tryPromise({
      try: async () => {
        const result = await db
          .update(notifications)
          .set({
            isRead: true,
            readAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.isRead, false),
              isNull(notifications.deletedAt),
            ),
          )
          .returning();

        return {
          success: true,
          updatedCount: result.length,
        };
      },
      catch: (error) => {
        logError(
          "notificationsQueries.markAllAsRead",
          "Error marking all notifications as read",
          { userId, error },
        );
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to mark all notifications as read",
          cause: error,
        });
      },
    }),

  /**
   * Get unread notification count for a user
   */
  getUnreadCount: (userId: string) =>
    Effect.tryPromise({
      try: async () => {
        const result = await db
          .select({ count: sql<number>`count(*)` })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, userId),
              eq(notifications.isRead, false),
              isNull(notifications.deletedAt),
            ),
          );

        return result[0]?.count ?? 0;
      },
      catch: (error) => {
        logError(
          "notificationsQueries.getUnreadCount",
          "Error getting unread count",
          { userId, error },
        );
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get unread count",
          cause: error,
        });
      },
    }),

  /**
   * Soft delete a notification
   */
  delete: (id: string, userId: string) =>
    Effect.tryPromise({
      try: async () => {
        const [notification] = await db
          .update(notifications)
          .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
          .where(
            and(
              eq(notifications.id, id),
              eq(notifications.userId, userId),
              isNull(notifications.deletedAt),
            ),
          )
          .returning();

        if (!notification) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Notification not found",
          });
        }

        return notification;
      },
      catch: (error) => {
        if (error instanceof TRPCError) {
          return error;
        }
        logError("notificationsQueries.delete", "Error deleting notification", {
          id,
          userId,
          error,
        });
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete notification",
          cause: error,
        });
      },
    }),

  /**
   * Delete all notifications for a user (soft delete)
   */
  deleteAll: (userId: string) =>
    Effect.tryPromise({
      try: async () => {
        const result = await db
          .update(notifications)
          .set({ deletedAt: sql`CURRENT_TIMESTAMP` })
          .where(
            and(
              eq(notifications.userId, userId),
              isNull(notifications.deletedAt),
            ),
          )
          .returning();

        return {
          success: true,
          deletedCount: result.length,
        };
      },
      catch: (error) => {
        logError(
          "notificationsQueries.deleteAll",
          "Error deleting all notifications",
          { userId, error },
        );
        return new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete all notifications",
          cause: error,
        });
      },
    }),
};
