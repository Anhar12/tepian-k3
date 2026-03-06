import auditSchema from "@tepian-k3/schema/platform/audit.schema";
import auditQueries from "@tepian-k3/queries/platform/audit.queries";
import { createTRPCRouter, withPermissionAndRateLimit } from "../..";
import { runEffect } from "../../utils/run-effect";
import z from "zod";

export const auditRouter = createTRPCRouter({
  /**
   * Get audit logs with filters and pagination
   */
  getAuditLogs: withPermissionAndRateLimit("audits.view", "queries")
    .input(auditSchema.getAuditLogsSchema)
    .query(async ({ input }) => {
      const { page, limit, ...filters } = input;

      const logs = await runEffect(
        auditQueries.getAuditLogs({
          ...filters,
          limit,
        }),
      );

      return {
        logs,
        page,
        limit,
        total: logs.length,
      };
    }),

  /**
   * Get audit history for a specific entity
   */
  getEntityHistory: withPermissionAndRateLimit("audits.view", "queries")
    .input(auditSchema.getEntityAuditHistorySchema)
    .query(
      async ({ input }) =>
        await runEffect(
          auditQueries.getAuditLogsByEntity(input.entityType, input.entityId),
        ),
    ),

  /**
   * Get activity logs for a user.
   * Admins can view any user's activity; non-admins only their own.
   */
  getUserActivity: withPermissionAndRateLimit("audits.view", "queries")
    .input(auditSchema.getUserActivitySchema)
    .query(async ({ input, ctx }) => {
      const isAdmin = ctx.user.roles.includes("admin");
      const targetUserId = isAdmin ? input.userId : ctx.user.id;

      return await runEffect(
        auditQueries.getAuditLogsByUser(targetUserId, input.limit),
      );
    }),

  /**
   * Get a single audit log by ID
   */
  getAuditLogById: withPermissionAndRateLimit("audits.view", "queries")
    .input(z.object({ id: z.uuidv7() }))
    .query(
      async ({ input }) =>
        await runEffect(auditQueries.getAuditLogById(input.id)),
    ),

  /**
   * Get audit statistics, optionally filtered by entity type
   */
  getStatistics: withPermissionAndRateLimit("audits.view", "api")
    .input(auditSchema.getAuditStatisticsSchema)
    .query(
      async ({ input }) =>
        await runEffect(auditQueries.getAuditStatistics(input.entityType)),
    ),
});
