import auditSchema from "@tepian-k3/schema/audit.schema";
import auditQueries from "@tepian-k3/queries/audit.queries";
import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, withPermissionAndRateLimit } from "..";

export const auditRouter = createTRPCRouter({
  /**
   * Get audit logs with filters
   */
  getAuditLogs: withPermissionAndRateLimit("audits.view", "queries")
    .input(auditSchema.getAuditLogsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Check if user has permission to view audit logs
        // You can add permission check here based on your RBAC
        const hasPermission = ctx.user.role === "admin"; // Adjust based on your permission system

        if (!hasPermission) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view audit logs",
          });
        }

        const { page, limit, ...filters } = input;
        // const offset = (page - 1) * limit;

        const logs = await Effect.runPromise(
          auditQueries.getAuditLogs({
            ...filters,
            limit,
          })
        );

        // For pagination, you'd want to also get total count
        // This is simplified - you may want to add a separate count query
        return {
          logs,
          page,
          limit,
          total: logs.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch audit logs",
          cause: error,
        });
      }
    }),

  /**
   * Get audit history for a specific entity
   */
  getEntityHistory: withPermissionAndRateLimit("audits.view", "queries")
    .input(auditSchema.getEntityAuditHistorySchema)
    .query(async ({ input }) => {
      try {
        const logs = await Effect.runPromise(
          auditQueries.getAuditLogsByEntity(input.entityType, input.entityId)
        );

        return logs;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch entity audit history",
          cause: error,
        });
      }
    }),

  /**
   * Get user activity logs
   */
  getUserActivity: withPermissionAndRateLimit("audits.view", "queries")
    .input(auditSchema.getUserActivitySchema)
    .query(async ({ input, ctx }) => {
      try {
        // Users can only view their own activity unless admin
        const isAdmin = ctx.user.role === "admin";
        const targetUserId = isAdmin ? input.userId : ctx.user.id;

        const logs = await Effect.runPromise(
          auditQueries.getAuditLogsByUser(targetUserId, input.limit)
        );

        return logs;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch user activity",
          cause: error,
        });
      }
    }),

  /**
   * Get audit statistics
   */
  getStatistics: withPermissionAndRateLimit("audits.view", "api")
    .input(auditSchema.getAuditStatisticsSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Check if user has permission to view statistics
        const hasPermission = ctx.user.role === "admin";

        if (!hasPermission) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to view audit statistics",
          });
        }

        const stats = await Effect.runPromise(
          auditQueries.getAuditStatistics(input.entityType)
        );

        return stats;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch audit statistics",
          cause: error,
        });
      }
    }),
});
