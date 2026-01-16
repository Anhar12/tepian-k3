import { createTRPCRouter, protectedProcedure } from "..";
import { notificationsQueries } from "@tepian-k3/queries/notifications.queries";
import notificationSchema from "@tepian-k3/schema/notification.schema";
import { runEffect } from "../utils/run-effect";
import z from "zod";

export const notificationsRouter = createTRPCRouter({
  /**
   * Get paginated notifications for the current user
   */
  getAll: protectedProcedure
    .input(notificationSchema.getNotificationsSchema)
    .query(async ({ input, ctx }) =>
      runEffect(notificationsQueries.getPaginated(ctx.user.id, input))
    ),

  /**
   * Get unread notification count for the current user
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) =>
    runEffect(notificationsQueries.getUnreadCount(ctx.user.id))
  ),

  /**
   * Mark a notification as read
   */
  markAsRead: protectedProcedure
    .input(notificationSchema.markAsReadSchema)
    .mutation(async ({ input, ctx }) =>
      runEffect(notificationsQueries.markAsRead(input.id, ctx.user.id))
    ),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) =>
    runEffect(notificationsQueries.markAllAsRead(ctx.user.id))
  ),

  /**
   * Delete a notification (soft delete)
   */
  delete: protectedProcedure
    .input(notificationSchema.deleteNotificationSchema)
    .mutation(async ({ input, ctx }) =>
      runEffect(notificationsQueries.delete(input.id, ctx.user.id))
    ),

  /**
   * Delete all notifications for the current user (soft delete)
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) =>
    runEffect(notificationsQueries.deleteAll(ctx.user.id))
  ),

  /**
   * Create a notification (admin only - for system notifications)
   * This can be called by other routers internally or by admins
   */
  create: protectedProcedure
    .input(notificationSchema.createNotificationSchema)
    .mutation(async ({ input }) => runEffect(notificationsQueries.create(input))),
});
